import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';
import {
  BuildingOfficeIcon,
  UserGroupIcon,
  BriefcaseIcon,
  EnvelopeIcon,
  PhoneIcon,
  PlusIcon,
  EyeIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationCircleIcon
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
  coordinator_name?: string;
  coordinator_email?: string;
  coordinator_contact?: string;
  affiliated_at?: string;
}

interface DashboardStats {
  total_jobs: number;
  active_jobs: number;
  expired_jobs?: number;
  total_applications: number;
  pending_applications: number;
  qualified_applications: number;
  accepted_applications: number;
  rejected_applications: number;
  on_hold_applications: number;
}

export const CompanyDashboard: React.FC = () => {
  const {} = useAuth();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentJobs, setRecentJobs] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch profile with coordinator info
      const [profileRes, statsRes, jobsRes] = await Promise.all([
        api.get('/companies/profile'),
        api.get('/companies/dashboard-stats'),
        api.get('/companies/recent-jobs')
      ]);

      setProfile(profileRes.data);
      setStats(statsRes.data);
      setRecentJobs(jobsRes.data);
    } catch (error: any) {
      console.error('Dashboard data fetch error:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
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
          <h3 className="mt-2 text-sm font-medium text-gray-900">No profile found</h3>
          <p className="mt-1 text-sm text-gray-500">Please complete your profile first</p>
          <div className="mt-6">
            <Link
              to="/company/complete-profile"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
            >
              Complete Profile
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {profile.profile_photo_url ? (
                <img
                  className="h-16 w-16 rounded-full object-cover"
                  src={profile.profile_photo_url}
                  alt={profile.company_name}
                />
              ) : (
                <div className="h-16 w-16 rounded-full bg-gray-300 flex items-center justify-center">
                  <BuildingOfficeIcon className="h-8 w-8 text-gray-600" />
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Welcome back, {profile.company_name}! 👋
                </h1>
                <p className="text-sm text-gray-600">
                  {profile.profile_type === 'business_owner' ? 'Business Owner' : 'Company'} Dashboard
                </p>
                {profile.coordinator_name && (
                  <p className="text-sm text-green-600 font-medium">
                    Affiliated with Coordinator: {profile.coordinator_name}
                  </p>
                )}
              </div>
            </div>
            <div className="flex space-x-3">
              <Link
                to="/company/profile"
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <EyeIcon className="h-4 w-4 mr-2" />
                View Profile
              </Link>
              <Link
                to="/company/jobs/create"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Post New Job
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <BriefcaseIcon className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Jobs</dt>
                      <dd className="text-lg font-medium text-gray-900">{stats.total_jobs}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <CheckCircleIcon className="h-6 w-6 text-green-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Active Jobs</dt>
                      <dd className="text-lg font-medium text-gray-900">{stats.active_jobs}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <UserGroupIcon className="h-6 w-6 text-blue-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Applications</dt>
                      <dd className="text-lg font-medium text-gray-900">{stats.total_applications}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <ClockIcon className="h-6 w-6 text-yellow-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Qualified Applications</dt>
                      <dd className="text-lg font-medium text-gray-900">{stats.qualified_applications}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Expired Jobs Alert */}
        {stats && stats.expired_jobs && stats.expired_jobs > 0 && (
          <div className="mb-6 bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-start">
              <ExclamationCircleIcon className="h-6 w-6 text-orange-500 mt-0.5 mr-3" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-orange-800">
                  Jobs Past Deadline
                </h3>
                <div className="mt-2 text-sm text-orange-700">
                  <p>
                    You have {stats.expired_jobs} job{stats.expired_jobs !== 1 ? 's' : ''} that {stats.expired_jobs !== 1 ? 'have' : 'has'} passed the application deadline.
                    These jobs are no longer visible to applicants.
                  </p>
                  <p className="mt-1">
                    <Link
                      to="/company/jobs?status=expired"
                      className="font-medium text-orange-800 underline hover:text-orange-600"
                    >
                      View expired jobs
                    </Link>{' '}
                    to renew deadlines or delete them.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Application Status Summary */}
        {stats && (
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-lg leading-6 font-medium text-gray-900 mb-4">Application Status Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Link
                to="/company/applications/pending"
                className="group p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all"
              >
                <div className="flex items-center">
                  <ClockIcon className="h-8 w-8 text-blue-500" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-500">Pending Review</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.pending_applications}</p>
                  </div>
                </div>
              </Link>

              <Link
                to="/company/applications/accepted"
                className="group p-4 border border-gray-200 rounded-lg hover:border-green-300 hover:shadow-md transition-all"
              >
                <div className="flex items-center">
                  <CheckCircleIcon className="h-8 w-8 text-green-500" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-500">Accepted</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.accepted_applications}</p>
                  </div>
                </div>
              </Link>

              <Link
                to="/company/applications/rejected"
                className="group p-4 border border-gray-200 rounded-lg hover:border-red-300 hover:shadow-md transition-all"
              >
                <div className="flex items-center">
                  <XCircleIcon className="h-8 w-8 text-red-500" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-500">Rejected</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.rejected_applications}</p>
                  </div>
                </div>
              </Link>

              <Link
                to="/company/applications/on-hold"
                className="group p-4 border border-gray-200 rounded-lg hover:border-yellow-300 hover:shadow-md transition-all"
              >
                <div className="flex items-center">
                  <ExclamationCircleIcon className="h-8 w-8 text-yellow-500" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-500">On Hold</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.on_hold_applications}</p>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coordinator Info */}
          {profile.coordinator_name && (
            <div className="lg:col-span-1">
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Your Coordinator</h3>
                <div className="space-y-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <UserGroupIcon className="h-5 w-5 mr-2" />
                    <span>{profile.coordinator_name}</span>
                  </div>
                  {profile.coordinator_email && (
                    <div className="flex items-center text-sm text-gray-600">
                      <EnvelopeIcon className="h-5 w-5 mr-2" />
                      <a href={`mailto:${profile.coordinator_email}`} className="text-green-600 hover:text-green-500">
                        {profile.coordinator_email}
                      </a>
                    </div>
                  )}
                  {profile.coordinator_contact && (
                    <div className="flex items-center text-sm text-gray-600">
                      <PhoneIcon className="h-5 w-5 mr-2" />
                      <span>{profile.coordinator_contact}</span>
                    </div>
                  )}
                  {profile.affiliated_at && (
                    <div className="text-xs text-gray-500">
                      Affiliated since: {new Date(profile.affiliated_at).toLocaleDateString()}
                    </div>
                  )}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    Your coordinator manages application approvals and helps you find the right candidates.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Recent Jobs */}
          <div className={profile.coordinator_name ? 'lg:col-span-2' : 'lg:col-span-3'}>
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Job Postings</h3>
                <Link
                  to="/company/jobs"
                  className="text-sm text-green-600 hover:text-green-500 font-medium"
                >
                  View all jobs
                </Link>
              </div>
              
              {recentJobs.length > 0 ? (
                <div className="space-y-3">
                  {recentJobs.map((job) => (
                    <div key={job.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">{job.title}</h4>
                          <p className="text-xs text-gray-500">{job.location} • {job.work_type}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            job.status === 'active' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {job.status}
                          </span>
                          <Link
                            to={`/jobs/${job.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-green-600 hover:text-green-500"
                            title="View job post"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <BriefcaseIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h4 className="mt-2 text-sm font-medium text-gray-900">No jobs posted yet</h4>
                  <p className="mt-1 text-sm text-gray-500">Start by creating your first job posting</p>
                  <div className="mt-6">
                    <Link
                      to="/company/jobs/create"
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                    >
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Post Your First Job
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
