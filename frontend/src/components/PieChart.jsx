import React from 'react';

export default function PieChart({ data, height = 400 }) {
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
    item.name && 
    item.value != null && 
    !isNaN(item.value) && 
    item.value > 0
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

  const total = validData.reduce((sum, item) => sum + Number(item.value), 0);
  
  if (total === 0) {
    return (
      <div 
        className="flex items-center justify-center text-textSecondary"
        style={{ height }}
      >
        All values are zero
      </div>
    );
  }

  let currentAngle = 0;

  const segments = validData.map((item, index) => {
    const value = Number(item.value);
    const percentage = (value / total) * 100;
    const angle = (value / total) * 360;
    const startAngle = currentAngle;
    currentAngle += angle;

    const largeArc = angle > 180 ? 1 : 0;
    const startX = 50 + 50 * Math.cos((startAngle * Math.PI) / 180);
    const startY = 50 + 50 * Math.sin((startAngle * Math.PI) / 180);
    const endX = 50 + 50 * Math.cos(((startAngle + angle) * Math.PI) / 180);
    const endY = 50 + 50 * Math.sin(((startAngle + angle) * Math.PI) / 180);

    return {
      ...item,
      percentage,
      path: `M 50 50 L ${startX} ${startY} A 50 50 0 ${largeArc} 1 ${endX} ${endY} Z`,
      textX: 50 + 30 * Math.cos(((startAngle + angle / 2) * Math.PI) / 180),
      textY: 50 + 30 * Math.sin(((startAngle + angle / 2) * Math.PI) / 180),
    };
  });

  return (
    <div style={{ height }} className="flex flex-col">
      {/* Диаграмма занимает основную часть высоты */}
      <div className="flex-1 relative min-h-0">
        <svg viewBox="0 0 100 100" className="w-full h-full">
        {segments.map((segment, index) => (
            <g key={index}>
            <path
                d={segment.path}
                fill={segment.color || `hsl(${index * 137.5}, 70%, 50%)`}
                stroke="#1F2937"
                strokeWidth="1"
            />
            {segment.percentage > 5 && (
                <text
                x={segment.textX}
                y={segment.textY}
                textAnchor="middle"
                dominantBaseline="middle"
                className="text-xs fill-white font-medium"
                >
                {Math.round(segment.percentage)}%
                </text>
            )}
            </g>
        ))}
        </svg>
      </div>
      
      {/* Легенда под диаграммой - теперь segments гарантированно определен */}
      <div className="mt-4 space-y-2 flex-none">
        {segments.map((segment, index) => (
          <div key={index} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded"
              style={{ backgroundColor: segment.color || `hsl(${index * 137.5}, 70%, 50%)` }}
            />
            <span className="text-sm text-white">{segment.name}</span>
            <span className="text-sm text-textSecondary ml-auto">
              {segment.value} ({Math.round(segment.percentage)}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}