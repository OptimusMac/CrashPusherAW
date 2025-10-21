import React from "react";

const ICONS = {
  SYSTEM: "🖥️",
  CPU: "🧠",
  MEMORY: "💾",
  DISKS: "📀",
  NETWORK: "🌐",
  SENSORS: "🌡️",
  GPUS: "🎮",
  BATTERY: "🔋",
  PROCESSES: "⚙️",
  HWID: "🔑",
};

export default function SystemInfoSection({ title, lines }) {
  const icon = ICONS[title.toUpperCase()] || "📋";

  return (
    <div className="bg-[#262626] border border-border rounded-lg p-4 mb-4 shadow-sm hover:shadow-neon transition">
      <div className="flex items-center gap-2 mb-3">
        <div className="text-2xl">{icon}</div>
        <div className="text-accentTeal font-semibold text-lg">{title}</div>
      </div>
      <div className="pl-1 text-sm font-mono text-textSecondary whitespace-pre-wrap leading-relaxed">
        {lines
          .filter((l) => l.trim() && !l.startsWith("?"))
          .map((l, i) => (
            <div key={i}>{l}</div>
          ))}
      </div>
    </div>
  );
}
