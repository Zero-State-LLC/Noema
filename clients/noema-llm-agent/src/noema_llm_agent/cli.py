"""CLI for the LLM Controller client."""

from __future__ import annotations

import asyncio
import sys
from typing import Optional

import typer
from rich.console import Console

from noema_llm_agent.agent import NoemaAgent
from noema_llm_agent.llm import make_llm
from noema_llm_agent.protocol import connect_protocol

app = typer.Typer(no_args_is_help=True, add_completion=False)
console = Console()


@app.command()
def run(
    endpoint: str = typer.Option("https://noema.guru", "--endpoint", "-e"),
    token: Optional[str] = typer.Option(None, "--token", envvar="NOEMA_TOKEN"),
    transport: str = typer.Option("auto", "--transport", help="websocket|http|auto|mock"),
    heartbeat_interval: float = typer.Option(25.0, "--heartbeat-interval"),
    max_reconnects: int = typer.Option(8, "--max-reconnects"),
    resume: bool = typer.Option(True, "--resume/--no-resume"),
    provider: str = typer.Option("none", "--provider"),
    llm_base: Optional[str] = typer.Option(None, "--llm-base"),
    llm_model: Optional[str] = typer.Option(None, "--llm-model"),
    world_id: Optional[str] = typer.Option(None, "--world-id"),
    turns: int = typer.Option(4, "--turns"),
) -> None:
    """HELLO → AUTH → ENTER_WORLD → observe/decide/act."""
    print(
        "DEPRECATED: in-repo noema-llm-agent is not the official client. "
        "Install pipx install git+https://github.com/scrimshawlife-ctrl/noema-client.git "
        "then run `noema connect`. Kept for CI.",
        file=sys.stderr,
    )

    async def _main() -> None:
        client = await connect_protocol(
            "mock" if transport == "mock" else endpoint,
            transport=transport,
            token=token,
            heartbeat_interval=heartbeat_interval,
            max_reconnects=max_reconnects,
            resume=resume,
        )
        llm = make_llm(provider, base_url=llm_base, model=llm_model)
        agent = NoemaAgent(client, llm)
        tok = token or "mock-token"
        try:
            results = await agent.run(tok, world_id=world_id, turns=turns)
            for result in results:
                loc = (result.observation.location if result.observation else None) or {}
                console.print(f"[bold]{result.request_id}[/] ok={result.ok} room={loc.get('name')}")
        finally:
            await agent.close()

    asyncio.run(_main())


if __name__ == "__main__":
    app()
