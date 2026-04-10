import React, { useState } from "react";
import { api } from "../lib/api";

interface PasswordChangeFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface FormData {
  old_password: string;
  new_password: string;
  new_password_confirm: string;
}

interface FormErrors {
  old_password?: string;
  new_password?: string;
  new_password_confirm?: string;
  general?: string;
}

/**
 * PasswordChangeForm Component
 *
 * Allows authenticated users to securely change their password.
 *
 * Security features:
 * - Validates old password before allowing change
 * - Requires new password confirmation
 * - Checks password strength requirements
 * - Shows warning about device logout
 * - All other sessions invalidated on password change
 */
export const PasswordChangeForm: React.FC<PasswordChangeFormProps> = ({
  onSuccess,
  onCancel,
}) => {
  const [formData, setFormData] = useState<FormData>({
    old_password: "",
    new_password: "",
    new_password_confirm: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    old: false,
    new: false,
    confirm: false,
  });

  // Password strength requirements
  const passwordRequirements = {
    minLength: 8,
    hasUppercase: /[A-Z]/.test(formData.new_password),
    hasLowercase: /[a-z]/.test(formData.new_password),
    hasNumbers: /\d/.test(formData.new_password),
    hasSpecial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(
      formData.new_password,
    ),
  };

  const passwordStrength =
    Object.values(passwordRequirements).filter(Boolean).length;

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.old_password.trim()) {
      newErrors.old_password = "Current password is required";
    }

    if (!formData.new_password.trim()) {
      newErrors.new_password = "New password is required";
    } else if (formData.new_password.length < 8) {
      newErrors.new_password = "Password must be at least 8 characters";
    } else if (formData.new_password === formData.old_password) {
      newErrors.new_password =
        "New password must be different from current password";
    }

    if (!formData.new_password_confirm.trim()) {
      newErrors.new_password_confirm = "Please confirm new password";
    } else if (formData.new_password !== formData.new_password_confirm) {
      newErrors.new_password_confirm = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const togglePasswordVisibility = (field: "old" | "new" | "confirm") => {
    setShowPasswords((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      await api.post("/users/me/change-password/", {
        old_password: formData.old_password,
        new_password: formData.new_password,
        new_password_confirm: formData.new_password_confirm,
      });

      setSuccess(true);
      setFormData({
        old_password: "",
        new_password: "",
        new_password_confirm: "",
      });

      // Show success message and redirect to login after a delay
      setTimeout(() => {
        sessionStorage.removeItem("lune_user_profile"); // FSEC-4
        window.dispatchEvent(new Event("auth:session-expired"));
        if (onSuccess) {
          onSuccess();
        } else {
          // Redirect to login
          window.location.href = "/login";
        }
      }, 2000);
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.detail ||
        error?.response?.data?.non_field_errors?.[0] ||
        "Failed to change password. Please try again.";

      if (error?.response?.data?.old_password) {
        setErrors((prev) => ({
          ...prev,
          old_password: error.response.data.old_password[0],
        }));
      } else if (error?.response?.data?.new_password) {
        setErrors((prev) => ({
          ...prev,
          new_password: error.response.data.new_password[0],
        }));
      } else {
        setErrors((prev) => ({
          ...prev,
          general: errorMessage,
        }));
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="password-change-success">
        <div className="success-icon">✓</div>
        <h3>Password Changed Successfully</h3>
        <p>
          Your password has been updated. All other sessions have been logged
          out for security.
        </p>
        <p className="text-sm text-gray-600">
          You will be redirected to login shortly...
        </p>
      </div>
    );
  }

  return (
    <div className="password-change-form">
      <form onSubmit={handleSubmit} noValidate>
        {/* Warning Banner */}
        <div className="security-warning">
          <svg
            className="warning-icon"
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          <div>
            <p className="font-semibold">Security Notice</p>
            <p className="text-sm">
              Changing your password will log you out on all other devices.
              You'll remain logged in on this device.
            </p>
          </div>
        </div>

        {/* General Error */}
        {errors.general && (
          <div className="error-message">
            <p>{errors.general}</p>
          </div>
        )}

        {/* Old Password Field */}
        <div className="form-group">
          <label htmlFor="old_password">Current Password</label>
          <div className="password-input-wrapper">
            <input
              id="old_password"
              type={showPasswords.old ? "text" : "password"}
              name="old_password"
              value={formData.old_password}
              onChange={handleChange}
              disabled={loading}
              className={errors.old_password ? "input-error" : ""}
              placeholder="Enter your current password"
              required
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => togglePasswordVisibility("old")}
              aria-label={showPasswords.old ? "Hide password" : "Show password"}
            >
              {showPasswords.old ? "👁️" : "👁️‍🗨️"}
            </button>
          </div>
          {errors.old_password && (
            <p className="error-text">{errors.old_password}</p>
          )}
        </div>

        {/* New Password Field */}
        <div className="form-group">
          <label htmlFor="new_password">New Password</label>
          <div className="password-input-wrapper">
            <input
              id="new_password"
              type={showPasswords.new ? "text" : "password"}
              name="new_password"
              value={formData.new_password}
              onChange={handleChange}
              disabled={loading}
              className={errors.new_password ? "input-error" : ""}
              placeholder="Enter new password"
              required
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => togglePasswordVisibility("new")}
              aria-label={showPasswords.new ? "Hide password" : "Show password"}
            >
              {showPasswords.new ? "👁️" : "👁️‍🗨️"}
            </button>
          </div>

          {/* Password Strength Meter */}
          {formData.new_password && (
            <div className="password-strength">
              <div className="strength-bar">
                <div
                  className={`strength-fill strength-${passwordStrength}`}
                  style={{ width: `${(passwordStrength / 5) * 100}%` }}
                />
              </div>
              <p className="strength-text">
                {passwordStrength <= 2 && "Weak"}
                {passwordStrength === 3 && "Fair"}
                {passwordStrength === 4 && "Good"}
                {passwordStrength === 5 && "Strong"}
              </p>

              {/* Requirements Checklist */}
              <div className="requirements">
                <div
                  className={`requirement ${passwordRequirements.minLength ? "met" : ""}`}
                >
                  <span className="check">✓</span>
                  At least 8 characters
                </div>
                <div
                  className={`requirement ${passwordRequirements.hasUppercase ? "met" : ""}`}
                >
                  <span className="check">✓</span>
                  Uppercase letter (A-Z)
                </div>
                <div
                  className={`requirement ${passwordRequirements.hasLowercase ? "met" : ""}`}
                >
                  <span className="check">✓</span>
                  Lowercase letter (a-z)
                </div>
                <div
                  className={`requirement ${passwordRequirements.hasNumbers ? "met" : ""}`}
                >
                  <span className="check">✓</span>
                  Number (0-9)
                </div>
                <div
                  className={`requirement ${passwordRequirements.hasSpecial ? "met" : ""}`}
                >
                  <span className="check">✓</span>
                  Special character (!@#$%^&*)
                </div>
              </div>
            </div>
          )}

          {errors.new_password && (
            <p className="error-text">{errors.new_password}</p>
          )}
        </div>

        {/* Confirm Password Field */}
        <div className="form-group">
          <label htmlFor="new_password_confirm">Confirm New Password</label>
          <div className="password-input-wrapper">
            <input
              id="new_password_confirm"
              type={showPasswords.confirm ? "text" : "password"}
              name="new_password_confirm"
              value={formData.new_password_confirm}
              onChange={handleChange}
              disabled={loading}
              className={errors.new_password_confirm ? "input-error" : ""}
              placeholder="Confirm new password"
              required
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => togglePasswordVisibility("confirm")}
              aria-label={
                showPasswords.confirm ? "Hide password" : "Show password"
              }
            >
              {showPasswords.confirm ? "👁️" : "👁️‍🗨️"}
            </button>
          </div>
          {errors.new_password_confirm && (
            <p className="error-text">{errors.new_password_confirm}</p>
          )}
        </div>

        {/* Form Actions */}
        <div className="form-actions">
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? "Changing Password..." : "Change Password"}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="btn-secondary"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <style>{`
        .password-change-form {
          max-width: 500px;
          margin: 0 auto;
        }

        .security-warning {
          display: flex;
          gap: 12px;
          padding: 12px 16px;
          background-color: #fef3c7;
          border: 1px solid #fcd34d;
          border-radius: 8px;
          margin-bottom: 24px;
          color: #92400e;
        }

        .warning-icon {
          flex-shrink: 0;
          color: #f59e0b;
        }

        .security-warning p {
          margin: 0;
        }

        .security-warning .font-semibold {
          font-weight: 600;
        }

        .security-warning .text-sm {
          font-size: 0.875rem;
          margin-top: 4px;
        }

        .error-message {
          padding: 12px 16px;
          background-color: #fee2e2;
          border: 1px solid #fecaca;
          border-radius: 8px;
          margin-bottom: 16px;
          color: #991b1b;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group label {
          display: block;
          margin-bottom: 8px;
          font-weight: 500;
          color: #1f2937;
        }

        .password-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .password-input-wrapper input {
          width: 100%;
          padding: 10px 40px 10px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 1rem;
          transition: border-color 0.2s;
        }

        .password-input-wrapper input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .password-input-wrapper input.input-error {
          border-color: #ef4444;
        }

        .password-input-wrapper input:disabled {
          background-color: #f3f4f6;
          cursor: not-allowed;
        }

        .password-toggle {
          position: absolute;
          right: 12px;
          background: none;
          border: none;
          cursor: pointer;
          font-size: 1.2rem;
          padding: 4px;
        }

        .password-toggle:hover {
          opacity: 0.7;
        }

        .error-text {
          color: #dc2626;
          font-size: 0.875rem;
          margin-top: 6px;
        }

        .password-strength {
          margin-top: 12px;
        }

        .strength-bar {
          height: 4px;
          background-color: #e5e7eb;
          border-radius: 2px;
          overflow: hidden;
          margin-bottom: 8px;
        }

        .strength-fill {
          height: 100%;
          border-radius: 2px;
          transition: all 0.3s;
        }

        .strength-fill.strength-1 {
          width: 20%;
          background-color: #ef4444;
        }

        .strength-fill.strength-2 {
          width: 40%;
          background-color: #f97316;
        }

        .strength-fill.strength-3 {
          width: 60%;
          background-color: #eab308;
        }

        .strength-fill.strength-4 {
          width: 80%;
          background-color: #84cc16;
        }

        .strength-fill.strength-5 {
          width: 100%;
          background-color: #22c55e;
        }

        .strength-text {
          font-size: 0.75rem;
          color: #6b7280;
          margin-bottom: 8px;
        }

        .requirements {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .requirement {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.875rem;
          color: #6b7280;
        }

        .requirement.met {
          color: #059669;
        }

        .requirement .check {
          opacity: 0;
          transition: opacity 0.2s;
        }

        .requirement.met .check {
          opacity: 1;
        }

        .form-actions {
          display: flex;
          gap: 12px;
          margin-top: 24px;
        }

        .btn-primary,
        .btn-secondary {
          flex: 1;
          padding: 10px 16px;
          border: none;
          border-radius: 6px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-primary {
          background-color: #3b82f6;
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background-color: #2563eb;
        }

        .btn-primary:disabled {
          background-color: #9ca3af;
          cursor: not-allowed;
        }

        .btn-secondary {
          background-color: #e5e7eb;
          color: #1f2937;
        }

        .btn-secondary:hover:not(:disabled) {
          background-color: #d1d5db;
        }

        .btn-secondary:disabled {
          background-color: #f3f4f6;
          cursor: not-allowed;
        }

        .password-change-success {
          text-align: center;
          padding: 32px 24px;
        }

        .success-icon {
          width: 64px;
          height: 64px;
          margin: 0 auto 16px;
          background-color: #dcfce7;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 32px;
          color: #16a34a;
        }

        .password-change-success h3 {
          margin: 0 0 8px;
          color: #1f2937;
        }

        .password-change-success p {
          margin: 0 0 8px;
          color: #6b7280;
        }

        .password-change-success .text-sm {
          font-size: 0.875rem;
          color: #9ca3af;
        }
      `}</style>
    </div>
  );
};
