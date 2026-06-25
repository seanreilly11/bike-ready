import type { LucideIcon } from "lucide-react";

type Size = "sm" | "md" | "lg";

interface ModuleIconProps {
  icon: LucideIcon;
  size?: Size;
  className?: string;
}

const tileClasses: Record<Size, string> = {
  sm: "size-9 rounded-lg",
  md: "size-11 rounded-xl",
  lg: "size-14 rounded-2xl",
};

const iconPx: Record<Size, number> = { sm: 18, md: 22, lg: 28 };

// A module's lucide icon in the standard orange-on-orange-light tile.
// Decorative - the adjacent module title is the accessible label.
export default function ModuleIcon({
  icon: Icon,
  size = "md",
  className = "",
}: ModuleIconProps) {
  return (
    <span
      className={[
        "flex-none inline-flex items-center justify-center",
        "bg-orange-light text-orange",
        tileClasses[size],
        className,
      ].join(" ")}
    >
      <Icon size={iconPx[size]} strokeWidth={1.75} aria-hidden="true" />
    </span>
  );
}
