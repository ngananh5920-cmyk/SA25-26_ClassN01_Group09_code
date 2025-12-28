import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingProps {
  size?: number;
  className?: string;
}

export const Loading: React.FC<LoadingProps> = ({ size = 24, className = '' }) => {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <Loader2 className="animate-spin text-primary-600" size={size} />
    </div>
  );
};

interface LoadingOverlayProps {
  message?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ message = 'Đang tải...' }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 flex flex-col items-center gap-4 shadow-xl">
        <Loader2 className="animate-spin text-primary-600" size={48} />
        <p className="text-gray-700 font-medium">{message}</p>
      </div>
    </div>
  );
};

export const SkeletonCard: React.FC = () => {
  return (
    <div className="card">
      <div className="skeleton-shimmer h-4 w-3/4 mb-4 rounded"></div>
      <div className="skeleton-shimmer h-8 w-1/2 rounded"></div>
    </div>
  );
};

export const SkeletonTable: React.FC<{ rows?: number; cols?: number }> = ({ rows = 5, cols = 5 }) => {
  return (
    <div className="card overflow-hidden">
      <div className="skeleton-shimmer h-12 mb-4 rounded"></div>
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex gap-4">
            {Array.from({ length: cols }).map((_, j) => (
              <div key={j} className="skeleton-shimmer h-10 flex-1 rounded"></div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};






