import React, { useMemo } from 'react';
import { Check, X, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface PasswordStrengthMeterProps {
  password: string;
  onStrengthChange?: (strength: number) => void;
  showFeedback?: boolean;
  minLength?: number;
}

interface StrengthMetrics {
  hasMinLength: boolean;
  hasUpperCase: boolean;
  hasLowerCase: boolean;
  hasNumbers: boolean;
  hasSpecialChars: boolean;
  score: number; // 0-100
  level: 'weak' | 'fair' | 'good' | 'strong' | 'very-strong';
}

const calculatePasswordStrength = (password: string, minLength = 8): StrengthMetrics => {
  const metrics: StrengthMetrics = {
    hasMinLength: password.length >= minLength,
    hasUpperCase: /[A-Z]/.test(password),
    hasLowerCase: /[a-z]/.test(password),
    hasNumbers: /\d/.test(password),
    hasSpecialChars: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    score: 0,
    level: 'weak',
  };

  // Calculate score (0-100)
  let score = 0;

  // Length scoring
  if (password.length >= minLength) score += 20;
  if (password.length >= minLength + 4) score += 10;
  if (password.length >= minLength + 8) score += 10;

  // Character variety scoring
  if (metrics.hasUpperCase) score += 15;
  if (metrics.hasLowerCase) score += 15;
  if (metrics.hasNumbers) score += 15;
  if (metrics.hasSpecialChars) score += 15;

  // Bonus for combining multiple character types
  const varietyCount = [
    metrics.hasUpperCase,
    metrics.hasLowerCase,
    metrics.hasNumbers,
    metrics.hasSpecialChars,
  ].filter(Boolean).length;

  if (varietyCount >= 3) score += 5;
  if (varietyCount === 4) score += 5;

  metrics.score = Math.min(score, 100);

  // Determine level
  if (metrics.score < 25) {
    metrics.level = 'weak';
  } else if (metrics.score < 50) {
    metrics.level = 'fair';
  } else if (metrics.score < 75) {
    metrics.level = 'good';
  } else if (metrics.score < 90) {
    metrics.level = 'strong';
  } else {
    metrics.level = 'very-strong';
  }

  return metrics;
};

export const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({
  password,
  onStrengthChange,
  showFeedback = true,
  minLength = 8,
}) => {
  const metrics = useMemo(() => calculatePasswordStrength(password, minLength), [password, minLength]);

  React.useEffect(() => {
    if (onStrengthChange) {
      onStrengthChange(metrics.score);
    }
  }, [metrics.score, onStrengthChange]);

  const getColorClasses = (level: string) => {
    switch (level) {
      case 'very-strong':
        return {
          bar: 'bg-gradient-to-r from-green-500 to-emerald-500',
          text: 'text-green-700',
          bg: 'bg-green-50',
          badge: 'bg-green-100 text-green-800',
        };
      case 'strong':
        return {
          bar: 'bg-gradient-to-r from-green-400 to-teal-500',
          text: 'text-teal-700',
          bg: 'bg-teal-50',
          badge: 'bg-teal-100 text-teal-800',
        };
      case 'good':
        return {
          bar: 'bg-gradient-to-r from-yellow-400 to-amber-500',
          text: 'text-amber-700',
          bg: 'bg-amber-50',
          badge: 'bg-amber-100 text-amber-800',
        };
      case 'fair':
        return {
          bar: 'bg-gradient-to-r from-orange-400 to-red-500',
          text: 'text-orange-700',
          bg: 'bg-orange-50',
          badge: 'bg-orange-100 text-orange-800',
        };
      case 'weak':
      default:
        return {
          bar: 'bg-gradient-to-r from-red-400 to-red-600',
          text: 'text-red-700',
          bg: 'bg-red-50',
          badge: 'bg-red-100 text-red-800',
        };
    }
  };

  const colors = getColorClasses(metrics.level);

  const getStrengthLabel = (level: string) => {
    switch (level) {
      case 'very-strong':
        return 'Very Strong';
      case 'strong':
        return 'Strong';
      case 'good':
        return 'Good';
      case 'fair':
        return 'Fair';
      case 'weak':
      default:
        return 'Weak';
    }
  };

  const feedbackItems = [
    {
      label: `At least ${minLength} characters`,
      met: metrics.hasMinLength,
      icon: metrics.hasMinLength ? Check : X,
    },
    {
      label: 'Uppercase letter (A-Z)',
      met: metrics.hasUpperCase,
      icon: metrics.hasUpperCase ? Check : X,
    },
    {
      label: 'Lowercase letter (a-z)',
      met: metrics.hasLowerCase,
      icon: metrics.hasLowerCase ? Check : X,
    },
    {
      label: 'Number (0-9)',
      met: metrics.hasNumbers,
      icon: metrics.hasNumbers ? Check : X,
    },
    {
      label: 'Special character (!@#$%^&*)',
      met: metrics.hasSpecialChars,
      icon: metrics.hasSpecialChars ? Check : X,
    },
  ];

  const unmetRequirements = feedbackItems.filter((item) => !item.met);
  const hasWarning = unmetRequirements.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`space-y-3 p-4 rounded-lg border ${colors.bg} border-opacity-30`}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          Password Strength
        </label>
        <motion.span
          key={metrics.level}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={`text-xs font-bold px-2.5 py-1 rounded-full ${colors.badge}`}
        >
          {getStrengthLabel(metrics.level)}
        </motion.span>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1">
        <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${metrics.score}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className={`h-full ${colors.bar} rounded-full`}
          />
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Strength: {metrics.score}/100
        </p>
      </div>

      {/* Requirements Feedback */}
      {showFeedback && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="space-y-2"
        >
          {/* Warning Message */}
          {hasWarning && password.length > 0 && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 p-2 rounded-md"
            >
              <AlertCircle size={14} className="flex-shrink-0" />
              <span>
                {unmetRequirements.length} requirement{unmetRequirements.length !== 1 ? 's' : ''} remaining
              </span>
            </motion.div>
          )}

          {/* Requirements List */}
          <div className="space-y-1.5">
            {feedbackItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`flex items-center gap-2 text-xs transition-colors ${
                    item.met
                      ? 'text-green-700 dark:text-green-400'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  <Icon
                    size={14}
                    className={`flex-shrink-0 ${
                      item.met ? 'text-green-500' : 'text-gray-400'
                    }`}
                  />
                  <span>{item.label}</span>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Strength Tips */}
      {password.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="pt-2 border-t border-gray-200 dark:border-gray-700"
        >
          <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
            💡 Pro tip:
          </p>
          {metrics.level === 'weak' && (
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Make your password longer and combine different character types for better security.
            </p>
          )}
          {metrics.level === 'fair' && (
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Add special characters and numbers to improve your password strength.
            </p>
          )}
          {metrics.level === 'good' && (
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Consider adding a few more characters or special symbols for maximum security.
            </p>
          )}
          {metrics.level === 'strong' && (
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Great password! You're well protected. Consider using a passphrase for even better security.
            </p>
          )}
          {metrics.level === 'very-strong' && (
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Excellent! Your password is very strong and secure. 🎉
            </p>
          )}
        </motion.div>
      )}
    </motion.div>
  );
};

/**
 * Hook to use password strength calculation
 * @param password - The password to evaluate
 * @param minLength - Minimum password length (default: 8)
 * @returns Password strength metrics
 */
export const usePasswordStrength = (password: string, minLength = 8): StrengthMetrics => {
  return useMemo(() => calculatePasswordStrength(password, minLength), [password, minLength]);
};

export default PasswordStrengthMeter;
