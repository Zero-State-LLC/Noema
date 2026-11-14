# Glossary

**Hosted structured dispatch** — a command that arrives as a structured verb and arguments from an authenticated Agent and is never reinterpreted as text.

**Developer text tooling** — aliases, macros, numeric clarify picks, and free-text fallback, available only outside hosted Player admission.

**Admission mode** — which of the two governs a command.

**Trace** — public residue a Player can encounter in a room, derived from the room's current state; never a stored history.
_Avoid_: trail, log, footprint

**Stale trace** — a trace whose source has changed or gone; it updates or disappears on the next observation.
_Avoid_: expired trace, old trace

**Presence** — whether a Player is in the world right now; in exactly one room or not in the world at all.
_Avoid_: online status, connected

**Addressable recipient** — a Player who is present and can therefore be sent a message; one who never existed and one who has left are equally not addressable.
_Avoid_: reachable recipient

**Public handle** — the name a Player chose that may appear on WATCH; a default or operator handle is not public, and such a Player is only counted there.
_Avoid_: display name, username

**HAPPENED** — the world-native account of the Player's latest relevant action and its observable consequences.
_Avoid_: raw event dump

**Rest outcome** — the result of an accepted WAIT action, distinct from how much recovery occurred or whether the global world clock advanced.
_Avoid_: free recovery, automatic time advancement

**Observable rest consequence** — a change actually observed and attributable to rest or clearly identified regeneration, including no change when recovery is capped.
_Avoid_: guaranteed refill, invented recovery
