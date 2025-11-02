import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../services/api';
import { toast } from 'react-hot-toast';
import { ApplicantRating } from '../../components/ApplicantRating';
import { RatingBreakdown } from '../../components/RatingBreakdown';
import {
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  DocumentTextIcon,
  CalendarIcon,
  LinkIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  ArrowLeftIcon,
  StarIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';

interface JobApplication {
  id: number;
  job_id: number;
  job_title: string;
  user_id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  position_applying_for: string;
  resume_type: 'uploaded' | 'builder_link';
  resume_file: string;
  resume_builder_link: string;
  interview_video: string;
  status: 'pending' | 'qualified' | 'rejected' | 'interview_scheduled' | 'interview_completed' | 'pending_review' | 'hired';
  created_at: string;
  updated_at: string;
  profile_photo: string;
  screening_answers: ScreeningAnswer[];
  scheduled_interview_date?: string;
  interview_id?: number;
  
  // Rating fields
  company_rating?: number;
  company_rating_comment?: string;
  average_rating?: number;
  rating_count?: number;
  all_ratings?: Array<{
    id: number;
    rating: number;
    comment: string | null;
    created_at: string;
    rated_by_type: 'coordinator' | 'company';
    rater_name: string;
    rater_photo: string | null;
    job_title?: string;
  }>;
  
  // Complete user rating profile across all applications
  user_rating_profile?: {
    overall_average_rating?: number;
    total_ratings?: number;
    highest_rating?: number;
    lowest_rating?: number;
    company_ratings_count?: number;
    coordinator_ratings_count?: number;
  };

  // Employment history with this company
  employment_count?: number;
  last_hired_date?: string;
  last_job_title?: string;
  current_employment_status?: string;
}

interface ScreeningAnswer {
  id: number;
  question_id: number;
  question_text: string;
  question_type: string;
  answer: string;
}

export const CompanyApplications: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [selectedApplication, setSelectedApplication] = useState<JobApplication | null>(null);
  const [showApplicationDetails, setShowApplicationDetails] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [ratingFilter, setRatingFilter] = useState<string>('all');
  
  // Accept/Reject Modal States
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [actionApplication, setActionApplication] = useState<JobApplication | null>(null);
  
  // Interview Scheduling Form
  const [interviewForm, setInterviewForm] = useState({
    date: '',
    time: '',
    mode: 'onsite' as 'onsite' | 'online',
    location: '',
    link: '',
    notes: ''
  });
  
  // Rejection Form
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    if (jobId) {
      fetchApplications();
    }
  }, [jobId]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/companies/jobs/${jobId}/applications`);
      setApplications(response.data.applications);
    } catch (error: any) {
      console.error('Failed to fetch applications:', error);
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const fetchApplicationDetails = async (applicationId: number) => {
    try {
      const response = await api.get(`/jobs/applications/${applicationId}/details`);
      setSelectedApplication(response.data);
      setShowApplicationDetails(true);
    } catch (error) {
      console.error('Failed to fetch application details:', error);
      toast.error('Failed to load application details');
    }
  };

  const handleDecision = async (decision: 'accepted' | 'rejected') => {
    if (!selectedApplication) return;

    // Check if current status is final
    if (['accepted', 'rejected', 'hired'].includes(selectedApplication.status)) {
      toast.error('Cannot change status: Application has been finalized');
      return;
    }

    if (decision === 'accepted') {
      // For acceptance, open the interview scheduling modal instead of direct hire
      setActionApplication(selectedApplication);
      // Reset interview form
      setInterviewForm({
        date: '',
        time: '',
        mode: 'onsite',
        location: '',
        link: '',
        notes: ''
      });
      setShowAcceptModal(true);
      return;
    }

    // For rejection, open the reject modal to get reason
    setActionApplication(selectedApplication);
    setRejectionReason('');
    setShowRejectModal(true);
  };

  const handleRatingSubmit = async (rating: number, comment: string) => {
    if (!selectedApplication) return;

    try {
      const response = await api.post(`/companies/applications/${selectedApplication.id}/rate`, {
        rating,
        comment
      });

      toast.success('Rating submitted successfully');
      
      // Update local state
      setApplications(apps => 
        apps.map(app => 
          app.id === selectedApplication.id 
            ? { 
                ...app, 
                company_rating: rating,
                company_rating_comment: comment,
                average_rating: response.data.average_rating,
                rating_count: response.data.rating_count
              }
            : app
        )
      );

      // Update selected application
      setSelectedApplication({
        ...selectedApplication,
        company_rating: rating,
        company_rating_comment: comment,
        average_rating: response.data.average_rating,
        rating_count: response.data.rating_count
      });

      await fetchApplications(); // Refresh to get updated sorting
    } catch (error) {
      console.error('Failed to submit rating:', error);
      toast.error('Failed to submit rating');
      throw error;
    }
  };

  // These functions are now handled by handleDecision() to maintain consistency

  // Submit Accept with Interview Scheduling
  const submitAccept = async () => {
    if (!actionApplication || !interviewForm.date || !interviewForm.time) {
      toast.error('Please fill in all required interview details');
      return;
    }

    const interviewDateTime = `${interviewForm.date} ${interviewForm.time}`;
    const locationOrLink = interviewForm.mode === 'onsite' ? interviewForm.location : interviewForm.link;

    if (!locationOrLink) {
      toast.error(`Please provide ${interviewForm.mode === 'onsite' ? 'location' : 'link'} for the interview`);
      return;
    }

    try {
      setLoading(true);
      
      // Accept application and schedule interview
      await api.post(`/jobs/applications/${actionApplication.id}/accept`, {
        interviewDate: interviewDateTime,
        interviewMode: interviewForm.mode,
        interviewLocation: interviewForm.mode === 'onsite' ? locationOrLink : null,
        interviewLink: interviewForm.mode === 'online' ? locationOrLink : null,
        notes: interviewForm.notes
      });

      toast.success('Application accepted and interview scheduled!');
      
      // Close modal and refresh
      setShowAcceptModal(false);
      setActionApplication(null);
      fetchApplications();
      
    } catch (error: any) {
      console.error('Failed to accept application:', error);
      toast.error(error.response?.data?.message || 'Failed to accept application');
    } finally {
      setLoading(false);
    }
  };

  // Submit Reject with Reason
  const submitReject = async () => {
    if (!actionApplication) return;

    try {
      setLoading(true);
      
      await api.post(`/jobs/applications/${actionApplication.id}/reject`, {
        reason: rejectionReason
      });

      toast.success('Application rejected and email sent to applicant');
      
      // Close modal and refresh
      setShowRejectModal(false);
      setActionApplication(null);
      fetchApplications();
      
    } catch (error: any) {
      console.error('Failed to reject application:', error);
      toast.error(error.response?.data?.message || 'Failed to reject application');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredApplications = () => {
    let filtered = applications;

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(app => app.status === statusFilter);
    }

    // Filter by rating
    if (ratingFilter !== 'all') {
      if (ratingFilter === 'rated') {
        filtered = filtered.filter(app => app.average_rating && app.average_rating > 0);
      } else if (ratingFilter === 'unrated') {
        filtered = filtered.filter(app => !app.average_rating || app.average_rating === 0);
      } else if (ratingFilter === 'high') {
        filtered = filtered.filter(app => app.average_rating && app.average_rating >= 4);
      } else if (ratingFilter === 'low') {
        filtered = filtered.filter(app => app.average_rating && app.average_rating < 3);
      }
    }

    return filtered;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; label: string }> = {
      pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
      qualified: { color: 'bg-green-100 text-green-800', label: 'Qualified' },
      interview_scheduled: { color: 'bg-cyan-100 text-cyan-800', label: 'Interview Scheduled' },
      interview_completed: { color: 'bg-indigo-100 text-indigo-800', label: 'Interview Completed' },
      pending_review: { color: 'bg-orange-100 text-orange-800', label: 'Pending Review' },
      rejected: { color: 'bg-red-100 text-red-800', label: 'Rejected' },
      hired: { color: 'bg-green-100 text-green-800', label: 'Hired' },
    };

    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const filteredApplications = getFilteredApplications();

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
            <div className="flex items-center space-x-4">
              <Link
                to="/company/jobs"
                className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-1" />
                Back to Jobs
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Job Applications</h1>
                <p className="mt-1 text-sm text-gray-600">
                  Review, rate, and make hiring decisions for your job applicants
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Company Features */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex">
            <CheckCircleIcon className="h-5 w-5 text-blue-400 mt-0.5" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">Company Hiring Features</h3>
              <div className="mt-2 text-sm text-blue-700">
                <ul className="list-disc pl-5 space-y-1">
                  <li>Accept or reject applicants directly - no coordinator approval needed</li>
                  <li>Rate applicants with stars and comments to help other employers</li>
                  <li>View detailed rating breakdowns from other companies and coordinators</li>
                  <li>Filter applicants by status and rating to find the best candidates</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
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
                <option value="pending">Pending</option>
                <option value="qualified">Qualified</option>
                <option value="interview_scheduled">Interview Scheduled</option>
                <option value="rejected">Rejected</option>
                <option value="hired">Hired</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <StarIcon className="h-4 w-4 inline mr-1" />
                Rating
              </label>
              <select
                value={ratingFilter}
                onChange={(e) => setRatingFilter(e.target.value)}
                className="w-full text-sm border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="all">All Ratings</option>
                <option value="high">High Rated (4+ stars)</option>
                <option value="rated">Has Rating</option>
                <option value="unrated">Not Rated</option>
                <option value="low">Low Rated (&lt;3 stars)</option>
              </select>
            </div>

            <div className="flex items-end">
              <div className="text-sm text-gray-600">
                Showing {filteredApplications.length} of {applications.length} applications
              </div>
            </div>
          </div>
        </div>

        {/* Applications List */}
        <div className="space-y-4">
          {filteredApplications.length === 0 ? (
            <div className="bg-white shadow rounded-lg p-12">
              <div className="text-center">
                <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No applications found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {applications.length === 0
                    ? "No one has applied to this job yet."
                    : "No applications match your current filters."
                  }
                </p>
              </div>
            </div>
          ) : (
            filteredApplications.map((application) => (
              <div key={application.id} className="bg-white shadow rounded-lg p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    {/* Profile Photo */}
                    <div className="flex-shrink-0">
                      {application.profile_photo ? (
                        <img
                          className="h-14 w-14 rounded-full object-cover"
                          src={application.profile_photo}
                          alt={`${application.first_name} ${application.last_name}`}
                          onError={(e) => {
                            console.error('❌ Image failed to load:', application.profile_photo);
                            (e.target as HTMLImageElement).style.display = 'none';
                            (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                      ) : null}
                      <div className={`h-14 w-14 rounded-full bg-gray-300 flex items-center justify-center ${application.profile_photo ? 'hidden' : ''}`}>
                        <UserIcon className="h-7 w-7 text-gray-600" />
                      </div>
                    </div>

                    {/* Application Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-medium text-gray-900">
                          {application.first_name} {application.last_name}
                        </h3>
                        {getStatusBadge(application.status)}
                      </div>

                      <div className="flex flex-wrap items-center text-sm text-gray-500 space-x-4 mb-3">
                        <div className="flex items-center">
                          <EnvelopeIcon className="h-4 w-4 mr-1" />
                          {application.email}
                        </div>
                        <div className="flex items-center">
                          <PhoneIcon className="h-4 w-4 mr-1" />
                          {application.phone}
                        </div>
                        <div className="flex items-center">
                          <CalendarIcon className="h-4 w-4 mr-1" />
                          Applied {new Date(application.created_at).toLocaleDateString()}
                        </div>
                      </div>

                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm text-gray-600">
                          <strong>Position:</strong> {application.position_applying_for}
                        </p>
                        
                        {/* Overall Rating Display */}
                        {application.user_rating_profile?.overall_average_rating && Number(application.user_rating_profile.overall_average_rating) > 0 ? (
                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2 flex items-center space-x-2">
                            <StarIcon className="h-4 w-4 text-yellow-500 fill-current" />
                            <div className="text-center">
                              <div className="text-sm font-semibold text-yellow-900">
                                {Number(application.user_rating_profile.overall_average_rating).toFixed(1)}
                              </div>
                              <div className="text-xs text-yellow-700">
                                {application.user_rating_profile.total_ratings || 0} rating{(application.user_rating_profile.total_ratings || 0) !== 1 ? 's' : ''}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-center">
                            <div className="text-xs text-gray-500">No ratings yet</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2 ml-4">
                    {/* Accept/Decline buttons for non-final statuses */}
                    {!['interview_scheduled', 'rejected', 'hired'].includes(application.status) && (
                      <>
                        <button
                          onClick={() => {
                            setSelectedApplication(application);
                            handleDecision('accepted');
                          }}
                          className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircleIcon className="h-4 w-4 mr-1" />
                          Accept
                        </button>

                        <button
                          onClick={() => {
                            setSelectedApplication(application);
                            handleDecision('rejected');
                          }}
                          className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                        >
                          <XCircleIcon className="h-4 w-4 mr-1" />
                          Reject
                        </button>
                      </>
                    )}

                    {/* Status indicator for final statuses */}
                    {['interview_scheduled', 'rejected', 'hired'].includes(application.status) && (
                      <div className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                        Status: {application.status.replace('_', ' ').toUpperCase()}
                      </div>
                    )}

                    <button
                      onClick={() => fetchApplicationDetails(application.id)}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <EyeIcon className="h-4 w-4 mr-1" />
                      View Details
                    </button>
                  </div>
                </div>

              </div>
            ))
          )}
        </div>


        {/* Application Details Modal */}
        {showApplicationDetails && selectedApplication && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-8 mx-auto p-5 border max-w-5xl shadow-lg rounded-md bg-white mb-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  Application Details - {selectedApplication.first_name} {selectedApplication.last_name}
                </h3>
                <button
                  onClick={() => setShowApplicationDetails(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircleIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Application Info (2/3 width) */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Personal Information */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h4>
                    
                    {/* Profile Photo - Centered at top */}
                    <div className="flex justify-center mb-6">
                      {selectedApplication.profile_photo ? (
                        <img
                          src={selectedApplication.profile_photo}
                          alt={`${selectedApplication.first_name} ${selectedApplication.last_name}`}
                          className="h-24 w-24 rounded-full object-cover border-4 border-gray-200 shadow-md"
                          onError={(e) => {
                            console.error('❌ Selected application image failed to load:', selectedApplication.profile_photo);
                            (e.target as HTMLImageElement).style.display = 'none';
                            (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                      ) : null}
                      <div className={`h-24 w-24 rounded-full bg-gray-200 flex items-center justify-center border-4 border-gray-200 shadow-md ${selectedApplication.profile_photo ? 'hidden' : ''}`}>
                        <UserIcon className="h-12 w-12 text-gray-400" />
                      </div>
                    </div>

                    {/* Employment History Alert */}
                    {selectedApplication.employment_count && selectedApplication.employment_count > 0 && (
                      <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="flex items-center">
                          <CheckCircleIcon className="h-5 w-5 text-yellow-500 mr-2" />
                          <div className="flex-1">
                            <h4 className="text-sm font-medium text-yellow-800">
                              Previously Hired by Your Company
                            </h4>
                            <p className="text-sm text-yellow-700 mt-1">
                              This applicant was hired {selectedApplication.employment_count} time(s) by your company.
                              Last position: <span className="font-medium">{selectedApplication.last_job_title}</span>
                              {selectedApplication.last_hired_date && (
                                <span> on {new Date(selectedApplication.last_hired_date).toLocaleDateString()}</span>
                              )}
                              {selectedApplication.current_employment_status && (
                                <span className="block mt-1">
                                  Current status: <span className="font-medium capitalize">{selectedApplication.current_employment_status.replace('_', ' ')}</span>
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Applicant Information - Centered below photo */}
                    <div className="text-center mb-4">
                      <h5 className="text-xl font-semibold text-gray-900">
                        {selectedApplication.first_name} {selectedApplication.last_name}
                      </h5>
                      <p className="text-sm text-gray-600">{selectedApplication.position_applying_for}</p>
                      <div className="mt-2 flex justify-center">
                        {getStatusBadge(selectedApplication.status)}
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center text-sm">
                        <EnvelopeIcon className="h-5 w-5 text-gray-400 mr-3" />
                        <span className="text-gray-700">{selectedApplication.email}</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <PhoneIcon className="h-5 w-5 text-gray-400 mr-3" />
                        <span className="text-gray-700">{selectedApplication.phone}</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <CalendarIcon className="h-5 w-5 text-gray-400 mr-3" />
                        <span className="text-gray-700">
                          Applied on {new Date(selectedApplication.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Resume */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Resume</h4>
                    {selectedApplication.resume_type === 'uploaded' && selectedApplication.resume_file ? (
                      <a
                        href={selectedApplication.resume_file}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      >
                        <DocumentTextIcon className="h-5 w-5 mr-2" />
                        View Uploaded Resume
                      </a>
                    ) : selectedApplication.resume_type === 'builder_link' && selectedApplication.resume_builder_link ? (
                      <a
                        href={selectedApplication.resume_builder_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      >
                        <LinkIcon className="h-5 w-5 mr-2" />
                        View Resume Builder Link
                      </a>
                    ) : (
                      <p className="text-sm text-gray-500">No resume provided</p>
                    )}
                  </div>

                  {/* Interview Video */}
                  {selectedApplication.interview_video && (
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <h4 className="text-lg font-medium text-gray-900 mb-4">Interview Video</h4>
                      <a
                        href={selectedApplication.interview_video}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      >
                        <LinkIcon className="h-5 w-5 mr-2" />
                        Watch Interview Video
                      </a>
                    </div>
                  )}

                  {/* Screening Questions */}
                  {selectedApplication.screening_answers && selectedApplication.screening_answers.length > 0 && (
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <h4 className="text-lg font-medium text-gray-900 mb-4">Screening Questions</h4>
                      <div className="space-y-4">
                        {selectedApplication.screening_answers.map((answer, index) => (
                          <div key={answer.id} className="border-b border-gray-200 pb-4 last:border-b-0">
                            <p className="text-sm font-medium text-gray-900 mb-2">
                              {index + 1}. {answer.question_text}
                            </p>
                            <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">
                              {answer.answer}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Column - Actions & Rating (1/3 width) */}
                <div className="space-y-6">
                  {/* Decision Actions */}
                  {['interview_scheduled', 'rejected', 'hired'].includes(selectedApplication.status) ? (
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <h4 className="text-lg font-medium text-gray-900 mb-4">Application Status</h4>
                      <div className="text-center py-4">
                        <p className="text-sm text-gray-600 mb-2">
                          {selectedApplication.status === 'interview_scheduled' 
                            ? 'Interview has been scheduled. Check Scheduled Interviews page.'
                            : 'Application status is final'
                          }
                        </p>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(selectedApplication.status).props.className}`}>
                          {selectedApplication.status === 'interview_scheduled' && <CalendarIcon className="w-4 h-4 mr-2" />}
                          {selectedApplication.status === 'hired' && <CheckCircleIcon className="w-4 h-4 mr-2" />}
                          {selectedApplication.status === 'rejected' && <XCircleIcon className="w-4 h-4 mr-2" />}
                          {selectedApplication.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <h4 className="text-lg font-medium text-gray-900 mb-4">Decision</h4>
                      <div className="space-y-3">
                        <button
                          onClick={() => handleDecision('accepted')}
                          className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircleIcon className="h-5 w-5 mr-2" />
                          Accept & Schedule Interview
                        </button>
                        <button
                          onClick={() => handleDecision('rejected')}
                          className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
                        >
                          <XCircleIcon className="h-5 w-5 mr-2" />
                          Reject Applicant
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Rating Section */}
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-blue-200">
                      <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                        <StarIcon className="h-5 w-5 text-blue-500 mr-2" />
                        Rate Applicant
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Rate this applicant's overall performance and suitability
                      </p>
                    </div>
                    <div className="p-6">
                      <ApplicantRating
                        currentRating={selectedApplication.company_rating}
                        currentComment={selectedApplication.company_rating_comment}
                        onSubmit={handleRatingSubmit}
                        averageRating={selectedApplication.user_rating_profile?.overall_average_rating}
                        ratingCount={selectedApplication.user_rating_profile?.total_ratings}
                      />
                    </div>
                  </div>

                  {/* Rating History */}
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-green-200">
                      <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                        <StarIcon className="h-5 w-5 text-green-500 mr-2" />
                        Applicant's Rating History
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Complete rating history from all job applications and interactions
                      </p>
                    </div>
                    <div className="p-6">
                      <RatingBreakdown
                        ratings={selectedApplication.all_ratings || []}
                        averageRating={selectedApplication.user_rating_profile?.overall_average_rating}
                        totalCount={selectedApplication.user_rating_profile?.total_ratings}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Accept Modal - Interview Scheduling */}
        {showAcceptModal && actionApplication && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Schedule Interview
                  </h3>
                  <button
                    onClick={() => setShowAcceptModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircleIcon className="h-6 w-6" />
                  </button>
                </div>
                
                <p className="text-sm text-gray-600 mb-4">
                  Accept {actionApplication.first_name} {actionApplication.last_name}'s application and schedule an interview.
                </p>

                <div className="space-y-4">
                  {/* Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Interview Date</label>
                    <input
                      type="date"
                      value={interviewForm.date}
                      onChange={(e) => setInterviewForm(prev => ({ ...prev, date: e.target.value }))}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-primary-500 focus:border-primary-500"
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>

                  {/* Time */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Interview Time</label>
                    <input
                      type="time"
                      value={interviewForm.time}
                      onChange={(e) => setInterviewForm(prev => ({ ...prev, time: e.target.value }))}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>

                  {/* Mode */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Interview Mode</label>
                    <select
                      value={interviewForm.mode}
                      onChange={(e) => setInterviewForm(prev => ({ ...prev, mode: e.target.value as 'onsite' | 'online' }))}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="onsite">On-site</option>
                      <option value="online">Online</option>
                    </select>
                  </div>

                  {/* Location or Link */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      {interviewForm.mode === 'onsite' ? 'Location' : 'Meeting Link'}
                    </label>
                    <input
                      type={interviewForm.mode === 'online' ? 'url' : 'text'}
                      value={interviewForm.mode === 'onsite' ? interviewForm.location : interviewForm.link}
                      onChange={(e) => {
                        if (interviewForm.mode === 'onsite') {
                          setInterviewForm(prev => ({ ...prev, location: e.target.value }));
                        } else {
                          setInterviewForm(prev => ({ ...prev, link: e.target.value }));
                        }
                      }}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder={interviewForm.mode === 'onsite' ? 'Enter interview location' : 'Enter meeting link (e.g., Zoom, Teams)'}
                    />
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Notes (Optional)</label>
                    <textarea
                      value={interviewForm.notes}
                      onChange={(e) => setInterviewForm(prev => ({ ...prev, notes: e.target.value }))}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-primary-500 focus:border-primary-500"
                      rows={3}
                      placeholder="Any additional notes for the interview..."
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setShowAcceptModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submitAccept}
                    disabled={loading}
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 disabled:opacity-50"
                  >
                    {loading ? 'Scheduling...' : 'Accept & Schedule Interview'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Reject Modal */}
        {showRejectModal && actionApplication && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Reject Application
                  </h3>
                  <button
                    onClick={() => setShowRejectModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircleIcon className="h-6 w-6" />
                  </button>
                </div>
                
                <p className="text-sm text-gray-600 mb-4">
                  Reject {actionApplication.first_name} {actionApplication.last_name}'s application. This will send them an email notification.
                </p>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason for Rejection (Optional)
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-primary-500 focus:border-primary-500"
                    rows={4}
                    placeholder="Provide feedback to help the applicant improve..."
                  />
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setShowRejectModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submitReject}
                    disabled={loading}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 disabled:opacity-50"
                  >
                    {loading ? 'Rejecting...' : 'Reject Application'}
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
