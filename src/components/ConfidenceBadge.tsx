"use client";

interface ConfidenceBadgeProps {
  score: number;
  size?: "sm" | "lg";
}

export default function ConfidenceBadge({
  score,
  size = "sm",
}: ConfidenceBadgeProps) {
  const color =
    score >= 7
      ? "var(--success)"
      : score >= 4
      ? "var(--warning)"
      : "var(--error)";

  const dimensions = size === "lg" ? "w-20 h-20" : "w-8 h-8";
  const textSize = size === "lg" ? "text-2xl" : "text-xs";

  return (
    <div
      className={`${dimensions} rounded-full flex items-center justify-center font-bold ${textSize} shrink-0`}
      style={{
        border: `2px solid ${color}`,
        color,
      }}
    >
      {score}/10
    </div>
  );
}
