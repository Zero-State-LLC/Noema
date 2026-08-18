import { beforeEach } from "vitest";
import { commandThrottle, deviceThrottle } from "../src/rate-limit";

beforeEach(() => {
  commandThrottle.reset();
  deviceThrottle.reset();
});
