import Image from "next/image";
import type { StaticImageData } from "next/image";
import { SIGN_REFERENCE_IMAGES } from "@/data/signImages";

type ThumbSize = "sm" | "md" | "lg";

const sizeClasses: Record<ThumbSize, string> = {
  sm: "w-16 h-16",
  md: "w-24 h-24",
  lg: "w-28 h-28 sm:w-32 sm:h-32",
};

/** Rendered width in px, used for the `sizes` hint. Matches sizeClasses. */
const sizeHints: Record<ThumbSize, string> = {
  sm: "64px",
  md: "96px",
  lg: "128px",
};

interface SignThumbProps {
  /** `component` key from data/signs-reference.json */
  component?: string;
  /** Explicit photo, for signs that live outside the reference categories. */
  image?: StaticImageData;
  alt: string;
  size?: ThumbSize;
  priority?: boolean;
}

/**
 * Fixed square box with the sign photo contained inside, so round, rectangular
 * and diamond signs all show whole and the box never changes size as images
 * load. Renders nothing when we hold no photo for that sign.
 */
export default function SignThumb({
  component,
  image,
  alt,
  size = "md",
  priority = false,
}: SignThumbProps) {
  const src = image ?? (component ? SIGN_REFERENCE_IMAGES[component] : undefined);
  if (!src) return null;

  return (
    <div
      className={`relative flex-shrink-0 rounded-lg bg-stone-50 border border-stone-200 ${sizeClasses[size]}`}
    >
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizeHints[size]}
        priority={priority}
        loading={priority ? undefined : "lazy"}
        className="object-contain p-2"
      />
    </div>
  );
}

/** Alt text for a reference sign: name plus RVV code when it has one. */
export function signAlt(name: string, code: string | null): string {
  return code ? `${name} sign (${code})` : name;
}
