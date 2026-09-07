// Local response fixture only. Real Worker HTTP routing and device enrollment,
// existing in-memory DO boundary. Never sends a request outside this process.
import worker from "../../workers/noema/src/index";
import { env, humanToken } from "../../workers/noema/test/conformance/harness";

globalThis.fetch = async () => { throw new Error("external network forbidden in receipt fixture"); };
const calls = [];
const environment = env(calls, "test.hosted-canonical.receipt-binding");
const human = await humanToken(calls);
async function request(path: string, body?: object, token?: string) {
  const response = await worker.fetch(new Request(`http://127.0.0.1${path}`, {
    method: body ? "POST" : "GET",
    headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  }), environment, { waitUntil() {} } as ExecutionContext);
  if (response.status !== 200) throw new Error(`fixture HTTP ${response.status}`);
  return response.json();
}
const discovery = await request("/.well-known/noema-agent.json");
const enrollments = [];
for (const label of ["controller-a", "controller-b", "controller-c"]) {
  const start = await request("/v1/auth/device", { metadata: { runtime: label } });
  const approval = await request("/v1/auth/device/approve", { user_code: start.user_code }, human);
  const token = await request("/v1/auth/device/token", { device_code: start.device_code });
  const replay = await worker.fetch(new Request("http://127.0.0.1/v1/auth/device/token", {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ device_code: start.device_code }),
  }), environment, { waitUntil() {} } as ExecutionContext);
  if (replay.status !== 401) throw new Error("redeemed device token replay was admitted");
  enrollments.push({ start, approval, token });
}
const vectors = [];
for (const identity of ["ctrl.fixture", "ctrl.agent.abc123"]) {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(identity));
  vectors.push([identity, Array.from(new Uint8Array(bytes)).map(x => x.toString(16).padStart(2, "0")).join("")]);
}
// This pipe carries synthetic credentials into the test, never a retained log.
process.stdout.write(JSON.stringify({ discovery, enrollments, vectors }));
