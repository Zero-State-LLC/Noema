# Presence is visible to anyone who can address a Player

Anyone who holds a Player's id or public handle may learn whether that Player is present (in the world or not), but never which room they are in. Only co-located Players and, for public handles, WATCH show the room. We accepted this rather than making presence private because a message that succeeds to a present Player and is refused to an absent one discloses presence whatever the refusal says. Closing that would mean accepting and charging for messages to absent or unknown recipients, which rewrites the relay delivery contract. WATCH already publishes presence and room for public handles, and an anonymous Player's id is learned only by dealing with them.

## Consequences

These consequences are required of every path. Hosted structured dispatch already meets them. Developer text tooling does not yet: it still answers "not found" for a never-seen handle, and it matches partial names over every Player the world has seen. #791 brings it into line.

- An absent recipient must be refused the same way whether they never existed or have left. No path may distinguish the two.
- A recipient may be resolved by partial name only among co-located Players. Anyone else must be named by exact handle or id, so name matching never lists handles the sender did not already hold.
- Revisit this if Players gain a way to hide presence (for example, an invisible mode). That is the point where absent-recipient acceptance becomes worth its cost.
