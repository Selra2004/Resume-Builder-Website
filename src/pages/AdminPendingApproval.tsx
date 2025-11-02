import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ClockIcon, 
  CheckCircleIcon, 
  EnvelopeIcon,
  ShieldCheckIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';

interface AdminProfile {
  is_profile_complete: boolean;
  first_name?: string;
  last_name?: string;
  position?: string;
  department?: string;
}

export const AdminPendingApproval: React.FC = () => {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfileStatus = async () => {
      try {
        const response = await api.get('/admin/profile');
        setProfileData(response.data);
      } catch (error) {
        console.error('Failed to fetch profile status:', error);
        // If profile doesn't exist, assume it's not complete
        setProfileData({ is_profile_complete: false });
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchProfileStatus();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white shadow rounded-lg p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading your profile status...</p>
          </div>
        </div>
      </div>
    );
  }

  const isProfileComplete = profileData?.is_profile_complete || false;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Profile Completion Warning */}
        {!isProfileComplete && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Profile Completion Required
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>
                    <strong>Your admin account cannot be approved until you complete your profile.</strong>
                  </p>
                  <p className="mt-1">
                    Please fill out all required information including your professional details and profile photo to be eligible for admin approval.
                  </p>
                </div>
                <div className="mt-4 space-x-3">
                  <Link
                    to="/admin/complete-profile"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    Complete Profile Now
                  </Link>
                  <Link
                    to="/"
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Back to Home
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white shadow rounded-lg">
          {/* Header */}
          <div className="px-6 py-8 text-center">
            <div className={`mx-auto h-16 w-16 flex items-center justify-center rounded-full ${
              isProfileComplete ? 'bg-yellow-100' : 'bg-orange-100'
            }`}>
              {isProfileComplete ? (
                <ClockIcon className="h-10 w-10 text-yellow-600" />
              ) : (
                <ExclamationTriangleIcon className="h-10 w-10 text-orange-600" />
              )}
            </div>
            <h2 className="mt-4 text-2xl font-bold text-gray-900">
              {isProfileComplete ? 'Profile Submitted Successfully!' : 'Profile Completion Required'}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {isProfileComplete 
                ? 'Your admin profile is now pending approval from an existing administrator.'
                : 'Complete your admin profile to be eligible for approval and access to the system.'
              }
            </p>
          </div>

          {/* Status Steps */}
          <div className="px-6 py-6 border-t border-gray-200">
            <div className="flow-root">
              <ul className="-mb-8">
                <li>
                  <div className="relative pb-8">
                    <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"></span>
                    <div className="relative flex space-x-3">
                      <div>
                        <span className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center ring-8 ring-white">
                          <CheckCircleIcon className="h-5 w-5 text-white" />
                        </span>
                      </div>
                      <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                        <div>
                          <p className="text-sm text-gray-500">Email verification</p>
                          <p className="text-xs text-gray-400">Account registered and email verified</p>
                        </div>
                        <div className="text-right text-xs text-gray-400 whitespace-nowrap">
                          Completed
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
                <li>
                  <div className="relative pb-8">
                    <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"></span>
                    <div className="relative flex space-x-3">
                      <div>
                        <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${
                          isProfileComplete ? 'bg-green-500' : 'bg-orange-500'
                        }`}>
                          {isProfileComplete ? (
                            <CheckCircleIcon className="h-5 w-5 text-white" />
                          ) : (
                            <ExclamationTriangleIcon className="h-5 w-5 text-white" />
                          )}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                        <div>
                          <p className="text-sm text-gray-500">Profile completion</p>
                          <p className="text-xs text-gray-400">
                            {isProfileComplete 
                              ? 'Professional profile completed'
                              : 'Complete your profile with personal and professional details'
                            }
                          </p>
                        </div>
                        <div className="text-right text-xs text-gray-400 whitespace-nowrap">
                          {isProfileComplete ? 'Completed' : 'Required'}
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
                <li>
                  <div className="relative pb-8">
                    <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"></span>
                    <div className="relative flex space-x-3">
                      <div>
                        <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${
                          isProfileComplete ? 'bg-yellow-500' : 'bg-gray-400'
                        }`}>
                          <ClockIcon className="h-5 w-5 text-white" />
                        </span>
                      </div>
                      <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                        <div>
                          <p className="text-sm text-gray-500">Admin review</p>
                          <p className="text-xs text-gray-400">
                            {isProfileComplete 
                              ? 'Waiting for existing admin approval'
                              : 'Pending profile completion'
                            }
                          </p>
                        </div>
                        <div className="text-right text-xs text-gray-400 whitespace-nowrap">
                          {isProfileComplete ? 'In Progress' : 'Waiting'}
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
                <li>
                  <div className="relative">
                    <div className="relative flex space-x-3">
                      <div>
                        <span className="h-8 w-8 rounded-full bg-gray-400 flex items-center justify-center ring-8 ring-white">
                          <ShieldCheckIcon className="h-5 w-5 text-white" />
                        </span>
                      </div>
                      <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                        <div>
                          <p className="text-sm text-gray-500">Account activation</p>
                          <p className="text-xs text-gray-400">Full admin access granted</p>
                        </div>
                        <div className="text-right text-xs text-gray-400 whitespace-nowrap">
                          Pending
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          {/* Information Cards */}
          <div className="px-6 py-6 space-y-4">
            {/* Email Notification Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <EnvelopeIcon className="h-5 w-5 text-blue-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">
                    Email Notifications
                  </h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <p>
                      You will receive an email notification once your admin account is:
                    </p>
                    <ul className="list-disc list-inside mt-1">
                      <li>Approved and activated</li>
                      <li>Rejected (with reason if provided)</li>
                      <li>Requires additional information</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* What's Next Info */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <InformationCircleIcon className="h-5 w-5 text-gray-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-gray-800">
                    What happens next?
                  </h3>
                  <div className="mt-2 text-sm text-gray-600">
                    <ul className="space-y-1">
                      <li>• An existing admin will review your profile and credentials</li>
                      <li>• The review process typically takes 1-3 business days</li>
                      <li>• Once approved, you'll have full admin access to the system</li>
                      <li>• You'll be able to approve other admins, coordinators, and companies</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="px-6 py-6 border-t border-gray-200 text-center space-y-3">
            {!isProfileComplete ? (
              <>
                <p className="text-sm text-red-600 font-medium">
                  🚫 Profile completion is required for admin approval
                </p>
                <p className="text-xs text-gray-600">
                  Your profile must include all personal and professional information to proceed.
                </p>
                <Link
                  to="/admin/complete-profile"
                  className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 shadow-lg"
                >
                  Complete Profile Now
                </Link>
              </>
            ) : (
              <>
                <p className="text-sm text-green-600 font-medium">
                  ✅ Profile completed - ready for admin review
                </p>
                <p className="text-xs text-gray-600">
                  Need to make changes to your profile?
                </p>
                <Link
                  to="/admin/complete-profile"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Edit Profile
                </Link>
              </>
            )}
            <div className="pt-4">
              <Link
                to="/"
                className="text-sm text-primary-600 hover:text-primary-500"
              >
                ← Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
