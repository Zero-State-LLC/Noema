import { afterEach, describe, expect, it, vi } from "vitest";
import {
  PREDICT_KEY,
  parsePredictState,
  placeGuess,
  predictInlineSource,
  resolvePrediction,
} from "../src/watch-predict";
import { watchHtml } from "../src/watch";

type State = { on: boolean; hits: number; tries: number; guess: string; after: number };

const OFF: State = { on: false, hits: 0, tries: 0, guess: "", after: 0 };

function base(over: Partial<State>): State {
  return Object.assign({ on: true, hits: 0, tries: 0, guess: "room.a", after: 4 }, over);
}

const BANNED = ["fetch(", "XMLHttpRequest", "sendBeacon", "WebSocket", "EventSource", "import("];

describe("parsePredictState", () => {
  it("is off by default and always a fresh object", () => {
    expect(parsePredictState(null)).toEqual(OFF);
    expect(parsePredictState("")).toEqual(OFF);
    expect(parsePredictState(null)).not.toBe(parsePredictState(null));
  });

  it("tolerates garbage", () => {
    expect(parsePredictState("not json")).toEqual(OFF);
    expect(parsePredictState("null")).toEqual(OFF);
    expect(parsePredictState("[1,2,3]")).toEqual(OFF);
    expect(parsePredictState('"text"')).toEqual(OFF);
    expect(parsePredictState("{}")).toEqual(OFF);
    expect(parsePredictState(JSON.stringify({ on: "yes", guess: 7, hits: "x", tries: null, after: {} }))).toEqual(OFF);
  });

  it("keeps strict booleans and clamps integers", () => {
    expect(parsePredictState(JSON.stringify({ on: 1 })).on).toBe(false);
    expect(parsePredictState(JSON.stringify({ on: "true" })).on).toBe(false);
    expect(parsePredictState(JSON.stringify({ on: true })).on).toBe(true);
    expect(parsePredictState(JSON.stringify({ on: true, hits: -4, tries: 2.9, guess: "room.a", after: 12 })))
      .toEqual({ on: true, hits: 0, tries: 2, guess: "room.a", after: 12 });
    expect(parsePredictState(JSON.stringify({ on: true, hits: 5000000, tries: 1000000, guess: "x".repeat(200), after: 1000000.7 })))
      .toEqual({ on: true, hits: 1000000, tries: 1000000, guess: "x".repeat(80), after: 1000000 });
  });

  it("exposes the storage key", () => {
    expect(PREDICT_KEY).toBe("noema.watch.predict.v1");
  });
});

describe("resolvePrediction", () => {
  it("stays unchanged while off or with no pending guess", () => {
    const offState = base({ on: false });
    const offRes = resolvePrediction(offState, [{ sequence: 5, room_id: "room.a" }], ["room.a"]);
    expect(offRes.outcome).toBe("");
    expect(offRes.site).toBe("");
    expect(offRes.state).toBe(offState);

    const noGuess = base({ guess: "" });
    const noGuessRes = resolvePrediction(noGuess, [{ sequence: 5, room_id: "room.a" }], ["room.a"]);
    expect(noGuessRes.outcome).toBe("");
    expect(noGuessRes.state).toBe(noGuess);
  });

  it("resolves a hit without mutating the input", () => {
    const st = base({});
    const snapshot = Object.assign({}, st);
    const res = resolvePrediction(st, [
      { sequence: 3, room_id: "room.a" },
      { sequence: 9, room_id: "room.b" },
      { sequence: 5, room_id: "room.a" },
    ], ["room.a", "room.b"]);
    expect(res.outcome).toBe("hit");
    expect(res.site).toBe("room.a");
    expect(res.state).toEqual({ on: true, hits: 1, tries: 1, guess: "", after: 5 });
    expect(res.state).not.toBe(st);
    expect(st).toEqual(snapshot);
  });

  it("resolves a miss", () => {
    const res = resolvePrediction(base({ guess: "room.b" }), [{ sequence: 5, room_id: "room.a" }], ["room.a", "room.b"]);
    expect(res.outcome).toBe("miss");
    expect(res.site).toBe("room.a");
    expect(res.state.hits).toBe(0);
    expect(res.state.tries).toBe(1);
    expect(res.state.guess).toBe("");
  });

  it("ignores non-public room ids", () => {
    const st = base({});
    const res = resolvePrediction(st, [{ sequence: 6, room_id: "room.private" }], ["room.a"]);
    expect(res.outcome).toBe("");
    expect(res.state).toBe(st);
  });

  it("ignores sequences at or before after", () => {
    const st = base({ after: 5 });
    const res = resolvePrediction(st, [
      { sequence: 5, room_id: "room.a" },
      { sequence: 4, room_id: "room.a" },
    ], ["room.a"]);
    expect(res.outcome).toBe("");
    expect(res.state).toBe(st);
  });

  it("ignores malformed events", () => {
    const st = base({});
    const res = resolvePrediction(st, [
      null,
      { sequence: "5", room_id: "room.a" },
      { sequence: 7, room_id: 42 },
    ] as unknown[], ["room.a"]);
    expect(res.outcome).toBe("");
    expect(res.state).toBe(st);
  });

  it("picks the smallest qualifying sequence", () => {
    const res = resolvePrediction(base({ guess: "room.a", after: 5 }), [
      { sequence: 12, room_id: "room.a" },
      { sequence: 7, room_id: "room.b" },
      { sequence: 9, room_id: "room.c" },
    ], ["room.a", "room.b", "room.c"]);
    expect(res.site).toBe("room.b");
    expect(res.outcome).toBe("miss");
    expect(res.state.after).toBe(7);
  });
});

