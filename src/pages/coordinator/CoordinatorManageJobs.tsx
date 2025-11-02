import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { toast } from 'react-hot-toast';
import { 
  BriefcaseIcon,
  PlusIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  ClockIcon,
  UserGroupIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';

interface Job {
  id: number;
  title: string;
  location: string;
  category: string;
  work_type: string;
  work_arrangement: string;
  status: string;
  display_status?: 'pending' | 'active' | 'closed' | 'rejected' | 'expired';
  is_expired?: boolean;
  application_count: number;
  positions_available: number;
  application_deadline: string;
  created_by_type: 'coordinator' | 'company';
  created_by_name: string;
  created_at: string;
  updated_at: string;
  application_limit?: number;
}

export const CoordinatorManageJobs: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deleteJobId, setDeleteJobId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const response = await api.get('/coordinators/jobs');
      setJobs(response.data || []);
    } catch (error: any) {
      console.error('Failed to fetch jobs:', error);
      toast.error('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteJob = async (jobId: number) => {
    try {
      setIsDeleting(true);
      await api.delete(`/jobs/${jobId}`);
      toast.success('Job deleted successfully');
      setDeleteJobId(null);
      fetchJobs(); // Refresh the list
    } catch (error: any) {
      console.error('Failed to delete job:', error);
      toast.error('Failed to delete job');
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusBadge = (job: Job) => {
    const status = job.display_status || job.status;
    const statusConfig = {
      active: { color: 'bg-green-100 text-green-800', icon: CheckCircleIcon },
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: ClockIcon },
      draft: { color: 'bg-gray-100 text-gray-800', icon: ClockIcon },
      paused: { color: 'bg-yellow-100 text-yellow-800', icon: ClockIcon },
      closed: { color: 'bg-red-100 text-red-800', icon: XCircleIcon },
      expired: { color: 'bg-orange-100 text-orange-800', icon: ExclamationCircleIcon }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="h-3 w-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          job.category.toLowerCase().includes(searchTerm.toLowerCase());
    const displayStatus = job.display_status || job.status;
    const matchesStatus = statusFilter === 'all' || displayStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white shadow rounded-lg p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading jobs...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Manage Job Postings</h1>
              <p className="mt-2 text-gray-600">
                View, edit, and manage your job postings and affiliated company jobs in one place.
              </p>
            </div>
            <Link
              to="/coordinator/jobs/create"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Post New Job
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Jobs
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by title or category..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="expired">Expired</option>
                <option value="draft">Draft</option>
                <option value="paused">Paused</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Expired Jobs Alert */}
        {(() => {
          const expiredJobs = jobs.filter(job => job.display_status === 'expired' || job.is_expired);
          const ownExpiredJobs = expiredJobs.filter(job => job.created_by_type === 'coordinator');
          
          if (expiredJobs.length > 0) {
            return (
              <div className="mb-6 bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-start">
                  <ExclamationCircleIcon className="h-6 w-6 text-orange-500 mt-0.5 mr-3" />
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-orange-800">
                      Jobs Past Deadline
                    </h3>
                    <div className="mt-2 text-sm text-orange-700">
                      <p>
                        {expiredJobs.length} job{expiredJobs.length !== 1 ? 's have' : ' has'} passed {expiredJobs.length !== 1 ? 'their' : 'its'} application deadline
                        {ownExpiredJobs.length > 0 && ` (${ownExpiredJobs.length} of your own jobs)`}.
                        Expired jobs are no longer visible to applicants.
                      </p>
                      {ownExpiredJobs.length > 0 && (
                        <p className="mt-1">
                          <strong>Action required:</strong> Contact the company to renew deadlines or delete expired job posts.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          }
          return null;
        })()}

        {/* Jobs List */}
        {filteredJobs.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <BriefcaseIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              {jobs.length === 0 ? 'No jobs posted yet' : 'No jobs match your filters'}
            </h3>
            <p className="mt-2 text-gray-500">
              {jobs.length === 0 
                ? 'Get started by posting your first job.' 
                : 'Try adjusting your search or filter criteria.'
              }
            </p>
            {jobs.length === 0 && (
              <div className="mt-6">
                <Link
                  to="/coordinator/jobs/create"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Post Your First Job
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Job Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Posted By
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Applications
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Deadline
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredJobs.map((job) => (
                    <tr key={job.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <BriefcaseIcon className="h-5 w-5 text-gray-400 mr-3" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">{job.title}</div>
                            <div className="text-sm text-gray-500">{job.location}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{job.category}</div>
                        <div className="text-sm text-gray-500">
                          {job.work_type} • {job.work_arrangement}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{job.created_by_name || 'N/A'}</div>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          job.created_by_type === 'coordinator' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-purple-100 text-purple-800'
                        }`}>
                          {job.created_by_type === 'coordinator' ? 'Your Job' : 'Company Job'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(job)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <UserGroupIcon className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900">
                            {job.application_limit 
                              ? `${job.application_count}/${job.application_limit} applications`
                              : `${job.application_count}/${job.positions_available} applied`
                            }
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {job.application_deadline 
                          ? new Date(job.application_deadline).toLocaleDateString()
                          : 'No deadline'
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex space-x-2">
                          <Link
                            to={`/jobs/${job.id}`}
                            className="text-blue-600 hover:text-blue-900"
                            title="View Details"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </Link>
                          {job.created_by_type === 'coordinator' && (
                            <Link
                              to={`/coordinator/jobs/${job.id}/edit`}
                              className="text-indigo-600 hover:text-indigo-900"
                              title="Edit Job"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </Link>
                          )}
                          {job.created_by_type === 'coordinator' && (
                            <Link
                              to={`/jobs/${job.id}/applications`}
                              className="text-green-600 hover:text-green-900"
                              title="View Applications"
                            >
                              <UserGroupIcon className="h-4 w-4" />
                            </Link>
                          )}
                          {job.created_by_type === 'coordinator' && (
                            <button
                              onClick={() => setDeleteJobId(job.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Delete Job"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteJobId && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3 text-center">
                <TrashIcon className="mx-auto h-16 w-16 text-red-500" />
                <h3 className="text-lg font-medium text-gray-900 mt-4">Delete Job Posting</h3>
                <p className="text-sm text-gray-500 mt-2">
                  Are you sure you want to delete this job posting? This action cannot be undone.
                  All applications for this job will also be permanently deleted.
                </p>
                <div className="flex justify-center space-x-3 mt-6">
                  <button
                    onClick={() => setDeleteJobId(null)}
                    disabled={isDeleting}
                    className="px-4 py-2 bg-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-400 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDeleteJob(deleteJobId)}
                    disabled={isDeleting}
                    className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 disabled:opacity-50"
                  >
                    {isDeleting ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
