import { cn } from "@/lib/utils";
import Image from "next/image";

interface SourceBadgeProps {
  source: string;
  /** Optional favicon/logo URL. Falls back to a colored initial chip. */
  logoUrl?: string;
  className?: string;
}

/** Small attribution chip showing the originating source of a content item. */
export function SourceBadge({ source, logoUrl, className }: SourceBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full bg-secondary/60 px-2 py-0.5 text-xs font-medium text-muted-foreground",
        className
      )}
    >
      {logoUrl ? (
        <Image
          src={logoUrl}
          alt=""
          width={12}
          height={12}
          className="rounded-sm"
          unoptimized
        />
      ) : (
        <span className="h-1.5 w-1.5 rounded-full bg-primary/70" />
      )}
      {source}
    </span>
  );
}
