import React from 'react';
import { LucideIcon } from 'lucide-react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  subtitle?: string;
  color?: 'primary' | 'green' | 'yellow' | 'blue' | 'red' | 'purple';
  onClick?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  trend,
  subtitle,
  color = 'primary',
  onClick,
}) => {
  const colorClasses = {
    primary: {
      bg: 'bg-primary-100',
      icon: 'text-primary-600',
      hover: 'hover:bg-primary-200',
      value: 'text-gray-900',
    },
    green: {
      bg: 'bg-green-100',
      icon: 'text-green-600',
      hover: 'hover:bg-green-200',
      value: 'text-green-600',
    },
    yellow: {
      bg: 'bg-yellow-100',
      icon: 'text-yellow-600',
      hover: 'hover:bg-yellow-200',
      value: 'text-yellow-600',
    },
    blue: {
      bg: 'bg-blue-100',
      icon: 'text-blue-600',
      hover: 'hover:bg-blue-200',
      value: 'text-blue-600',
    },
    red: {
      bg: 'bg-red-100',
      icon: 'text-red-600',
      hover: 'hover:bg-red-200',
      value: 'text-red-600',
    },
    purple: {
      bg: 'bg-purple-100',
      icon: 'text-purple-600',
      hover: 'hover:bg-purple-200',
      value: 'text-purple-600',
    },
  };

  const colors = colorClasses[color];

  return (
    <div
      className={`card-hover group ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 group-hover:text-gray-700 transition-colors">
            {title}
          </p>
          <p className={`text-3xl font-bold mt-2 bounce-in ${colors.value}`}>
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          )}
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              {trend.isPositive ? (
                <TrendingUp size={14} className="text-green-600" />
              ) : (
                <TrendingDown size={14} className="text-red-600" />
              )}
              <span
                className={`text-xs font-medium ${
                  trend.isPositive ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {Math.abs(trend.value)}%
              </span>
              <span className="text-xs text-gray-500">so với tháng trước</span>
            </div>
          )}
        </div>
        <div className={`${colors.bg} p-3 rounded-full group-hover:${colors.hover} transition-colors`}>
          <Icon className={colors.icon} size={24} />
        </div>
      </div>
    </div>
  );
};

export default StatCard;

