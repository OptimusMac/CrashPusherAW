import React from 'react';

export default function RecentActivityList({ data }) {
  // Добавим отладочную информацию
  
  if (!data || !Array.isArray(data)) {
    return (
      <div className="text-textSecondary text-center py-8">
        No recent activity
      </div>
    );
  }

  // Проверим, есть ли валидные элементы
  const validData = data.filter(item => 
    item && 
    item.id != null && 
    item.username != null && 
    item.timestamp != null &&
    item.fixed != null
  );

  if (validData.length === 0) {
    return (
      <div className="text-textSecondary text-center py-8">
        No valid activity data
        <div className="text-xs mt-2">
          Expected: id, username, timestamp, fixed
        </div>
      </div>
    );
  }

    const formatTime = (timestamp) => {
        let date;
        
        // Обрабатываем разные форматы timestamp
        if (typeof timestamp === 'string') {
        // Если это строка в формате LocalDateTime (например: "2024-01-15T10:30:00")
        if (timestamp.includes('T')) {
            date = new Date(timestamp);
        } else {
            // Если это число в виде строки
            date = new Date(Number(timestamp));
        }
        } else if (typeof timestamp === 'number') {
        // Если это число (миллисекунды)
        date = new Date(timestamp);
        } else if (timestamp instanceof Date) {
        // Если это уже Date объект
        date = timestamp;
        } else {
        return 'Unknown time';
        }
        
        if (isNaN(date.getTime())) {
        return 'Invalid date';
        }
        
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        
        if (diffMins < 1) {
        return 'Just now';
        } else if (diffMins < 60) {
        return `${diffMins}m ago`;
        } else if (diffHours < 24) {
        return `${diffHours}h ago`;
        } else if (diffDays < 7) {
        return `${diffDays}d ago`;
        } else {
        return date.toLocaleDateString();
        }
    };

  return (
    <div className="space-y-3">
      {validData.map((activity) => (
        <div
          key={activity.id}
          className="flex items-center justify-between p-3 bg-panel-dark rounded-lg border border-border hover:border-accentTeal transition"
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-3 h-3 rounded-full ${
                activity.fixed ? 'bg-green-500' : 'bg-accentRed'
              }`}
            />
            <div>
              <div className="text-white font-medium">
                Crash #{activity.id}
              </div>
              <div className="text-textSecondary text-sm">
                {activity.username}
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-white text-sm font-medium">
              {formatTime(activity.timestamp)}
            </div>
            <div className={`text-xs ${
              activity.fixed ? 'text-green-400' : 'text-accentRed'
            }`}>
              {activity.fixed ? 'Fixed' : 'Not Fixed'}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}