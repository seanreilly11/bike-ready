import { describe, it, expect, afterEach } from "vitest";
import { isPaddleConfigured } from "@/lib/paddle/config";

const key = process.env.PADDLE_API_KEY;
const secret = process.env.PADDLE_WEBHOOK_SECRET;
afterEach(() => {
  process.env.PADDLE_API_KEY = key;
  process.env.PADDLE_WEBHOOK_SECRET = secret;
});

describe("isPaddleConfigured", () => {
  it("is true when both key and webhook secret are set", () => {
    process.env.PADDLE_API_KEY = "k";
    process.env.PADDLE_WEBHOOK_SECRET = "s";
    expect(isPaddleConfigured()).toBe(true);
  });

  it("is false when the api key is missing", () => {
    delete process.env.PADDLE_API_KEY;
    process.env.PADDLE_WEBHOOK_SECRET = "s";
    expect(isPaddleConfigured()).toBe(false);
  });

  it("is false when the webhook secret is missing", () => {
    process.env.PADDLE_API_KEY = "k";
    delete process.env.PADDLE_WEBHOOK_SECRET;
    expect(isPaddleConfigured()).toBe(false);
  });
});
