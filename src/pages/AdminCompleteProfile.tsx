import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { toast } from 'react-hot-toast';
import { ProfilePhotoUpload } from '../components/ProfilePhotoUpload';
import { 
  UserIcon, 
  PhoneIcon, 
  CalendarIcon, 
  UserCircleIcon,
  CheckCircleIcon,
  ClockIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

export const AdminCompleteProfile: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const [adminProfile, setAdminProfile] = useState({
    firstName: '',
    lastName: '',
    contactNumber: '',
    age: '',
    birthdate: '',
    gender: '',
    position: '',
    department: '',
    profilePhotoUrl: null as string | null,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!adminProfile.firstName || !adminProfile.lastName) {
      toast.error('First name and last name are required');
      return;
    }

    if (!adminProfile.contactNumber) {
      toast.error('Contact number is required');
      return;
    }

    if (!adminProfile.age || !adminProfile.birthdate) {
      toast.error('Age and birthdate are required');
      return;
    }

    if (!adminProfile.gender) {
      toast.error('Gender is required');
      return;
    }

    if (!adminProfile.position) {
      toast.error('Position/Title is required');
      return;
    }

    if (!adminProfile.profilePhotoUrl) {
      toast.error('Profile photo is required');
      return;
    }

    setIsLoading(true);

    try {
      const profileData = {
        ...adminProfile,
        age: parseInt(adminProfile.age)
      };

      await api.post('/admin/complete-profile', profileData);
      
      toast.success('Profile completed successfully! Please wait for approval from an existing admin.');
      
      // Redirect to a waiting page or dashboard
      navigate('/admin/pending-approval');
      
    } catch (error: any) {
      console.error('Profile completion error:', error);
      toast.error(error.response?.data?.message || 'Failed to complete profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhotoUpdate = (photoUrl: string) => {
    setAdminProfile(prev => ({ ...prev, profilePhotoUrl: photoUrl }));
  };

  const handlePhotoUpload = async (file: File): Promise<{ photoUrl: string }> => {
    try {
      const formData = new FormData();
      formData.append('profilePhoto', file);

      const response = await api.post('/upload/profile-photo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return { photoUrl: response.data.photoUrl };
    } catch (error) {
      console.error('Photo upload error:', error);
      throw new Error('Failed to upload photo');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow rounded-lg">
          {/* Header */}
          <div className="px-6 py-8 border-b border-gray-200">
            <div className="text-center">
              <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-100">
                <UserCircleIcon className="h-8 w-8 text-blue-600" />
              </div>
              <h2 className="mt-4 text-2xl font-bold text-gray-900">
                Complete Your Admin Profile
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Please provide your information to complete the admin registration process.
              </p>
            </div>
          </div>

          {/* Profile Requirement Notice */}
          <div className="px-6 py-4 bg-red-50 border-b border-red-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <InformationCircleIcon className="h-5 w-5 text-red-500" />
                <div>
                  <p className="text-sm font-medium text-red-900">Profile Completion Required</p>
                  <p className="text-xs text-red-700">
                    <strong>Admin accounts cannot be approved without a complete profile.</strong> All fields below are mandatory for admin approval. This includes personal information, professional details, and a profile photo.
                  </p>
                </div>
              </div>
              <Link
                to="/"
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Back to Home
              </Link>
            </div>
          </div>

          {/* Status Info */}
          <div className="px-6 py-4 bg-blue-50 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <ClockIcon className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium text-blue-900">Approval Process</p>
                <p className="text-xs text-blue-700">
                  After completing your profile, an existing admin will review and approve your account. 
                  You'll be notified via email once approved or if additional information is needed.
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-6 py-8 space-y-6">
            {/* Profile Photo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Profile Photo *
              </label>
              <ProfilePhotoUpload
                currentPhotoUrl={adminProfile.profilePhotoUrl}
                onPhotoUpdate={handlePhotoUpdate}
                onUpload={handlePhotoUpload}
              />
              <p className="mt-1 text-xs text-gray-500">
                A professional profile photo is required for admin accounts.
              </p>
            </div>

            {/* Personal Information */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                  First Name *
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UserIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="firstName"
                    required
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Your first name"
                    value={adminProfile.firstName}
                    onChange={(e) => setAdminProfile(prev => ({ ...prev, firstName: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                  Last Name *
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UserIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="lastName"
                    required
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Your last name"
                    value={adminProfile.lastName}
                    onChange={(e) => setAdminProfile(prev => ({ ...prev, lastName: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="contactNumber" className="block text-sm font-medium text-gray-700">
                  Contact Number *
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <PhoneIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="tel"
                    id="contactNumber"
                    required
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    placeholder="09XX-XXX-XXXX"
                    value={adminProfile.contactNumber}
                    onChange={(e) => setAdminProfile(prev => ({ ...prev, contactNumber: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="age" className="block text-sm font-medium text-gray-700">
                  Age *
                </label>
                <input
                  type="number"
                  id="age"
                  required
                  min="18"
                  max="70"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="25"
                  value={adminProfile.age}
                  onChange={(e) => setAdminProfile(prev => ({ ...prev, age: e.target.value }))}
                />
              </div>
            </div>

            {/* Personal Details */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="birthdate" className="block text-sm font-medium text-gray-700">
                  Birthdate *
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <CalendarIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="date"
                    id="birthdate"
                    required
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    value={adminProfile.birthdate}
                    onChange={(e) => setAdminProfile(prev => ({ ...prev, birthdate: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="gender" className="block text-sm font-medium text-gray-700">
                  Gender *
                </label>
                <select
                  id="gender"
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  value={adminProfile.gender}
                  onChange={(e) => setAdminProfile(prev => ({ ...prev, gender: e.target.value }))}
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            {/* Professional Information */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="position" className="block text-sm font-medium text-gray-700">
                  Position/Title *
                </label>
                <input
                  type="text"
                  id="position"
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="e.g., IT Administrator, HR Manager"
                  value={adminProfile.position}
                  onChange={(e) => setAdminProfile(prev => ({ ...prev, position: e.target.value }))}
                />
              </div>

              <div>
                <label htmlFor="department" className="block text-sm font-medium text-gray-700">
                  Department
                </label>
                <input
                  type="text"
                  id="department"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="e.g., Information Technology, Human Resources"
                  value={adminProfile.department}
                  onChange={(e) => setAdminProfile(prev => ({ ...prev, department: e.target.value }))}
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-6">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Completing Profile...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <CheckCircleIcon className="h-5 w-5 mr-2" />
                    Complete Profile & Submit for Approval
                  </div>
                )}
              </button>
            </div>

            <div className="text-center">
              <p className="text-xs text-gray-500">
                * Required fields must be filled out before submission
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
