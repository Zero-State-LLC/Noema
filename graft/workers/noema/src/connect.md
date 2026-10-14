# workers/noema/src/connect.ts

- signupSection · function · L38-L56 — function signupSection(task: boolean): string
- onboardCopy · function · L58-L85 — function onboardCopy(reviewEmailReady: boolean): string
- approveSection · function · L87-L114 — function approveSection(task: boolean, codeValue: string): string
- ConnectHtmlOpts · type · L116-L119 — type ConnectHtmlOpts = { /** True only when review mail can report delivery `sent`. */ reviewEmailReady?: boolean; };
- connectHtml · function · L122-L503 — function connectHtml( production = false, pendingCode: string | null = null, opts: ConnectHtmlOpts = {}, ): string
- enrollHtml · function · L505-L601 — function enrollHtml(): string
