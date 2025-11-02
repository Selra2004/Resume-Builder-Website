import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ClockIcon, 
  CheckCircleIcon,
  ExclamationTriangleIcon,
  UserCircleIcon,
  AcademicCapIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';
import { api } from '../services/api';

interface CoordinatorProfile {
  first_name?: string;
  last_name?: string;
  designated_course?: string;
  is_profile_complete?: boolean;
}

export const CoordinatorPendingApproval: React.FC = () => {
  const [profileData, setProfileData] = useState<CoordinatorProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfileStatus = async () => {
      try {
        const response = await api.get('/coordinators/profile');
        setProfileData(response.data);
      } catch (error) {
        console.error('Failed to fetch profile status:', error);
        // If profile doesn't exist, assume it's not complete
        setProfileData({ is_profile_complete: false });
      } finally {
        setLoading(false);
      }
    };

    fetchProfileStatus();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white shadow rounded-lg p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
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
                    <strong>Your coordinator account cannot be approved until you complete your profile.</strong>
                  </p>
                  <p className="mt-1">
                    Please fill out all required information including your personal details, course designation, and profile photo to be eligible for admin approval.
                  </p>
                </div>
                <div className="mt-4 space-x-3">
                  <Link
                    to="/coordinator/complete-profile"
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
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <AcademicCapIcon className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <div className="ml-4">
                <h1 className="text-xl font-semibold text-gray-900">
                  Coordinator Account Status
                </h1>
                <p className="text-sm text-gray-600">
                  Course Coordination Application
                </p>
              </div>
            </div>
          </div>

          {/* Status Content */}
          <div className="px-6 py-6">
            {isProfileComplete ? (
              <div className="text-center">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ClockIcon className="w-8 h-8 text-yellow-600" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                  Pending Admin Approval
                </h2>
                <p className="text-gray-600 mb-6">
                  Your coordinator profile has been submitted successfully and is awaiting approval from an administrator.
                </p>
                
                {/* Profile Summary */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Your Profile Summary:</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center">
                      <UserCircleIcon className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-gray-600">Name:</span>
                      <span className="ml-2 font-medium">
                        {profileData?.first_name} {profileData?.last_name}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <AcademicCapIcon className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-gray-600">Designated Course:</span>
                      <span className="ml-2 font-medium">
                        {profileData?.designated_course}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />
                      <span className="text-green-600 font-medium">Profile Complete</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ExclamationTriangleIcon className="w-8 h-8 text-red-600" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                  Profile Incomplete
                </h2>
                <p className="text-gray-600 mb-6">
                  Please complete your coordinator profile to proceed with the approval process.
                </p>
              </div>
            )}

            {/* Approval Process Steps */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Approval Process</h3>
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <CheckCircleIcon className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">Email Verification</p>
                    <p className="text-sm text-gray-600">Your email has been verified successfully.</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      isProfileComplete 
                        ? 'bg-green-500' 
                        : 'bg-gray-300'
                    }`}>
                      <CheckCircleIcon className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">Profile Completion</p>
                    <p className="text-sm text-gray-600">
                      {isProfileComplete 
                        ? 'Your profile has been completed successfully.'
                        : 'Complete your personal information and course designation.'
                      }
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      isProfileComplete 
                        ? 'bg-yellow-500' 
                        : 'bg-gray-300'
                    }`}>
                      <ClockIcon className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">Admin Review</p>
                    <p className="text-sm text-gray-600">
                      {isProfileComplete 
                        ? 'An administrator will review your application and approve your account.'
                        : 'Waiting for profile completion.'
                      }
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                      <EnvelopeIcon className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">Email Notification</p>
                    <p className="text-sm text-gray-600">
                      You'll receive an email notification once your account is approved or if additional information is needed.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="border-t border-gray-200 pt-6 mt-6">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <EnvelopeIcon className="h-5 w-5 text-blue-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">
                      Need Help?
                    </h3>
                    <p className="mt-1 text-sm text-blue-700">
                      If you have questions about the approval process or need assistance, please contact the ACC administration team.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