describe("placeGuess", () => {
  it("refuses when off", () => {
    const st = base({ on: false });
    expect(placeGuess(st, "room.a", 10, ["room.a"])).toBe(st);
  });

  it("refuses a non-public or empty site", () => {
    const st = base({ guess: "" });
    expect(placeGuess(st, "room.private", 10, ["room.a"])).toBe(st);
    expect(placeGuess(st, "", 10, ["room.a"])).toBe(st);
  });

  it("records the guess and the latest sequence", () => {
    const st = base({ guess: "" });
    const next = placeGuess(st, "room.a", 42, ["room.a"]);
    expect(next).toEqual({ on: true, hits: 0, tries: 0, guess: "room.a", after: 42 });
    expect(st.guess).toBe("");
  });

  it("floors the sequence at zero", () => {
    expect(placeGuess(base({ guess: "" }), "room.a", -9, ["room.a"]).after).toBe(0);
    expect(placeGuess(base({ guess: "" }), "room.a", 3.9, ["room.a"]).after).toBe(3);
  });
});

describe("network isolation", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("drives a full local game with every network API trapped", () => {
    let calls = 0;
    class Trap {
      constructor() { calls += 1; }
    }
    vi.stubGlobal("fetch", function () { calls += 1; return Promise.resolve({}); });
    vi.stubGlobal("XMLHttpRequest", Trap);
    vi.stubGlobal("WebSocket", Trap);
    vi.stubGlobal("EventSource", Trap);
    vi.stubGlobal("navigator", { sendBeacon: function () { calls += 1; } });

    const src = predictInlineSource();
    const api = new Function(
      src + "; return { parsePredictState: parsePredictState, resolvePrediction: resolvePrediction, placeGuess: placeGuess };",
    )() as {
      parsePredictState: (raw: string | null) => State;
      resolvePrediction: (state: State, events: unknown[], ids: string[]) => { state: State; outcome: string; site: string };
      placeGuess: (state: State, roomId: string, seq: number, ids: string[]) => State;
    };

    let st = api.parsePredictState(JSON.stringify({ on: true, hits: 0, tries: 0, guess: "", after: 0 }));
    st = api.placeGuess(st, "room.a", 4, ["room.a", "room.b"]);
    expect(st.guess).toBe("room.a");

    const hit = api.resolvePrediction(st, [{ sequence: 5, room_id: "room.a" }], ["room.a", "room.b"]);
    expect(hit.outcome).toBe("hit");
    expect(hit.site).toBe("room.a");

    const second = api.placeGuess(hit.state, "room.a", 8, ["room.a", "room.b"]);
    expect(second.guess).toBe("room.a");
    const miss = api.resolvePrediction(second, [{ sequence: 9, room_id: "room.b" }], ["room.a", "room.b"]);
    expect(miss.outcome).toBe("miss");
    expect(miss.state.hits).toBe(1);
    expect(miss.state.tries).toBe(2);

    expect(calls).toBe(0);
  });

  it("keeps the inline source and the page block free of network and storage escapes", () => {
    const src = predictInlineSource();
    for (let i = 0; i < BANNED.length; i++) expect(src).not.toContain(BANNED[i]);

    const html = watchHtml();
    const start = html.indexOf("PREDICT_KEY");
    const end = html.indexOf("// end predictions");
    expect(start).toBeGreaterThan(-1);
    expect(end).toBeGreaterThan(start);
    const block = html.slice(start, end);
    for (let i = 0; i < BANNED.length; i++) expect(block).not.toContain(BANNED[i]);
    expect(block).toContain("localStorage");
    expect(block).not.toContain("sessionStorage");
    expect(block).not.toContain("indexedDB");
    expect(block).not.toContain("document.cookie");
  });

  it("is off by default in the rendered page", () => {
    const html = watchHtml();
    const onIdx = html.indexOf('id="watch-predict-on"');
    expect(onIdx).toBeGreaterThan(-1);
    const inputStart = html.lastIndexOf("<input", onIdx);
    const inputEnd = html.indexOf(">", onIdx);
    expect(inputStart).toBeGreaterThan(-1);
    expect(html.slice(inputStart, inputEnd + 1)).not.toContain("checked");
    expect(html).toContain('id="watch-predict-body" hidden');
  });

  it("leaks no bundler keepNames", () => {
    expect(predictInlineSource()).not.toContain("__name");
  });
});
