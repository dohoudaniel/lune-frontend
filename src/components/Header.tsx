import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

export interface HeaderAction {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
}

export interface HeaderProps {
  title: string;
  subtitle?: string;
  showBackButton?: boolean;
  onBack?: () => void;
  rightActions?: HeaderAction[];
  className?: string;
  hideOnMobile?: boolean;
}

/**
 * Reusable Header component for consistent page headers across the Lune platform.
 * Provides navigation, title display, and customizable actions.
 *
 * @example
 * ```tsx
 * <Header
 *   title="Candidate Dashboard"
 *   subtitle="Welcome back, John!"
 *   showBackButton
 *   onBack={() => navigate('/')}
 *   rightActions={[
 *     { icon: <Bell />, label: "Notifications", onClick: handleNotifications }
 *   ]}
 * />
 * ```
 */
export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  showBackButton = false,
  onBack,
  rightActions,
  className = '',
  hideOnMobile = false,
}) => {
  const getActionVariantClasses = (variant: string = 'secondary') => {
    switch (variant) {
      case 'primary':
        return 'bg-teal-600 text-white hover:bg-teal-700 dark:bg-teal-700 dark:hover:bg-teal-600';
      case 'danger':
        return 'bg-red-500 text-white hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-500';
      default:
        return 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700';
    }
  };

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`
        ${hideOnMobile ? 'hidden md:block' : ''}
        ${className}
        bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800
        sticky top-0 z-40 shadow-sm
      `}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Left Section: Back Button + Title */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {showBackButton && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={onBack}
                aria-label="Go back"
                className="
                  flex-shrink-0 p-2 rounded-lg text-gray-600 dark:text-gray-400
                  hover:text-gray-900 dark:hover:text-gray-200
                  hover:bg-gray-100 dark:hover:bg-gray-800
                  transition-colors duration-200
                "
              >
                <ArrowLeft size={20} />
              </motion.button>
            )}

            {/* Title & Subtitle */}
            <div className="flex-1 min-w-0">
              <motion.h1
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="
                  text-xl sm:text-2xl font-bold text-gray-900 dark:text-white
                  truncate tracking-tight
                "
              >
                {title}
              </motion.h1>

              {subtitle && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.15 }}
                  className="
                    text-sm sm:text-base text-gray-600 dark:text-gray-400
                    mt-0.5 truncate
                  "
                >
                  {subtitle}
                </motion.p>
              )}
            </div>
          </div>

          {/* Right Section: Actions */}
          {rightActions && rightActions.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-2 flex-shrink-0"
            >
              {rightActions.map((action, index) => (
                <motion.button
                  key={index}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={action.onClick}
                  disabled={action.disabled}
                  aria-label={action.label}
                  title={action.label}
                  className={`
                    p-2 rounded-lg transition-all duration-200
                    disabled:opacity-50 disabled:cursor-not-allowed
                    flex items-center justify-center
                    ${getActionVariantClasses(action.variant)}
                  `}
                >
                  {action.icon}
                </motion.button>
              ))}
            </motion.div>
          )}
        </div>
      </div>
    </motion.header>
  );
};

export default Header;
```

Now let me create the Footer component:

Now I'll create the Footer component. Let me enable tools again to proceed:
