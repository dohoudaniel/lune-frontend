import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Upload,
  Lock,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../lib/toast';
import { api } from '../lib/api';

interface RequiredField {
  id: string;
  label: string;
  description: string;
  type: 'text' | 'email' | 'select' | 'textarea' | 'number' | 'file';
  placeholder?: string;
  required: boolean;
  completed: boolean;
  options?: Array<{ label: string; value: string }>;
  value?: any;
}

interface ProfileCompletionGateProps {
  isOpen: boolean;
  onComplete: () => void;
  minimumCompletion?: number;
}

const CANDIDATE_REQUIRED_FIELDS: RequiredField[] = [
  {
    id: 'title',
    label: 'Professional Title',
    description: 'Your current job title or role',
    type: 'text',
    placeholder: 'e.g., Senior Software Engineer',
    required: true,
    completed: false,
  },
  {
    id: 'location',
    label: 'Location',
    description: 'Your city and country',
    type: 'text',
    placeholder: 'e.g., San Francisco, CA',
    required: true,
    completed: false,
  },
  {
    id: 'bio',
    label: 'Professional Bio',
    description: 'Brief description of your experience and goals',
    type: 'textarea',
    placeholder: 'Tell us about yourself...',
    required: true,
    completed: false,
  },
  {
    id: 'years_of_experience',
    label: 'Years of Experience',
    description: 'How many years have you been working?',
    type: 'number',
    placeholder: '5',
    required: true,
    completed: false,
  },
  {
    id: 'preferred_work_mode',
    label: 'Preferred Work Mode',
    description: 'How do you prefer to work?',
    type: 'select',
    required: true,
    completed: false,
    options: [
      { label: 'Remote', value: 'Remote' },
      { label: 'Hybrid', value: 'Hybrid' },
      { label: 'On-site', value: 'On-site' },
    ],
  },
  {
    id: 'avatar',
    label: 'Profile Photo',
    description: 'Upload a professional photo',
    type: 'file',
    required: true,
    completed: false,
  },
];

const EMPLOYER_REQUIRED_FIELDS: RequiredField[] = [
  {
    id: 'company_name',
    label: 'Company Name',
    description: 'Your company name',
    type: 'text',
    placeholder: 'e.g., Acme Corporation',
    required: true,
    completed: false,
  },
  {
    id: 'industry',
    label: 'Industry',
    description: 'What industry is your company in?',
    type: 'select',
    required: true,
    completed: false,
    options: [
      { label: 'Technology', value: 'Technology' },
      { label: 'Finance', value: 'Finance' },
      { label: 'Healthcare', value: 'Healthcare' },
      { label: 'Retail', value: 'Retail' },
      { label: 'Manufacturing', value: 'Manufacturing' },
      { label: 'Education', value: 'Education' },
      { label: 'Other', value: 'Other' },
    ],
  },
  {
    id: 'company_size',
    label: 'Company Size',
    description: 'How many employees?',
    type: 'select',
    required: true,
    completed: false,
    options: [
      { label: '1-10', value: '1-10' },
      { label: '11-50', value: '11-50' },
      { label: '51-200', value: '51-200' },
      { label: '201-500', value: '201-500' },
      { label: '500+', value: '500+' },
    ],
  },
  {
    id: 'location',
    label: 'Location',
    description: 'Company headquarters location',
    type: 'text',
    placeholder: 'e.g., San Francisco, CA',
    required: true,
    completed: false,
  },
  {
    id: 'website',
    label: 'Company Website',
    description: 'Your company website URL',
    type: 'text',
    placeholder: 'https://example.com',
    required: true,
    completed: false,
  },
];

