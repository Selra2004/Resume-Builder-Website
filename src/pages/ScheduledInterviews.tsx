import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { toast } from 'react-hot-toast';
import {
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  LinkIcon,
  CheckCircleIcon,
  XCircleIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';

interface ScheduledInterview {
  id: number;
  application_id: number;
  job_id: number;
  user_id: number;
  interview_date: string;
  interview_mode: 'onsite' | 'online';
  interview_location?: string;
  interview_link?: string;
  notes?: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
  
  // Application details
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  position_applying_for: string;
  profile_photo?: string;
  
  // Job details
  job_title: string;
  company_name: string;
  
  // Timing
  hours_until_interview: number;
  is_overdue: boolean;
}

interface ActionModalData {
  interview: ScheduledInterview;
  action: 'hire' | 'reject';
  reason?: string;
  details?: string;
}

export const ScheduledInterviews: React.FC = () => {
  const [interviews, setInterviews] = useState<ScheduledInterview[]>([]);
  const [filteredInterviews, setFilteredInterviews] = useState<ScheduledInterview[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  
  // Modal states
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionModalData, setActionModalData] = useState<ActionModalData | null>(null);

  useEffect(() => {
    fetchInterviews();
    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchInterviews, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    applyFilters();
  }, [interviews, statusFilter, dateFilter]);

  const fetchInterviews = async () => {
    try {
      setLoading(true);
      const response = await api.get('/interviews/scheduled');
      setInterviews(response.data);
    } catch (error) {
      console.error('Error fetching interviews:', error);
      toast.error('Failed to load scheduled interviews');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...interviews];

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(interview => interview.status === statusFilter);
    }

    // Filter by date
    const now = new Date();
    if (dateFilter === 'today') {
      filtered = filtered.filter(interview => {
        const interviewDate = new Date(interview.interview_date);
        return interviewDate.toDateString() === now.toDateString();
      });
    } else if (dateFilter === 'week') {
      const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(interview => {
        const interviewDate = new Date(interview.interview_date);
        return interviewDate >= now && interviewDate <= weekFromNow;
      });
    } else if (dateFilter === 'overdue') {
      filtered = filtered.filter(interview => interview.is_overdue);
    }

    // Sort by interview date (closest first)
    filtered.sort((a, b) => {
      const dateA = new Date(a.interview_date);
      const dateB = new Date(b.interview_date);
      return dateA.getTime() - dateB.getTime();
    });

    setFilteredInterviews(filtered);
  };

  const updateInterviewStatus = async (interviewId: number, status: string) => {
    try {
      setSubmitting(true);
      await api.patch(`/interviews/${interviewId}/status`, { status });
      
      if (status === 'completed') {
        toast.success('Interview marked as completed. You can now hire or reject the applicant.');
      } else {
        toast.success(`Interview status updated to ${status}`);
      }
      
      fetchInterviews();
    } catch (error: any) {
      console.error('Error updating interview status:', error);
      toast.error(error.response?.data?.message || 'Failed to update interview status');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePostInterviewAction = (interview: ScheduledInterview, action: 'hire' | 'reject') => {
    setActionModalData({ interview, action, reason: '', details: '' });
    setShowActionModal(true);
  };

  const submitPostInterviewAction = async () => {
    if (!actionModalData) return;

    try {
      setSubmitting(true);
      
      if (actionModalData.action === 'hire') {
        await api.post(`/jobs/applications/${actionModalData.interview.application_id}/hire`, {
          details: actionModalData.details
        });
        toast.success('Applicant hired successfully!');
      } else {
        await api.post(`/jobs/applications/${actionModalData.interview.application_id}/post-interview-reject`, {
          reason: actionModalData.reason
        });
        toast.success('Post-interview rejection sent to applicant');
      }

      setShowActionModal(false);
      setActionModalData(null);
      fetchInterviews();
      
    } catch (error: any) {
      console.error('Error processing post-interview action:', error);
      toast.error(error.response?.data?.message || 'Failed to process action');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const config = {
      scheduled: { color: 'bg-cyan-100 text-cyan-800', label: 'Scheduled' },
      completed: { color: 'bg-green-100 text-green-800', label: 'Completed' },
      cancelled: { color: 'bg-red-100 text-red-800', label: 'Cancelled' },
      no_show: { color: 'bg-gray-100 text-gray-800', label: 'No Show' }
    };

    const statusConfig = config[status as keyof typeof config] || config.scheduled;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig.color}`}>
        {statusConfig.label}
      </span>
    );
  };

  const getUrgencyColor = (hoursUntil: number, isOverdue: boolean) => {
    if (isOverdue) return 'border-l-red-500 bg-red-50';
    if (hoursUntil <= 1) return 'border-l-orange-500 bg-orange-50';
    if (hoursUntil <= 24) return 'border-l-yellow-500 bg-yellow-50';
    return 'border-l-blue-500 bg-white';
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      }),
      time: date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit'
      })
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading scheduled interviews...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Scheduled Interviews</h1>
          <p className="mt-2 text-sm text-gray-600">
            Manage all your scheduled interviews and make hiring decisions
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FunnelIcon className="h-4 w-4 inline mr-1" />
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full text-sm border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="all">All Status</option>
                <option value="scheduled">Scheduled</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="no_show">No Show</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <CalendarIcon className="h-4 w-4 inline mr-1" />
                Date Range
              </label>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full text-sm border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="all">All Dates</option>
                <option value="today">Today</option>
                <option value="week">Next 7 Days</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>

            <div className="flex items-end">
              <div className="text-sm text-gray-600">
                <div>Total: <span className="font-medium">{filteredInterviews.length}</span> interviews</div>
                <div>Scheduled: <span className="font-medium text-cyan-600">
                  {filteredInterviews.filter(i => i.status === 'scheduled').length}
                </span></div>
              </div>
            </div>
          </div>
        </div>

        {/* Interviews List */}
        <div className="space-y-4">
          {filteredInterviews.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No interviews found</h3>
              <p className="text-gray-600">No scheduled interviews match your current filters.</p>
            </div>
          ) : (
            filteredInterviews.map((interview) => {
              const { date, time } = formatDateTime(interview.interview_date);
              
              return (
                <div
                  key={interview.id}
                  className={`bg-white rounded-lg shadow-sm border-l-4 ${getUrgencyColor(interview.hours_until_interview, interview.is_overdue)} overflow-hidden`}
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      {/* Applicant Info */}
                      <div className="flex items-start space-x-4 flex-1">
                        {/* Profile Photo */}
                        <div className="flex-shrink-0">
                          {interview.profile_photo ? (
                            <img
                              src={interview.profile_photo}
                              alt={`${interview.first_name} ${interview.last_name}`}
                              className="h-12 w-12 rounded-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                                (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                              }}
                            />
                          ) : null}
                          <div className={`h-12 w-12 rounded-full bg-gray-300 flex items-center justify-center ${interview.profile_photo ? 'hidden' : ''}`}>
                            <UserIcon className="h-6 w-6 text-gray-600" />
                          </div>
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-medium text-gray-900">
                              {interview.first_name} {interview.last_name}
                            </h3>
                            {getStatusBadge(interview.status)}
                            {interview.is_overdue && (
                              <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded">
                                Overdue
                              </span>
                            )}
                          </div>

                          <p className="text-sm text-gray-600 mb-3">{interview.position_applying_for}</p>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                            <div className="space-y-2">
                              <div className="flex items-center">
                                <CalendarIcon className="h-4 w-4 mr-2 text-gray-400" />
                                <span className="font-medium">{date}</span>
                              </div>
                              <div className="flex items-center">
                                <ClockIcon className="h-4 w-4 mr-2 text-gray-400" />
                                <span>{time}</span>
                                {interview.hours_until_interview > 0 && (
                                  <span className="ml-2 text-xs text-gray-500">
                                    (in {interview.hours_until_interview}h)
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center">
                                <EnvelopeIcon className="h-4 w-4 mr-2 text-gray-400" />
                                <span>{interview.email}</span>
                              </div>
                              <div className="flex items-center">
                                <PhoneIcon className="h-4 w-4 mr-2 text-gray-400" />
                                <span>{interview.phone}</span>
                              </div>
                            </div>
                          </div>

                          {/* Interview Details */}
                          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-4 text-sm">
                              <div className="flex items-center">
                                {interview.interview_mode === 'onsite' ? (
                                  <MapPinIcon className="h-4 w-4 mr-2 text-gray-400" />
                                ) : (
                                  <LinkIcon className="h-4 w-4 mr-2 text-gray-400" />
                                )}
                                <span className="font-medium capitalize">{interview.interview_mode}</span>
                              </div>
                              <div className="text-gray-600">
                                {interview.interview_mode === 'onsite' ? interview.interview_location : interview.interview_link}
                              </div>
                            </div>
                            {interview.notes && (
                              <div className="mt-2 text-sm text-gray-600">
                                <strong>Notes:</strong> {interview.notes}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex-shrink-0 ml-4">
                        <div className="flex flex-col space-y-2">
                          {interview.status === 'scheduled' && (
                            <>
                              <button
                                onClick={() => updateInterviewStatus(interview.id, 'completed')}
                                disabled={submitting}
                                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                              >
                                <CheckCircleIcon className="h-4 w-4 mr-1" />
                                Mark Completed
                              </button>
                              <button
                                onClick={() => updateInterviewStatus(interview.id, 'no_show')}
                                disabled={submitting}
                                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                              >
                                <XCircleIcon className="h-4 w-4 mr-1" />
                                No Show
                              </button>
                            </>
                          )}

                          {interview.status === 'completed' && (
                            <>
                              <button
                                onClick={() => handlePostInterviewAction(interview, 'hire')}
                                disabled={submitting}
                                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
                              >
                                <CheckCircleIcon className="h-4 w-4 mr-1" />
                                Hire
                              </button>
                              <button
                                onClick={() => handlePostInterviewAction(interview, 'reject')}
                                disabled={submitting}
                                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
                              >
                                <XCircleIcon className="h-4 w-4 mr-1" />
                                Reject
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Action Modal */}
        {showActionModal && actionModalData && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-full max-w-lg shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {actionModalData.action === 'hire' ? 'Hire Applicant' : 'Reject After Interview'}
                </h3>
                <p className="text-sm text-gray-600 mb-6">
                  {actionModalData.action === 'hire' ? 'Hiring' : 'Rejecting'} {actionModalData.interview.first_name} {actionModalData.interview.last_name} for {actionModalData.interview.position_applying_for}
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {actionModalData.action === 'hire' ? 'Next Steps / Details' : 'Feedback / Reason'} (Optional)
                    </label>
                    <textarea
                      value={actionModalData.action === 'hire' ? actionModalData.details : actionModalData.reason}
                      onChange={(e) => setActionModalData(prev => prev ? {
                        ...prev,
                        [actionModalData.action === 'hire' ? 'details' : 'reason']: e.target.value
                      } : null)}
                      placeholder={actionModalData.action === 'hire' 
                        ? 'Provide next steps, start date, or other details...'
                        : 'Provide feedback to help the applicant improve...'
                      }
                      rows={4}
                      className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 ${
                        actionModalData.action === 'hire' ? 'focus:ring-purple-500' : 'focus:ring-red-500'
                      }`}
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
                  <button
                    onClick={() => setShowActionModal(false)}
                    disabled={submitting}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submitPostInterviewAction}
                    disabled={submitting}
                    className={`px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white disabled:opacity-50 ${
                      actionModalData.action === 'hire' 
                        ? 'bg-purple-600 hover:bg-purple-700'
                        : 'bg-red-600 hover:bg-red-700'
                    }`}
                  >
                    {submitting ? 'Processing...' : (actionModalData.action === 'hire' ? 'Hire Applicant' : 'Send Rejection')}
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
