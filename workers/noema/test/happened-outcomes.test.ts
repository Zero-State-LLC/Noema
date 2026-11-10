import { expect, test } from "vitest";
import { cloneBudgets, DEFAULT_BUDGETS, enrichEntity } from "../src/actions";
import { mintControllerToken } from "../src/auth";
import { DELAYED_MESSAGE } from "../src/communication";
import { fourBeatFromResult } from "../src/play-ui";
import type { CommandResult } from "../src/types";
import { fixtureWorld, harness } from "./agent-http-do-fixture";

function happened(result: CommandResult) {
  const text = result.observation?.play_text ?? "";
  expect(text).toContain("\nHAPPENED\n");
  return text.split("\nHAPPENED\n")[1].split("\n");
}

for (const command of ["wait", "WAIT", "  WaIt  "]) {
  test(`successful normalized ${JSON.stringify(command)} is wait without replacing consequence or hint`, () => {
    expect(fourBeatFromResult({ command, ok: true, consequence: "Authoritative rest delta.",
      affordances: [{ cmd: "blocked", available: false }, { cmd: " LOOK " }] })).toEqual({
      tried: "You wait.", outcome: "wait", changed: "Authoritative rest delta.", next: "LOOK",
    });
  });
}

test("failure and partial take precedence over the wait verb", () => {
  expect(fourBeatFromResult({ command: "WAIT", ok: false, partial: true,
    errorCode: "NOT_IN_WORLD", errorMessage: "Enter the world first." })).toMatchObject({
    outcome: "fail", changed: "Enter the world first.",
  });
  expect(fourBeatFromResult({ command: "WAIT", ok: true, partial: true }).outcome).toBe("partial");
  expect(fourBeatFromResult({ command: "MESSAGE", ok: true, partial: true,
    consequence: DELAYED_MESSAGE })).toMatchObject({ outcome: "partial", changed: DELAYED_MESSAGE });
  expect(fourBeatFromResult({ command: "MESSAGE", ok: true }).outcome).toBe("ok");
  expect(fourBeatFromResult({ command: "await", ok: true }).outcome).toBe("ok");
});

test("authenticated Worker and DO emit actual ok, fail and delayed MESSAGE partial HAPPENED outcomes", async () => {
  const world = fixtureWorld();
  world.rooms["room.a"].entities.push(enrichEntity({ entity_id: "entity.delayed-relay",
    label: "relay", entity_type: "INFRASTRUCTURE", condition: 25 }));
  const h = harness(world);
  const sender = await h.agent();
  const recipient = await mintControllerToken(h.env, { handle: "Recipient", controllerType: "agent",
    playerId: "player.recipient" });
  const send = async (token: string, command: string, args = {}) => {
    const response = await h.command(token, command, args);
    expect(response.status).toBe(200);
    return await response.json() as CommandResult;
  };
  const failedWait = await send(sender.access_token, "WAIT");
  expect(failedWait.ok).toBe(false);
  expect(failedWait.error?.code).toBe("NOT_IN_WORLD");
  expect((await send(sender.access_token, "ENTER_WORLD")).ok).toBe(true);
  const failedMove = await send(sender.access_token, "MOVE", { direction: "north" });
  expect(failedMove.ok).toBe(false);
  expect(happened(failedMove)[1]).toBe("fail");
  expect((await send(recipient.access_token, "ENTER_WORLD")).ok).toBe(true);
  const moved = await send(recipient.access_token, "MOVE", { direction: "east" });
  expect(moved.ok).toBe(true);
  expect(happened(moved)[1]).toBe("ok");
  const before = await h.persistedWorld();
  const partial = await send(sender.access_token, "MESSAGE", { recipient_id: "player.recipient", text: "Delayed body" });
  expect(partial.ok).toBe(true);
  expect(partial.events?.map(e => e.event_type)).toEqual(["MESSAGE"]);
  expect(partial.observation?.consequence).toBe(DELAYED_MESSAGE);
  expect(happened(partial).slice(0, 3)).toEqual(["You message.", "partial", DELAYED_MESSAGE]);
  const after = await h.persistedWorld();
  expect(after?.pending_messages).toHaveLength(1);
  expect(after?.messages.filter(m => m.recipient_id === "player.recipient")).toEqual([]);
  expect(after!.players["player.boundary"].budgets.compute).toBe(before!.players["player.boundary"].budgets.compute - 1);
});

for (const capped of [false, true]) {
  test(`authenticated WAIT preserves ${capped ? "capped" : "noncapped"} authoritative rest deltas and machine result`, async () => {
    const seed = harness();
    const identity = await seed.agent();
    expect((await (await seed.command(identity.access_token, "ENTER_WORLD")).json() as CommandResult).ok).toBe(true);
    const world = (await seed.persistedWorld())!;
    // A second, nonwaiting occupant prevents cycle regeneration from obscuring rest deltas.
    world.players["player.other"] = structuredClone(world.players["player.boundary"]);
    const budgets = cloneBudgets(DEFAULT_BUDGETS);
    if (!capped) { budgets.attention -= 3; budgets.compute -= 5; }
    world.players["player.boundary"].budgets = budgets;
    const h = harness(world);
    const agent = await h.agent();
    const response = await h.command(agent.access_token, "WAIT", {}, { request_id: "rest.wait" });
    expect(response.status).toBe(200);
    const result = await response.json() as CommandResult;
    expect(result.ok).toBe(true);
    expect(result.settled).toBe(false);
    expect(result.observation?.consequence).toBe("You wait.");
    expect(result.events?.map(e => e.event_type)).toEqual(["WAIT"]);
    expect(happened(result).slice(0, 3)).toEqual(["You wait.", "wait",
      `You wait. Attention +${capped ? 0 : 2} · Compute +${capped ? 0 : 4}.`]);
    const after = (await h.persistedWorld())!;
    expect(after.players["player.boundary"].budgets.attention - budgets.attention).toBe(capped ? 0 : 2);
    expect(after.players["player.boundary"].budgets.compute - budgets.compute).toBe(capped ? 0 : 4);
    expect(result.observation?.budgets).toEqual(after.players["player.boundary"].budgets);
    expect(after.cycle).toBe(world.cycle);
    const hint = result.observation?.affordances?.find(a => a.available !== false && a.cmd?.trim())?.cmd?.trim();
    if (hint) expect(happened(result)[3]).toBe(hint);
  });
}
