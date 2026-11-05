import { afterEach, beforeEach, expect, test as mountedSocialCase, vi } from "vitest";
import { mintControllerToken } from "../src/auth";
import { enrichEntity } from "../src/actions";
import { fixtureWorld, harness, WORLD } from "./agent-http-do-fixture";

beforeEach(() => vi.stubGlobal("fetch", vi.fn(() => {
  throw new Error("External network forbidden in local DO fixture");
})));
afterEach(() => vi.unstubAllGlobals());

mountedSocialCase("mounted structured observation stays local after fixture restart, while exact distant MESSAGE reaches only its recipient", async () => {
  const world = fixtureWorld();
  // Long-range delivery requires a live relay; the default two-room fixture has none.
  world.rooms["room.a"].entities.push(enrichEntity({ entity_id: "entity.social-relay",
    label: "relay", entity_type: "INFRASTRUCTURE", condition: 75 }));
  const h = harness(world);
  const sender = await mintControllerToken(h.env, {
    handle: "Sender", controllerType: "agent", playerId: "player.social-sender",
  });
  const near = await mintControllerToken(h.env, {
    handle: "Near", controllerType: "agent", playerId: "player.social-near",
  });
  const far = await mintControllerToken(h.env, {
    handle: "Far", controllerType: "agent", playerId: "player.social-far",
  });
  for (const principal of [sender, near, far]) {
    const entered = await h.command(principal.access_token, "ENTER_WORLD");
    expect(entered.status).toBe(200);
    expect((await entered.json() as { ok: boolean }).ok).toBe(true);
  }
  const moved = await h.command(far.access_token, "MOVE", { direction: "east" });
  expect(moved.status).toBe(200);
  expect(await moved.json()).toMatchObject({ ok: true, observation: { location: { room_id: "room.b" } } });

  type View = { ok: boolean; observation?: {
    location?: { room_id: string }; players_here?: Array<{ player_id: string }>;
    affordances?: Array<{ action: string; target_id?: string; target_label?: string; label: string }>;
    messages?: Array<{ sender_id: string; text: string }>;
  } };
  const readSender = async () => {
    const response = await h.command(sender.access_token, "LOOK");
    expect(response.status).toBe(200);
    const body = await response.json() as View;
    expect(body.ok).toBe(true);
    expect(body.observation?.location?.room_id).toBe("room.a");
    expect(body.observation?.players_here?.map(p => p.player_id)).toContain(near.player_id);
    expect(body.observation?.players_here?.map(p => p.player_id)).not.toContain(far.player_id);
    const social = body.observation?.affordances?.filter(a => a.action === "MESSAGE" || a.action === "TRADE") ?? [];
    expect(social.filter(a => a.target_id === near.player_id).map(a => a.action).sort()).toEqual(["MESSAGE", "TRADE"]);
    expect(social.filter(a => a.target_id === near.player_id).every(a => a.target_label === "Near")).toBe(true);
    expect(JSON.stringify(social)).not.toContain(far.player_id);
    expect(JSON.stringify(social)).not.toContain("Far");
    return body;
  };
  await readSender();
  h.restart();
  expect((await h.persistedWorld())?.players[far.player_id].room_id).toBe("room.b");
  await readSender();

  const privateText = "PRIVATE_MOUNTED_SOCIAL_BODY";
  const sent = await h.command(sender.access_token, "MESSAGE", { recipient_id: far.player_id, text: privateText });
  expect(sent.status).toBe(200);
  const delivered = await sent.json() as { ok: boolean; error?: { code: string }; events?: Array<{ event_type: string; payload: Record<string, unknown> }> };
  expect(delivered.ok, delivered.error?.code).toBe(true);
  expect(delivered.events?.map(e => e.event_type)).toEqual(["MESSAGE", "MESSAGE_DELIVERED"]);
  expect(delivered.events?.find(e => e.event_type === "MESSAGE")?.payload).toMatchObject({ recipient_id: far.player_id });
  const stored = (await h.persistedWorld())!;
  expect(stored.messages.at(-1)).toMatchObject({ recipient_id: far.player_id, text: privateText });
  h.restart();
  const receiver = await h.command(far.access_token, "LOOK");
  expect(receiver.status).toBe(200);
  const receiverBody = await receiver.json() as View;
  expect(receiverBody.observation?.messages).toContainEqual(expect.objectContaining({ sender_id: sender.player_id, text: privateText }));
  expect(JSON.stringify(await readSender())).not.toContain(privateText);
  const bystander = await h.command(near.access_token, "LOOK");
  expect(bystander.status).toBe(200);
  expect(JSON.stringify(await bystander.json())).not.toContain(privateText);
  const watch = await h.hit("/v1/watch/live");
  expect(watch.status).toBe(200);
  expect(JSON.stringify(await watch.json())).not.toContain(privateText);
  expect(h.calls.filter(c => c.path === "/command").every(c => c.name === WORLD)).toBe(true);
});
