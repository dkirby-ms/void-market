/**
 * Dev auth bypass tests — verifies the module is inert when disabled
 * and provides correct tokens when enabled.
 */

import { describe, test, expect, vi, afterEach } from "vitest";
import { verifyToken } from "../jwt.js";

// We test by dynamically importing the module after setting env vars.

describe("dev-auth", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.resetModules();
  });

  test("isDevAuthEnabled returns false when DEV_AUTH_BYPASS is not set", async () => {
    delete process.env.DEV_AUTH_BYPASS;
    delete process.env.NODE_ENV;
    const mod = await import("../dev-auth.js");
    // Module was already evaluated with its original env, so we test the
    // exported constant behaviour via the function.
    // Since vitest caches modules, we rely on the test environment (NODE_ENV=test)
    // and DEV_AUTH_BYPASS not being set by default.
    expect(mod.isDevAuthEnabled()).toBe(false);
  });

  test("DEV_USER has expected shape", async () => {
    const { DEV_USER } = await import("../dev-auth.js");
    expect(DEV_USER.id).toBe("dev-user-00000000-0000-0000-0000-000000000000");
    expect(DEV_USER.username).toBe("DevPilot");
    expect(DEV_USER.email).toBe("dev@void.market");
  });

  test("generateDevTokens produces valid JWT tokens", async () => {
    const { generateDevTokens, DEV_USER } = await import("../dev-auth.js");
    const { accessToken, refreshToken } = generateDevTokens();

    expect(typeof accessToken).toBe("string");
    expect(typeof refreshToken).toBe("string");

    const payload = verifyToken(accessToken);
    expect(payload).not.toBeNull();
    expect(payload?.userId).toBe(DEV_USER.id);
    expect(payload?.username).toBe(DEV_USER.username);
  });

  test("devTokenHandler returns 404 when bypass is disabled", async () => {
    const { devTokenHandler, isDevAuthEnabled } = await import("../dev-auth.js");

    // In default test environment, bypass should be disabled
    if (!isDevAuthEnabled()) {
      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };
      devTokenHandler({} as never, mockRes as never);
      expect(mockRes.status).toHaveBeenCalledWith(404);
    }
  });
});
