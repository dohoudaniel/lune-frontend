import React from 'react';
import { motion } from 'framer-motion';
import { ExternalLink } from 'lucide-react';

export interface FooterLink {
  label: string;
  href: string;
  external?: boolean;
  onClick?: () => void;
}

export interface FooterSection {
  title: string;
  links: FooterLink[];
}

export interface FooterProps {
  sections?: FooterSection[];
  copyrightText?: string;
  companyName?: string;
  year?: number;
  showBrand?: boolean;
  socialLinks?: Array<{
    icon: React.ReactNode;
    href: string;
    label: string;
  }>;
  className?: string;
}

/**
 * Reusable Footer component for consistent footer across all pages.
 * Displays copyright info, navigation links, and optional social links.
 *
 * @example
 * ```tsx
 * <Footer
 *   companyName="Lune"
 *   sections={[
 *     {
 *       title: "Product",
 *       links: [
 *         { label: "Features", href: "/features" },
 *         { label: "Pricing", href: "/pricing" }
 *       ]
 *     }
 *   ]}
 * />
 * ```
 */
export const Footer: React.FC<FooterProps> = ({
  sections,
  copyrightText,
  companyName = 'Lune',
  year,
  showBrand = true,
  socialLinks,
  className = '',
}) => {
  const currentYear = year || new Date().getFullYear();
  const defaultCopyright = `© ${currentYear} ${companyName}. All rights reserved.`;

  return (
    <motion.footer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className={`
        ${className}
        bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800
        mt-auto
      `}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Main Footer Content */}
        {sections && sections.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            {sections.map((section, sectionIndex) => (
              <motion.div
                key={sectionIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: sectionIndex * 0.1 }}
              >
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                  {section.title}
                </h3>
                <ul className="space-y-3">
                  {section.links.map((link, linkIndex) => (
                    <li key={linkIndex}>
                      <motion.a
                        whileHover={{ x: 4 }}
                        href={link.href}
                        target={link.external ? '_blank' : undefined}
                        rel={link.external ? 'noopener noreferrer' : undefined}
                        onClick={link.onClick}
                        className="
                          text-sm text-gray-600 dark:text-gray-400
                          hover:text-gray-900 dark:hover:text-white
                          transition-colors duration-200
                          inline-flex items-center gap-1
                        "
                      >
                        {link.label}
                        {link.external && <ExternalLink size={12} />}
                      </motion.a>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        )}

        {/* Divider */}
        <div className="border-t border-gray-200 dark:border-gray-800 mb-8" />

        {/* Bottom Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Brand + Copyright */}
          <div className="flex flex-col gap-3">
            {showBrand && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="flex items-center gap-2"
              >
                {/* Lune Brand Mark */}
                <div className="w-6 h-6 grid grid-cols-2 gap-1">
                  <div className="bg-teal-600 rounded-full" />
                  <div className="bg-teal-600 rounded-full" />
                  <div className="bg-orange-500 rounded-full" />
                  <div className="bg-orange-500 rounded-full" />
                </div>
                <span className="font-bold text-gray-900 dark:text-white">
                  {companyName}
                </span>
              </motion.div>
            )}

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35 }}
              className="text-sm text-gray-600 dark:text-gray-400"
            >
              {copyrightText || defaultCopyright}
            </motion.p>
          </div>

          {/* Social Links */}
          {socialLinks && socialLinks.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="flex items-center gap-4"
            >
              {socialLinks.map((social, index) => (
                <motion.a
                  key={index}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.95 }}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  title={social.label}
                  className="
                    text-gray-600 dark:text-gray-400
                    hover:text-gray-900 dark:hover:text-white
                    transition-colors duration-200
                  "
                >
                  {social.icon}
                </motion.a>
              ))}
            </motion.div>
          )}
        </div>

        {/* Additional Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45 }}
          className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-800 text-center"
        >
          <p className="text-xs text-gray-500 dark:text-gray-500">
            Built with{' '}
            <span className="text-red-500">♥</span>
            {' '}for talent beyond borders
          </p>
        </motion.div>
      </div>
    </motion.footer>
  );
};

export default Footer;
