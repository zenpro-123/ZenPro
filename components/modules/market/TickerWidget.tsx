import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import { GlassCard } from "@/components/shared/GlassCard";
import { cn } from "@/lib/utils";
import { formatPercent, formatPrice } from "@/lib/utils/formatting";
import type { MarketItem } from "@/types/market";

interface TickerWidgetProps {
  item: MarketItem;
}

/** Single market ticker — symbol, price, and 24h change. */
export function TickerWidget({ item }: TickerWidgetProps) {
  const isUp = item.changePercent > 0;
  const isDown = item.changePercent < 0;
  const Icon = isUp ? TrendingUp : isDown ? TrendingDown : Minus;
  const changeColor = isUp ? "text-positive" : isDown ? "text-negative" : "text-muted-foreground";

  return (
    <GlassCard className="flex h-full w-full flex-col justify-center gap-1 p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-xs font-semibold tracking-tight">{item.displaySymbol}</span>
        <Icon className={cn("h-3 w-3 shrink-0", changeColor)} />
      </div>
      <span className="text-base font-semibold leading-tight tabular-nums">
        {formatPrice(item.price, item.currency)}
      </span>
      <span className={cn("text-[11px] font-medium tabular-nums", changeColor)}>
        {formatPercent(item.changePercent)}
      </span>
    </GlassCard>
  );
}
