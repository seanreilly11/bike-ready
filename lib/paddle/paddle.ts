import "server-only";
import { Environment, Paddle } from "@paddle/paddle-node-sdk";
import { paddleEnvironment } from "./env";

let _paddle: Paddle | null = null;

// Lazy singleton so PADDLE_ENV / PADDLE_API_KEY are read at first use, not at
// module load. The API key is server-only and never reaches client code.
export function getPaddle(): Paddle {
  if (!_paddle) {
    const env =
      paddleEnvironment() === "production"
        ? Environment.production
        : Environment.sandbox;
    _paddle = new Paddle(process.env.PADDLE_API_KEY ?? "", { environment: env });
  }
  return _paddle;
}
