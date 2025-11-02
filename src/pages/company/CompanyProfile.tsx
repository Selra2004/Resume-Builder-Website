import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { RatingDisplay } from '../../components/RatingDisplay';
import {
  BuildingOfficeIcon,
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  DocumentTextIcon,
  PencilIcon,
  UserGroupIcon,
  CalendarIcon,
  CheckBadgeIcon,
  StarIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';

interface CompanyProfile {
  id: number;
  email: string;
  company_name: string;
  profile_type: 'company' | 'business_owner';
  first_name?: string;
  last_name?: string;
  contact_number: string;
  company_address?: string;
  business_summary: string;
  profile_photo_url?: string;
  average_rating?: number;
  rating_count?: number;
  profile_completed: boolean;
  created_at: string;
  updated_at: string;
  
  // Coordinator information
  coordinator_id?: number;
  coordinator_name?: string;
  coordinator_email?: string;
  coordinator_contact?: string;
  coordinator_course?: string;
  affiliated_at?: string;
  invitation_code?: string;
}

interface JobApplication {
  id: number;
  user_id: number;
  job_id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  status: string;
  profile_photo?: string;
  job_title: string;
  job_location: string;
  work_type: string;
  created_at: string;
  user_rating_profile?: {
    overall_average_rating: number;
    total_ratings: number;
    highest_rating: number;
    lowest_rating: number;
    company_ratings_count: number;
    coordinator_ratings_count: number;
  };
}

export const CompanyProfile: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [recentApplicants, setRecentApplicants] = useState<JobApplication[]>([]);
  const [totalApplicants, setTotalApplicants] = useState(0);

  useEffect(() => {
    fetchProfile();
    fetchRecentApplicants();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await api.get('/companies/profile-detailed');
      setProfile(response.data);
    } catch (error: any) {
      console.error('Profile fetch error:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentApplicants = async () => {
    try {
      const response = await api.get('/companies/applications');
      const applications = response.data.applications || [];
      setRecentApplicants(applications.slice(0, 5)); // Show only recent 5
      setTotalApplicants(applications.length);
    } catch (error: any) {
      console.error('Failed to fetch applicants:', error);
      // Don't show error toast as this is not critical
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <BuildingOfficeIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Profile not found</h3>
          <p className="mt-1 text-sm text-gray-500">Please complete your profile first</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900">Company Profile</h1>
              <Link
                to="/company/profile/edit"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
              >
                <PencilIcon className="h-4 w-4 mr-2" />
                Edit Profile
              </Link>
            </div>
          </div>

          {/* Profile Header */}
          <div className="px-6 py-6">
            <div className="flex items-start space-x-6">
              <div className="flex-shrink-0">
                {profile.profile_photo_url ? (
                  <img
                    className="h-24 w-24 rounded-full object-cover"
                    src={profile.profile_photo_url}
                    alt={profile.company_name}
                  />
                ) : (
                  <div className="h-24 w-24 rounded-full bg-gray-300 flex items-center justify-center">
                    {profile.profile_type === 'company' ? (
                      <BuildingOfficeIcon className="h-12 w-12 text-gray-600" />
                    ) : (
                      <UserIcon className="h-12 w-12 text-gray-600" />
                    )}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-3">
                  <h2 className="text-2xl font-bold text-gray-900 truncate">
                    {profile.company_name}
                  </h2>
                  {profile.profile_completed && (
                    <CheckBadgeIcon className="h-6 w-6 text-green-500" title="Profile Completed" />
                  )}
                </div>
                <div className="flex items-center mt-1 text-sm text-gray-500">
                  {profile.profile_type === 'company' ? (
                    <BuildingOfficeIcon className="h-4 w-4 mr-1" />
                  ) : (
                    <UserIcon className="h-4 w-4 mr-1" />
                  )}
                  <span className="capitalize">
                    {profile.profile_type === 'business_owner' ? 'Business Owner' : 'Company'}
                  </span>
                </div>
                {profile.first_name && profile.last_name && (
                  <p className="mt-1 text-sm text-gray-600">
                    Owner: {profile.first_name} {profile.last_name}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Profile Information */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Contact Information */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Contact Information</h3>
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500 flex items-center">
                    <EnvelopeIcon className="h-4 w-4 mr-2" />
                    Email Address
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">{profile.email}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500 flex items-center">
                    <PhoneIcon className="h-4 w-4 mr-2" />
                    Contact Number
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">{profile.contact_number}</dd>
                </div>
                {profile.company_address && (
                  <div className="sm:col-span-2">
                    <dt className="text-sm font-medium text-gray-500 flex items-center">
                      <MapPinIcon className="h-4 w-4 mr-2" />
                      Address
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">{profile.company_address}</dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Business Description */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                <DocumentTextIcon className="h-5 w-5 inline mr-2" />
                Business Description
              </h3>
              <div className="prose max-w-none">
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {profile.business_summary}
                </p>
              </div>
            </div>

            {/* Account Information */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Account Information</h3>
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Account Type</dt>
                  <dd className="mt-1 text-sm text-gray-900 capitalize">Company Account</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Profile Status</dt>
                  <dd className="mt-1">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      profile.profile_completed 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {profile.profile_completed ? 'Complete' : 'Incomplete'}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500 flex items-center">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    Member Since
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {new Date(profile.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {new Date(profile.updated_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Coordinator Information */}
            {profile.coordinator_name && (
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  <UserGroupIcon className="h-5 w-5 inline mr-2" />
                  Your Coordinator
                </h3>
                <div className="space-y-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Coordinator Name</dt>
                    <dd className="mt-1 text-sm text-gray-900 font-medium">{profile.coordinator_name}</dd>
                  </div>
                  {profile.coordinator_email && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Email</dt>
                      <dd className="mt-1 text-sm">
                        <a 
                          href={`mailto:${profile.coordinator_email}`}
                          className="text-green-600 hover:text-green-500"
                        >
                          {profile.coordinator_email}
                        </a>
                      </dd>
                    </div>
                  )}
                  {profile.coordinator_contact && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Contact</dt>
                      <dd className="mt-1 text-sm text-gray-900">{profile.coordinator_contact}</dd>
                    </div>
                  )}
                  {profile.coordinator_course && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Designated Course</dt>
                      <dd className="mt-1 text-sm text-gray-900">{profile.coordinator_course}</dd>
                    </div>
                  )}
                  {profile.affiliated_at && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Affiliated Since</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {new Date(profile.affiliated_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </dd>
                    </div>
                  )}
                  {profile.invitation_code && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Invitation Code Used</dt>
                      <dd className="mt-1 text-sm text-gray-900 font-mono bg-gray-100 px-2 py-1 rounded">
                        {profile.invitation_code}
                      </dd>
                    </div>
                  )}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    Your coordinator manages application approvals and helps coordinate job placements.
                  </p>
                </div>
              </div>
            )}

            {/* Company Ratings */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 px-6 py-4 border-b border-yellow-200">
                <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                  <StarIcon className="h-6 w-6 mr-3 text-yellow-500" />
                  My Ratings & Reviews
                </h3>
                <p className="mt-1 text-sm text-gray-600">
                  Ratings from users who have interacted with your company
                </p>
              </div>
              
              <div className="p-6">
                <RatingDisplay
                  entityId={profile.id}
                  entityType="company"
                  averageRating={profile.average_rating}
                  totalCount={profile.rating_count}
                  showDetails={true}
                />
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link
                  to="/company/jobs"
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
                >
                  View My Jobs
                </Link>
                <Link
                  to="/company/jobs/create"
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
                >
                  Post New Job
                </Link>
                <Link
                  to="/company/applications"
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
                >
                  View Applications
                </Link>
                <Link
                  to="/company/profile/edit"
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
                >
                  Edit Profile
                </Link>
              </div>
            </div>

            {/* Recent Applicants */}
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Applicants</h3>
                {totalApplicants > 5 && (
                  <Link
                    to="/company/applications"
                    className="text-sm text-green-600 hover:text-green-500 font-medium flex items-center"
                  >
                    View all ({totalApplicants})
                    <ChevronRightIcon className="h-4 w-4 ml-1" />
                  </Link>
                )}
              </div>
              
              {recentApplicants.length > 0 ? (
                <div className="space-y-3">
                  {recentApplicants.map((application) => (
                    <div key={application.id} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex-shrink-0">
                        {application.profile_photo ? (
                          <img
                            className="h-10 w-10 rounded-full object-cover"
                            src={application.profile_photo}
                            alt={`${application.first_name} ${application.last_name}`}
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <UserIcon className="h-6 w-6 text-gray-600" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {application.first_name} {application.last_name}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {application.job_title} • {application.work_type}
                        </p>
                        <div className="flex items-center mt-1">
                          {application.user_rating_profile?.overall_average_rating ? (
                            <div className="flex items-center space-x-1">
                              <StarIcon className="h-3 w-3 text-yellow-400 fill-current" />
                              <span className="text-xs text-gray-600">
                                {Number(application.user_rating_profile.overall_average_rating).toFixed(1)} ({application.user_rating_profile.total_ratings})
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-500">No ratings yet</span>
                          )}
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          application.status === 'qualified' ? 'bg-green-100 text-green-800' :
                          application.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          application.status === 'under_review' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {application.status}
                        </span>
                      </div>
                    </div>
                  ))}
                  
                  {totalApplicants > 5 && (
                    <div className="pt-3 border-t border-gray-200">
                      <Link
                        to="/company/applications"
                        className="block w-full text-center px-4 py-2 text-sm font-medium text-green-600 bg-green-50 rounded-md hover:bg-green-100 transition-colors"
                      >
                        View All Applicants ({totalApplicants})
                      </Link>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-6">
                  <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h4 className="mt-2 text-sm font-medium text-gray-900">No applicants yet</h4>
                  <p className="mt-1 text-sm text-gray-500">Applications will appear here once users apply to your jobs</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
