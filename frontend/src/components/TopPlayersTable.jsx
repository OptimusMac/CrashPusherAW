import React from 'react';

export default function TopPlayersTable({ data }) {
  // Add proper array checking
  if (!data || !Array.isArray(data)) {
    return (
      <div className="text-textSecondary text-center py-8">
        No player data available
      </div>
    );
  }

  // Rest of your component logic...
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-700">
            <th className="text-left text-textSecondary text-sm font-medium pb-2">Rank</th>
            <th className="text-left text-textSecondary text-sm font-medium pb-2">Player</th>
            <th className="text-right text-textSecondary text-sm font-medium pb-2">Crashes</th>
          </tr>
        </thead>
        <tbody>
          {data.map((player, index) => (
            <tr key={player.userId} className="border-b border-gray-800 hover:bg-gray-800 transition">
              <td className="py-3 text-textSecondary">#{index + 1}</td>
              <td className="py-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-accentTeal rounded-full flex items-center justify-center text-black font-bold text-sm">
                    {player.username?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <span className="text-white font-medium">{player.username}</span>
                </div>
              </td>
              <td className="py-3 text-right">
                <span className="text-white font-bold">{player.crashCount}</span>
                <div className="text-xs text-textSecondary">crashes</div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}