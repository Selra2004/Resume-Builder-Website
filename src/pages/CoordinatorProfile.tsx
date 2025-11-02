import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { ProfilePhotoUpload } from '../components/ProfilePhotoUpload';
import { RatingDisplay } from '../components/RatingDisplay';
import { api } from '../services/api';
import { 
  UserCircleIcon, 
  PencilIcon, 
  EnvelopeIcon,
  PhoneIcon,
  CalendarIcon,
  AcademicCapIcon,
  XMarkIcon,
  CheckIcon,
  CameraIcon,
  StarIcon
} from '@heroicons/react/24/outline';

interface CoordinatorProfileData {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
  contact_number?: string;
  age?: number;
  birthdate?: string;
  gender?: string;
  designated_course?: string;
  profile_photo?: string;
  average_rating?: number;
  rating_count?: number;
  is_profile_complete?: boolean;
}

export const CoordinatorProfile: React.FC = () => {
  const [profileData, setProfileData] = useState<CoordinatorProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    contactNumber: '',
    age: '',
    birthdate: '',
    gender: '',
    designatedCourse: '',
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/coordinators/profile');
      const data = response.data;
      setProfileData(data);
      
      // Populate edit form with current data
      setEditForm({
        firstName: data.first_name || '',
        lastName: data.last_name || '',
        contactNumber: data.contact_number || '',
        age: data.age?.toString() || '',
        birthdate: data.birthdate || '',
        gender: data.gender || '',
        designatedCourse: data.designated_course || '',
      });
    } catch (error: any) {
      console.error('Failed to fetch profile:', error);
      toast.error('Failed to load profile data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditToggle = () => {
    if (isEditing) {
      // Reset form when cancelling
      setEditForm({
        firstName: profileData?.first_name || '',
        lastName: profileData?.last_name || '',
        contactNumber: profileData?.contact_number || '',
        age: profileData?.age?.toString() || '',
        birthdate: profileData?.birthdate || '',
        gender: profileData?.gender || '',
        designatedCourse: profileData?.designated_course || '',
      });
    }
    setIsEditing(!isEditing);
  };

  const handleFormChange = (field: string, value: string) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveProfile = async () => {
    try {
      // Validation
      if (!editForm.firstName || !editForm.lastName) {
        toast.error('First name and last name are required');
        return;
      }

      if (!editForm.contactNumber) {
        toast.error('Contact number is required');
        return;
      }

      if (!editForm.age || !editForm.birthdate) {
        toast.error('Age and birthdate are required');
        return;
      }

      if (!editForm.gender) {
        toast.error('Gender is required');
        return;
      }

      if (!editForm.designatedCourse) {
        toast.error('Designated course is required');
        return;
      }

      const updateData = {
        firstName: editForm.firstName,
        lastName: editForm.lastName,
        contactNumber: editForm.contactNumber,
        age: parseInt(editForm.age),
        birthdate: editForm.birthdate,
        gender: editForm.gender,
        designatedCourse: editForm.designatedCourse,
        profilePhotoUrl: profileData?.profile_photo, // Include current photo URL
      };

      await api.put('/coordinators/profile', updateData);
      toast.success('Profile updated successfully');
      
      // Refresh profile data
      await fetchProfile();
      setIsEditing(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
      console.error('Error updating profile:', error);
    }
  };

  const handlePhotoUpdate = (photoUrl: string) => {
    if (profileData) {
      setProfileData(prev => ({
        ...prev!,
        profile_photo: photoUrl
      }));
    }
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white shadow rounded-lg p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading your profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white shadow rounded-lg p-8 text-center">
            <UserCircleIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Profile not found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Your coordinator profile could not be loaded.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {/* Header */}
          <div className="px-6 py-8 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">Coordinator Profile</h1>
                <p className="mt-1 text-blue-100">
                  Manage your coordinator information
                </p>
              </div>
              <div className="flex space-x-3">
                {isEditing ? (
                  <>
                    <button
                      onClick={handleEditToggle}
                      className="inline-flex items-center px-4 py-2 border border-white/20 rounded-md text-sm font-medium text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/25"
                    >
                      <XMarkIcon className="h-4 w-4 mr-2" />
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveProfile}
                      className="inline-flex items-center px-4 py-2 bg-white text-blue-600 rounded-md text-sm font-medium hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-white/25"
                    >
                      <CheckIcon className="h-4 w-4 mr-2" />
                      Save Changes
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleEditToggle}
                    className="inline-flex items-center px-4 py-2 bg-white text-blue-600 rounded-md text-sm font-medium hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-white/25"
                  >
                    <PencilIcon className="h-4 w-4 mr-2" />
                    Edit Profile
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="px-6 py-6 space-y-8">
            {/* Profile Photo Section */}
            <div className="border-b border-gray-200 pb-8">
              <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <CameraIcon className="h-5 w-5 mr-2 text-gray-500" />
                Profile Photo
              </h2>
              <div className="flex items-start space-x-6">
                <div className="flex-shrink-0">
                  {profileData.profile_photo ? (
                    <img
                      src={profileData.profile_photo}
                      alt="Profile"
                      className="h-24 w-24 rounded-full object-cover ring-4 ring-blue-100"
                    />
                  ) : (
                    <div className="h-24 w-24 rounded-full bg-gray-200 flex items-center justify-center ring-4 ring-gray-100">
                      <UserCircleIcon className="h-12 w-12 text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <ProfilePhotoUpload
                    currentPhotoUrl={profileData.profile_photo || null}
                    onPhotoUpdate={handlePhotoUpdate}
                    onUpload={handlePhotoUpload}
                    className="mb-0"
                  />
                  <p className="mt-2 text-sm text-gray-500">
                    Your profile photo helps identify you across the platform.
                  </p>
                </div>
              </div>
            </div>

            {/* Personal Information */}
            <div className="border-b border-gray-200 pb-8">
              <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <UserCircleIcon className="h-5 w-5 mr-2 text-gray-500" />
                Personal Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* First Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name *
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editForm.firstName}
                      onChange={(e) => handleFormChange('firstName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter your first name"
                    />
                  ) : (
                    <p className="text-sm text-gray-900 py-2">
                      {profileData.first_name || 'Not provided'}
                    </p>
                  )}
                </div>

                {/* Last Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name *
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editForm.lastName}
                      onChange={(e) => handleFormChange('lastName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter your last name"
                    />
                  ) : (
                    <p className="text-sm text-gray-900 py-2">
                      {profileData.last_name || 'Not provided'}
                    </p>
                  )}
                </div>

                {/* Contact Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <PhoneIcon className="h-4 w-4 inline mr-1" />
                    Contact Number *
                  </label>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={editForm.contactNumber}
                      onChange={(e) => handleFormChange('contactNumber', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="09xxxxxxxxx"
                    />
                  ) : (
                    <p className="text-sm text-gray-900 py-2">
                      {profileData.contact_number || 'Not provided'}
                    </p>
                  )}
                </div>

                {/* Age */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Age *
                  </label>
                  {isEditing ? (
                    <input
                      type="number"
                      value={editForm.age}
                      onChange={(e) => handleFormChange('age', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      min="18"
                      max="120"
                      placeholder="Enter your age"
                    />
                  ) : (
                    <p className="text-sm text-gray-900 py-2">
                      {profileData.age || 'Not provided'}
                    </p>
                  )}
                </div>

                {/* Birthdate */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <CalendarIcon className="h-4 w-4 inline mr-1" />
                    Birthdate *
                  </label>
                  {isEditing ? (
                    <input
                      type="date"
                      value={editForm.birthdate}
                      onChange={(e) => handleFormChange('birthdate', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  ) : (
                    <p className="text-sm text-gray-900 py-2">
                      {profileData.birthdate ? new Date(profileData.birthdate).toLocaleDateString() : 'Not provided'}
                    </p>
                  )}
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gender *
                  </label>
                  {isEditing ? (
                    <select
                      value={editForm.gender}
                      onChange={(e) => handleFormChange('gender', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  ) : (
                    <p className="text-sm text-gray-900 py-2 capitalize">
                      {profileData.gender || 'Not provided'}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Course Information */}
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <AcademicCapIcon className="h-5 w-5 mr-2 text-gray-500" />
                Course Information
              </h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Designated Course *
                </label>
                {isEditing ? (
                  <div>
                    <input
                      type="text"
                      value={editForm.designatedCourse}
                      onChange={(e) => handleFormChange('designatedCourse', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., Bachelor of Science in Information Technology"
                    />
                    <p className="mt-2 text-sm text-gray-500">
                      Enter the course or program that you coordinate for OJT placements.
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-900 py-2">
                    {profileData.designated_course || 'Not specified'}
                  </p>
                )}
              </div>
            </div>

            {/* Account Information */}
            <div className="border-t border-gray-200 pt-8">
              <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <EnvelopeIcon className="h-5 w-5 mr-2 text-gray-500" />
                Account Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <p className="text-sm text-gray-900 py-2">
                    {profileData.email}
                  </p>
                  <p className="text-xs text-gray-500">
                    Contact support to change your email address.
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Account Role
                  </label>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Course Coordinator
                  </span>
                </div>
              </div>
            </div>

            {/* Rating Information */}
            <div className="border-t border-gray-200 pt-8">
              <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 px-6 py-4 border-b border-purple-200">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                    <StarIcon className="h-6 w-6 mr-3 text-purple-500" />
                    My Ratings & Reviews
                  </h2>
                  <p className="mt-1 text-sm text-gray-600">
                    Ratings from users who have interacted with you through job posts or the team page
                  </p>
                </div>
                
                <div className="p-6">
                  <RatingDisplay
                    entityId={profileData.id}
                    entityType="coordinator"
                    averageRating={profileData.average_rating}
                    totalCount={profileData.rating_count}
                    showDetails={true}
                  />
                </div>
              </div>
            </div>

            {/* Profile Completion Status */}
            {!profileData.is_profile_complete && (
              <div className="border-t border-gray-200 pt-8">
                <div className="bg-orange-50 border border-orange-200 rounded-md p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <UserCircleIcon className="h-5 w-5 text-orange-400" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-orange-800">
                        Profile Incomplete
                      </h3>
                      <div className="mt-2 text-sm text-orange-700">
                        <p>
                          Please complete all required fields to activate your coordinator account.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
