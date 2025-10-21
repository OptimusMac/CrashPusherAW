import React from "react";

export default function CrashCard({ crash, onView }) {
  const shortSummary =
    crash.summary && crash.summary.length > 200
      ? crash.summary.slice(0, 200) + "..."
      : crash.summary || "(empty)";

  return (
    <div className="bg-panel p-4 rounded-md mb-3 border border-border hover:border-accentTeal transition">
      <div className="flex justify-between items-start gap-3">
        <div className="flex-1">
          <div className="text-sm text-textSecondary mb-1">
            Crash #{crash.id}
          </div>
          <div className="font-mono text-sm whitespace-pre-wrap break-words">
            {shortSummary}
          </div>
        </div>
        <button
          onClick={() => onView(crash)}
          className="bg-accentTeal text-white text-sm px-3 py-1.5 rounded-md hover:opacity-90 whitespace-nowrap"
        >
          View
        </button>
      </div>
    </div>
  );
}
