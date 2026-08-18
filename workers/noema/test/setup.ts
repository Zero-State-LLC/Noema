import { beforeEach } from "vitest";
import { adminLoginThrottle } from "../src/admin-auth";
import { playLoginThrottle } from "../src/play-auth";
import { adminSessionThrottle, commandThrottle, deviceThrottle } from "../src/rate-limit";

beforeEach(() => {
  commandThrottle.reset();
  deviceThrottle.reset();
  adminSessionThrottle.reset();
  adminLoginThrottle.reset();
  playLoginThrottle.reset();
});
