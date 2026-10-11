import { SectionTitle } from "@/components/dashboard/section-title";
import { goal } from "@/components/dashboard/workspace";

const series = [
  3.08, 3.12, 3.2, 3.18, 3.24, 3.3, 3.27, 3.36, 3.44, 3.5, 3.58, 3.66, 3.74,
  3.8,
];

const width = 640;
const height = 200;
const padX = 8;
const padY = 18;
const min = 2.9;
const max = 4.05;

function xFor(index: number) {
  return padX + (index / (series.length - 1)) * (width - padX * 2);
}

function yFor(value: number) {
  return padY + (1 - (value - min) / (max - min)) * (height - padY * 2);
}

const line = series
  .map((value, index) => {
    const command = index === 0 ? "M" : "L";
    return `${command} ${xFor(index).toFixed(2)} ${yFor(value).toFixed(2)}`;
  })
  .join(" ");

const area = `${line} L ${xFor(series.length - 1).toFixed(2)} ${height - padY} L ${xFor(0).toFixed(2)} ${height - padY} Z`;
const baselineY = yFor(3.2);
const endX = xFor(series.length - 1);
const endY = yFor(series[series.length - 1]);

export function ConversionChart() {
  return (
    <section>
      <SectionTitle title={goal} meta="Last 14 days" />
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="mt-4 h-52 w-full"
        role="img"
        aria-label="Signup conversion over the last 14 days, rising from 3.2% to 3.8%"
      >
        <line
          x1={padX}
          x2={width - padX}
          y1={baselineY}
          y2={baselineY}
          className="stroke-border"
          strokeDasharray="4 6"
        />
        <path d={area} className="fill-success/10" />
        <path
          d={line}
          fill="none"
          className="stroke-success"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <circle cx={endX} cy={endY} r="7" className="fill-success/15" />
        <circle cx={endX} cy={endY} r="3.5" className="fill-success" />
      </svg>
      <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
        <span className="size-1.5 rounded-full bg-success ring-4 ring-success/10" />
        Pricing CTA improvement kept · +18.7% lift
      </p>
    </section>
  );
}
