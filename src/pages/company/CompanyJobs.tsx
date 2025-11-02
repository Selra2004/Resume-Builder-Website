import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { toast } from 'react-hot-toast';
import {
  BriefcaseIcon,
  PlusIcon,
  EyeIcon,
  PencilIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  UserGroupIcon,
  MagnifyingGlassIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  TrashIcon,
  ArrowPathIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';

interface Job {
  id: number;
  title: string;
  description: string;
  category: string;
  work_type: string;
  work_arrangement: string;
  experience_level: string;
  location: string;
  currency: string;
  min_salary?: number;
  max_salary?: number;
  application_deadline: string;
  positions_available: number;
  status: 'pending' | 'active' | 'closed' | 'rejected' | 'expired';
  display_status?: 'pending' | 'active' | 'closed' | 'rejected' | 'expired';
  is_expired?: boolean;
  created_at: string;
  updated_at: string;
  application_count: number;
  qualified_count: number;
  coordinator_approved: boolean;
  coordinator_notes?: string;
  application_limit?: number;
}

interface Filters {
  status: string;
  category: string;
  workType: string;
  search: string;
}

export const CompanyJobs: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  
  const [filters, setFilters] = useState<Filters>({
    status: 'all',
    category: 'all',
    workType: 'all',
    search: ''
  });

  // Modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [newDeadline, setNewDeadline] = useState('');

  useEffect(() => {
    fetchJobs();
    fetchCategories();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [jobs, filters]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const response = await api.get('/companies/jobs');
      setJobs(response.data);
    } catch (error: any) {
      console.error('Failed to fetch jobs:', error);
      toast.error('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get('/jobs/categories');
      // Ensure categories is always an array of strings
      const categoryData = response.data;
      if (Array.isArray(categoryData)) {
        // Filter out any non-string values and ensure we have strings
        const validCategories = categoryData
          .filter(cat => typeof cat === 'string' || (cat && typeof cat.name === 'string'))
          .map(cat => typeof cat === 'string' ? cat : cat.name);
        setCategories(validCategories);
      } else {
        setCategories([]);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      setCategories([]);
    }
  };

  const applyFilters = () => {
    let filtered = jobs;

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(job => (job.display_status || job.status) === filters.status);
    }

    // Category filter
    if (filters.category !== 'all') {
      filtered = filtered.filter(job => job.category === filters.category);
    }

    // Work type filter
    if (filters.workType !== 'all') {
      filtered = filtered.filter(job => job.work_type === filters.workType);
    }

    // Search filter
    if (filters.search.trim()) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(job => 
        job.title.toLowerCase().includes(searchTerm) ||
        job.location.toLowerCase().includes(searchTerm) ||
        job.category.toLowerCase().includes(searchTerm)
      );
    }

    setFilteredJobs(filtered);
  };

  const handleFilterChange = (key: keyof Filters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'pending':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      case 'closed':
        return <XCircleIcon className="h-5 w-5 text-gray-500" />;
      case 'rejected':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
      case 'expired':
        return <ExclamationCircleIcon className="h-5 w-5 text-orange-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'pending':
        return 'Pending Approval';
      case 'closed':
        return 'Closed';
      case 'rejected':
        return 'Rejected';
      case 'expired':
        return 'Expired';
      default:
        return 'Unknown';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'expired':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatSalaryRange = (job: Job) => {
    // Ensure values are numbers before formatting
    const minSalary = Number(job.min_salary);
    const maxSalary = Number(job.max_salary);
    
    if (minSalary && maxSalary) {
      return `${job.currency || 'PHP'} ${minSalary.toLocaleString()} - ${maxSalary.toLocaleString()}`;
    } else if (minSalary) {
      return `${job.currency || 'PHP'} ${minSalary.toLocaleString()}+`;
    } else if (maxSalary) {
      return `Up to ${job.currency || 'PHP'} ${maxSalary.toLocaleString()}`;
    }
    return 'Negotiable';
  };

  const isDeadlinePassed = (deadline: string) => {
    if (!deadline) return false;
    return new Date(deadline) < new Date();
  };

  const handleDeleteJob = async () => {
    if (!selectedJob) return;

    try {
      await api.delete(`/companies/jobs/${selectedJob.id}`);
      toast.success(`Job "${selectedJob.title}" deleted successfully`);
      fetchJobs(); // Refresh the list
      setShowDeleteModal(false);
      setSelectedJob(null);
    } catch (error: any) {
      console.error('Failed to delete job:', error);
      toast.error(error.response?.data?.message || 'Failed to delete job');
    }
  };

  const handleRenewJob = async () => {
    if (!selectedJob || !newDeadline) return;

    try {
      await api.patch(`/companies/jobs/${selectedJob.id}/renew`, {
        newDeadline: newDeadline
      });
      toast.success(`Job "${selectedJob.title}" deadline renewed successfully`);
      fetchJobs(); // Refresh the list
      setShowRenewModal(false);
      setSelectedJob(null);
      setNewDeadline('');
    } catch (error: any) {
      console.error('Failed to renew job:', error);
      toast.error(error.response?.data?.message || 'Failed to renew job deadline');
    }
  };

  const openDeleteModal = (job: Job) => {
    setSelectedJob(job);
    setShowDeleteModal(true);
  };

  const openRenewModal = (job: Job) => {
    setSelectedJob(job);
    setNewDeadline('');
    setShowRenewModal(true);
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
              <h1 className="text-2xl font-bold text-gray-900">My Job Postings</h1>
              <p className="mt-1 text-sm text-gray-600">
                Manage your job postings and track applications
              </p>
            </div>
            <Link
              to="/company/jobs/create"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Post New Job
            </Link>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Jobs ({filteredJobs.length})
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  id="search"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-10 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                  placeholder="Search jobs..."
                />
              </div>
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                id="status"
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending Approval</option>
                <option value="active">Active</option>
                <option value="expired">Expired</option>
                <option value="closed">Closed</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                id="category"
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
              >
                <option value="all">All Categories</option>
                {categories.map((category, index) => {
                  // Ensure category is a string
                  const categoryName = typeof category === 'string' ? category : String(category || `Category ${index + 1}`);
                  return (
                    <option key={`category-${categoryName}-${index}`} value={categoryName}>
                      {categoryName}
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label htmlFor="workType" className="block text-sm font-medium text-gray-700 mb-1">
                Work Type
              </label>
              <select
                id="workType"
                value={filters.workType}
                onChange={(e) => handleFilterChange('workType', e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
              >
                <option value="all">All Types</option>
                <option value="full-time">Full-time</option>
                <option value="part-time">Part-time</option>
                <option value="contract">Contract</option>
                <option value="internship">Internship</option>
                <option value="ojt">OJT</option>
              </select>
            </div>
          </div>
        </div>

        {/* Jobs List */}
        <div className="space-y-4">
          {filteredJobs.length === 0 ? (
            <div className="bg-white shadow rounded-lg p-12">
              <div className="text-center">
                <BriefcaseIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No jobs found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {jobs.length === 0 
                    ? "You haven't posted any jobs yet. Start by creating your first job posting."
                    : "No jobs match your current filters. Try adjusting your search criteria."
                  }
                </p>
                {jobs.length === 0 && (
                  <div className="mt-6">
                    <Link
                      to="/company/jobs/create"
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                    >
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Post Your First Job
                    </Link>
                  </div>
                )}
              </div>
            </div>
          ) : (
            filteredJobs.map((job) => {
              // Ensure job is a valid object with required properties
              const safeJob: Job = {
                id: job?.id || 0,
                title: String(job?.title || 'Untitled Job'),
                status: (job?.status as Job['status']) || 'pending',
                location: String(job?.location || 'Not specified'),
                work_type: String(job?.work_type || 'Not specified'),
                work_arrangement: String(job?.work_arrangement || 'Not specified'),
                description: String(job?.description || 'No description provided'),
                category: String(job?.category || 'General'),
                experience_level: String(job?.experience_level || 'Entry Level'),
                application_count: Number(job?.application_count || 0),
                qualified_count: Number(job?.qualified_count || 0),
                positions_available: Number(job?.positions_available || 0),
                coordinator_approved: Boolean(job?.coordinator_approved),
                created_at: job?.created_at || new Date().toISOString(),
                updated_at: job?.updated_at || new Date().toISOString(),
                application_deadline: job?.application_deadline || '',
                min_salary: job?.min_salary,
                max_salary: job?.max_salary,
                currency: String(job?.currency || 'PHP'),
                coordinator_notes: job?.coordinator_notes ? String(job.coordinator_notes) : undefined,
                display_status: job?.display_status as Job['display_status'],
                is_expired: Boolean(job?.is_expired),
                application_limit: job?.application_limit
              };
              
              return (
                <div key={safeJob.id} className="bg-white shadow rounded-lg p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-medium text-gray-900 truncate">
                          {safeJob.title}
                        </h3>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(safeJob.display_status || safeJob.status)}
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(safeJob.display_status || safeJob.status)}`}>
                            {getStatusText(safeJob.display_status || safeJob.status)}
                          </span>
                        </div>
                      </div>
                    
                    <div className="flex flex-wrap items-center text-sm text-gray-500 space-x-4 mb-3">
                      <div className="flex items-center">
                        <MapPinIcon className="h-4 w-4 mr-1" />
                        {safeJob.location}
                      </div>
                      <div className="flex items-center">
                        <BriefcaseIcon className="h-4 w-4 mr-1" />
                        {safeJob.work_type} • {safeJob.work_arrangement}
                      </div>
                      <div className="flex items-center">
                        <CurrencyDollarIcon className="h-4 w-4 mr-1" />
                        {formatSalaryRange(safeJob)}
                      </div>
                      <div className="flex items-center">
                        <CalendarIcon className="h-4 w-4 mr-1" />
                        <span className={isDeadlinePassed(safeJob.application_deadline) ? 'text-red-600' : ''}>
                          Deadline: {safeJob.application_deadline ? new Date(safeJob.application_deadline).toLocaleDateString() : 'Not set'}
                        </span>
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                      {safeJob.description}
                    </p>

                    <div className="flex items-center space-x-4 text-sm">
                      <div className={`flex items-center ${
                        safeJob.application_limit && safeJob.application_count >= safeJob.application_limit 
                          ? 'text-red-600' 
                          : safeJob.application_limit && safeJob.application_count >= safeJob.application_limit * 0.8 
                            ? 'text-amber-600' 
                            : 'text-blue-600'
                      }`}>
                        <UserGroupIcon className="h-4 w-4 mr-1" />
                        {safeJob.application_limit 
                          ? `${safeJob.application_count}/${safeJob.application_limit} applications`
                          : `${safeJob.application_count} applications`
                        }
                        {safeJob.application_limit && safeJob.application_count >= safeJob.application_limit && (
                          <span className="ml-1 text-xs text-red-500 font-medium">FULL</span>
                        )}
                      </div>
                      {safeJob.qualified_count > 0 && (
                        <div className="flex items-center text-green-600">
                          <CheckCircleIcon className="h-4 w-4 mr-1" />
                          {safeJob.qualified_count} qualified
                        </div>
                      )}
                      <div className="text-gray-500">
                        {safeJob.positions_available} position{safeJob.positions_available !== 1 ? 's' : ''} available
                      </div>
                    </div>

                    {safeJob.coordinator_notes && (
                      <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                        <p className="text-sm text-yellow-800">
                          <strong>Coordinator Notes:</strong> {safeJob.coordinator_notes}
                        </p>
                      </div>
                    )}

                    {/* Application Limit Warning */}
                    {safeJob.application_limit && safeJob.application_count >= safeJob.application_limit && (
                      <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                        <p className="text-sm text-red-800">
                          <strong>⚠️ Application Limit Reached:</strong> This job has reached its maximum of {safeJob.application_limit} applications. No new applications will be accepted.
                        </p>
                      </div>
                    )}
                    
                    {safeJob.application_limit && safeJob.application_count >= safeJob.application_limit * 0.8 && safeJob.application_count < safeJob.application_limit && (
                      <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-md">
                        <p className="text-sm text-amber-800">
                          <strong>📝 Application Limit Warning:</strong> This job is nearing its limit ({safeJob.application_count}/{safeJob.application_limit} applications received).
                        </p>
                      </div>
                    )}

                    {/* Expired Job Notice */}
                    {(safeJob.display_status === 'expired' || safeJob.is_expired) && (
                      <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-md">
                        <div className="flex items-center">
                          <ExclamationCircleIcon className="h-5 w-5 text-orange-500 mr-2" />
                          <div>
                            <p className="text-sm font-medium text-orange-800">Job Expired</p>
                            <p className="text-xs text-orange-700">
                              This job is no longer visible to applicants. Renew the deadline or delete it.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-end space-y-2 ml-4">
                    <div className="flex items-center space-x-2">
                      <Link
                        to={`/jobs/${safeJob.id}`}
                        target="_blank"
                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      >
                        <EyeIcon className="h-4 w-4 mr-1" />
                        View Post
                      </Link>
                      
                      {(safeJob.status === 'pending' || safeJob.status === 'active') && !(safeJob.display_status === 'expired' || safeJob.is_expired) ? (
                        <Link
                          to={`/company/jobs/${safeJob.id}/edit`}
                          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                        >
                          <PencilIcon className="h-4 w-4 mr-1" />
                          Edit
                        </Link>
                      ) : null}

                      <Link
                        to={`/company/jobs/${safeJob.id}/applications`}
                        className={`inline-flex items-center px-3 py-2 border shadow-sm text-sm leading-4 font-medium rounded-md ${
                          safeJob.application_count > 0
                            ? 'border-transparent text-white bg-green-600 hover:bg-green-700'
                            : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                        }`}
                      >
                        <UserGroupIcon className="h-4 w-4 mr-1" />
                        Applicants ({safeJob.application_count})
                      </Link>
                    </div>

                    {/* Expired Job Actions */}
                    {(safeJob.display_status === 'expired' || safeJob.is_expired) && (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => openRenewModal(safeJob)}
                          className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                        >
                          <ArrowPathIcon className="h-4 w-4 mr-1" />
                          Renew Deadline
                        </button>
                        <button
                          onClick={() => openDeleteModal(safeJob)}
                          className="inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50"
                        >
                          <TrashIcon className="h-4 w-4 mr-1" />
                          Delete
                        </button>
                      </div>
                    )}

                    {/* Regular Job Actions */}
                    {!(safeJob.display_status === 'expired' || safeJob.is_expired) && (
                      <button
                        onClick={() => openDeleteModal(safeJob)}
                        className="inline-flex items-center px-2 py-1 border border-red-300 shadow-sm text-xs leading-4 font-medium rounded text-red-700 bg-white hover:bg-red-50"
                      >
                        <TrashIcon className="h-3 w-3 mr-1" />
                        Delete
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
                  <div>
                    Created: {safeJob.created_at ? new Date(safeJob.created_at).toLocaleDateString() : 'Unknown'}
                  </div>
                  <div>
                    Last updated: {safeJob.updated_at ? new Date(safeJob.updated_at).toLocaleDateString() : 'Unknown'}
                  </div>
                </div>
              </div>
              );
            })
          )}
        </div>

        {/* Delete Modal */}
        {showDeleteModal && selectedJob && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex items-center">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                    <TrashIcon className="h-6 w-6 text-red-600" />
                  </div>
                </div>
                <div className="mt-3 text-center">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Delete Job</h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      Are you sure you want to delete "{selectedJob.title}"? This action cannot be undone and will also delete all applications and related data.
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex justify-center space-x-3 mt-5">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteJob}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  Delete Job
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Renew Modal */}
        {showRenewModal && selectedJob && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex items-center">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
                    <ArrowPathIcon className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <div className="mt-3 text-center">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Renew Job Deadline</h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500 mb-4">
                      Set a new application deadline for "{selectedJob.title}" to make it visible to applicants again.
                    </p>
                    <div className="text-left">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        New Application Deadline
                      </label>
                      <input
                        type="datetime-local"
                        value={newDeadline}
                        onChange={(e) => setNewDeadline(e.target.value)}
                        min={new Date().toISOString().slice(0, 16)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-center space-x-3 mt-5">
                <button
                  onClick={() => setShowRenewModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRenewJob}
                  disabled={!newDeadline}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  Renew Deadline
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
