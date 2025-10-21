import React from 'react';

export default function BarChart({ data, xKey, yKey, height = 300, horizontal = false }) {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div 
        className="flex items-center justify-center text-textSecondary"
        style={{ height }}
      >
        No data available
      </div>
    );
  }

  // Фильтруем валидные данные
  const validData = data.filter(item => 
    item && 
    item[xKey] != null && 
    item[yKey] != null && 
    !isNaN(item[yKey])
  );

  if (validData.length === 0) {
    return (
      <div 
        className="flex items-center justify-center text-textSecondary"
        style={{ height }}
      >
        No valid data available
      </div>
    );
  }

  const values = validData.map(item => Number(item[yKey]));
  const maxValue = Math.max(...values) || 1; // Защита от нуля

  if (horizontal) {
    return (
      <div style={{ height }} className="space-y-2">
        {validData.map((item, index) => {
          const value = Number(item[yKey]);
          const percentage = (value / maxValue) * 100;
          
          return (
            <div key={index} className="flex items-center gap-3">
              <div className="text-sm text-textSecondary min-w-[120px] truncate">
                {item[xKey]}
              </div>
              <div className="flex-1 bg-gray-700 rounded-full h-6 overflow-hidden">
                <div
                  className="bg-accentTeal h-full rounded-full transition-all duration-500"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <div className="text-sm text-white font-medium min-w-[40px] text-right">
                {value}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div style={{ height }} className="flex items-end gap-2">
      {validData.map((item, index) => {
        const value = Number(item[yKey]);
        const percentage = (value / maxValue) * 100;
        
        return (
          <div key={index} className="flex-1 flex flex-col items-center">
            <div
              className="bg-accentTeal rounded-t transition-all duration-500 w-full min-h-[20px]"
              style={{ height: `${percentage}%` }}
            />
            <div className="text-xs text-textSecondary mt-2 text-center">
              {String(item[xKey]).length > 8 ? `${String(item[xKey]).substring(0, 8)}...` : item[xKey]}
            </div>
            <div className="text-xs text-white font-medium mt-1">
              {value}
            </div>
          </div>
        );
      })}
    </div>
  );
}