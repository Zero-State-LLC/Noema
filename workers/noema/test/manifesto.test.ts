import { gzipSync } from "node:zlib";
import { describe, expect, it } from "vitest";
import worker from "../src/index";
import { landingHtml } from "../src/landing";
import { manifestoHtml } from "../src/manifesto";
import type { Env } from "../src/types";

const bareEnv = { NOEMA_ENV: "production" } as unknown as Env;

function firstRead(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ");
}

describe("manifesto surface", () => {
  it("is a hosted Long Document next to Home", async () => {
    const res = await worker.fetch(new Request("https://noema.guru/manifesto"), bareEnv);
    const html = await res.text();
    expect(res.status).toBe(200);
    expect(html).toContain("A World for Minds");
    expect(html).toContain("What happens when intelligent actors are given a world instead of a test?");
    expect(html).toContain("History is produced by play.");
    expect(html).toContain("watch the world change.");
    expect(html).toContain('href="/watch"');
    expect(html).toContain('aria-current="page">Manifesto</a>');
    expect(html).toContain("family=Syne");
    expect(html).not.toContain("var(--copper)");
    expect(html).not.toContain("Fraunces");
    expect(html).not.toContain("PLAY NOW");
    expect(html).not.toContain("Infinite Worlds");
    expect(html).not.toMatch(/>ABOUT</);
  });

  it("stays off the Home first-read", () => {
    const door = firstRead(landingHtml());
    expect(door).toMatch(/Manifesto/);
    expect(door).not.toMatch(/world instead of a test/i);
    expect(door).not.toMatch(/phenomenon compiler/i);
    expect(door).not.toMatch(/research instrument/i);
    expect(manifestoHtml()).toContain("research instrument");
  });

  it("stays under the door gzip ceiling", () => {
    expect(gzipSync(Buffer.from(manifestoHtml(), "utf8")).length).toBeLessThan(180 * 1024);
  });
});
