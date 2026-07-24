// Reads PADDLE_ENV only — no secrets, no "server-only" import, so it stays
// directly unit-testable. Never silently default the environment: a wrong
// default means running against the wrong Paddle account.
export type PaddleEnv = "sandbox" | "production";

export function paddleEnvironment(): PaddleEnv {
  const value = process.env.PADDLE_ENV;
  if (value !== "sandbox" && value !== "production") {
    throw new Error(
      `PADDLE_ENV must be "sandbox" or "production" (got: ${value ?? "unset"})`,
    );
  }
  return value;
}
