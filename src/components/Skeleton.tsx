import React from 'react';

interface SkeletonProps {
    className?: string;
    variant?: 'text' | 'circular' | 'rectangular';
    width?: string | number;
    height?: string | number;
    animation?: 'pulse' | 'wave' | 'none';
}

export const Skeleton: React.FC<SkeletonProps> = ({
    className = '',
    variant = 'text',
    width,
    height,
    animation = 'pulse'
}) => {
    const variantClasses = {
        text: 'h-4 rounded',
        circular: 'rounded-full',
        rectangular: 'rounded-lg'
    };

    const animationClasses = {
        pulse: 'animate-pulse',
        wave: 'animate-shimmer',
        none: ''
    };

    const style: React.CSSProperties = {};
    if (width) style.width = typeof width === 'number' ? `${width}px` : width;
    if (height) style.height = typeof height === 'number' ? `${height}px` : height;

    return (
        <div
            className={`bg-gray-200 ${variantClasses[variant]} ${animationClasses[animation]} ${className}`}
            style={style}
        />
    );
};

// Compound components for common patterns
export const SkeletonCard: React.FC = () => (
    <div className="bg-white rounded-2xl p-6 border border-gray-100">
        <div className="flex gap-4 mb-4">
            <Skeleton variant="circular" width={64} height={64} />
            <div className="flex-1 space-y-2">
                <Skeleton width="60%" height={20} />
                <Skeleton width="40%" height={16} />
            </div>
        </div>
        <Skeleton width="100%" height={12} className="mb-2" />
        <Skeleton width="80%" height={12} className="mb-2" />
        <Skeleton width="90%" height={12} />
    </div>
);

export const SkeletonTable: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
    <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="flex gap-4">
                <Skeleton width="30%" height={40} />
                <Skeleton width="40%" height={40} />
                <Skeleton width="30%" height={40} />
            </div>
        ))}
    </div>
);

export const SkeletonGrid: React.FC<{ items?: number; columns?: 1 | 2 | 3 }> = ({
    items = 6,
    columns = 3
}) => {
    const gridCols = {
        1: 'grid-cols-1',
        2: 'grid-cols-1 md:grid-cols-2',
        3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
    };

    return (
        <div className={`grid ${gridCols[columns]} gap-4 lg:gap-6`}>
            {Array.from({ length: items }).map((_, i) => (
                <SkeletonCard key={i} />
            ))}
        </div>
    );
};

export const SkeletonList: React.FC<{ items?: number }> = ({ items = 3 }) => (
    <div className="space-y-4">
        {Array.from({ length: items }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-4 border border-gray-100 flex items-center gap-4">
                <Skeleton variant="circular" width={48} height={48} />
                <div className="flex-1 space-y-2">
                    <Skeleton width="70%" height={16} />
                    <Skeleton width="50%" height={14} />
                </div>
                <Skeleton width={80} height={36} className="rounded-lg" />
            </div>
        ))}
    </div>
);

export const SkeletonProfile: React.FC = () => (
    <div className="bg-white rounded-2xl p-8 border border-gray-100">
        {/* Header */}
        <div className="flex flex-col md:flex-row gap-6 mb-8">
            <Skeleton variant="circular" width={120} height={120} />
            <div className="flex-1 space-y-3">
                <Skeleton width="40%" height={28} />
                <Skeleton width="30%" height={20} />
                <Skeleton width="60%" height={16} />
                <div className="flex gap-2 mt-4">
                    <Skeleton width={100} height={36} className="rounded-lg" />
                    <Skeleton width={100} height={36} className="rounded-lg" />
                </div>
            </div>
        </div>

        {/* Content */}
        <div className="space-y-4">
            <Skeleton width="100%" height={12} />
            <Skeleton width="95%" height={12} />
            <Skeleton width="90%" height={12} />
        </div>
    </div>
);

export const SkeletonAssessment: React.FC = () => (
    <div className="max-w-4xl mx-auto space-y-6">
        {/* Question header */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
            <Skeleton width="80%" height={24} className="mb-4" />
            <Skeleton width="100%" height={16} className="mb-2" />
            <Skeleton width="95%" height={16} />
        </div>

        {/* Code editor skeleton */}
        <div className="bg-gray-900 rounded-2xl p-6 h-96">
            <div className="space-y-2">
                {Array.from({ length: 12 }).map((_, i) => (
                    <Skeleton
                        key={i}
                        width={`${Math.random() * 40 + 50}%`}
                        height={16}
                        className="bg-gray-700"
                    />
                ))}
            </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between">
            <Skeleton width={120} height={44} className="rounded-lg" />
            <Skeleton width={120} height={44} className="rounded-lg" />
        </div>
    </div>
);
