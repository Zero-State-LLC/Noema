"""Observe → decide → act. Private mind stays local."""

from __future__ import annotations

import json
import re
from typing import Any

from noema_llm_agent.cognition import PrivateCognitionError, contains_private
from noema_llm_agent.llm import ProposeFn, StaticProposer
from noema_llm_agent.protocol import ProtocolClient
from noema_llm_agent.schemas import ActResult, ActionProposal, Observation

_PROSE = re.compile(r"^\s*(MOVE|LOOK|WAIT|INSPECT|POST\s)", re.I)

ALLOWED_ACTIONS = frozenset(
    {
        "LOOK",
        "MOVE",
        "INSPECT",
        "WAIT",
        "OBSERVE",
        "ENTER_WORLD",
        "LEAVE_WORLD",
        "REPAIR",
        "HARVEST",
        "MESSAGE",
        "TRADE",
        "TRADE_PROPOSE",
        "ORG_CREATE",
    }
)


class LocalMind:
    """In-process only. Never serialized onto the protocol client."""

    def __init__(self, propose: ProposeFn) -> None:
        self.propose = propose
        self.history: list[str] = []
        self.last_reason: str | None = None


class NoemaAgent:
    """Public loop API. Stable."""

    def __init__(self, client: ProtocolClient, llm: ProposeFn | None = None) -> None:
        self.client = client
        self.mind = LocalMind(llm or StaticProposer())

    def _parse(self, raw: str) -> ActionProposal:
        text = raw.strip()
        if _PROSE.match(text) and not text.startswith("{"):
            raise PrivateCognitionError("model emitted a command line")
        try:
            data = json.loads(text)
        except json.JSONDecodeError:
            fence = re.search(r"\{[\s\S]*\}", text)
            if not fence:
                raise PrivateCognitionError("model output is not a proposal") from None
            data = json.loads(fence.group(0))
        if not isinstance(data, dict) or contains_private(data):
            raise PrivateCognitionError("proposal contains private fields")
        args = data.get("arguments") if isinstance(data.get("arguments"), dict) else {}
        if contains_private(args):
            raise PrivateCognitionError("arguments contain private fields")
        action = str(data.get("action") or "").upper()
        if action not in ALLOWED_ACTIONS:
            raise ValueError(f"UNKNOWN_ACTION:{action or '<empty>'}")
        return ActionProposal.model_validate(
            {"action": action, "target_id": data.get("target_id"), "arguments": args}
        )

    def decide(self, observation: Observation) -> ActionProposal:
        context = {
            "canonical": observation.model_dump(exclude_none=True),
        }
        raw = self.mind.propose(context)
        self.mind.history.append(raw[:500])
        try:
            return self._parse(raw)
        except (PrivateCognitionError, ValueError):
            return ActionProposal(action="WAIT")

    async def start(self, token: str, *, world_id: str | None = None, manifest: dict[str, Any] | None = None) -> Observation:
        await self.client.connect()
        await self.client.hello()
        await self.client.auth(token)
        await self.client.register(manifest)
        entered = await self.client.enter_world(world_id)
        return entered.observation or await self.client.observe()

    async def step(self, observation: Observation) -> ActResult:
        proposal = self.decide(observation)
        return await self.client.act(proposal.action, proposal.arguments, target_id=proposal.target_id)

    async def run(self, token: str, *, world_id: str | None = None, turns: int = 4) -> list[ActResult]:
        obs = await self.start(token, world_id=world_id)
        results: list[ActResult] = []
        for _ in range(max(0, turns)):
            result = await self.step(obs)
            results.append(result)
            if result.observation:
                obs = result.observation
            else:
                obs = await self.client.observe()
        return results

    async def close(self) -> None:
        await self.client.disconnect()
