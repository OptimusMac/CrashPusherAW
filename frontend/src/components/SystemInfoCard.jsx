import React from "react";
import SystemInfoSection from "./SystemInfoSection";

export default function SystemInfoCard({ content }) {
  if (!content) return null;

  const lines = content.split("\n").map((l) => l.trimEnd());
  const sections = [];
  let current = null;

  for (const line of lines) {
    const headerMatch = line.match(/^\?{3}\s*(.*?)\s*\?{3}$/);
    if (headerMatch) {
      if (current) sections.push(current);
      current = { title: headerMatch[1], lines: [] };
    } else if (current) {
      current.lines.push(line);
    }
  }
  if (current) sections.push(current);

  return (
    <div className="bg-[#1e1e1e] p-5 rounded-md border border-border mt-4">
      <h3 className="text-lg font-semibold mb-4 text-center text-accentRed">
        🧩 System Information Report
      </h3>
      {sections.map((s, i) => (
        <SystemInfoSection key={i} title={s.title} lines={s.lines} />
      ))}
    </div>
  );
}
