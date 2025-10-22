import React, { useState } from "react";

function ValueRenderer({ value, depth = 0 }) {
  const [expanded, setExpanded] = useState(false);

  if (value === null || value === undefined) {
    return <span className="text-gray-500 italic">null</span>;
  }

  const type = typeof value;

  // 🔹 Примитивы
  if (type === "string" || type === "number" || type === "boolean") {
    return <span className="text-white break-all">{String(value)}</span>;
  }

  // 🔹 Массив
  if (Array.isArray(value)) {
    const tooLong = value.length > 5 && !expanded;
    return (
      <div className="ml-4 border-l border-gray-700 pl-3 space-y-1">
        <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
          <button
            onClick={() => setExpanded(!expanded)}
            className="hover:text-white transition-colors"
          >
            {expanded ? "▼" : "▶"}
          </button>
          <span>
            Array[{value.length}]
            {tooLong && " (collapsed)"}
          </span>
        </div>
        {expanded && (
          <div className="max-h-64 overflow-auto space-y-1">
            {value.map((item, index) => (
              <div key={index} className="flex items-start gap-2">
                <span className="text-gray-500">[{index}]</span>
                <ValueRenderer value={item} depth={depth + 1} />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // 🔹 Объект
  if (type === "object") {
    return (
      <div className="ml-4 border-l border-gray-700 pl-3 space-y-1">
        {Object.entries(value).map(([key, val]) => (
          <div key={key} className="flex flex-col">
            <span className="text-xs text-gray-400">{key}</span>
            <ValueRenderer value={val} depth={depth + 1} />
          </div>
        ))}
      </div>
    );
  }

  // 🔹 Остальные типы
  return <span className="text-gray-400">{String(value)}</span>;
}

export default ValueRenderer;
