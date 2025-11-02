import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { toast } from 'react-hot-toast';
import { ApplicantRating } from '../components/ApplicantRating';
import { RatingBreakdown } from '../components/RatingBreakdown';
import {
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  DocumentTextIcon,
  CheckIcon,
  XMarkIcon,
  EyeIcon,
  FunnelIcon,
  ArrowLeftIcon,
  CalendarIcon,
  LinkIcon,
  StarIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

interface JobApplication {
  id: number;
  job_id: number;
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
  status: 'pending' | 'qualified' | 'rejected' | 'accepted' | 'interview_scheduled' | 'interview_completed' | 'pending_review' | 'hired';
  created_at: string;
  updated_at: string;
  profile_photo: string;
  overall_score: number;
  skill_match_score: number;
  experience_match_score: number;
  comment_count: number;
  screening_answers: ScreeningAnswer[];
  scheduled_interview_date?: string;
  interview_id?: number;
  
  // Employment history fields
  employment_count?: number;
  last_hired_date?: string;
  last_job_title?: string;
  current_employment_status?: string;
  
  // Rating fields
  user_rating?: number;
  user_rating_comment?: string;
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
}

interface ScreeningAnswer {
  id: number;
  question_id: number;
  question_text: string;
  question_type: string;
  answer: string;
  options: string[] | null;
}

interface JobDetails {
  id: number;
  title: string;
  company_name: string;
  created_by_type: string;
  created_by_id: number;
  filter_pre_screening: boolean;
}

export const ReviewApplications: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [job, setJob] = useState<JobDetails | null>(null);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<JobApplication[]>([]);
  const [selectedApplication, setSelectedApplication] = useState<JobApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [ratingFilter, setRatingFilter] = useState<string>('all');
  const [preScreeningFilter, setPreScreeningFilter] = useState<boolean>(false);
  const [showApplicationDetails, setShowApplicationDetails] = useState(false);
  const [jobOwnership, setJobOwnership] = useState<{created_by_type: string, created_by_id: number} | null>(null);
  
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
    if (id) {
      fetchJobDetails();
      fetchApplications();
    }
  }, [id]);

  useEffect(() => {
    const applyFilters = async () => {
      await filterApplications();
    };
    applyFilters();
  }, [applications, statusFilter, ratingFilter, preScreeningFilter]);

  const fetchJobDetails = async () => {
    try {
      const response = await api.get(`/jobs/${id}`);
      setJob(response.data);
      setJobOwnership({
        created_by_type: response.data.created_by_type,
        created_by_id: response.data.created_by_id
      });
    } catch (error) {
      console.error('Failed to fetch job details:', error);
      toast.error('Failed to load job details');
    }
  };

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/jobs/${id}/applications`);
      setApplications(response.data.applications || []);
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


  const filterApplications = async () => {
    let filtered = [...applications];

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(app => app.status === statusFilter);
    }

    // Rating filter
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

    // Pre-screening filter
    if (preScreeningFilter && job?.filter_pre_screening) {
      try {
        const response = await api.post(`/jobs/${id}/applications/filter`, {
          filterCriteria: {} // Can be extended with specific criteria
        });
        
        // Use the filtered applications from the backend
        const filteredByScreening = response.data.applications;
        const filteredIds = new Set(filteredByScreening.map((app: any) => app.id));
        
        filtered = filtered.filter(app => filteredIds.has(app.id));
        
        toast.success(`Filtered ${filteredByScreening.length} applications that meet pre-screening standards`);
      } catch (error: any) {
        console.error('Failed to apply pre-screening filter:', error);
        toast.error(error.response?.data?.message || 'Failed to apply pre-screening filter');
        // Continue with unfiltered results
      }
    }

    setFilteredApplications(filtered);
  };


  // Open Accept Modal
  const handleAccept = (application: JobApplication) => {
    setActionApplication(application);
    setInterviewForm({
      date: '',
      time: '',
      mode: 'onsite',
      location: '',
      link: '',
      notes: ''
    });
    setShowAcceptModal(true);
  };

  // Open Reject Modal
  const handleReject = (application: JobApplication) => {
    setActionApplication(application);
    setRejectionReason('');
    setShowRejectModal(true);
  };

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
      setSubmitting(true);
      
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
      setSubmitting(false);
    }
  };

  // Submit Reject with Reason
  const submitReject = async () => {
    if (!actionApplication) return;

    try {
      setSubmitting(true);
      
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
      setSubmitting(false);
    }
  };


  const handleRatingSubmit = async (rating: number, comment: string) => {
    if (!selectedApplication) return;

    // Coordinators can only rate their own job applicants
    if (user?.role === 'coordinator') {
      if (jobOwnership?.created_by_type !== 'coordinator' || jobOwnership.created_by_id !== user.id) {
        toast.error('You can only rate applicants for your own job postings');
        throw new Error('Permission denied');
      }
    }

    try {
      const response = await api.post(`/jobs/applications/${selectedApplication.id}/rate`, {
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
                user_rating: rating,
                user_rating_comment: comment,
                average_rating: response.data.average_rating,
                rating_count: response.data.rating_count
              }
            : app
        )
      );

      // Update selected application
      setSelectedApplication({
        ...selectedApplication,
        user_rating: rating,
        user_rating_comment: comment,
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'qualified': return 'bg-green-100 text-green-800';
      case 'accepted': return 'bg-emerald-100 text-emerald-800';
      case 'interview_scheduled': return 'bg-cyan-100 text-cyan-800';
      case 'interview_completed': return 'bg-indigo-100 text-indigo-800';
      case 'pending_review': return 'bg-orange-100 text-orange-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'hired': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading applications...</p>
        </div>
      </div>
    );
  }

  // Determine if this is coordinator's own job or a company job
  const isOwnJob = jobOwnership?.created_by_type === 'coordinator' && jobOwnership.created_by_id === user?.id;
  const isCompanyJob = jobOwnership?.created_by_type === 'company';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <button
              onClick={() => navigate(`/jobs/${id}`)}
              className="flex items-center text-sm text-gray-500 hover:text-gray-700 mb-2"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-1" />
              Back to Job Details
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Review Applications</h1>
            {job && (
              <div className="mt-2 flex items-center space-x-3">
                <p className="text-gray-600">
                  {job.title} • {applications.length} applications
                </p>
                {isCompanyJob && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    View Only - Company Job
                  </span>
                )}
                {isOwnJob && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Your Job - Full Access
                  </span>
                )}
              </div>
            )}
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
              <option value="accepted">Accepted</option>
              <option value="interview_scheduled">Interview Scheduled</option>
              <option value="interview_completed">Interview Completed</option>
              <option value="pending_review">Pending Review</option>
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

          {job?.filter_pre_screening && (
            <div className="flex items-end">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={preScreeningFilter}
                  onChange={(e) => setPreScreeningFilter(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                />
                <span className="ml-2 text-sm text-gray-700">Filter by pre-screening standards</span>
              </label>
            </div>
          )}
        </div>
      </div>

      {/* Applications List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">
            Applications ({filteredApplications.length})
          </h2>
        </div>

        {filteredApplications.length === 0 ? (
          <div className="p-8 text-center">
            <UserIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No applications found with the selected filters.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredApplications.map((application) => (
              <div key={application.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      {application.profile_photo ? (
                        <img
                          className="h-12 w-12 rounded-full object-cover"
                          src={application.profile_photo}
                          alt={`${application.first_name} ${application.last_name}`}
                          onLoad={() => {
                            console.log('✅ Image loaded successfully:', application.profile_photo);
                          }}
                          onError={(e) => {
                            console.error('❌ Image failed to load:', application.profile_photo);
                            (e.target as HTMLImageElement).style.display = 'none';
                            (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                      ) : null}
                      <div className={`h-12 w-12 rounded-full bg-gray-300 flex items-center justify-center ${application.profile_photo ? 'hidden' : ''}`}>
                        <UserIcon className="h-6 w-6 text-gray-600" />
                      </div>
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-medium text-gray-900">
                          {application.first_name} {application.last_name}
                        </h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(application.status)}`}>
                          {application.status.replace('_', ' ')}
                        </span>
                      </div>
                      
                      <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                        <span className="flex items-center">
                          <EnvelopeIcon className="h-4 w-4 mr-1" />
                          {application.email}
                        </span>
                        <span className="flex items-center">
                          <PhoneIcon className="h-4 w-4 mr-1" />
                          {application.phone}
                        </span>
                        <span className="flex items-center">
                          <CalendarIcon className="h-4 w-4 mr-1" />
                          Applied {formatDate(application.created_at)}
                        </span>
                      </div>
                      
                      <div className="mt-2 flex items-center space-x-4 text-sm">
                        <span className="text-gray-600">Position: {application.position_applying_for}</span>
                        {application.overall_score > 0 && (
                          <span className="text-blue-600">ATS Score: {application.overall_score}%</span>
                        )}
                        {application.user_rating_profile?.overall_average_rating && Number(application.user_rating_profile.overall_average_rating) > 0 ? (
                          <div className="bg-purple-50 border border-purple-200 rounded px-2 py-1 flex items-center space-x-1">
                            <StarIcon className="h-3 w-3 text-purple-500 fill-current" />
                            <span className="text-xs font-semibold text-purple-900">
                              {Number(application.user_rating_profile.overall_average_rating).toFixed(1)} ({application.user_rating_profile.total_ratings || 0})
                            </span>
                          </div>
                        ) : (
                          <div className="bg-gray-50 border border-gray-200 rounded px-2 py-1">
                            <span className="text-xs text-gray-500">No ratings</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => fetchApplicationDetails(application.id)}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <EyeIcon className="h-4 w-4 mr-2" />
                      View Details
                    </button>

                    {/* Only show accept/decline for coordinator's own jobs */}
                    {user?.role === 'coordinator' && isOwnJob && (
                      <div className="flex space-x-2">
                        {!['accepted', 'rejected', 'hired'].includes(application.status) && (
                          <>
                            <button
                              onClick={() => handleAccept(application)}
                              disabled={submitting}
                              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                            >
                              <CheckIcon className="h-4 w-4 mr-1" />
                              Accept
                            </button>
                            <button
                              onClick={() => handleReject(application)}
                              disabled={submitting}
                              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                            >
                              <XMarkIcon className="h-4 w-4 mr-1" />
                              Reject
                            </button>
                          </>
                        )}
                        
                        {['accepted', 'rejected', 'hired'].includes(application.status) && (
                          <div className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                            Status: {application.status.replace('_', ' ').toUpperCase()}
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* View-only message for company jobs */}
                    {isCompanyJob && (
                      <div className="text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded">
                        View Only - Company Job
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Application Details Modal */}
      {showApplicationDetails && selectedApplication && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-8 mx-auto p-5 border max-w-4xl shadow-lg rounded-md bg-white mb-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900">
                Application Details - {selectedApplication.first_name} {selectedApplication.last_name}
              </h3>
              <button
                onClick={() => setShowApplicationDetails(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Application Information */}
              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h4>
                  
                  {/* Profile Photo */}
                  <div className="flex justify-center mb-6">
                    {selectedApplication.profile_photo ? (
                      <img
                        src={selectedApplication.profile_photo}
                        alt={`${selectedApplication.first_name} ${selectedApplication.last_name}`}
                        className="h-24 w-24 rounded-full object-cover border-4 border-gray-200 shadow-md"
                        onError={(e) => {
                          console.error('❌ Details modal image failed to load:', selectedApplication.profile_photo);
                          (e.target as HTMLImageElement).style.display = 'none';
                          (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <div className={`h-24 w-24 rounded-full bg-gray-200 flex items-center justify-center border-4 border-gray-200 shadow-md ${selectedApplication.profile_photo ? 'hidden' : ''}`}>
                      <UserIcon className="h-12 w-12 text-gray-400" />
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Full Name</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedApplication.first_name} {selectedApplication.last_name}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedApplication.email}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Phone</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedApplication.phone}</p>
                    </div>
                    {selectedApplication.address && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Address</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedApplication.address}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Employment History Alert */}
                {selectedApplication.employment_count && selectedApplication.employment_count > 0 && (
                  <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <CheckCircleIcon className="h-5 w-5 text-yellow-500 mr-2" />
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-yellow-800">
                          Previously Hired by Related Company
                        </h4>
                        <p className="text-sm text-yellow-700 mt-1">
                          This applicant was hired {selectedApplication.employment_count} time(s) by a company you coordinate.
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

                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Application Details</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Position Applying For</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedApplication.position_applying_for}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Resume</label>
                      <div className="mt-1">
                        {selectedApplication.resume_type === 'uploaded' && selectedApplication.resume_file ? (
                          <a
                            href={`/uploads/resumes/${selectedApplication.resume_file}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
                          >
                            <DocumentTextIcon className="h-4 w-4 mr-1" />
                            View Resume File
                          </a>
                        ) : selectedApplication.resume_builder_link ? (
                          <a
                            href={selectedApplication.resume_builder_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
                          >
                            <LinkIcon className="h-4 w-4 mr-1" />
                            View Resume Builder
                          </a>
                        ) : (
                          <p className="text-sm text-gray-500">No resume provided</p>
                        )}
                      </div>
                    </div>
                    {selectedApplication.interview_video && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Interview Video</label>
                        <a
                          href={selectedApplication.interview_video}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
                        >
                          <LinkIcon className="h-4 w-4 mr-1" />
                          Watch Interview Video
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Screening Questions */}
                {selectedApplication.screening_answers && selectedApplication.screening_answers.length > 0 && (
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Screening Questions</h4>
                    <div className="space-y-4">
                      {selectedApplication.screening_answers.map((answer, _index) => (
                        <div key={answer.id} className="border border-gray-200 rounded-lg p-4">
                          <h5 className="font-medium text-gray-900 mb-2">{answer.question_text}</h5>
                          <p className="text-sm text-gray-700">{answer.answer}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-6">
                {/* Status Actions - Only for Own Jobs */}
                {isOwnJob && (
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Status & Actions</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-sm text-gray-700">Current Status:</span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedApplication.status)}`}>
                          {selectedApplication.status.replace('_', ' ')}
                        </span>
                      </div>
                      
                      {['accepted', 'rejected', 'hired'].includes(selectedApplication.status) ? (
                        <div className="text-center py-4">
                          <p className="text-sm text-gray-600 mb-2">Application status is final</p>
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedApplication.status)}`}>
                            {selectedApplication.status.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>
                      ) : (
                        <div className="flex space-x-3">
                          <button
                            onClick={() => handleAccept(selectedApplication)}
                            disabled={submitting}
                            className="flex-1 px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleReject(selectedApplication)}
                            disabled={submitting}
                            className="flex-1 px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* View Only Notice for Company Jobs */}
                {isCompanyJob && (
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 px-6 py-4 border-b border-amber-200">
                      <h4 className="text-lg font-semibold text-amber-900 flex items-center">
                        <StarIcon className="h-5 w-5 text-amber-600 mr-2" />
                        Company Job - View Only
                      </h4>
                    </div>
                    <div className="p-6">
                      <p className="text-sm text-amber-700">
                        View only - This is a company job. You can view and rate applicants but cannot change their status.
                      </p>
                    </div>
                  </div>
                )}

                {/* Rating Section - Only for Own Jobs */}
                {isOwnJob && (
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 px-6 py-4 border-b border-purple-200">
                      <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                        <StarIcon className="h-5 w-5 text-purple-500 mr-2" />
                        Rate Applicant
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Rate this applicant's overall performance and suitability
                      </p>
                    </div>
                    <div className="p-6">
                      <ApplicantRating
                        currentRating={selectedApplication.user_rating}
                        currentComment={selectedApplication.user_rating_comment}
                        onSubmit={handleRatingSubmit}
                        averageRating={selectedApplication.user_rating_profile?.overall_average_rating}
                        ratingCount={selectedApplication.user_rating_profile?.total_ratings}
                      />
                    </div>
                  </div>
                )}

                {/* Rating History */}
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                  <div className="bg-gradient-to-r from-emerald-50 to-teal-50 px-6 py-4 border-b border-emerald-200">
                    <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                      <StarIcon className="h-5 w-5 text-emerald-500 mr-2" />
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

      {/* Accept Application Modal */}
      {showAcceptModal && actionApplication && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Accept Application - Schedule Interview
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                Accepting {actionApplication.first_name} {actionApplication.last_name} for {actionApplication.position_applying_for}
              </p>

              <div className="space-y-4">
                {/* Date and Time */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Interview Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={interviewForm.date}
                      onChange={(e) => setInterviewForm(prev => ({ ...prev, date: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Interview Time <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="time"
                      value={interviewForm.time}
                      onChange={(e) => setInterviewForm(prev => ({ ...prev, time: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>

                {/* Interview Mode */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Interview Mode <span className="text-red-500">*</span>
                  </label>
                  <div className="flex space-x-4">
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        value="onsite"
                        checked={interviewForm.mode === 'onsite'}
                        onChange={(e) => setInterviewForm(prev => ({ ...prev, mode: e.target.value as 'onsite' | 'online' }))}
                        className="form-radio h-4 w-4 text-green-600"
                      />
                      <span className="ml-2 text-sm text-gray-700">Onsite</span>
                    </label>
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        value="online"
                        checked={interviewForm.mode === 'online'}
                        onChange={(e) => setInterviewForm(prev => ({ ...prev, mode: e.target.value as 'onsite' | 'online' }))}
                        className="form-radio h-4 w-4 text-green-600"
                      />
                      <span className="ml-2 text-sm text-gray-700">Online</span>
                    </label>
                  </div>
                </div>

                {/* Location or Link */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {interviewForm.mode === 'onsite' ? 'Interview Location' : 'Interview Link'} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type={interviewForm.mode === 'onsite' ? 'text' : 'url'}
                    value={interviewForm.mode === 'onsite' ? interviewForm.location : interviewForm.link}
                    onChange={(e) => setInterviewForm(prev => ({ 
                      ...prev, 
                      [interviewForm.mode === 'onsite' ? 'location' : 'link']: e.target.value 
                    }))}
                    placeholder={interviewForm.mode === 'onsite' ? 'Enter interview location' : 'Enter interview link (e.g., Zoom, Meet)'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                {/* Additional Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Notes / Instructions (Optional)
                  </label>
                  <textarea
                    value={interviewForm.notes}
                    onChange={(e) => setInterviewForm(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Any additional information for the applicant..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
                <button
                  onClick={() => setShowAcceptModal(false)}
                  disabled={submitting}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={submitAccept}
                  disabled={submitting || !interviewForm.date || !interviewForm.time}
                  className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                >
                  {submitting ? 'Accepting...' : 'Accept & Schedule Interview'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Application Modal */}
      {showRejectModal && actionApplication && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-lg shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Reject Application
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                Rejecting {actionApplication.first_name} {actionApplication.last_name} for {actionApplication.position_applying_for}
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason for Rejection (Optional)
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Provide feedback to help the applicant improve..."
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    This message will be included in the rejection email sent to the applicant.
                  </p>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
                <button
                  onClick={() => setShowRejectModal(false)}
                  disabled={submitting}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={submitReject}
                  disabled={submitting}
                  className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
                >
                  {submitting ? 'Rejecting...' : 'Reject Application'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
