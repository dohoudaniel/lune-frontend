import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface CardProps {
  children: ReactNode;
  className?: string;
  variant?: 'elevated' | 'outlined' | 'flat';
  padding?: 'sm' | 'md' | 'lg';
  rounded?: 'sm' | 'md' | 'lg' | 'xl';
  hoverable?: boolean;
  onClick?: () => void;
  animate?: boolean;
}

interface CardHeaderProps {
  children: ReactNode;
  className?: string;
  icon?: ReactNode;
  title?: string;
  subtitle?: string;
}

interface CardContentProps {
  children: ReactNode;
  className?: string;
}

interface CardFooterProps {
  children: ReactNode;
  className?: string;
  divider?: boolean;
}

const paddingClasses = {
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

const roundedClasses = {
  sm: 'rounded-lg',
  md: 'rounded-xl',
  lg: 'rounded-2xl',
  xl: 'rounded-3xl',
};

const variantClasses = {
  elevated: 'bg-white shadow-md border border-slate-100/50',
  outlined: 'bg-white border border-slate-200 shadow-sm',
  flat: 'bg-slate-50/50 border border-transparent',
};

const hoverableClasses = 'hover:shadow-lg hover:border-slate-200 hover:scale-[1.01] transition-all duration-200 cursor-pointer';

/**
 * Card Component - Reusable card container with consistent styling
 *
 * @example
 * <Card variant="elevated" hoverable>
 *   <Card.Header icon={<StarIcon />} title="Premium" subtitle="Unlock all features" />
 *   <Card.Content>Card content goes here</Card.Content>
 *   <Card.Footer>Footer content</Card.Footer>
 * </Card>
 */
export const Card: React.FC<CardProps> & {
  Header: React.FC<CardHeaderProps>;
  Content: React.FC<CardContentProps>;
  Footer: React.FC<CardFooterProps>;
} = ({
  children,
  className = '',
  variant = 'outlined',
  padding = 'md',
  rounded = 'lg',
  hoverable = false,
  onClick,
  animate = false,
}) => {
  const baseClasses = `bg-white overflow-hidden transition-all duration-200 ${roundedClasses[rounded]} ${variantClasses[variant]}`;
  const interactiveClasses = hoverable ? hoverableClasses : '';
  const combinedClasses = `${baseClasses} ${interactiveClasses} ${className}`;

  const cardContent = (
    <div className={combinedClasses} onClick={onClick}>
      {children}
    </div>
  );

  if (animate) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {cardContent}
      </motion.div>
    );
  }

  return cardContent;
};

/**
 * Card.Header - Header section with icon, title, and subtitle
 */
Card.Header = ({ children, className = '', icon, title, subtitle }: CardHeaderProps) => {
  if (children) {
    return <div className={`px-6 pt-6 pb-4 border-b border-slate-100 ${className}`}>{children}</div>;
  }

  return (
    <div className={`px-6 pt-6 pb-4 border-b border-slate-100 flex items-start gap-4 ${className}`}>
      {icon && <div className="flex-shrink-0 text-slate-900">{icon}</div>}
      <div className="flex-grow">
        {title && <h3 className="font-semibold text-slate-900 text-lg">{title}</h3>}
        {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
      </div>
    </div>
  );
};

/**
 * Card.Content - Main content area with consistent padding
 */
Card.Content = ({ children, className = '' }: CardContentProps) => {
  return (
    <div className={`px-6 py-6 space-y-4 ${className}`}>
      {children}
    </div>
  );
};

/**
 * Card.Footer - Footer section, optional divider
 */
Card.Footer = ({ children, className = '', divider = true }: CardFooterProps) => {
  return (
    <div
      className={`px-6 py-4 ${divider ? 'border-t border-slate-100' : ''} bg-slate-50/30 ${className}`}
    >
      {children}
    </div>
  );
};

/**
 * StatCard - Specialized card for displaying statistics
 */
interface StatCardProps {
  icon?: ReactNode;
  label: string;
  value: string | number;
  unit?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  icon,
  label,
  value,
  unit,
  trend,
  trendValue,
  className = '',
}) => {
  const trendColors = {
    up: 'text-green-600 bg-green-50',
    down: 'text-red-600 bg-red-50',
    neutral: 'text-slate-600 bg-slate-50',
  };

  return (
    <Card variant="outlined" className={className}>
      <Card.Content>
        <div className="flex items-start justify-between">
          <div className="flex-grow">
            <p className="text-sm font-medium text-slate-600 mb-1">{label}</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-slate-900">{value}</span>
              {unit && <span className="text-sm text-slate-500">{unit}</span>}
            </div>
            {trend && trendValue && (
              <div className={`text-xs font-semibold mt-2 px-2 py-1 rounded-md inline-block ${trendColors[trend]}`}>
                {trend === 'up' && '↑'} {trend === 'down' && '↓'} {trendValue}
              </div>
            )}
          </div>
          {icon && <div className="text-slate-400 flex-shrink-0">{icon}</div>}
        </div>
      </Card.Content>
    </Card>
  );
};

/**
 * ProfileCard - Specialized card for displaying user profiles
 */
interface ProfileCardProps {
  name: string;
  title: string;
  image?: string;
  badge?: string;
  stats?: Array<{ label: string; value: string | number }>;
  actions?: ReactNode;
  hoverable?: boolean;
  onClick?: () => void;
}

export const ProfileCard: React.FC<ProfileCardProps> = ({
  name,
  title,
  image,
  badge,
  stats,
  actions,
  hoverable = true,
  onClick,
}) => {
  return (
    <Card variant="elevated" hoverable={hoverable} onClick={onClick}>
      {image && (
        <div className="relative h-40 bg-gradient-to-br from-orange/10 to-teal/10 overflow-hidden">
          <img src={image} alt={name} className="w-full h-full object-cover" />
          {badge && (
            <div className="absolute top-3 right-3 px-3 py-1 bg-orange text-white text-xs font-semibold rounded-full">
              {badge}
            </div>
          )}
        </div>
      )}

      <Card.Content>
        <h3 className="text-lg font-bold text-slate-900">{name}</h3>
        <p className="text-sm text-slate-600 mt-1">{title}</p>

        {stats && stats.length > 0 && (
          <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-100">
            {stats.map((stat, idx) => (
              <div key={idx}>
                <p className="text-xs text-slate-500 font-medium">{stat.label}</p>
                <p className="text-lg font-bold text-slate-900 mt-1">{stat.value}</p>
              </div>
            ))}
          </div>
        )}
      </Card.Content>

      {actions && <Card.Footer divider={!!(image || stats)}>{actions}</Card.Footer>}
    </Card>
  );
};

export default Card;
