import { cn } from "@/lib/utils";

export interface SparklineProps {
  data: number[];
  trend: "up" | "down";
  className?: string;
}

const WIDTH = 64;
const HEIGHT = 24;
const PADDING = 2;

// Minimal inline trend line for a stat tile — not a full chart (no axes, no
// legend, no tooltip). The line itself stays neutral; only the endpoint
// carries the up/down status color, matching the delta text/icon next to it
// so direction is never color-alone.
export function Sparkline({ data, trend, className }: SparklineProps) {
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((value, index) => {
    const x = PADDING + (index / (data.length - 1)) * (WIDTH - PADDING * 2);
    const y = HEIGHT - PADDING - ((value - min) / range) * (HEIGHT - PADDING * 2);
    return [x, y] as const;
  });

  const path = points.map(([x, y], index) => `${index === 0 ? "M" : "L"}${x},${y}`).join(" ");
  const [lastX, lastY] = points[points.length - 1];

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      width={WIDTH}
      height={HEIGHT}
      className={cn("overflow-visible", className)}
      aria-hidden="true"
    >
      <path
        d={path}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-gray-300"
      />
      <circle
        cx={lastX}
        cy={lastY}
        r={2}
        className={trend === "up" ? "fill-emerald-500" : "fill-red-400"}
      />
    </svg>
  );
}
