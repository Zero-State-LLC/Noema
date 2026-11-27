"""Typed shapes of the GitHub REST fields the wrappers rely on (not exhaustive)."""

from __future__ import annotations

from typing import Any, TypedDict


class Label(TypedDict, total=False):
    name: str


class User(TypedDict, total=False):
    login: str


class Issue(TypedDict, total=False):
    number: int
    title: str
    state: str
    body: str | None
    labels: list[Label]
    user: User
    assignees: list[User]
    comments: int
    created_at: str
    updated_at: str
    html_url: str
    milestone: dict[str, Any] | None


class Comment(TypedDict, total=False):
    id: int
    user: User
    body: str
    created_at: str


class Pull(TypedDict, total=False):
    number: int
    title: str
    state: str
    draft: bool
    user: User
    head: dict[str, Any]
    base: dict[str, Any]
    labels: list[Label]
    created_at: str
    updated_at: str
    html_url: str


class CheckRun(TypedDict, total=False):
    id: int
    name: str
    status: str
    conclusion: str | None
    started_at: str
    completed_at: str | None
    html_url: str


class WorkflowRun(TypedDict, total=False):
    id: int
    name: str
    head_branch: str
    head_sha: str
    event: str
    status: str
    conclusion: str | None
    created_at: str
    html_url: str


class Job(TypedDict, total=False):
    id: int
    run_id: int
    name: str
    status: str
    conclusion: str | None
    steps: list[dict[str, Any]]
    html_url: str


class Commit(TypedDict, total=False):
    sha: str
    commit: dict[str, Any]
    author: User | None
    html_url: str
