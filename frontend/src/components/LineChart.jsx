import React from 'react';

export default function LineChart({ data, xKey, yKey, height = 300 }) {
  // Строгая проверка данных
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

  // Фильтрация и валидация данных
  const validData = data
    .filter(item => {
      if (!item || item[yKey] === null || item[yKey] === undefined) return false;
      const numValue = Number(item[yKey]);
      return !isNaN(numValue) && isFinite(numValue);
    })
    .map(item => ({
      ...item,
      [yKey]: Number(item[yKey])
    }));

  if (validData.length === 0) {
    return (
      <div 
        className="flex items-center justify-center text-textSecondary"
        style={{ height }}
      >
        No valid numeric data
      </div>
    );
  }

  // Расчет значений для графика
  const values = validData.map(item => item[yKey]);
  const maxValue = Math.max(...values);
  const minValue = Math.min(...values);
  const range = maxValue - minValue || 1; // Защита от деления на ноль

  // Размеры SVG
  const svgWidth = 400;
  const svgHeight = 200;
  const padding = 40;

  // Генерация точек с абсолютными координатами
  const points = validData.map((item, index) => {
    const x = padding + (index / Math.max(validData.length - 1, 1)) * (svgWidth - padding * 2);
    const y = padding + (svgHeight - padding * 2) - ((item[yKey] - minValue) / range) * (svgHeight - padding * 2);
    
    return { 
      x: Math.max(padding, Math.min(svgWidth - padding, x)), 
      y: Math.max(padding, Math.min(svgHeight - padding, y)),
      value: item[yKey] 
    };
  });

  // Создаем path data с абсолютными координатами
  const pathData = points.map((point, index) => 
    `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
  ).join(' ');

  return (
    <div style={{ height }} className="relative">
      {/* Y-axis labels */}
      <div className="absolute left-0 top-0 bottom-0 w-12 flex flex-col justify-between text-xs text-textSecondary">
        <span>{maxValue}</span>
        <span>{Math.round((maxValue + minValue) / 2)}</span>
        <span>{minValue}</span>
      </div>

      {/* Chart area */}
      <div className="ml-12 h-full relative">
        {/* Grid lines */}
        <div className="absolute inset-0 flex flex-col justify-between">
          {[0, 0.5, 1].map((position) => (
            <div
              key={position}
              className="border-t border-gray-700"
              style={{ marginTop: position === 0 ? 0 : -1 }}
            />
          ))}
        </div>

        {/* Line path с абсолютными координатами */}
        <svg 
          width="100%" 
          height="100%" 
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          preserveAspectRatio="none"
        >
          {/* Grid lines */}
          <line x1={padding} y1={padding} x2={svgWidth - padding} y2={padding} stroke="#374151" strokeWidth="1" />
          <line x1={padding} y1={svgHeight / 2} x2={svgWidth - padding} y2={svgHeight / 2} stroke="#374151" strokeWidth="1" />
          <line x1={padding} y1={svgHeight - padding} x2={svgWidth - padding} y2={svgHeight - padding} stroke="#374151" strokeWidth="1" />
          
          {/* Main line */}
          <path
            d={pathData}
            fill="none"
            stroke="#10B981"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* Data points */}
          {points.map((point, index) => (
            <circle
              key={index}
              cx={point.x}
              cy={point.y}
              r="4"
              fill="#10B981"
              className="hover:r-6 transition-all"
            />
          ))}
        </svg>

        {/* X-axis labels */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-textSecondary pt-2">
          {validData.map((item, index) => (
            <div key={index} className="text-center flex-1 truncate px-1">
              {String(item[xKey]).length > 6 
                ? `${String(item[xKey]).substring(0, 6)}...` 
                : item[xKey]
              }
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}