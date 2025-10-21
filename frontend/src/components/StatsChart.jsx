import React from "react";

export default function StatsChart({ title, value, accent = "teal" }) {
  const color = accent === "teal" ? "text-accentTeal" : "text-accentRed";
  return (
    <div className="bg-panel rounded-md p-5 shadow-md flex flex-col items-start justify-between hover:shadow-neon transition-all">
      <div className="text-textSecondary text-sm uppercase tracking-wide mb-2">{title}</div>
      <div className={`text-3xl font-bold ${color}`}>{value}</div>
    </div>
  );
}
