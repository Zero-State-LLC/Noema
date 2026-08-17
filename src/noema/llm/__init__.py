"""LLM Controller adapter. The model proposes; the harness transports; NOEMA decides."""

from noema.llm.adapter import LlmProposeAdapter
from noema.llm.manifest import ManifestError, validate_manifest
from noema.llm.mcp_stub import MCP_TOOLS, mcp_status
from noema.llm.proposal import PRIVATE_KEYS, ProposalError, parse_proposal
from noema.llm.providers import OpenAICompatibleProposer, StaticProposer
from noema.llm.rest import protocol_auth, protocol_hello

__all__ = [
    "LlmProposeAdapter",
    "MCP_TOOLS",
    "ManifestError",
    "OpenAICompatibleProposer",
    "PRIVATE_KEYS",
    "ProposalError",
    "StaticProposer",
    "mcp_status",
    "parse_proposal",
    "protocol_auth",
    "protocol_hello",
    "validate_manifest",
]
