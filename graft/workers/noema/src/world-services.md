# workers/noema/src/world-services.ts

- ServiceStatus · type · L6-L6 — type ServiceStatus = "AVAILABLE" | "DEGRADED" | "UNAVAILABLE" | "SUPERSEDED";
- WorldServiceId · type · L8-L14 — type WorldServiceId = | "service.exchange.01" | "service.quartermaster.01" | "service.registry.01" | "service.relay.01" | "service.archive.01" | "service.contracts.01";
- WorldServiceDef · interface · L16-L24 — interface WorldServiceDef
- ServiceView · interface · L26-L35 — interface ServiceView
- RoomHint · interface · L94-L106 — interface RoomHint
- servicesAtRoom · function · L108-L161 — function servicesAtRoom(room: RoomHint): ServiceView[]
- add · function · L110-L123 — add = (id: WorldServiceId, status: ServiceStatus, line: string, cmds: string[])
- resolveService · function · L163-L173 — function resolveService(raw: string, present: ServiceView[]): ServiceView | null
- isServiceConsultLine · function · L175-L178 — function isServiceConsultLine(line: string): boolean
- consultLine · function · L180-L184 — function consultLine(service: ServiceView): string
