"use client";

import { useAuthBootstrap } from "@/hooks/useAuthBootstrap";

/**
 * Mounts the app's single auth listener. Renders nothing - it exists so the
 * subscription and the sign-in sync happen once per page, not once per
 * component that reads auth state. Keep it in the root layout.
 */
export default function AuthBootstrap() {
  useAuthBootstrap();
  return null;
}
