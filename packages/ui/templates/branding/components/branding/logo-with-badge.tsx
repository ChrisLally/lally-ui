import { type ReactNode } from "react";
import { Badge } from "@/components/ui/badge";

export type LogoWithBadgeProps = {
  logo?: ReactNode;
  title: string;
  badge: string;
  className?: string;
  titleClassName?: string;
  badgeClassName?: string;
};

/**
 * Generic brand header row with a logo slot, title, and badge text.
 */
export function LogoWithBadge({
  logo,
  title,
  badge,
  className,
  titleClassName,
  badgeClassName,
}: LogoWithBadgeProps) {
  return (
    <div className={className ?? "flex items-center gap-2"}>
      {logo ? logo : <div aria-hidden className="h-7 w-7 rounded-md bg-neutral-300" />}
      <span className={titleClassName ?? "text-xl font-bold"}>{title}</span>
      <Badge
        variant="outline"
        className={badgeClassName ?? "text-xs font-semibold uppercase tracking-wide"}
      >
        {badge}
      </Badge>
    </div>
  );
}
