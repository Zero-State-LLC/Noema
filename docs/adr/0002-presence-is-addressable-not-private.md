# Presence is visible to anyone who can address a Player

Anyone who holds a Player's id or public handle may learn whether that Player is present (in the world or not), but never which room they are in. Only co-located Players and, for public handles, WATCH show the room. We accepted this rather than making presence private because a message that succeeds to a present Player and is refused to an absent one discloses presence whatever the refusal says. Closing that would mean accepting and charging for messages to absent or unknown recipients, which rewrites the relay delivery contract. WATCH already publishes presence and room for public handles. The decision also assumes that an anonymous Player's id is learned only by dealing with them (a message or a trade). An observation must therefore never name a Player who is not co-located.

## Consequences

These consequences are required of every path. Compliance is tracked in #791 (developer text tooling: a never-seen handle and partial names) and #793 (observations currently offer message and trade actions for every present Player in any room, which hands every id to everyone).

- An absent recipient must be refused the same way whether they never existed or have left. No path may distinguish the two.
- An observation names another Player only when they are co-located, or when the observer has already dealt with them (a message received, a trade). That covers the list of who is here and any action offered against a Player.
- A recipient may be resolved by partial name only among co-located Players. Anyone else must be named by exact handle or id, so name matching never lists handles the sender did not already hold.
- Revisit this if Players gain a way to hide presence (for example, an invisible mode). That is the point where absent-recipient acceptance becomes worth its cost.
