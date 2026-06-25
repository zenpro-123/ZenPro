import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPercent, formatPrice } from "@/lib/utils/formatting";
import type { MarketItem } from "@/types/market";

interface TickerWidgetProps {
  item: MarketItem;
}

/** Single market row — symbol, full name, price, and 24h change. */
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
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-semibold leading-tight tracking-tight">{item.displaySymbol}</p>
        <p className="truncate text-[11px] text-muted-foreground">{item.name}</p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <span className="text-[13px] font-semibold tabular-nums leading-tight">
          {formatPrice(item.price, item.currency)}
        </span>
        <span
          className={cn(
            "inline-flex items-center gap-0.5 rounded px-1.5 py-px text-[10px] font-semibold tabular-nums",
            pill
          )}
        >
          <Icon className={cn("h-2.5 w-2.5 shrink-0", iconColor)} />
          {formatPercent(item.changePercent)}
        </span>
      </div>
    </div>
  );
}