export const ProfileCompletionGate: React.FC<ProfileCompletionGateProps> = ({
  isOpen,
  onComplete,
  minimumCompletion = 80,
}) => {
  const { user, logout } = useAuth();
  const toast = useToast();
  const [fields, setFields] = useState<RequiredField[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completionPercentage, setCompletionPercentage] = useState(0);

  // Initialize fields based on user role
  useEffect(() => {
    if (user?.role === 'employer') {
      setFields(EMPLOYER_REQUIRED_FIELDS);
    } else {
      setFields(CANDIDATE_REQUIRED_FIELDS);
    }
  }, [user?.role]);

  // Calculate completion percentage
  useEffect(() => {
    if (fields.length === 0) return;

    const completed = fields.filter((field) => field.value && field.value.toString().trim() !== '').length;
    const percentage = Math.round((completed / fields.length) * 100);
    setCompletionPercentage(percentage);
  }, [fields]);

  const handleFieldChange = (fieldId: string, value: any) => {
    setFields((prev) =>
      prev.map((field) => (field.id === fieldId ? { ...field, value } : field))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if minimum completion met
    const emptyFields = fields.filter((f) => !f.value || f.value.toString().trim() === '');
    if (emptyFields.length > 0) {
      toast.error(`Please complete all required fields: ${emptyFields.map((f) => f.label).join(', ')}`);
      return;
    }

    setIsSubmitting(true);
    try {
      // Prepare form data
      const formData = new FormData();
      fields.forEach((field) => {
        if (field.type === 'file' && field.value instanceof File) {
          formData.append(field.id, field.value);
        } else if (field.value) {
          formData.append(field.id, field.value);
        }
      });

      // Submit to appropriate endpoint
      const endpoint =
        user?.role === 'employer'
          ? '/profiles/employer/'
          : '/profiles/candidate/';

      await api.put(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.success('Profile completed successfully! 🎉');
      onComplete();
    } catch (error) {
      toast.error('Failed to save profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to log out?')) {
      await logout();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop - non-dismissible */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />

          {/* Modal - can't be closed */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl max-h-[90vh] z-50 overflow-hidden"
          >
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col h-full">
              {/* Header */}
              <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-6 py-6">
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="space-y-2"
                >
                  <div className="flex items-center gap-3">
                    <AlertCircle className="text-amber-400" size={28} />
                    <h2 className="text-2xl font-bold text-white">Complete Your Profile</h2>
                  </div>
                  <p className="text-slate-300 text-sm">
                    Please complete your profile to unlock the full Lune experience
                  </p>
                </motion.div>
              </div>

              {/* Progress Bar */}
              <div className="px-6 pt-6 pb-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-slate-900">Profile Completion</span>
                    <span className="font-bold text-teal-600">{completionPercentage}%</span>
                  </div>
                  <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${completionPercentage}%` }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                      className="h-full bg-gradient-to-r from-teal-500 to-teal-600 rounded-full"
                    />
                  </div>
                </div>
              </div>

              {/* Form - Scrollable */}
              <motion.form
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                onSubmit={handleSubmit}
                className="flex-1 overflow-y-auto px-6 py-4"
              >
                <div className="space-y-5">
                  {fields.map((field, index) => (
                    <motion.div
                      key={field.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 + index * 0.05 }}
                      className="space-y-2"
                    >
                      <label className="block text-sm font-semibold text-slate-900">
                        <span className="flex items-center gap-2">
                          {field.label}
                          {field.required && <span className="text-red-500">*</span>}
                          {field.value && field.value.toString().trim() !== '' && (
                            <CheckCircle2 className="text-green-500" size={16} />
                          )}
                        </span>
                        <p className="text-xs text-slate-600 font-normal mt-0.5">
                          {field.description}
                        </p>
                      </label>

                      {field.type === 'text' || field.type === 'email' || field.type === 'number' ? (
                        <input
                          type={field.type}
                          placeholder={field.placeholder}
                          value={field.value || ''}
                          onChange={(e) => handleFieldChange(field.id, e.target.value)}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all text-sm"
                          required={field.required}
                        />
                      ) : field.type === 'textarea' ? (
                        <textarea
                          placeholder={field.placeholder}
                          value={field.value || ''}
                          onChange={(e) => handleFieldChange(field.id, e.target.value)}
                          rows={3}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all text-sm resize-none"
                          required={field.required}
                        />
                      ) : field.type === 'select' ? (
                        <select
                          value={field.value || ''}
                          onChange={(e) => handleFieldChange(field.id, e.target.value)}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all text-sm"
                          required={field.required}
                        >
                          <option value="">Select an option...</option>
                          {field.options?.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      ) : field.type === 'file' ? (
                        <div className="relative">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFieldChange(field.id, e.target.files?.[0])}
                            className="hidden"
                            id={field.id}
                            required={field.required}
                          />
                          <label
                            htmlFor={field.id}
                            className="flex flex-col items-center justify-center w-full px-4 py-6 bg-slate-50 border-2 border-dashed border-slate-200 rounded-lg cursor-pointer hover:bg-slate-100 hover:border-slate-300 transition-all"
                          >
                            <Upload className="text-slate-400 mb-2" size={24} />
                            <span className="text-sm font-semibold text-slate-700">
                              {field.value?.name || 'Click to upload photo'}
                            </span>
                            <span className="text-xs text-slate-500 mt-1">
                              JPG, PNG or WebP up to 5MB
                            </span>
                          </label>
                        </div>
                      ) : null}
                    </motion.div>
                  ))}
                </div>
              </motion.form>

              {/* Footer with Actions */}
              <div className="border-t border-slate-200 bg-slate-50 px-6 py-4 flex items-center justify-between gap-3">
                <button
                  onClick={handleLogout}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <LogOut size={16} />
                  Logout
                </button>

                <motion.button
                  type="submit"
                  form="profile-completion-form"
                  onClick={handleSubmit}
                  disabled={isSubmitting || completionPercentage < 100}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-semibold transition-all ${
                    completionPercentage === 100
                      ? 'bg-gradient-to-r from-teal-600 to-teal-700 text-white hover:shadow-lg'
                      : 'bg-slate-300 text-slate-600 cursor-not-allowed'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Lock size={18} />
                      Complete Profile
                    </>
                  )}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ProfileCompletionGate;
