"""Sandbox for code-mode scripts, built on CPython audit hooks (PEP 578).

Installed by run.py in the child process before the script runs. It confines:
  - reads to this repo and the Python installation,
  - writes to codemode/.work and codemode/skills,
  - subprocesses to allow-listed tools (gh, read-only git subcommands),
  - network to allow-listed MCP hosts (plus the configured HTTPS proxy).
It also refuses os.system/exec/fork and ctypes. Audit hooks cannot be removed
once installed, so this blocks accidental reach outside the project. It is not
a security boundary against hostile code; use a VM or container for that.
"""

from __future__ import annotations

import os
import socket
import sys
import sysconfig
import threading
from pathlib import Path
from typing import Any, Iterable
from urllib.parse import urlsplit

_WRITE_FLAGS = os.O_WRONLY | os.O_RDWR | os.O_APPEND | os.O_CREAT | os.O_TRUNC
_ALWAYS_DENY = {"os.system", "os.exec", "os.spawn", "os.fork", "os.forkpty", "pty.spawn", "os.startfile", "ctypes.dlopen"}
# event -> indexes of path arguments that are written
_WRITE_EVENTS = {
    "os.remove": (0,), "os.rmdir": (0,), "os.mkdir": (0,), "os.rename": (0, 1), "os.chmod": (0,),
    "os.chown": (0,), "os.link": (0, 1), "os.symlink": (1,), "os.truncate": (0,), "os.utime": (0,),
    "shutil.rmtree": (0,), "shutil.move": (0, 1), "shutil.copyfile": (1,), "shutil.copytree": (1,),
}


class SandboxError(PermissionError):
    pass


def _host_of(url: str | None) -> str | None:
    if not url:
        return None
    return (urlsplit(url if "://" in url else f"//{url}").hostname or "").lower() or None


def install(
    *,
    root: Path,
    writable: Iterable[Path],
    allow_exec: Iterable[str],
    git_subcommands: Iterable[str],
    allow_hosts: Iterable[str],
) -> None:
    root = Path(os.path.realpath(root))
    write_ok = [Path(os.path.realpath(p)) for p in writable] + [Path(os.devnull)]
    read_ok = [root, *write_ok]
    too_broad = {Path("/"), Path(os.path.realpath(Path.home()))}
    for base in {sys.prefix, sys.base_prefix, sys.exec_prefix, sys.base_exec_prefix, *sysconfig.get_paths().values()}:
        if base and Path(os.path.realpath(base)) not in too_broad:
            read_ok.append(Path(os.path.realpath(base)))
    read_ok += [Path("/dev/urandom")]
    exe_ok = {Path(e).name for e in allow_exec}
    git_ok = set(git_subcommands)
    hosts = {h.lower() for h in allow_hosts}
    for var in ("HTTPS_PROXY", "https_proxy", "HTTP_PROXY", "http_proxy"):
        proxy = _host_of(os.environ.get(var))
        if proxy:
            hosts.add(proxy)
    ips: set[str] = set()
    local = threading.local()

    def deny(msg: str) -> None:
        raise SandboxError(f"codemode sandbox: {msg}")

    def resolve(p: Any) -> Path | None:
        if p is None or isinstance(p, int):
            return None
        return Path(os.path.realpath(os.fsdecode(p)))

    def inside(p: Path, bases: list[Path]) -> bool:
        return any(p == b or b in p.parents for b in bases)

    def check_read(p: Any) -> None:
        path = resolve(p if p is not None else ".")
        if path is not None and not inside(path, read_ok):
            deny(f"read outside the project refused: {path}")

    def check_write(p: Any) -> None:
        path = resolve(p)
        if path is not None and not inside(path, write_ok):
            deny(f"write refused (writable: codemode/.work, codemode/skills): {path}")

    def check_exec(executable: Any, argv: Any) -> None:
        argv = [os.fsdecode(a) for a in (argv or [])]
        name = Path(os.fsdecode(executable or (argv[0] if argv else ""))).name
        if name in exe_ok:
            return
        if name == "git":
            rest = argv[1:]
            while rest and rest[0].startswith("-"):
                rest = rest[2:] if rest[0] in ("-C", "-c") else rest[1:]
            if rest and rest[0] in git_ok:
                return
            deny(f"git {rest[0] if rest else ''} refused; allowed: {sorted(git_ok)}")
        deny(f"subprocess {name!r} refused; allowed: {sorted(exe_ok)}")

    def check_host(host: Any) -> None:
        if host in (None, b"", ""):
            return
        name = (host.decode() if isinstance(host, bytes) else str(host)).lower()
        if name not in hosts:
            deny(f"network to {name!r} refused; allowed: {sorted(hosts)}")

    def hook(event: str, args: tuple[Any, ...]) -> None:
        if event == "open":
            path, mode, flags = args
            if path is None or isinstance(path, int):
                return
            writing = bool(mode and any(c in mode for c in "wax+")) or bool((flags or 0) & _WRITE_FLAGS)
            (check_write if writing else check_read)(path)
        elif event in ("os.listdir", "os.scandir"):
            if args and not isinstance(args[0], int):
                check_read(args[0])
        elif event == "os.chdir":
            path = resolve(args[0])
            if path is not None and not inside(path, [root]):
                deny(f"chdir outside the project refused: {path}")
        elif event in _WRITE_EVENTS:
            for i in _WRITE_EVENTS[event]:
                if i < len(args):
                    check_write(args[i])
        elif event == "subprocess.Popen":
            check_exec(args[0], args[1])
        elif event == "os.posix_spawn":
            check_exec(args[0], args[1])
        elif event in _ALWAYS_DENY:
            deny(f"{event} refused")
        elif event == "urllib.Request":
            check_host(_host_of(args[0]))
        elif event == "socket.getaddrinfo":
            check_host(args[0])
            if not getattr(local, "busy", False) and args[0]:
                local.busy = True
                try:
                    for info in socket.getaddrinfo(args[0], args[1]):
                        ips.add(str(info[4][0]))
                except OSError:
                    pass
                finally:
                    local.busy = False
        elif event == "socket.connect":
            sock, address = args
            if getattr(sock, "family", None) == getattr(socket, "AF_UNIX", object()):
                deny("unix socket connect refused")
            ip = str(address[0]) if isinstance(address, tuple) else str(address)
            if ip not in ips:
                deny(f"connect to {ip} refused (resolve an allow-listed host first)")

    sys.addaudithook(hook)
