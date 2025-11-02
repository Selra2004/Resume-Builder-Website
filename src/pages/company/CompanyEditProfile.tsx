import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { toast } from 'react-hot-toast';
import { ProfilePhotoUpload } from '../../components/ProfilePhotoUpload';
import {
  BuildingOfficeIcon,
  UserIcon,
  ArrowLeftIcon,
  PhoneIcon,
  MapPinIcon,
  DocumentTextIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

interface ProfileData {
  profileType: 'company' | 'business_owner';
  firstName: string;
  lastName: string;
  companyName: string;
  contactNumber: string;
  companyAddress: string;
  businessSummary: string;
  profilePhotoUrl: string | null;
}

export const CompanyEditProfile: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData>({
    profileType: 'company',
    firstName: '',
    lastName: '',
    companyName: '',
    contactNumber: '',
    companyAddress: '',
    businessSummary: '',
    profilePhotoUrl: null
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await api.get('/companies/profile-detailed');
      const profile = response.data;
      
      setProfileData({
        profileType: profile.profile_type || 'company',
        firstName: profile.first_name || '',
        lastName: profile.last_name || '',
        companyName: profile.company_name || '',
        contactNumber: profile.contact_number || '',
        companyAddress: profile.company_address || '',
        businessSummary: profile.business_summary || '',
        profilePhotoUrl: profile.profile_photo_url || null
      });
    } catch (error: any) {
      console.error('Failed to fetch profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof ProfileData, value: string) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePhotoUpdate = (photoUrl: string) => {
    setProfileData(prev => ({
      ...prev,
      profilePhotoUrl: photoUrl
    }));
  };

  const handlePhotoUpload = async (file: File): Promise<{ photoUrl: string }> => {
    const formData = new FormData();
    formData.append('profilePhoto', file);
    
    const response = await api.post('/companies/upload-photo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return { photoUrl: response.data.photoUrl };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!profileData.companyName.trim()) {
      toast.error('Company/Business name is required');
      return;
    }
    
    if (!profileData.businessSummary.trim()) {
      toast.error('Business description is required');
      return;
    }
    
    if (!profileData.contactNumber.trim()) {
      toast.error('Contact number is required');
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('profileType', profileData.profileType);
      formData.append('firstName', profileData.firstName);
      formData.append('lastName', profileData.lastName);
      formData.append('companyName', profileData.companyName);
      formData.append('contactNumber', profileData.contactNumber);
      formData.append('companyAddress', profileData.companyAddress);
      formData.append('businessSummary', profileData.businessSummary);

      await api.post('/companies/complete-profile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.success('Profile updated successfully!');
      navigate('/company/profile');
    } catch (error: any) {
      console.error('Profile update error:', error);
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setSubmitting(false);
    }
  };

  const getPhotoLabel = () => {
    return profileData.profileType === 'company' 
      ? 'Company Logo' 
      : 'Profile Picture or Business Logo';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/company/profile')}
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Back to Profile
          </button>
          
          <div className="flex items-center">
            <BuildingOfficeIcon className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Edit Profile</h1>
              <p className="mt-1 text-sm text-gray-600">
                Update your company or business information
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="bg-white shadow rounded-lg p-6 space-y-6">
            
            {/* Profile Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Account Type *
              </label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="profileType"
                    value="company"
                    checked={profileData.profileType === 'company'}
                    onChange={(e) => handleInputChange('profileType', e.target.value)}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                  />
                  <BuildingOfficeIcon className="ml-2 h-5 w-5 text-gray-400" />
                  <span className="ml-2 text-sm text-gray-900">Company</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="profileType"
                    value="business_owner"
                    checked={profileData.profileType === 'business_owner'}
                    onChange={(e) => handleInputChange('profileType', e.target.value)}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                  />
                  <UserIcon className="ml-2 h-5 w-5 text-gray-400" />
                  <span className="ml-2 text-sm text-gray-900">Business Owner</span>
                </label>
              </div>
            </div>

            {/* Profile Photo Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {getPhotoLabel()}
              </label>
              <ProfilePhotoUpload
                currentPhotoUrl={profileData.profilePhotoUrl}
                onPhotoUpdate={handlePhotoUpdate}
                onUpload={handlePhotoUpload}
              />
            </div>

            {/* Business Owner Name (Optional) */}
            {profileData.profileType === 'business_owner' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                    First Name (Optional)
                  </label>
                  <div className="mt-1 relative">
                    <UserIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <input
                      id="firstName"
                      name="firstName"
                      type="text"
                      value={profileData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      className="pl-10 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
                      placeholder="Your first name"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                    Last Name (Optional)
                  </label>
                  <div className="mt-1 relative">
                    <UserIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <input
                      id="lastName"
                      name="lastName"
                      type="text"
                      value={profileData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      className="pl-10 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
                      placeholder="Your last name"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Company/Business Name */}
            <div>
              <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">
                {profileData.profileType === 'company' ? 'Company Name' : 'Business Name'} *
              </label>
              <div className="mt-1 relative">
                <BuildingOfficeIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  id="companyName"
                  name="companyName"
                  type="text"
                  required
                  value={profileData.companyName}
                  onChange={(e) => handleInputChange('companyName', e.target.value)}
                  className="pl-10 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
                  placeholder={profileData.profileType === 'company' ? 'Enter company name' : 'Enter business name'}
                />
              </div>
            </div>

            {/* Contact Number */}
            <div>
              <label htmlFor="contactNumber" className="block text-sm font-medium text-gray-700">
                Contact Number *
              </label>
              <div className="mt-1 relative">
                <PhoneIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  id="contactNumber"
                  name="contactNumber"
                  type="tel"
                  required
                  value={profileData.contactNumber}
                  onChange={(e) => handleInputChange('contactNumber', e.target.value)}
                  className="pl-10 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
                  placeholder="Enter contact number"
                />
              </div>
            </div>

            {/* Company Address */}
            <div>
              <label htmlFor="companyAddress" className="block text-sm font-medium text-gray-700">
                Business Address (Optional)
              </label>
              <div className="mt-1 relative">
                <MapPinIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  id="companyAddress"
                  name="companyAddress"
                  type="text"
                  value={profileData.companyAddress}
                  onChange={(e) => handleInputChange('companyAddress', e.target.value)}
                  className="pl-10 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
                  placeholder="Enter business address"
                />
              </div>
            </div>

            {/* Business Summary */}
            <div>
              <label htmlFor="businessSummary" className="block text-sm font-medium text-gray-700">
                Business Description *
              </label>
              <div className="mt-1 relative">
                <DocumentTextIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <textarea
                  id="businessSummary"
                  name="businessSummary"
                  rows={4}
                  required
                  value={profileData.businessSummary}
                  onChange={(e) => handleInputChange('businessSummary', e.target.value)}
                  className="pl-10 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
                  placeholder="Describe your company or business..."
                />
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex items-center justify-end space-x-4 pt-4 border-t">
              <button
                type="button"
                onClick={() => navigate('/company/profile')}
                disabled={submitting}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="h-5 w-5 mr-2" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

