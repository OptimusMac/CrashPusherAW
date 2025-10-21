import React, { useState, useEffect } from "react";

export default function SearchBar({ onSearch, placeholder = "Search...", delay = 350 }) {
  const [value, setValue] = useState("");

  useEffect(() => {
    const t = setTimeout(() => onSearch(value), delay);
    return () => clearTimeout(t);
  }, [value, onSearch, delay]);

  return (
    <div className="w-full">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-panel text-textPrimary placeholder:text-textSecondary px-4 py-2 rounded-md focus:outline-none"
      />
    </div>
  );
}
