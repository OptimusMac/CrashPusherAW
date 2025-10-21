import React, { useState } from "react";
import CrashViewer from "./CrashViewer";

export default function GlobalCrashCard({ crash, onView }) {
  const [expanded, setExpanded] = useState(false);
  const toggle = async () => {
    if (!expanded && onView) await onView(crash.exampleId);
    setExpanded((v) => !v);
  };

  return (
    <div className="bg-panel border border-border rounded-md mb-3 p-4 hover:border-accentTeal transition">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="font-semibold text-white mb-1">{crash.signature}</div>
          <div className="text-xs text-textSecondary mb-1">
            Example player: {crash.examplePlayer || "-"}
          </div>
          <div className="text-sm text-textSecondary">Count: {crash.count}</div>
        </div>
        <button
          onClick={toggle}
          className="bg-accentTeal text-black text-sm px-3 py-1.5 rounded-md ml-4 hover:opacity-90"
        >
          {expanded ? "Hide" : "View"}
        </button>
      </div>

      {expanded && crash.full && (
        <div className="mt-3">
          <CrashViewer crash={crash.full} />
        </div>
      )}
    </div>
  );
}
