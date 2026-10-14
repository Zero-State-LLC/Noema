# workers/noema/src/watch-theater.ts

- TheaterEvent · type · L15-L22 — type TheaterEvent = { sequence?: number; projection_id?: string; line?: string; actor_label?: string; room_id?: string; consequence?: string; };
- theaterEventPool · function · L24-L43 — function theaterEventPool( head: TheaterEvent | null, events?: Array<TheaterEvent | null | undefined> | null, ): TheaterEvent[]
- recentFactParts · function · L46-L55 — function recentFactParts(actor?: string | null, site?: string | null, consequence?: string | null): string[]
- joinWatchPhrases · function · L58-L67 — function joinWatchPhrases(parts?: Array<string | null | undefined> | null): string
- heroFactValue · function · L70-L73 — function heroFactValue(raw?: string | null): string
- namedListLine · function · L75-L87 — function namedListLine(kind?: string | null, names?: string[] | null): string
- agentsInPublicSitesCaption · function · L89-L93 — function agentsInPublicSitesCaption(count: number): string
- withheldFromProjection · function · L99-L108 — function withheldFromProjection(projectionId?: string | null, actor?: string | null): string
- withheldBandLines · function · L110-L121 — function withheldBandLines(marks?: string[] | null): string[]
- followedSiteWithheld · function · L123-L127 — function followedSiteWithheld(followKind: string, inPublicSite: boolean): string
- watchTheaterInlineSource · function · L145-L153 — function watchTheaterInlineSource(): string
