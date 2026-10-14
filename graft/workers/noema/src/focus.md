# workers/noema/src/focus.ts

- FocusId · type · L15-L15 — type FocusId = (typeof FOCUS_TRACKS)[number]["id"];
- FocusState · type · L17-L17 — type FocusState = { track: FocusId; declared_cycle: number };
- parseFocusTrack · function · L19-L24 — function parseFocusTrack(raw: string): FocusId | "clear" | null
- focusSelfLine · function · L26-L29 — function focusSelfLine(focus: FocusState | undefined | null): string | undefined
- publicFocusLine · function · L31-L45 — function publicFocusLine( handle: string | undefined | null, focus: FocusState | undefined | null, practice: PracticeState | undefined | null, now: number, playerId?: string | null, ): string | undefined
