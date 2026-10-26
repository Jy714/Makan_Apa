import { useId } from "react";

export const WHEEL_COLOURS: { fill: string; text: string }[] = [
  { fill: "#C8472B", text: "#FFFFFF" },
  { fill: "#F4B942", text: "#24211E" },
  { fill: "#FBE3C9", text: "#24211E" },
  { fill: "#2F6F62", text: "#FFFFFF" },
  { fill: "#EE8E6F", text: "#24211E" },
  { fill: "#7A3E2B", text: "#FFFFFF" },
];

function colourFor(i: number, n: number) {
  // Avoid the last segment sharing a colour with the first when wrapping.
  let idx = i % WHEEL_COLOURS.length;
  if (i === n - 1 && n > 1 && idx === 0) idx = 2;
  return WHEEL_COLOURS[idx];
}

function point(r: number, deg: number) {
  const rad = (deg * Math.PI) / 180;
  return [r * Math.sin(rad), -r * Math.cos(rad)] as const;
}

function truncate(label: string, max: number) {
  return label.length > max ? `${label.slice(0, max - 1).trimEnd()}…` : label;
}

type Props = {
  labels: string[];
  rotation?: number;
  durationMs?: number;
  highlightIndex?: number | null;
  className?: string;
};

/**
 * Pure SVG wheel. Segment i spans [i·seg, (i+1)·seg] degrees clockwise from 12 o'clock.
 * The pointer sits at 12 o'clock, outside the rotating group.
 */
export function WheelGraphic({ labels, rotation = 0, durationMs = 0, highlightIndex = null, className }: Props) {
  const n = labels.length;
  const seg = n > 0 ? 360 / n : 360;
  const R = 92;
  const fontSize = n <= 4 ? 9 : n <= 8 ? 7.6 : 6.4;
  const maxChars = n <= 4 ? 16 : n <= 8 ? 15 : 14;
  const shadowId = useId();

  return (
    <svg viewBox="-100 -108 200 208" className={className} role="presentation" aria-hidden="true">
      <defs>
        <filter id={shadowId} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#24211E" floodOpacity="0.18" />
        </filter>
      </defs>
      <circle r="98" fill="#24211E" filter={`url(#${shadowId})`} />
      <g
        style={{
          transform: `rotate(${rotation}deg)`,
          transition: durationMs ? `transform ${durationMs}ms cubic-bezier(0.12, 0.6, 0.12, 1)` : "none",
        }}
      >
        {n === 0 && <circle r={R} fill="#E9DED2" />}
        {n === 1 && <circle r={R} fill={WHEEL_COLOURS[0].fill} />}
        {n > 1 &&
          labels.map((_, i) => {
            const [x0, y0] = point(R, i * seg);
            const [x1, y1] = point(R, (i + 1) * seg);
            const large = seg > 180 ? 1 : 0;
            return (
              <path
                key={`s${i}`}
                d={`M0 0 L${x0} ${y0} A${R} ${R} 0 ${large} 1 ${x1} ${y1} Z`}
                fill={colourFor(i, n).fill}
                stroke="#24211E"
                strokeWidth="0.6"
                opacity={highlightIndex !== null && highlightIndex !== i ? 0.55 : 1}
              />
            );
          })}
        {labels.map((label, i) => {
          const mid = n === 1 ? 90 : i * seg + seg / 2;
          // Flip labels on the left half so they never read upside down.
          const flip = mid > 180;
          return (
            <g key={`l${i}`} transform={`rotate(${flip ? mid + 90 : mid - 90})`}>
              <text
                x={flip ? -(R - 7) : R - 7}
                y={0}
                textAnchor={flip ? "start" : "end"}
                dominantBaseline="central"
                fontSize={fontSize}
                fontWeight={600}
                fill={colourFor(i, n).text}
                style={{ fontFamily: "inherit" }}
              >
                {truncate(label, maxChars)}
              </text>
            </g>
          );
        })}
      </g>
      <circle r="13" fill="#FFF9F1" stroke="#24211E" strokeWidth="2" />
      <circle r="4.5" fill="#C8472B" />
      {/* Pointer */}
      <path d="M0 -84 L-9 -106 L9 -106 Z" fill="#24211E" stroke="#FFF9F1" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}
