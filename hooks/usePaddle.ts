"use client";
import { useEffect, useState } from "react";
import { initializePaddle, type Paddle } from "@paddle/paddle-js";

// Initializes Paddle.js once with the sandbox/production client token. The
// environment and token are read from NEXT_PUBLIC_* vars — never the server key.
export function usePaddle(): Paddle | undefined {
  const [paddle, setPaddle] = useState<Paddle>();

  useEffect(() => {
    const environment = process.env.NEXT_PUBLIC_PADDLE_ENV as
      | "sandbox"
      | "production"
      | undefined;
    const token = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;

    if (!environment || !token) {
      console.error("Paddle client env vars missing");
      return;
    }

    initializePaddle({ environment, token }).then(setPaddle);
  }, []);

  return paddle;
}
