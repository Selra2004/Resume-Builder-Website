import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { toast } from 'react-hot-toast';
import { 
  BriefcaseIcon, 
  MapPinIcon, 
  ClockIcon, 
  CurrencyDollarIcon,
  BuildingOfficeIcon,
  AcademicCapIcon,
  UserGroupIcon,
  StarIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline';
import { RatingDisplay } from '../components/RatingDisplay';

interface Job {
  id: number;
  title: string;
  location: string;
  category: string;
  work_type: string;
  work_arrangement: string;
  currency: string;
  min_salary: number;
  max_salary: number;
  description: string;
  summary: string;
  company_name: string;
  coordinator_name: string;
  business_owner_name: string;
  created_by_name: string;
  application_count: number;
  average_rating: number;
  rating_count: number;
  created_at: string;
  application_deadline: string;
  positions_available: number;
  experience_level: string;
  matchScore?: number;
  matchReasons?: string[];
}

export const Jobs: React.FC = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [recommendedJobs, setRecommendedJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recommendationsExpanded, setRecommendationsExpanded] = useState(true);
  const [filters, setFilters] = useState({
    category: '',
    workType: '',
    location: '',
    search: ''
  });

  // Define functions first before useEffects
  const fetchRecommendations = useCallback(async () => {
    try {
      setRecommendationsLoading(true);
      const response = await api.get('/jobs/recommendations');
      setRecommendedJobs(response.data.jobs || []);
    } catch (err: any) {
      console.error('Error fetching recommendations:', err);
      // Don't show error for recommendations, just silently fail
    } finally {
      setRecommendationsLoading(false);
    }
  }, []);

  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      
      if (filters.category) params.append('category', filters.category);
      if (filters.workType) params.append('workType', filters.workType);
      if (filters.location) params.append('location', filters.location);
      if (filters.search) params.append('search', filters.search);
      
      const response = await api.get(`/jobs?${params.toString()}`);
      setJobs(response.data.jobs || []);
    } catch (err: any) {
      setError('Failed to load jobs');
      console.error('Error fetching jobs:', err);
      // Only show toast for user-initiated actions
      if (!filters.category && !filters.workType && !filters.location && !filters.search) {
        toast.error('Failed to load jobs');
      }
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Initial load - no debounce needed
  useEffect(() => {
    // Initial fetch on mount - create a separate function to avoid dependency issues
    const initialFetch = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.get('/jobs');
        setJobs(response.data.jobs || []);
      } catch (err: any) {
        setError('Failed to load jobs');
        toast.error('Failed to load jobs');
        console.error('Error fetching jobs:', err);
      } finally {
        setLoading(false);
      }
    };
    
    initialFetch();
  }, []); // Only run on mount

  useEffect(() => {
    if (user?.role === 'user' && recommendedJobs.length === 0) {
      fetchRecommendations();
    }
  }, [user?.role, fetchRecommendations, recommendedJobs.length]); // Only fetch when user role changes, not when user object changes

  // Debounce filter changes to prevent too many API calls
  const handleFilterChange = useCallback((field: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  // Debounced effect for filters to prevent rapid API calls
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchJobs();
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [filters, fetchJobs]);

  const formatSalary = (job: Job) => {
    if (!job.min_salary && !job.max_salary) return 'Salary not specified';
    
    const currency = job.currency || 'PHP';
    // Ensure values are numbers before formatting
    const minSalary = Number(job.min_salary);
    const maxSalary = Number(job.max_salary);
    
    if (minSalary && maxSalary) {
      return `${currency} ${minSalary.toLocaleString()} - ${maxSalary.toLocaleString()}`;
    } else if (minSalary) {
      return `${currency} ${minSalary.toLocaleString()}+`;
    } else if (maxSalary) {
      return `Up to ${currency} ${maxSalary.toLocaleString()}`;
    }
    return 'Salary not specified';
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 24) {
      return `${diffInHours} hours ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays} days ago`;
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading job opportunities...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Job Opportunities</h1>
        <p className="mt-2 text-gray-600">
          Discover exciting career opportunities tailored for ACC students and alumni.
        </p>
      </div>

      {/* Recommended Jobs for logged-in users */}
      {user?.role === 'user' && (
        <div className="mb-8">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <button
                  onClick={() => setRecommendationsExpanded(!recommendationsExpanded)}
                  className="flex items-center hover:bg-blue-100 rounded-lg px-2 py-1 transition-colors"
                >
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center mr-2">
                    <StarIcon className="h-5 w-5 text-yellow-500 mr-2" />
                    Recommended for You
                  </h2>
                  {recommendationsExpanded ? (
                    <ChevronUpIcon className="h-5 w-5 text-gray-500 hover:text-gray-700" />
                  ) : (
                    <ChevronDownIcon className="h-5 w-5 text-gray-500 hover:text-gray-700" />
                  )}
                </button>
                {!recommendationsExpanded && recommendedJobs.length > 0 && (
                  <span className="ml-3 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
                    {recommendedJobs.length} job{recommendedJobs.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-3">
                {recommendationsExpanded && (
                  <p className="text-sm text-gray-600">
                    Jobs that match your skills, courses, and experience
                  </p>
                )}
                {recommendedJobs.length > 0 && recommendationsExpanded && (
                  <button 
                    onClick={() => {
                      if (!recommendationsLoading) {
                        fetchRecommendations();
                      }
                    }}
                    disabled={recommendationsLoading}
                    className="text-sm text-blue-600 hover:text-blue-800 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {recommendationsLoading ? 'Refreshing...' : 'Refresh Recommendations'}
                  </button>
                )}
              </div>
            </div>

            {recommendationsExpanded && (
              <div className="transition-all duration-300 ease-in-out">
                {recommendationsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    <span className="ml-3 text-sm text-gray-600">Finding your perfect matches...</span>
                  </div>
                ) : recommendedJobs.length > 0 ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {recommendedJobs.slice(0, 4).map((job) => (
                        <div key={job.id} className="bg-white rounded-lg border border-blue-200 p-4 hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h3 className="font-medium text-gray-900 mb-1">{job.title}</h3>
                              <p className="text-sm text-gray-600">{job.created_by_name} • {job.location}</p>
                            </div>
                            <div className="ml-3">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                {job.matchScore}% Match
                              </span>
                            </div>
                          </div>
                          
                          {job.matchReasons && job.matchReasons.length > 0 && (
                            <div className="mb-3">
                              <p className="text-xs text-blue-600 font-medium mb-1">Why this matches you:</p>
                              <ul className="text-xs text-gray-600 space-y-1">
                                {job.matchReasons.slice(0, 2).map((reason, index) => (
                                  <li key={index} className="flex items-start">
                                    <span className="text-blue-500 mr-1">•</span>
                                    {reason}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          <div className="flex space-x-2">
                            <Link
                              to={`/jobs/${job.id}`}
                              className="flex-1 text-center px-3 py-2 text-xs border border-blue-300 text-blue-700 rounded hover:bg-blue-50 transition-colors"
                            >
                              View Details
                            </Link>
                            {user?.role === 'user' && (
                              <Link
                                to={`/jobs/${job.id}/apply`}
                                className="flex-1 text-center px-3 py-2 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                              >
                                Apply Now
                              </Link>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    {recommendedJobs.length > 4 && (
                      <div className="text-center">
                        <p className="text-sm text-gray-600">
                          Showing 4 of {recommendedJobs.length} recommendations.{' '}
                          <button 
                            onClick={() => {
                              if (!recommendationsLoading) {
                                fetchRecommendations();
                              }
                            }}
                            disabled={recommendationsLoading}
                            className="text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {recommendationsLoading ? 'Refreshing...' : 'Refresh for more'}
                          </button>
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <StarIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <h3 className="text-sm font-medium text-gray-900 mb-1">No Personalized Recommendations Yet</h3>
                    <p className="text-xs text-gray-600 mb-4">
                      Complete your profile and build your resume to get job recommendations tailored just for you!
                    </p>
                    <div className="space-x-2">
                      <Link
                        to="/complete-profile"
                        className="inline-block px-3 py-2 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        Complete Profile
                      </Link>
                      <Link
                        to="/resume-builder"
                        className="inline-block px-3 py-2 text-xs border border-blue-300 text-blue-700 rounded hover:bg-blue-50"
                      >
                        Build Resume
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Jobs
            </label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder="Search by title or description"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Work Type
            </label>
            <select 
              value={filters.workType}
              onChange={(e) => handleFilterChange('workType', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Types</option>
              <option value="full-time">Full Time</option>
              <option value="part-time">Part Time</option>
              <option value="contract">Contract</option>
              <option value="internship">Internship</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <input
              type="text"
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              placeholder="e.g., IT Support, Accounting"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location
            </label>
            <input
              type="text"
              value={filters.location}
              onChange={(e) => handleFilterChange('location', e.target.value)}
              placeholder="e.g., Manila, Quezon City"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
          <BriefcaseIcon className="h-8 w-8 text-blue-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">{jobs.length}</div>
          <div className="text-sm text-gray-600">Active Job Openings</div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
          <UserGroupIcon className="h-8 w-8 text-green-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">
            {jobs.reduce((sum, job) => sum + (job.application_count || 0), 0)}
          </div>
          <div className="text-sm text-gray-600">Total Applications</div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
          <BuildingOfficeIcon className="h-8 w-8 text-purple-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">
            {new Set(jobs.map(job => job.created_by_name)).size}
          </div>
          <div className="text-sm text-gray-600">Hiring Partners</div>
        </div>
      </div>

      {/* Job Listings */}
      {error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-600">{error}</p>
          <button 
            onClick={fetchJobs}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      ) : jobs.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
          <BriefcaseIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Jobs Found</h3>
          <p className="text-gray-600 mb-4">
            There are no job opportunities matching your current filters.
          </p>
          <button 
            onClick={() => setFilters({ category: '', workType: '', location: '', search: '' })}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {jobs.map((job) => (
            <div key={job.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-xl font-semibold text-gray-900 mb-1">
                      {job.title}
                    </h3>
                    <div className="flex items-center space-x-2">
                      {job.average_rating > 0 && (
                        <RatingDisplay
                          entityId={job.id}
                          entityType="job"
                          averageRating={job.average_rating}
                          totalCount={job.rating_count}
                          showDetails={false}
                        />
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-3">
                    <span className="flex items-center">
                      <BuildingOfficeIcon className="h-4 w-4 mr-1" />
                      {job.created_by_name}
                    </span>
                    <span className="flex items-center">
                      <MapPinIcon className="h-4 w-4 mr-1" />
                      {job.location}
                    </span>
                    <span className="flex items-center">
                      <BriefcaseIcon className="h-4 w-4 mr-1" />
                      {job.work_type?.charAt(0).toUpperCase() + job.work_type?.slice(1)} • {job.work_arrangement?.charAt(0).toUpperCase() + job.work_arrangement?.slice(1)}
                    </span>
                    <span className="flex items-center">
                      <ClockIcon className="h-4 w-4 mr-1" />
                      {getTimeAgo(job.created_at)}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      <AcademicCapIcon className="h-3 w-3 mr-1" />
                      {job.category}
                    </span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <CurrencyDollarIcon className="h-3 w-3 mr-1" />
                      {formatSalary(job)}
                    </span>
                    {job.experience_level && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {job.experience_level.charAt(0).toUpperCase() + job.experience_level.slice(1)}
                      </span>
                    )}
                  </div>

                  <p className="text-gray-700 text-sm leading-relaxed mb-4 line-clamp-3">
                    {job.summary || job.description}
                  </p>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-4 text-gray-500">
                      <span>{job.application_count || 0} applications</span>
                      <span>{job.positions_available} positions</span>
                      {job.application_deadline && (
                        <span className="text-orange-600">
                          Deadline: {new Date(job.application_deadline).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3">
                <Link
                  to={`/jobs/${job.id}`}
                  className="flex-1 text-center px-4 py-2 border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  View Details
                </Link>
                {user?.role === 'user' ? (
                  <Link
                    to={`/jobs/${job.id}/apply`}
                    className="flex-1 text-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                  >
                    Apply Now
                  </Link>
                ) : (user?.role === 'coordinator' || user?.role === 'company') ? (
                  <div className="flex-1 text-center px-4 py-2 bg-gray-100 text-gray-500 rounded-lg cursor-not-allowed">
                    View Only
                  </div>
                ) : !user ? (
                  <Link
                    to="/login"
                    className="flex-1 text-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                  >
                    Login to Apply
                  </Link>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};