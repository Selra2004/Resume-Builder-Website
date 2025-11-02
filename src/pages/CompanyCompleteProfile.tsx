import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { toast } from 'react-hot-toast';
import { ProfilePhotoUpload } from '../components/ProfilePhotoUpload';
import {
  BuildingOfficeIcon,
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  DocumentTextIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

interface CompanyProfileData {
  profileType: 'company' | 'business_owner';
  firstName: string;
  lastName: string;
  companyName: string;
  email: string;
  contactNumber: string;
  companyAddress: string;
  businessSummary: string;
  profilePhotoUrl: string | null;
}

export const CompanyCompleteProfile: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState<CompanyProfileData>({
    profileType: 'company',
    firstName: '',
    lastName: '',
    companyName: '',
    email: user?.email || '',
    contactNumber: '',
    companyAddress: '',
    businessSummary: '',
    profilePhotoUrl: null
  });

  useEffect(() => {
    // Check if profile is already completed
    checkProfileStatus();
  }, []);

  const checkProfileStatus = async () => {
    try {
      const response = await api.get('/companies/profile');
      if (response.data.profile_completed) {
        navigate('/company/dashboard');
      }
    } catch (error) {
      // Profile doesn't exist yet, which is expected
      console.log('No existing profile found');
    }
  };

  const handleInputChange = (field: keyof CompanyProfileData, value: string) => {
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

    setLoading(true);

    try {
      // Send as FormData (without photo since it's uploaded separately)
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

      toast.success('Profile completed successfully!');
      navigate('/company/dashboard');
    } catch (error: any) {
      console.error('Profile completion error:', error);
      toast.error(error.response?.data?.message || 'Failed to complete profile');
    } finally {
      setLoading(false);
    }
  };

  const getPhotoLabel = () => {
    return profileData.profileType === 'company' 
      ? 'Company Logo' 
      : 'Profile Picture or Business Logo';
  };

  const getPhotoNote = () => {
    return profileData.profileType === 'company'
      ? 'Upload your company logo to represent your brand'
      : 'Upload your profile picture or business logo';
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-2xl">
        <div className="text-center">
          <BuildingOfficeIcon className="mx-auto h-12 w-12 text-green-600" />
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Complete Your Business Profile
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Help us understand your business better to connect you with the right talent
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-2xl">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Profile Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Profile Type *
                </label>
                <div className="flex space-x-4">
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
                <p className="text-xs text-gray-500 mb-3">{getPhotoNote()}</p>
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
                    placeholder={`Enter your ${profileData.profileType === 'company' ? 'company' : 'business'} name`}
                  />
                </div>
              </div>

              {/* Email (Read-only) */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <div className="mt-1 relative">
                  <EnvelopeIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={profileData.email}
                    readOnly
                    className="pl-10 appearance-none relative block w-full px-3 py-2 border border-gray-300 bg-gray-50 text-gray-500 rounded-md focus:outline-none sm:text-sm"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">This is your registered email address</p>
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
                    placeholder="Your contact number"
                  />
                </div>
              </div>

              {/* Company Address */}
              <div>
                <label htmlFor="companyAddress" className="block text-sm font-medium text-gray-700">
                  {profileData.profileType === 'company' ? 'Company Address' : 'Business Address'} (Optional)
                </label>
                <div className="mt-1 relative">
                  <MapPinIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <textarea
                    id="companyAddress"
                    name="companyAddress"
                    rows={3}
                    value={profileData.companyAddress}
                    onChange={(e) => handleInputChange('companyAddress', e.target.value)}
                    className="pl-10 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
                    placeholder={`Enter your ${profileData.profileType === 'company' ? 'company' : 'business'} address`}
                  />
                </div>
              </div>

              {/* Business Description */}
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
                    placeholder="Describe your business, services, and what makes you unique..."
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  This helps students understand your business and job opportunities
                </p>
              </div>

              {/* Submit Button */}
              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Completing Profile...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <CheckCircleIcon className="h-5 w-5 mr-2" />
                      Complete Profile
                    </div>
                  )}
                </button>
              </div>

              <div className="text-center">
                <p className="text-xs text-gray-500">
                  * Required fields must be filled to complete your profile
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
