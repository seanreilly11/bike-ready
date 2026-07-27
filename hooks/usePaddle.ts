"use client";
import { useEffect, useState } from "react";
import { initializePaddle, type Paddle } from "@paddle/paddle-js";

// Module-level singleton so every usePaddle() consumer shares ONE
// initializePaddle call. Both the overlay hook (useUnlock) and the post-auth
// auto-open effect use it; without this they would each load Paddle.js.
// The environment and token are read from NEXT_PUBLIC_* vars — never the
// server key.
let paddlePromise: Promise<Paddle | undefined> | null = null;

function loadPaddle(): Promise<Paddle | undefined> {
  if (!paddlePromise) {
    const rawEnv = process.env.NEXT_PUBLIC_PADDLE_ENV;
    const environment =
      rawEnv === "sandbox" || rawEnv === "production" ? rawEnv : undefined;
    const token = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;

    if (!environment || !token) {
      console.error("Paddle client env vars missing");
      return Promise.resolve(undefined);
    }

    paddlePromise = initializePaddle({ environment, token });
  }
  return paddlePromise;
}

export function usePaddle(): Paddle | undefined {
  const [paddle, setPaddle] = useState<Paddle>();

  useEffect(() => {
    loadPaddle().then(setPaddle);
  }, []);

  return paddle;
}
