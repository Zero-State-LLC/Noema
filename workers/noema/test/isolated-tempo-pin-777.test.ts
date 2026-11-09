/** Proposed local fixture checks only; not hosted platform evidence. */
import { afterEach, beforeEach, describe, expect, it as tempoCase, vi } from "vitest";
import { mintAdminSession } from "../src/admin-auth";
import { mintControllerToken, mintHumanPlatformToken } from "../src/auth";
import worker from "../src/index";
import { NoemaWorldDO } from "../src/world-do";
import type { Env } from "../src/types";
import { ACCEPTED_SEALS } from "../src/seal";
import { fixtureWorld, harness, SIGNING, WORLD } from "./agent-http-do-fixture";
const TARGET = "test.hosted-canonical.g5-pin-proof";
const API = "/v1/operator/test-world/tempo-pin";
beforeEach(() => {
  vi.useFakeTimers(); vi.setSystemTime(new Date("2026-11-08T12:00:00Z"));
  vi.stubGlobal("fetch", vi.fn(() => { throw new Error("External fetch forbidden in local G5 fixture"); }));
});
afterEach(() => {
  try { expect(fetch).not.toHaveBeenCalled(); }
  finally { vi.unstubAllGlobals(); vi.useRealTimers(); }
});
async function setupIsolatedTempoPin() {
  const target = fixtureWorld(); target.world_id = TARGET;
  const h = harness(fixtureWorld(), TARGET, target, TARGET);
  h.env.ADMIN_OPERATOR_TOKEN = "fixture-only-g5-operator";
  const admin = await mintAdminSession(h.env, h.env.ADMIN_OPERATOR_TOKEN);
  if (admin instanceof Response) throw new Error("local admin fixture failed");
  const a = await h.agent();
  const b = await mintControllerToken(h.env, { handle: "Other", controllerType: "agent", playerId: "player.g5.other" });
  const header = { "X-Noema-Admin-Token": admin.access_token };
  expect((await h.command(a.access_token, "ENTER_WORLD")).status).toBe(200);
  for (const [i, token] of [a.access_token, b.access_token].entries()) {
    expect((await h.hit("/v1/command", { world_id: TARGET, request_id: `setup.${i}`, command: "ENTER_WORLD", arguments: {} }, token, ACCEPTED_SEALS[0], header)).status).toBe(200);
  }
  const beforeDefault = await h.persistedWorld(WORLD);
  expect(beforeDefault?.players["player.boundary"]).toBeDefined();
  h.calls.length = 0; h.writes.length = 0; h.alarms.length = 0;
  return { h, a, b, header, admin, beforeDefault };
}
function targetWrites(h: ReturnType<typeof harness>) { return h.writes.filter(x => x.name === TARGET || x.name === WORLD); }
async function onlyObserveScope(token: string) {
  const [head, payload] = token.split(".");
  const claims = JSON.parse(atob(payload.replace(/-/g,"+").replace(/_/g,"/")));
  claims.scopes = ["noema.world.observe"];
  const b64 = (s: string) => btoa(s).replace(/=/g,"").replace(/\+/g,"-").replace(/\//g,"_");
  const unsigned = head + "." + b64(JSON.stringify(claims));
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(SIGNING), { name:"HMAC", hash:"SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(unsigned));
  return unsigned + "." + b64(String.fromCharCode(...new Uint8Array(sig)));
}
describe("isolated G5 tempo pin admission", () => {
  tempoCase("pins only the configured target with real dual authorization and records its pending alarm", async () => {
    const {h,a,header,beforeDefault}=await setupIsolatedTempoPin();
    const r=await h.hit(API,{world_id:TARGET},a.access_token,ACCEPTED_SEALS[0],header);
    expect(r.status).toBe(200);
    expect(await r.json()).toMatchObject({ok:true,world_id:TARGET,player_tempo:{mode:"OBSERVED_LIVE",phase:"COLLECT"}});
    const stored=await h.persistedWorld(TARGET);
    expect(stored?.player_tempo?.active_participant_ids).toHaveLength(2);
    expect(stored?.player_tempo?.collect_deadline_ms).toBe(Date.now()+20000);
    expect(h.alarms).toContainEqual({name:TARGET,at:Date.now()+20000});
    expect(await h.persistedWorld(WORLD)).toEqual(beforeDefault);
    // Authentication legitimately reads the revocation DO; only the pin dispatch must select TARGET.
    expect(h.calls.filter(x=>x.path==="/isolated-tempo/pin")).toEqual([{name:TARGET,path:"/isolated-tempo/pin"}]);
    expect(h.calls.some(x=>x.name===WORLD)).toBe(false);
    expect(h.calls.filter(x=>x.name!==TARGET).every(x=>x.path==="/revoke")).toBe(true);
  });
  tempoCase.each(["production","local"])("is404 outside test (%s) before dispatch",async name=>{
    const {h,a,header}=await setupIsolatedTempoPin();h.env.NOEMA_ENV=name;
    expect((await h.hit(API,{world_id:TARGET},a.access_token,ACCEPTED_SEALS[0],header)).status).toBe(404);
    expect(targetWrites(h)).toEqual([]);expect(h.calls.filter(x=>x.name===TARGET||x.name===WORLD)).toEqual([]);
  });
  tempoCase.each([WORLD,"world-01","invalid-target","test.hosted-canonical.other"])("rejects a nonconfigured target (%s)",async target=>{
    const {h,a,header}=await setupIsolatedTempoPin();
    expect((await h.hit(API,{world_id:target},a.access_token,ACCEPTED_SEALS[0],header)).status).toBe(403);
    expect(targetWrites(h)).toEqual([]);
    expect(h.calls.filter(x=>x.path==="/isolated-tempo/pin")).toEqual([]);
  });
  tempoCase("requires both Agent and signed-admin credentials",async()=>{
    const {h,a,admin,header}=await setupIsolatedTempoPin();
    const human=await mintHumanPlatformToken(h.env,{identityId:"identity.fixture.g5"});
    for(const [token,headers] of [[a.access_token,{}],[admin.access_token,header],[human.access_token,header]] as const){
      expect([401,403]).toContain((await h.hit(API,{world_id:TARGET},token,ACCEPTED_SEALS[0],headers)).status);
    }
    expect(targetWrites(h)).toEqual([]);
  });
  tempoCase("requires Agent action-submit scope",async()=>{
    const {h,a,header}=await setupIsolatedTempoPin();const token=await onlyObserveScope(a.access_token);
    expect((await h.hit(API,{world_id:TARGET},token,ACCEPTED_SEALS[0],header)).status).toBe(403);
    expect(targetWrites(h)).toEqual([]);
  });
  tempoCase.each(["mode","now","action","reason"])("rejects caller override field %s",async field=>{
    const {h,a,header}=await setupIsolatedTempoPin();
    expect((await h.hit(API,{world_id:TARGET,[field]:"override"},a.access_token,ACCEPTED_SEALS[0],header)).status).toBe(400);
    expect(targetWrites(h)).toEqual([]);
  });
  tempoCase("rechecks stored identity before load or write on direct DO entry",async()=>{
    const writes:string[]=[];const reads:string[]=[];
    const state={storage:{get:async(key:string)=>{reads.push(key);return key==="world"?{world_id:WORLD}:undefined;},put:async(key:string)=>{writes.push(key);}}} as unknown as DurableObjectState;
    const object=new NoemaWorldDO(state,{NOEMA_ENV:"test",DEFAULT_WORLD_ID:WORLD,ISOLATED_WATCH_WORLD_ID:TARGET} as Env);
    const r=await object.fetch(new Request("https://do/isolated-tempo/pin",{method:"POST",headers:{"content-type":"application/json","x-noema-world-id":TARGET},body:JSON.stringify({world_id:TARGET})}));
    expect(r.status).toBe(403);expect(reads).toEqual(["world"]);expect(writes).toEqual([]);
  });
  tempoCase.each(["production","local"])("direct DO endpoint404 outside test (%s)",async name=>{
    const writes:string[]=[];const reads:string[]=[];
    const state={storage:{get:async(key:string)=>{reads.push(key);return undefined;},put:async(key:string)=>{writes.push(key);}}} as unknown as DurableObjectState;
    const object=new NoemaWorldDO(state,{NOEMA_ENV:name,DEFAULT_WORLD_ID:WORLD,ISOLATED_WATCH_WORLD_ID:TARGET} as Env);
    const r=await object.fetch(new Request("https://do/isolated-tempo/pin",{method:"POST",body:JSON.stringify({world_id:TARGET})}));
    expect(r.status).toBe(404);expect(reads).toEqual([]);expect(writes).toEqual([]);
  });
  tempoCase.each(["missing-header","wrong-header","wrong-target","default-target","missing-world","missing-config","override"])("direct DO rejects bad admission before storage (%s)",async variant=>{
    const reads:string[]=[];const writes:string[]=[];
    const state={storage:{get:async(key:string)=>{reads.push(key);return undefined;},put:async(key:string)=>{writes.push(key);}}} as unknown as DurableObjectState;
    const object=new NoemaWorldDO(state,{NOEMA_ENV:"test",DEFAULT_WORLD_ID:WORLD,...(variant==="missing-config"?{}:{ISOLATED_WATCH_WORLD_ID:TARGET})} as Env);
    const body:Record<string,unknown>=variant==="missing-world"?{}:{world_id:variant==="wrong-target"?"test.hosted-canonical.other":variant==="default-target"?WORLD:TARGET};
    if(variant==="override")body.now=0;
    const headers:Record<string,string>={"content-type":"application/json"};
    if(variant!=="missing-header")headers["x-noema-world-id"]=variant==="wrong-header"?WORLD:TARGET;
    const r=await object.fetch(new Request("https://do/isolated-tempo/pin",{method:"POST",headers,body:JSON.stringify(body)}));
    expect(r.status).toBe(variant==="override"?400:403);expect(reads).toEqual([]);expect(writes).toEqual([]);
  });
  tempoCase("refuses an uninitialized isolated world without implicit bootstrap",async()=>{
    const writes:string[]=[];
    const state={storage:{get:async()=>undefined,put:async(key:string)=>{writes.push(key);}}} as unknown as DurableObjectState;
    const object=new NoemaWorldDO(state,{NOEMA_ENV:"test",DEFAULT_WORLD_ID:WORLD,ISOLATED_WATCH_WORLD_ID:TARGET} as Env);
    const r=await object.fetch(new Request("https://do/isolated-tempo/pin",{method:"POST",headers:{"content-type":"application/json","x-noema-world-id":TARGET},body:JSON.stringify({world_id:TARGET})}));
    expect(r.status).toBe(409);expect(writes).toEqual([]);
  });
  tempoCase("preserves existing unresolved-settlement pin refusal",async()=>{
    const stored=fixtureWorld();stored.world_id=TARGET;stored.unsettled=[{} as never];
    const h=harness(fixtureWorld(),TARGET,stored,TARGET);
    h.env.ADMIN_OPERATOR_TOKEN="fixture-only-g5-operator";
    const admin=await mintAdminSession(h.env,h.env.ADMIN_OPERATOR_TOKEN);if(admin instanceof Response)throw new Error("fixture admin session failed");
    const token=(await h.agent()).access_token;
    // Establish a real default-world control and instantiate the retained target without loading/mutating it.
    expect((await h.command(token,"ENTER_WORLD")).status).toBe(200);
    const stub=h.env.WORLD_DO.get(h.env.WORLD_DO.idFromName(TARGET));
    expect((await stub.fetch(new Request("https://do/isolated-instance/probe",{method:"POST",headers:{"x-noema-world-id":TARGET}}))).status).toBe(200);
    const beforeTarget=await h.persistedWorld(TARGET);const beforeDefault=await h.persistedWorld(WORLD);
    expect(beforeTarget).toBeDefined();expect(beforeDefault?.players["player.boundary"]).toBeDefined();
    const beforeAlarms=structuredClone(h.alarms);h.writes.length=0;
    const r=await h.hit(API,{world_id:TARGET},token,ACCEPTED_SEALS[0],{"X-Noema-Admin-Token":admin.access_token});
    expect(r.status).toBe(409);expect(await r.json()).toMatchObject({error:{code:"TEMPO_PIN_FORBIDDEN"}});
    expect((await h.persistedWorld(TARGET))?.unsettled).toEqual(stored.unsettled);
    expect((await h.persistedWorld(TARGET))?.player_tempo_policy_version).toBeUndefined();
    expect(await h.persistedWorld(TARGET)).toEqual(beforeTarget);
    expect(await h.persistedWorld(WORLD)).toEqual(beforeDefault);
    expect(targetWrites(h)).toEqual([]);expect(h.alarms).toEqual(beforeAlarms);
  });
  tempoCase("denies absent gateway target configuration before pin dispatch",async()=>{
    const {h,a,header}=await setupIsolatedTempoPin();delete h.env.ISOLATED_WATCH_WORLD_ID;
    expect((await h.hit(API,{world_id:TARGET},a.access_token,ACCEPTED_SEALS[0],header)).status).toBe(403);
    expect(h.calls.filter(x=>x.path==="/isolated-tempo/pin")).toEqual([]);expect(targetWrites(h)).toEqual([]);
  });
  tempoCase("preserves accepted-set committed-boundary refusal without a new alarm",async()=>{
    const {h,a,header}=await setupIsolatedTempoPin();
    expect((await h.hit(API,{world_id:TARGET},a.access_token,ACCEPTED_SEALS[0],header)).status).toBe(200);
    expect((await h.hit("/v1/command",{world_id:TARGET,request_id:"g5.accepted.move",command:"MOVE",arguments:{direction:"east"}},a.access_token,ACCEPTED_SEALS[0],header)).status).toBe(200);
    const before=await h.persistedWorld(TARGET);expect(before?.player_tempo?.accepted).toHaveLength(1);expect(before?.unsettled).toEqual([]);
    const beforeAlarms=structuredClone(h.alarms);const beforeDefault=await h.persistedWorld(WORLD);h.writes.length=0;
    const r=await h.hit(API,{world_id:TARGET},a.access_token,ACCEPTED_SEALS[0],header);
    expect(r.status).toBe(409);expect(await r.json()).toMatchObject({error:{code:"TEMPO_PIN_FORBIDDEN"}});
    expect(await h.persistedWorld(TARGET)).toEqual(before);expect(h.alarms).toEqual(beforeAlarms);expect(targetWrites(h)).toEqual([]);
    expect(await h.persistedWorld(WORLD)).toEqual(beforeDefault);
  });
  tempoCase.each(["{malformed", "null", "[]", "1", "\"text\""])("gateway rejects malformed/non-object JSON (%s)",async body=>{
    const {h,a,header}=await setupIsolatedTempoPin();
    const r=await worker.fetch(new Request("https://noema.invalid"+API,{method:"POST",headers:{"content-type":"application/json",Authorization:`Bearer ${a.access_token}`,"X-Noema-Seal":ACCEPTED_SEALS[0],...header},body}),h.env);
    expect(r.status).toBe(400);expect(h.calls.filter(x=>x.path==="/isolated-tempo/pin")).toEqual([]);expect(targetWrites(h)).toEqual([]);
  });
  tempoCase.each(["{malformed", "null", "[]", "1", "\"text\""])("direct DO rejects malformed/non-object JSON (%s)",async body=>{
    const reads:string[]=[];const writes:string[]=[];
    const state={storage:{get:async(key:string)=>{reads.push(key);return undefined;},put:async(key:string)=>{writes.push(key);}}} as unknown as DurableObjectState;
    const object=new NoemaWorldDO(state,{NOEMA_ENV:"test",DEFAULT_WORLD_ID:WORLD,ISOLATED_WATCH_WORLD_ID:TARGET} as Env);
    const r=await object.fetch(new Request("https://do/isolated-tempo/pin",{method:"POST",headers:{"content-type":"application/json","x-noema-world-id":TARGET},body}));
    expect(r.status).toBe(400);expect(reads).toEqual([]);expect(writes).toEqual([]);
  });
  tempoCase.each(["TOOBIG","storage unavailable"])("refuses persistence failure with no success or new alarm (%s)",async fault=>{
    const {h}=await setupIsolatedTempoPin();const world=await h.persistedWorld(TARGET);const meta=await h.persistedMeta(TARGET);
    const bag=new Map<string,unknown>([["world",world],["world_meta",meta]]);const alarms:number[]=[];let failing=false;let attempts=0;
    const state={storage:{get:async(key:string)=>structuredClone(bag.get(key)),put:async(key:string,value:unknown)=>{if(key==="world"){attempts++;if(failing)throw new Error(fault);}bag.set(key,structuredClone(value));},setAlarm:async(at:number)=>{alarms.push(at);},deleteAlarm:async()=>{throw new Error("unexpected deletion");}}} as unknown as DurableObjectState;
    const object=new NoemaWorldDO(state,h.env);
    const request=()=>new Request("https://do/isolated-tempo/pin",{method:"POST",headers:{"content-type":"application/json","x-noema-world-id":TARGET},body:JSON.stringify({world_id:TARGET})});
    expect((await object.fetch(request())).status).toBe(200);expect(attempts).toBeGreaterThan(0);expect(alarms).toHaveLength(1);
    const retained=structuredClone(bag.get("world"));const priorAlarms=[...alarms];const priorAttempts=attempts;
    failing=true;vi.setSystemTime(new Date(Date.now()+1000));
    const r=await object.fetch(request());expect(r.status).toBe(503);const body=await r.json();expect(body).toMatchObject({error:{code:"CONFLICT"}});expect(body).not.toMatchObject({ok:true});
    expect(attempts-priorAttempts).toBe(fault==="TOOBIG"?2:1);expect(bag.get("world")).toEqual(retained);expect(alarms).toEqual(priorAlarms);
    expect(JSON.stringify(body)).not.toContain(fault);
  });
  tempoCase.each([undefined,null,7,false,[],{},{toString:"not-a-function"}].map(world_id=>({world_id})))("rejects non-string gateway world_id (%j)",async ({world_id})=>{
    const {h,a,header}=await setupIsolatedTempoPin();
    expect((await h.hit(API,{world_id},a.access_token,ACCEPTED_SEALS[0],header)).status).toBe(403);
    expect(h.calls.filter(x=>x.path==="/isolated-tempo/pin")).toEqual([]);expect(targetWrites(h)).toEqual([]);
  });
  tempoCase("rejects a cached identity mismatch before load after controlled storage replacement",async()=>{
    const initial=fixtureWorld();const target=fixtureWorld();target.world_id=TARGET;
    const bag=new Map<string,unknown>([["world",initial],["world_meta",{status:"ACTIVE",config_frozen:true,settlement_health:"HEALTHY"}]]);
    const reads:string[]=[];const writes:string[]=[];const alarms:number[]=[];
    const state={storage:{get:async(key:string)=>{reads.push(key);return structuredClone(bag.get(key));},put:async(key:string,value:unknown)=>{writes.push(key);bag.set(key,structuredClone(value));},setAlarm:async(at:number)=>{alarms.push(at);}}} as unknown as DurableObjectState;
    const object=new NoemaWorldDO(state,{NOEMA_ENV:"test",DEFAULT_WORLD_ID:WORLD,ISOLATED_WATCH_WORLD_ID:TARGET} as Env);
    expect((await object.fetch(new Request("https://do/health"))).status).toBe(200);
    // Controlled fixture intervention: retain the old cache but replace storage identity; not a production write.
    bag.set("world",target);reads.length=0;writes.length=0;
    const r=await object.fetch(new Request("https://do/isolated-tempo/pin",{method:"POST",headers:{"content-type":"application/json","x-noema-world-id":TARGET},body:JSON.stringify({world_id:TARGET})}));
    expect(r.status).toBe(403);expect(reads).toEqual(["world"]);expect(writes).toEqual([]);expect(bag.get("world")).toEqual(target);
    expect(alarms).toEqual([]);
  });
});
