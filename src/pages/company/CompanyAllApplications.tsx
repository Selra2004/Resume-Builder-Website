import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';
import {
  UserGroupIcon,
  UserIcon,
  MagnifyingGlassIcon,
  StarIcon,
  BriefcaseIcon,
  MapPinIcon,
  CalendarIcon,
  EyeIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';

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

export const CompanyAllApplications: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<JobApplication[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [ratingFilter, setRatingFilter] = useState('all');

  useEffect(() => {
    fetchApplications();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [applications, searchTerm, statusFilter, ratingFilter]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await api.get('/companies/applications');
      setApplications(response.data.applications || []);
    } catch (error: any) {
      console.error('Failed to fetch applications:', error);
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = applications;

    // Search filter
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(app => 
        app.first_name.toLowerCase().includes(search) ||
        app.last_name.toLowerCase().includes(search) ||
        app.email.toLowerCase().includes(search) ||
        app.job_title.toLowerCase().includes(search) ||
        app.job_location.toLowerCase().includes(search)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(app => app.status === statusFilter);
    }

    // Rating filter
    if (ratingFilter !== 'all') {
      filtered = filtered.filter(app => {
        const rating = app.user_rating_profile?.overall_average_rating || 0;
        switch (ratingFilter) {
          case 'high':
            return rating >= 4;
          case 'rated':
            return rating > 0;
          case 'unrated':
            return rating === 0;
          case 'low':
            return rating > 0 && rating < 3;
          default:
            return true;
        }
      });
    }

    setFilteredApplications(filtered);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'qualified':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'under_review':
        return 'bg-blue-100 text-blue-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'hired':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">All Applicants</h1>
              <p className="mt-1 text-sm text-gray-600">
                View all applications across all your job postings
              </p>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <UserGroupIcon className="h-5 w-5" />
              <span>{filteredApplications.length} of {applications.length} applicants</span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                Search Applicants
              </label>
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  id="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                  placeholder="Search by name, email, job, location..."
                />
              </div>
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                id="status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="under_review">Under Review</option>
                <option value="qualified">Qualified</option>
                <option value="rejected">Rejected</option>
                <option value="hired">Hired</option>
              </select>
            </div>

            <div>
              <label htmlFor="rating" className="block text-sm font-medium text-gray-700 mb-1">
                Rating
              </label>
              <select
                id="rating"
                value={ratingFilter}
                onChange={(e) => setRatingFilter(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
              >
                <option value="all">All Ratings</option>
                <option value="high">High Rated (4+ stars)</option>
                <option value="rated">Has Rating</option>
                <option value="unrated">Not Rated</option>
                <option value="low">Low Rated (&lt;3 stars)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Applications List */}
        <div className="bg-white shadow rounded-lg">
          {filteredApplications.length === 0 ? (
            <div className="p-12 text-center">
              <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                {applications.length === 0 ? 'No applicants yet' : 'No applicants match your filters'}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {applications.length === 0 
                  ? 'Applications will appear here once users apply to your jobs'
                  : 'Try adjusting your search criteria or filters'
                }
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredApplications.map((application) => (
                <div key={application.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        {application.profile_photo ? (
                          <img
                            className="h-12 w-12 rounded-full object-cover"
                            src={application.profile_photo}
                            alt={`${application.first_name} ${application.last_name}`}
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-full bg-gray-300 flex items-center justify-center">
                            <UserIcon className="h-8 w-8 text-gray-600" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3">
                          <h4 className="text-lg font-medium text-gray-900">
                            {application.first_name} {application.last_name}
                          </h4>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(application.status)}`}>
                            {application.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{application.email}</p>
                        
                        <div className="flex items-center mt-2 space-x-4 text-sm text-gray-500">
                          <div className="flex items-center">
                            <BriefcaseIcon className="h-4 w-4 mr-1" />
                            {application.job_title}
                          </div>
                          <div className="flex items-center">
                            <MapPinIcon className="h-4 w-4 mr-1" />
                            {application.job_location}
                          </div>
                          <div className="flex items-center">
                            <CalendarIcon className="h-4 w-4 mr-1" />
                            {new Date(application.created_at).toLocaleDateString()}
                          </div>
                        </div>

                        <div className="flex items-center mt-2">
                          {application.user_rating_profile?.overall_average_rating ? (
                            <div className="flex items-center space-x-1">
                              <StarIcon className="h-4 w-4 text-yellow-400 fill-current" />
                              <span className="text-sm text-gray-600">
                                {Number(application.user_rating_profile.overall_average_rating).toFixed(1)} 
                                ({application.user_rating_profile.total_ratings} rating{application.user_rating_profile.total_ratings !== 1 ? 's' : ''})
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-500">No ratings yet</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <Link
                        to={`/company/jobs/${application.job_id}/applications`}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      >
                        <EyeIcon className="h-4 w-4 mr-1" />
                        View Details
                      </Link>
                      <ChevronRightIcon className="h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
