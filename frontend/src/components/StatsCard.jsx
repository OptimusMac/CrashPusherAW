import React from 'react';

export default function StatsCard({ title, value, change, percentage, icon }) {
  const isPositive = change > 0;
  const hasChange = change !== undefined && change !== null;
  const hasPercentage = percentage !== undefined && percentage !== null;

  return (
    <div className="bg-panel rounded-xl p-4 border border-border">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-textSecondary text-sm font-medium">{title}</h3>
        <span className="text-2xl">{icon}</span>
      </div>
      
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold text-white">{value}</span>
        
        {hasChange && (
          <span className={`text-sm font-medium ${
            isPositive ? 'text-green-400' : 'text-red-400'
          }`}>
            {isPositive ? '+' : ''}{change}
          </span>
        )}
        
        {hasPercentage && (
          <span className="text-sm font-medium text-accentTeal">
            {percentage}%
          </span>
        )}
      </div>
      
      {hasChange && (
        <p className="text-xs text-textSecondary mt-1">
          {isPositive ? 'Increase' : 'Decrease'} from previous period
        </p>
      )}
    </div>
  );
}