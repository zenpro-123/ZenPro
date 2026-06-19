"use client";

import { Tooltip as TooltipPrimitive } from "radix-ui";
import { cn } from "@/lib/utils";

interface NavTooltipProps {
  description: string;
  side?: "right" | "bottom";
  children: React.ReactNode;
}

export function NavTooltip({ description, side = "right", children }: NavTooltipProps) {
  return (
    <TooltipPrimitive.Root delayDuration={150}>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          side={side}
          sideOffset={14}
          collisionPadding={12}
          className={cn(
            "z-[60] max-w-[260px] rounded-xl px-3.5 py-2.5",
            "glass surface-premium ring-gradient",
            "text-[13px] leading-relaxed text-foreground/80",
            "data-[state=delayed-open]:animate-in data-[state=delayed-open]:fade-in-0 data-[state=delayed-open]:zoom-in-95",
            "data-[side=right]:slide-in-from-left-2 data-[side=bottom]:slide-in-from-top-2",
            "data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
          )}
        >
          {description}
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  );
}
