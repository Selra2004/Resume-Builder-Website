import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { ProfilePhotoUpload } from '../components/ProfilePhotoUpload';
import { api } from '../services/api';
import { 
  UserCircleIcon, 
  ExclamationTriangleIcon,
  AcademicCapIcon,
  UserIcon,
  PhoneIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';

export const CoordinatorCompleteProfile: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [coordinatorProfile, setCoordinatorProfile] = useState({
    firstName: '',
    lastName: '',
    contactNumber: '',
    age: '',
    birthdate: '',
    gender: '',
    designatedCourse: '',
    profilePhotoUrl: null as string | null,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!coordinatorProfile.firstName || !coordinatorProfile.lastName) {
      toast.error('First name and last name are required');
      return;
    }

    if (!coordinatorProfile.contactNumber) {
      toast.error('Contact number is required');
      return;
    }

    if (!coordinatorProfile.age || !coordinatorProfile.birthdate) {
      toast.error('Age and birthdate are required');
      return;
    }

    if (!coordinatorProfile.gender) {
      toast.error('Gender is required');
      return;
    }

    if (!coordinatorProfile.designatedCourse) {
      toast.error('Designated course is required');
      return;
    }

    if (!coordinatorProfile.profilePhotoUrl) {
      toast.error('Profile photo is required');
      return;
    }

    setIsLoading(true);

    try {
      const profileData = {
        ...coordinatorProfile,
        age: parseInt(coordinatorProfile.age)
      };

      await api.post('/coordinators/complete-profile', profileData);
      
      toast.success('Profile completed successfully! Please wait for approval from an admin.');
      
      // Redirect to pending approval page
      navigate('/coordinator/pending-approval');
      
    } catch (error: any) {
      console.error('Profile completion error:', error);
      toast.error(error.response?.data?.message || 'Failed to complete profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhotoUpdate = (photoUrl: string) => {
    setCoordinatorProfile(prev => ({ ...prev, profilePhotoUrl: photoUrl }));
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
    } catch (error: any) {
      console.error('Photo upload error:', error);
      throw new Error(error.response?.data?.message || 'Failed to upload photo');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Warning Banner */}
        <div className="mb-6 bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="h-6 w-6 text-orange-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-orange-800">
                Profile Completion Required
              </h3>
              <div className="mt-2 text-sm text-orange-700">
                <p>
                  <strong>Your coordinator account cannot be approved until you complete your profile.</strong>
                </p>
                <p className="mt-1">
                  Please provide all required information including your personal details, course designation, and profile photo to be eligible for admin approval.
                </p>
              </div>
              <div className="mt-4">
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

        {/* Profile Completion Form */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <UserCircleIcon className="h-6 w-6 mr-2 text-blue-600" />
              Complete Your Coordinator Profile
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Fill out your profile information to get approved as a course coordinator.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6">
            {/* Profile Photo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Profile Photo *
              </label>
              <ProfilePhotoUpload
                currentPhotoUrl={coordinatorProfile.profilePhotoUrl}
                onPhotoUpdate={handlePhotoUpdate}
                onUpload={handlePhotoUpload}
                className="mb-4"
              />
            </div>

            {/* Personal Information */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <UserIcon className="h-5 w-5 mr-2 text-gray-500" />
                Personal Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                    First Name *
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    value={coordinatorProfile.firstName}
                    onChange={(e) => setCoordinatorProfile(prev => ({ ...prev, firstName: e.target.value }))}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    value={coordinatorProfile.lastName}
                    onChange={(e) => setCoordinatorProfile(prev => ({ ...prev, lastName: e.target.value }))}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="contactNumber" className="block text-sm font-medium text-gray-700">
                    <PhoneIcon className="h-4 w-4 inline mr-1" />
                    Contact Number *
                  </label>
                  <input
                    type="tel"
                    id="contactNumber"
                    value={coordinatorProfile.contactNumber}
                    onChange={(e) => setCoordinatorProfile(prev => ({ ...prev, contactNumber: e.target.value }))}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="09xxxxxxxxx"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="age" className="block text-sm font-medium text-gray-700">
                    Age *
                  </label>
                  <input
                    type="number"
                    id="age"
                    value={coordinatorProfile.age}
                    onChange={(e) => setCoordinatorProfile(prev => ({ ...prev, age: e.target.value }))}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    min="18"
                    max="120"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="birthdate" className="block text-sm font-medium text-gray-700">
                    <CalendarIcon className="h-4 w-4 inline mr-1" />
                    Birthdate *
                  </label>
                  <input
                    type="date"
                    id="birthdate"
                    value={coordinatorProfile.birthdate}
                    onChange={(e) => setCoordinatorProfile(prev => ({ ...prev, birthdate: e.target.value }))}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="gender" className="block text-sm font-medium text-gray-700">
                    Gender *
                  </label>
                  <select
                    id="gender"
                    value={coordinatorProfile.gender}
                    onChange={(e) => setCoordinatorProfile(prev => ({ ...prev, gender: e.target.value }))}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Course Information */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <AcademicCapIcon className="h-5 w-5 mr-2 text-gray-500" />
                Course Designation
              </h3>
              
              <div>
                <label htmlFor="designatedCourse" className="block text-sm font-medium text-gray-700">
                  Course You Will Represent *
                </label>
                <input
                  type="text"
                  id="designatedCourse"
                  value={coordinatorProfile.designatedCourse}
                  onChange={(e) => setCoordinatorProfile(prev => ({ ...prev, designatedCourse: e.target.value }))}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Information Technology, Computer Science, etc."
                  required
                />
                <p className="mt-2 text-sm text-gray-500">
                  Enter the course or program that you will be coordinating for OJT placements.
                </p>
              </div>
            </div>

            {/* Submit Button */}
            <div className="border-t border-gray-200 pt-6">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Completing Profile...
                  </div>
                ) : (
                  'Complete Profile & Submit for Approval'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
