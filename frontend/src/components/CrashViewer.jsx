import React from "react";

export default function CrashViewer({ crash }) {
  if (!crash) return null;

  // Разбиваем системные секции по маркерам ??? SECTION ???
  const parseSections = (text) => {
    const lines = text.split("\n");
    const result = [];
    let current = null;

    for (const line of lines) {
      const match = line.match(/^\?{3}\s*(.*?)\s*\?{3}$/);
      if (match) {
        if (current) result.push(current);
        current = { title: match[1], lines: [] };
      } else if (current) {
        current.lines.push(line);
      }
    }
    if (current) result.push(current);
    return result;
  };

  const sections = crash.content ? parseSections(crash.content) : [];

  return (
    <div className="mt-3 bg-[#1b1b1b] border border-border rounded-md p-4">
      {sections.length > 0 ? (
        <>
          <div className="text-lg font-semibold mb-2 text-accentRed">
            🧩 System Info
          </div>
          {sections.map((s, i) => (
            <div
              key={i}
              className="bg-[#222] border border-[#333] rounded-md mb-3 p-3"
            >
              <div className="font-semibold text-accentTeal mb-2 flex items-center gap-2">
                {s.title.includes("CPU") && "🧠"}
                {s.title.includes("MEMORY") && "💾"}
                {s.title.includes("NETWORK") && "🌐"}
                {s.title.includes("GPU") && "🎮"}
                {s.title.includes("DISKS") && "📀"}
                {s.title.includes("SYSTEM") && "🖥️"}
                {s.title.includes("SENSORS") && "🌡️"}
                {s.title.includes("BATTERY") && "🔋"}
                {s.title.includes("HWID") && "🔑"}
                {s.title}
              </div>
              <pre className="text-xs text-textSecondary whitespace-pre-wrap leading-relaxed">
                {s.lines.filter((l) => l.trim() && !l.startsWith("?")).join("\n")}
              </pre>
            </div>
          ))}
        </>
      ) : (
        <pre className="text-sm text-textSecondary whitespace-pre-wrap">
          {crash.content || "(empty crash log)"}
        </pre>
      )}
    </div>
  );
}
