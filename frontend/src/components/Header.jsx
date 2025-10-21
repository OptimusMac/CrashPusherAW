import React from "react";
import SearchBar from "./SearchBar";

export default function Header({ title, onSearch, rightContent }) {
  return (
    <div className="flex justify-between items-center mb-6">
      <div>
        <h1 className="text-2xl font-bold text-textPrimary">{title}</h1>
        <div className="h-[2px] w-20 bg-accentTeal mt-1"></div>
      </div>

      <div className="flex items-center gap-4">
        {onSearch && <SearchBar onSearch={onSearch} placeholder={`Search ${title.toLowerCase()}...`} />}
        {rightContent}
      </div>
    </div>
  );
}
