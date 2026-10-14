# workers/noema/src/lots.ts

- LotGrade · type · L11-L11 — type LotGrade = (typeof LOT_GRADES)[number];
- LotGrades · type · L16-L16 — type LotGrades = Partial<Record<keyof Budgets, LotGrade>>;
- harvestGrade · function · L18-L20 — function harvestGrade(condition?: number): LotGrade
- mixGrade · function · L22-L27 — function mixGrade(haveAmount: number, have: LotGrade | undefined, addAmount: number, add: LotGrade): LotGrade
- constructStorageCost · function · L29-L32 — function constructStorageCost(baseStorage: number, grade: LotGrade | undefined): number
- creditLot · function · L34-L45 — function creditLot( grades: LotGrades | undefined, budgets: Budgets, resource: keyof Budgets, amount: number, incoming: LotGrade, ): LotGrades
- spendLot · function · L47-L51 — function spendLot(grades: LotGrades | undefined, remaining: number, resource: keyof Budgets): LotGrades
- lotLines · function · L53-L71 — function lotLines(grades: LotGrades | undefined, origins?: LotOrigins, spoils?: string[]): string[]
- spoilWornLots · function · L73-L100 — function spoilWornLots( grades: LotGrades | undefined, budgets: Budgets, origins?: LotOrigins, ): { grades: LotGrades; origins: LotOrigins; losses: Array<{ resource: keyof Budgets; amount: number }>; lines: string[] }
- LotOrigin · type · L102-L102 — type LotOrigin = { room_id: string; room_name: string; producer_id: string };
- LotOrigins · type · L103-L103 — type LotOrigins = Partial<Record<keyof Budgets, LotOrigin>>;
- publicHarvestOrigin · function · L105-L113 — function publicHarvestOrigin( room: { room_id: string; name: string; hidden?: boolean; tags?: string[] } | undefined, producerId: string, ): LotOrigin | undefined
- mixOrigin · function · L115-L125 — function mixOrigin( haveAmount: number, have: LotOrigin | undefined, addAmount: number, add: LotOrigin | undefined, ): LotOrigin | undefined
- creditOrigin · function · L127-L140 — function creditOrigin( origins: LotOrigins | undefined, budgets: Budgets, resource: keyof Budgets, amount: number, incoming: LotOrigin | undefined, ): LotOrigins
- spendOrigin · function · L142-L150 — function spendOrigin( origins: LotOrigins | undefined, remaining: number, resource: keyof Budgets, ): LotOrigins
