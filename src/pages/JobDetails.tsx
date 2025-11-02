import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { toast } from 'react-hot-toast';
import { JobRating } from '../components/JobRating';
import { RatingDisplay } from '../components/RatingDisplay';
import { ProfileRating } from '../components/ProfileRating';
import { 
  MapPinIcon, 
  BriefcaseIcon, 
  CalendarIcon,
  BuildingOfficeIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  ClockIcon,
  StarIcon,
  AcademicCapIcon,
  PencilIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

interface JobDetail {
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
  video_url: string;
  company_name: string;
  coordinator_name: string;
  business_owner_name: string;
  created_by_name: string;
  created_by_type: string;
  created_by_id: number;
  application_deadline: string;
  positions_available: number;
  experience_level: string;
  application_count: number;
  average_rating: number;
  rating_count: number;
  created_at: string;
  screeningQuestions: Array<{
    id: number;
    question_text: string;
    question_type: string;
    options: string[] | string | null;
    is_required: boolean;
  }>;
  application_limit?: number;
}

export const JobDetails: React.FC = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [job, setJob] = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchJobDetails();
    }
  }, [id]);

  const fetchJobDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/jobs/${id}`);
      setJob(response.data);
    } catch (err: any) {
      setError('Failed to load job details');
      toast.error('Failed to load job details');
      console.error('Error fetching job details:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatSalary = (job: JobDetail) => {
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
    
    if (diffInHours < 1) {
      return 'Less than an hour ago';
    } else if (diffInHours < 24) {
      return `${diffInHours} hours ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading job details...</p>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
          <p className="text-red-600 mb-4">{error || 'Job not found'}</p>
          <Link
            to="/jobs"
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Back to Jobs
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <div className="mb-6">
        <nav className="flex" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1 md:space-x-3">
            <li className="inline-flex items-center">
              <Link to="/jobs" className="text-blue-600 hover:text-blue-800">
                Jobs
              </Link>
            </li>
            <li>
              <div className="flex items-center">
                <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                <span className="ml-1 text-gray-500 md:ml-2">{job.title}</span>
              </div>
            </li>
          </ol>
        </nav>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {/* Job Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {job.title}
              </h1>
              <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
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
              
              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  <AcademicCapIcon className="h-4 w-4 mr-1" />
                  {job.category}
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  <CurrencyDollarIcon className="h-4 w-4 mr-1" />
                  {formatSalary(job)}
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                  {job.experience_level?.charAt(0).toUpperCase() + job.experience_level?.slice(1)}
                </span>
                {job.application_deadline && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800">
                    <CalendarIcon className="h-4 w-4 mr-1" />
                    Deadline: {new Date(job.application_deadline).toLocaleDateString()}
                  </span>
                )}
              </div>

              {/* Stats */}
              <div className="flex items-center space-x-6 text-sm text-gray-600">
                <span className="flex items-center">
                  <UserGroupIcon className="h-4 w-4 mr-1" />
                  {job.application_limit 
                    ? `${job.application_count || 0}/${job.application_limit} applications`
                    : `${job.application_count || 0} applications`
                  }
                </span>
                <span>{job.positions_available} position{job.positions_available !== 1 ? 's' : ''} available</span>
                {job.average_rating && Number(job.average_rating) > 0 && (
                  <div className="flex items-center">
                    <StarIcon className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                    <span>{Number(job.average_rating || 0).toFixed(1)} ({job.rating_count || 0} review{job.rating_count !== 1 ? 's' : ''})</span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="ml-6">
              {user?.role === 'user' ? (
                <Link
                  to={`/jobs/${job.id}/apply`}
                  className="bg-blue-600 text-white px-8 py-4 rounded-lg font-medium hover:bg-blue-700 transition-colors text-lg"
                >
                  Apply Now
                </Link>
              ) : !user ? (
                <Link
                  to="/login"
                  className="bg-blue-600 text-white px-8 py-4 rounded-lg font-medium hover:bg-blue-700 transition-colors text-lg"
                >
                  Login to Apply
                </Link>
              ) : user?.role === 'coordinator' ? (
                <div className="flex flex-col space-y-3">
                  {/* Edit and Review buttons for coordinators */}
                  {job.created_by_type === 'coordinator' && job.created_by_id === user.id && (
                    <Link
                      to={`/coordinator/jobs/${job.id}/edit`}
                      className="inline-flex items-center justify-center bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                    >
                      <PencilIcon className="h-5 w-5 mr-2" />
                      Edit Job
                    </Link>
                  )}
                  {job.created_by_type === 'coordinator' && job.created_by_id === user.id && (
                    <Link
                      to={`/jobs/${job.id}/applications`}
                      className="inline-flex items-center justify-center bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors"
                    >
                      <EyeIcon className="h-5 w-5 mr-2" />
                      Review Applications
                    </Link>
                  )}
                </div>
              ) : user?.role === 'company' ? (
                <div className="flex flex-col space-y-3">
                  {/* Business owners can only view applications for their own job posts */}
                  {job.created_by_type === 'company' && job.created_by_id === user.id && (
                    <Link
                      to={`/jobs/${job.id}/applications`}
                      className="inline-flex items-center justify-center bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors"
                    >
                      <EyeIcon className="h-5 w-5 mr-2" />
                      View Applications
                    </Link>
                  )}
                </div>
              ) : (
                <div className="bg-gray-100 text-gray-500 px-8 py-4 rounded-lg font-medium text-lg cursor-not-allowed">
                  Only OJT/Alumni can apply
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Job Content */}
        <div className="p-6">
          {/* Summary */}
          {job.summary && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Summary</h2>
              <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {job.summary}
              </div>
            </div>
          )}

          {/* Job Description */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Job Description</h2>
            <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {job.description}
            </div>
          </div>

          {/* Video */}
          {job.video_url && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Company Video</h2>
              <div className="bg-gray-100 p-6 rounded-lg">
                <a 
                  href={job.video_url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
                >
                  🎥 Watch Company Video
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-1M14 7h4a2 2 0 012 2v5a2 2 0 01-2 2h-1M14 7V5a2 2 0 012-2h4a2 2 0 012 2v1M14 7l-5 5" />
                  </svg>
                </a>
              </div>
            </div>
          )}

          {/* Screening Questions */}
          {job.screeningQuestions && job.screeningQuestions.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Application Questions</h2>
              <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800 mb-4">
                  You'll be asked to answer these questions when applying:
                </p>
                <ul className="space-y-3">
                  {job.screeningQuestions.map((question, index) => (
                    <li key={question.id} className="flex items-start">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-medium mr-3 mt-0.5">
                        {index + 1}
                      </span>
                      <div className="flex-1">
                        <p className="text-sm text-gray-900 font-medium">
                          {question.question_text}
                          {question.is_required && (
                            <span className="text-red-500 ml-1">*</span>
                          )}
                        </p>
                        {(() => {
                          // Handle options that might be JSON string or array
                          let options = [];
                          if (question.options) {
                            if (Array.isArray(question.options)) {
                              options = question.options;
                            } else if (typeof question.options === 'string') {
                              try {
                                options = JSON.parse(question.options);
                              } catch {
                                // If parsing fails, treat as single option
                                options = [question.options];
                              }
                            }
                          }
                          
                          return options && options.length > 0 && (
                            <div className="mt-2 ml-4">
                              <p className="text-xs text-gray-600 mb-1">Options:</p>
                              <ul className="list-disc list-inside text-xs text-gray-600 space-y-1">
                                {options.map((option: string, optIndex: number) => (
                                  <li key={optIndex}>{option}</li>
                                ))}
                              </ul>
                            </div>
                          );
                        })()}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Job Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Job Information</h3>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Work Type</dt>
                  <dd className="text-sm text-gray-900">{job.work_type?.charAt(0).toUpperCase() + job.work_type?.slice(1)}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Work Arrangement</dt>
                  <dd className="text-sm text-gray-900">{job.work_arrangement?.charAt(0).toUpperCase() + job.work_arrangement?.slice(1)}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Experience Level</dt>
                  <dd className="text-sm text-gray-900">{job.experience_level?.charAt(0).toUpperCase() + job.experience_level?.slice(1)}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Positions Available</dt>
                  <dd className="text-sm text-gray-900">{job.positions_available} position{job.positions_available !== 1 ? 's' : ''}</dd>
                </div>
                {job.application_deadline && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Application Deadline</dt>
                    <dd className="text-sm text-gray-900">{new Date(job.application_deadline).toLocaleDateString()}</dd>
                  </div>
                )}
              </dl>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Posted By</h3>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Posted By</dt>
                  <dd className="text-sm text-gray-900">{job.created_by_name}</dd>
                </div>
                {job.coordinator_name && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Coordinator</dt>
                    <dd className="text-sm text-gray-900">{job.coordinator_name}</dd>
                  </div>
                )}
                {job.business_owner_name && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Business Owner</dt>
                    <dd className="text-sm text-gray-900">{job.business_owner_name}</dd>
                  </div>
                )}
                {job.company_name && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Company</dt>
                    <dd className="text-sm text-gray-900">{job.company_name}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-sm font-medium text-gray-500">Posted</dt>
                  <dd className="text-sm text-gray-900">{getTimeAgo(job.created_at)}</dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Application Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <UserGroupIcon className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-900">{job.application_count || 0}</div>
              <div className="text-sm text-blue-600">Applications</div>
            </div>
            
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <BriefcaseIcon className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-900">{job.positions_available}</div>
              <div className="text-sm text-green-600">Positions</div>
            </div>
            
            <div className="bg-yellow-50 rounded-lg p-4 text-center">
              <StarIcon className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-yellow-900">
                {job.average_rating ? Number(job.average_rating || 0).toFixed(1) : 'N/A'}
              </div>
              <div className="text-sm text-yellow-600">Rating ({job.rating_count || 0} reviews)</div>
            </div>
          </div>

          {/* Call to Action */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-8 text-center text-white">
            <h2 className="text-2xl font-bold mb-4">Ready to Apply?</h2>
            <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
              This position offers great opportunities for {job.experience_level} professionals. 
              Don't miss out on this {job.work_type} opportunity!
            </p>
            <div className="space-x-4">
              {user?.role === 'user' ? (
                <Link
                  to={`/jobs/${job.id}/apply`}
                  className="bg-white text-blue-600 px-8 py-4 rounded-lg font-medium hover:bg-blue-50 transition-colors inline-block text-lg"
                >
                  Apply for This Job
                </Link>
              ) : !user ? (
                <Link
                  to="/login"
                  className="bg-white text-blue-600 px-8 py-4 rounded-lg font-medium hover:bg-blue-50 transition-colors inline-block text-lg"
                >
                  Login to Apply
                </Link>
              ) : (
                <div className="bg-white bg-opacity-20 text-white px-8 py-4 rounded-lg font-medium inline-block text-lg cursor-not-allowed opacity-50">
                  Only OJT/Alumni can apply
                </div>
              )}
              <Link
                to="/jobs"
                className="border-2 border-white text-white px-8 py-4 rounded-lg font-medium hover:bg-white hover:text-blue-600 transition-colors inline-block text-lg"
              >
                Browse More Jobs
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Job Rating Section */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Job Rating & Reviews</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Rating Display */}
            <div className="lg:col-span-2">
              <RatingDisplay
                entityId={job.id}
                entityType="job"
                averageRating={job.average_rating}
                totalCount={job.rating_count}
                showDetails={true}
              />
            </div>

            {/* User Rating Input */}
            <div className="lg:col-span-1">
              {user?.role === 'user' ? (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Rate This Job</h3>
                  <JobRating
                    jobId={job.id}
                    readOnly={false}
                  />
                </div>
              ) : user?.role === 'coordinator' || user?.role === 'company' ? (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Job Rating (View Only)</h3>
                  <JobRating
                    jobId={job.id}
                    readOnly={true}
                  />
                </div>
              ) : (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Rate This Job</h3>
                  <JobRating
                    jobId={job.id}
                    readOnly={true}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Rate Company/Coordinator Section */}
      {job.created_by_type && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Rate the {job.created_by_type === 'company' ? 'Company' : 'Coordinator'}
            </h2>
            
            {user?.role === 'user' ? (
              <ProfileRating
                profileId={job.created_by_id}
                profileType={job.created_by_type as 'coordinator' | 'company'}
                profileName={job.created_by_type === 'company' ? job.company_name || 'Company' : job.coordinator_name || 'Coordinator'}
                context="job_post"
                jobId={job.id}
                readOnly={false}
              />
            ) : (
              <div className="text-center py-8">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                  <p className="text-gray-600">
                    Only users can rate {job.created_by_type === 'company' ? 'companies' : 'coordinators'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};