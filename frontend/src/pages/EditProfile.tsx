import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import authService from '../services/authService';
import { getErrorMessage, getFieldErrors } from '../services/api';
import type { FieldErrors } from '../types';

interface ProfileFormData {
  first_name: string;
  last_name: string;
  preferred_currency: 'BGN' | 'EUR';
}

interface PasswordFormData {
  old_password: string;
  new_password: string;
  new_password_confirm: string;
}

const EditProfile = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();

  // Profile form state
  const [profileData, setProfileData] = useState<ProfileFormData>({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    preferred_currency: user?.preferred_currency || 'BGN',
  });
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileFieldErrors, setProfileFieldErrors] = useState<FieldErrors<ProfileFormData>>({});
  const [profileSuccess, setProfileSuccess] = useState('');

  // Password form state
  const [passwordData, setPasswordData] = useState<PasswordFormData>({
    old_password: '',
    new_password: '',
    new_password_confirm: '',
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordFieldErrors, setPasswordFieldErrors] = useState<FieldErrors<PasswordFormData>>({});
  const [passwordSuccess, setPasswordSuccess] = useState('');

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
    // Clear field error when user types
    if (profileFieldErrors[name as keyof ProfileFormData]) {
      setProfileFieldErrors(prev => ({ ...prev, [name]: undefined }));
    }
    setProfileSuccess('');
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
    // Clear field error when user types
    if (passwordFieldErrors[name as keyof PasswordFormData]) {
      setPasswordFieldErrors(prev => ({ ...prev, [name]: undefined }));
    }
    setPasswordSuccess('');
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    setProfileError('');
    setProfileFieldErrors({});
    setProfileSuccess('');

    try {
      const updatedUser = await authService.updateProfile(profileData);
      updateUser(updatedUser);
      setProfileSuccess('Profile updated successfully!');
    } catch (err) {
      const apiFieldErrors = getFieldErrors(err);
      if (Object.keys(apiFieldErrors).length > 0) {
        setProfileFieldErrors(apiFieldErrors as FieldErrors<ProfileFormData>);
      } else {
        setProfileError(getErrorMessage(err));
      }
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsChangingPassword(true);
    setPasswordError('');
    setPasswordFieldErrors({});
    setPasswordSuccess('');

    // Client-side validation
    if (passwordData.new_password !== passwordData.new_password_confirm) {
      setPasswordFieldErrors({ new_password_confirm: 'Passwords do not match' });
      setIsChangingPassword(false);
      return;
    }

    try {
      const result = await authService.changePassword(passwordData);
      setPasswordSuccess(result.message);
      // Clear form
      setPasswordData({
        old_password: '',
        new_password: '',
        new_password_confirm: '',
      });
    } catch (err) {
      const apiFieldErrors = getFieldErrors(err);
      if (Object.keys(apiFieldErrors).length > 0) {
        setPasswordFieldErrors(apiFieldErrors as FieldErrors<PasswordFormData>);
      } else {
        setPasswordError(getErrorMessage(err));
      }
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Edit Profile</h1>
          <p className="text-gray-600 mt-2">Update your personal information and settings</p>
        </div>

        <div className="space-y-6">
          {/* Personal Information Form */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Personal Information</h2>

            <form onSubmit={handleProfileSubmit} className="space-y-6">
              {/* Success Message */}
              {profileSuccess && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm text-green-700">{profileSuccess}</span>
                </div>
              )}

              {/* Error Message */}
              {profileError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                  <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm text-red-700">{profileError}</span>
                </div>
              )}

              {/* Email (Read-only) */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email (cannot be changed)
                </label>
                <input
                  id="email"
                  type="email"
                  value={user.email}
                  disabled
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                />
              </div>

              {/* First Name */}
              <div>
                <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-2">
                  First Name
                </label>
                <input
                  id="first_name"
                  name="first_name"
                  type="text"
                  value={profileData.first_name}
                  onChange={handleProfileChange}
                  placeholder="Enter first name"
                  className={`w-full px-4 py-3 border ${
                    profileFieldErrors.first_name ? 'border-red-500' : 'border-gray-300'
                  } rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all`}
                  disabled={isUpdatingProfile}
                />
                {profileFieldErrors.first_name && (
                  <p className="mt-1 text-sm text-red-600">{profileFieldErrors.first_name}</p>
                )}
              </div>

              {/* Last Name */}
              <div>
                <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name
                </label>
                <input
                  id="last_name"
                  name="last_name"
                  type="text"
                  value={profileData.last_name}
                  onChange={handleProfileChange}
                  placeholder="Enter last name"
                  className={`w-full px-4 py-3 border ${
                    profileFieldErrors.last_name ? 'border-red-500' : 'border-gray-300'
                  } rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all`}
                  disabled={isUpdatingProfile}
                />
                {profileFieldErrors.last_name && (
                  <p className="mt-1 text-sm text-red-600">{profileFieldErrors.last_name}</p>
                )}
              </div>

              {/* Preferred Currency */}
              <div>
                <label htmlFor="preferred_currency" className="block text-sm font-medium text-gray-700 mb-2">
                  Preferred Currency
                </label>
                <select
                  id="preferred_currency"
                  name="preferred_currency"
                  value={profileData.preferred_currency}
                  onChange={handleProfileChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all bg-white"
                  disabled={isUpdatingProfile}
                >
                  <option value="BGN">BGN (Bulgarian Lev)</option>
                  <option value="EUR">EUR (Euro)</option>
                </select>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isUpdatingProfile}
                className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3 px-6 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isUpdatingProfile ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Updating...
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
            </form>
          </div>

          {/* Change Password Form */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Change Password</h2>

            <form onSubmit={handlePasswordSubmit} className="space-y-6">
              {/* Success Message */}
              {passwordSuccess && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm text-green-700">{passwordSuccess}</span>
                </div>
              )}

              {/* Error Message */}
              {passwordError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                  <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm text-red-700">{passwordError}</span>
                </div>
              )}

              {/* Old Password */}
              <div>
                <label htmlFor="old_password" className="block text-sm font-medium text-gray-700 mb-2">
                  Current Password
                </label>
                <input
                  id="old_password"
                  name="old_password"
                  type="password"
                  value={passwordData.old_password}
                  onChange={handlePasswordChange}
                  placeholder="Enter current password"
                  className={`w-full px-4 py-3 border ${
                    passwordFieldErrors.old_password ? 'border-red-500' : 'border-gray-300'
                  } rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all`}
                  disabled={isChangingPassword}
                  required
                />
                {passwordFieldErrors.old_password && (
                  <p className="mt-1 text-sm text-red-600">{passwordFieldErrors.old_password}</p>
                )}
              </div>

              {/* New Password */}
              <div>
                <label htmlFor="new_password" className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <input
                  id="new_password"
                  name="new_password"
                  type="password"
                  value={passwordData.new_password}
                  onChange={handlePasswordChange}
                  placeholder="Enter new password"
                  className={`w-full px-4 py-3 border ${
                    passwordFieldErrors.new_password ? 'border-red-500' : 'border-gray-300'
                  } rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all`}
                  disabled={isChangingPassword}
                  required
                />
                {passwordFieldErrors.new_password && (
                  <p className="mt-1 text-sm text-red-600">{passwordFieldErrors.new_password}</p>
                )}
              </div>

              {/* Confirm New Password */}
              <div>
                <label htmlFor="new_password_confirm" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm New Password
                </label>
                <input
                  id="new_password_confirm"
                  name="new_password_confirm"
                  type="password"
                  value={passwordData.new_password_confirm}
                  onChange={handlePasswordChange}
                  placeholder="Confirm new password"
                  className={`w-full px-4 py-3 border ${
                    passwordFieldErrors.new_password_confirm ? 'border-red-500' : 'border-gray-300'
                  } rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all`}
                  disabled={isChangingPassword}
                  required
                />
                {passwordFieldErrors.new_password_confirm && (
                  <p className="mt-1 text-sm text-red-600">{passwordFieldErrors.new_password_confirm}</p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isChangingPassword}
                className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3 px-6 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isChangingPassword ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Changing Password...
                  </>
                ) : (
                  'Change Password'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditProfile;
