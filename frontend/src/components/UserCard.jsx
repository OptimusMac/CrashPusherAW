import React from "react";

export default function UserCard({ user, onClick }) {
  return (
    <div
      onClick={() => onClick(user)}
      className="bg-panel hover:bg-[#454545] cursor-pointer p-4 rounded-md shadow-neon flex justify-between items-center transition-all"
    >
      <div>
        <div className="text-lg font-semibold">{user.username}</div>
        <div className="text-textSecondary text-sm">Crashes: {user.crashesCount ?? 0}</div>
      </div>
      <div className="px-3 py-1 rounded-full text-sm bg-accentRed/10 text-accentRed">
        ID #{user.id}
      </div>
    </div>
  );
}
