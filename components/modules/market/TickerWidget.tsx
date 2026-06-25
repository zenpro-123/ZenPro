import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import { GlassCard } from "@/components/shared/GlassCard";
import { cn } from "@/lib/utils";
import { formatPercent, formatPrice } from "@/lib/utils/formatting";
import type { MarketItem } from "@/types/market";

interface TickerWidgetProps {
  item: MarketItem;
}

/** Single market ticker — symbol, price, and 24h change as a colored pill. */
export function TickerWidget({ item }: TickerWidgetProps) {
  const isUp = item.changePercent > 0;
  const isDown = item.changePercent < 0;
  const Icon = isUp ? TrendingUp : isDown ? TrendingDown : Minus;
  const iconColor = isUp ? "text-positive" : isDown ? "text-negative" : "text-muted-foreground";
  const pill = isUp
    ? "bg-positive/10 text-positive"
    : isDown
      ? "bg-negative/10 text-negative"
      : "bg-foreground/5 text-muted-foreground";

  return (
    <GlassCard className="flex w-full flex-col gap-2 p-3.5">
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-[13px] font-semibold tracking-tight">{item.displaySymbol}</span>
        <Icon className={cn("h-3.5 w-3.5 shrink-0", iconColor)} />
      </div>
      <span className="text-lg font-semibold leading-none tabular-nums">
        {formatPrice(item.price, item.currency)}
      </span>
      <span
        className={cn(
          "inline-flex w-fit items-center rounded-md px-1.5 py-0.5 text-[11px] font-semibold tabular-nums",
          pill
        )}
      >
        {formatPercent(item.changePercent)}
      </span>
    </GlassCard>
  );
}
