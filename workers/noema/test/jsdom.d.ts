/**
 * Local jsdom surface for the axe shell tests.
 *
 * `@types/jsdom` is not usable here: its entry point begins with
 * `/// <reference lib="dom" />`, which force-injects lib.dom into a project
 * that declares `"lib": ["ES2022"]` and `"types": ["node"]`. lib.dom's
 * BufferSource then collides with the Workers crypto typings and breaks
 * src/jwt.ts. This declares only what the tests actually touch.
 */
declare module "jsdom" {
  interface JSDOMOptions {
    url?: string;
    runScripts?: "dangerously" | "outside-only";
  }

  interface JSDOMElement {
    textContent: string | null;
    appendChild(child: JSDOMElement): JSDOMElement;
  }

  interface JSDOMDocument {
    readonly head: JSDOMElement;
    createElement(tagName: string): JSDOMElement;
  }

  interface JSDOMWindow {
    readonly document: JSDOMDocument;
    close(): void;
  }

  export class JSDOM {
    constructor(html?: string, options?: JSDOMOptions);
    readonly window: JSDOMWindow;
  }
}
