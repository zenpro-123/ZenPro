import { cn } from "@/lib/utils";

interface ZenProMarkProps {
  className?: string;
}

export function ZenProMark({ className }: ZenProMarkProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("h-4 w-4", className)}
    >
      {/* Four-pointed compass star with north accent */}
      <path
        d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z"
        fill="currentColor"
      />
      <path
        d="M12 2L13 7L12 5L11 7L12 2Z"
        fill="currentColor"
        opacity="0.6"
      />
    </svg>
  );
}
