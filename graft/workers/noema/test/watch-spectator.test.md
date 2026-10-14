# workers/noema/test/watch-spectator.test.ts

- rooms · function · L15-L43 — function rooms()
- player · function · L45-L47 — function player(id: string, handle: string, room_id: string)
- ev · function · L49-L51 — function ev(partial: Partial<WatchSourceEvent> & Pick<WatchSourceEvent, "event_type" | "sequence">): WatchSourceEvent
- snap · function · L53-L62 — function snap(events: WatchSourceEvent[])
- Ev · type · L219-L219 — type Ev = { sequence: number; line: string };
- evs · function · L220-L220 — evs = (o: Record<string, unknown>)
- production · function · L221-L225 — production = (entity_id: string)
