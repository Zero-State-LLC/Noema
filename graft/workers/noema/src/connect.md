# workers/noema/src/connect.ts

- signupSection · function · L66-L84 — function signupSection(task: boolean): string
- onboardCopy · function · L86-L116 — function onboardCopy(reviewEmailReady: boolean): string
- approveSection · function · L118-L145 — function approveSection(task: boolean, codeValue: string): string
- ConnectHtmlOpts · type · L147-L150 — type ConnectHtmlOpts = { /** True only when review mail can report delivery `sent`. */ reviewEmailReady?: boolean; };
- connectHtml · function · L153-L553 — function connectHtml( production = false, pendingCode: string | null = null, opts: ConnectHtmlOpts = {}, ): string
- enrollHtml · function · L555-L656 — function enrollHtml(): string
