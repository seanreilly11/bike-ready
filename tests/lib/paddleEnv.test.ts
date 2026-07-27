import { describe, it, expect, afterEach } from "vitest";
import { paddleEnvironment } from "@/lib/paddle/env";

const original = process.env.PADDLE_ENV;
afterEach(() => { process.env.PADDLE_ENV = original; });

describe("paddleEnvironment", () => {
  it("returns 'sandbox' when set to sandbox", () => {
    process.env.PADDLE_ENV = "sandbox";
    expect(paddleEnvironment()).toBe("sandbox");
  });

  it("returns 'production' when set to production", () => {
    process.env.PADDLE_ENV = "production";
    expect(paddleEnvironment()).toBe("production");
  });

  it("throws when unset", () => {
    delete process.env.PADDLE_ENV;
    expect(() => paddleEnvironment()).toThrow(/PADDLE_ENV/);
  });

  it("throws on an unrecognized value", () => {
    process.env.PADDLE_ENV = "staging";
    expect(() => paddleEnvironment()).toThrow(/PADDLE_ENV/);
  });
});
