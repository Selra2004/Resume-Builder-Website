import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { toast } from 'react-hot-toast';
import { 
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckIcon,
  UserIcon,
  BriefcaseIcon,
  DocumentTextIcon,
  VideoCameraIcon,
  ClipboardDocumentListIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface JobDetail {
  id: number;
  title: string;
  location: string;
  category: string;
  company_name: string;
  created_by_name: string;
  screeningQuestions: Array<{
    id: number;
    question_text: string;
    question_type: string;
    options: string[] | string | null;
    is_required: boolean;
  }>;
}

/*
interface UserProfile {
  first_name: string;
  last_name: string;
  email: string;
  contact_number: string;
  address?: string;
}
*/

interface ApplicationData {
  contactDetails: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
  };
  positionDetails: {
    positionApplyingFor: string;
  };
  resumeDetails: {
    resumeType: 'uploaded' | 'builder_link';
    resumeFile?: File;
    resumeBuilderLink?: string;
  };
  interviewDetails: {
    interviewVideo?: string;
  };
  screeningAnswers: { [key: number]: string };
}

const STEPS = [
  { id: 1, name: 'Contact Details', icon: UserIcon },
  { id: 2, name: 'Position Details', icon: BriefcaseIcon },
  { id: 3, name: 'Resume', icon: DocumentTextIcon },
  { id: 4, name: 'Interview Video', icon: VideoCameraIcon },
  { id: 5, name: 'Screening Questions', icon: ClipboardDocumentListIcon }
];

export const JobApplication: React.FC = () => {
  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [job, setJob] = useState<JobDetail | null>(null);
  
  const [applicationData, setApplicationData] = useState<ApplicationData>({
    contactDetails: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      address: ''
    },
    positionDetails: {
      positionApplyingFor: ''
    },
    resumeDetails: {
      resumeType: 'uploaded'
    },
    interviewDetails: {},
    screeningAnswers: {}
  });

  useEffect(() => {
    if (!user || user.role !== 'user') {
      toast.error('Only OJT/Alumni students can apply for jobs');
      navigate('/jobs');
      return;
    }
    
    fetchJobAndProfile();
  }, [id, user, navigate]);

  const fetchJobAndProfile = async () => {
    try {
      setLoading(true);
      
      // Fetch job details
      const jobResponse = await api.get(`/jobs/${id}`);
      const jobData = jobResponse.data;
      setJob(jobData);

      // Fetch user profile
      const profileResponse = await api.get('/users/profile');
      const profileData = profileResponse.data;
      // setUserProfile(profileData);

      // Pre-populate contact details from profile
      setApplicationData(prev => ({
        ...prev,
        contactDetails: {
          firstName: profileData.first_name || '',
          lastName: profileData.last_name || '',
          email: user?.email || '',
          phone: profileData.contact_number || '',
          address: profileData.address || ''
        },
        positionDetails: {
          positionApplyingFor: jobData.title
        }
      }));

    } catch (error: any) {
      console.error('Failed to fetch job or profile:', error);
      toast.error('Failed to load application form');
      navigate('/jobs');
    } finally {
      setLoading(false);
    }
  };

  const updateApplicationData = (step: keyof ApplicationData, data: any) => {
    setApplicationData(prev => ({
      ...prev,
      [step]: { ...prev[step], ...data }
    }));
  };

  const isStepValid = (step: number) => {
    switch (step) {
      case 1:
        return applicationData.contactDetails.firstName && 
               applicationData.contactDetails.lastName && 
               applicationData.contactDetails.email && 
               applicationData.contactDetails.phone;
      case 2:
        return applicationData.positionDetails.positionApplyingFor;
      case 3:
        return applicationData.resumeDetails.resumeType === 'uploaded' 
          ? applicationData.resumeDetails.resumeFile 
          : applicationData.resumeDetails.resumeBuilderLink;
      case 4:
        return true; // Optional step
      case 5:
        // Check if all required screening questions are answered
        if (!job?.screeningQuestions) return true;
        return job.screeningQuestions.every(q => 
          !Boolean(q.is_required) || applicationData.screeningAnswers[q.id]
        );
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (!isStepValid(currentStep)) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!isStepValid(5)) {
      toast.error('Please answer all required screening questions');
      return;
    }

    try {
      setSubmitting(true);

      const formData = new FormData();
      formData.append('jobId', id!);
      formData.append('firstName', applicationData.contactDetails.firstName);
      formData.append('lastName', applicationData.contactDetails.lastName);
      formData.append('email', applicationData.contactDetails.email);
      formData.append('phone', applicationData.contactDetails.phone);
      formData.append('address', applicationData.contactDetails.address);
      formData.append('positionApplyingFor', applicationData.positionDetails.positionApplyingFor);
      formData.append('resumeType', applicationData.resumeDetails.resumeType);
      
      if (applicationData.resumeDetails.resumeType === 'uploaded' && applicationData.resumeDetails.resumeFile) {
        formData.append('resumeFile', applicationData.resumeDetails.resumeFile);
      } else if (applicationData.resumeDetails.resumeBuilderLink) {
        formData.append('resumeBuilderLink', applicationData.resumeDetails.resumeBuilderLink);
      }

      if (applicationData.interviewDetails.interviewVideo) {
        formData.append('interviewVideo', applicationData.interviewDetails.interviewVideo);
      }

      formData.append('screeningAnswers', JSON.stringify(applicationData.screeningAnswers));

      await api.post(`/jobs/${id}/apply`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      toast.success('Application submitted successfully!');
      navigate(`/jobs/${id}`);

    } catch (error: any) {
      console.error('Application submission failed:', error);
      toast.error(error.response?.data?.message || 'Failed to submit application');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return renderContactDetails();
      case 2:
        return renderPositionDetails();
      case 3:
        return renderResumeDetails();
      case 4:
        return renderInterviewDetails();
      case 5:
        return renderScreeningQuestions();
      default:
        return null;
    }
  };

  const renderContactDetails = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h3>
        <p className="text-sm text-gray-600 mb-6">
          Please verify and update your contact information.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            First Name *
          </label>
          <input
            type="text"
            value={applicationData.contactDetails.firstName}
            onChange={(e) => updateApplicationData('contactDetails', { firstName: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Last Name *
          </label>
          <input
            type="text"
            value={applicationData.contactDetails.lastName}
            onChange={(e) => updateApplicationData('contactDetails', { lastName: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email Address *
          </label>
          <input
            type="email"
            value={applicationData.contactDetails.email}
            onChange={(e) => updateApplicationData('contactDetails', { email: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Phone Number *
          </label>
          <input
            type="tel"
            value={applicationData.contactDetails.phone}
            onChange={(e) => updateApplicationData('contactDetails', { phone: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Address
        </label>
        <textarea
          value={applicationData.contactDetails.address}
          onChange={(e) => updateApplicationData('contactDetails', { address: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          placeholder="Complete address"
        />
      </div>
    </div>
  );

  const renderPositionDetails = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Position Information</h3>
        <p className="text-sm text-gray-600 mb-6">
          Confirm the position you're applying for.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Position Applying For *
        </label>
        <input
          type="text"
          value={applicationData.positionDetails.positionApplyingFor}
          onChange={(e) => updateApplicationData('positionDetails', { positionApplyingFor: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          required
        />
      </div>

      {job && (
        <div className="bg-blue-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-900 mb-2">Job Details</h4>
          <dl className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-blue-800">Company</dt>
              <dd className="text-sm text-blue-700">{job.created_by_name}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-blue-800">Location</dt>
              <dd className="text-sm text-blue-700">{job.location}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-blue-800">Category</dt>
              <dd className="text-sm text-blue-700">{job.category}</dd>
            </div>
          </dl>
        </div>
      )}
    </div>
  );

  const renderResumeDetails = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Resume</h3>
        <p className="text-sm text-gray-600 mb-6">
          Provide your resume for this application.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-4">
          Resume Type *
        </label>
        <div className="space-y-3">
          <label className="flex items-center">
            <input
              type="radio"
              name="resumeType"
              value="uploaded"
              checked={applicationData.resumeDetails.resumeType === 'uploaded'}
              onChange={(e) => updateApplicationData('resumeDetails', { resumeType: e.target.value })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
            />
            <span className="ml-2 text-sm text-gray-700">Upload Resume File</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="resumeType"
              value="builder_link"
              checked={applicationData.resumeDetails.resumeType === 'builder_link'}
              onChange={(e) => updateApplicationData('resumeDetails', { resumeType: e.target.value })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
            />
            <span className="ml-2 text-sm text-gray-700">Use Resume Builder Link</span>
          </label>
        </div>
      </div>

      {applicationData.resumeDetails.resumeType === 'uploaded' ? (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Upload Resume *
          </label>
          <input
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                updateApplicationData('resumeDetails', { resumeFile: file });
              }
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Accepted formats: PDF, DOC, DOCX (Max 10MB)
          </p>
        </div>
      ) : (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Resume Builder Link *
          </label>
          <input
            type="url"
            value={applicationData.resumeDetails.resumeBuilderLink || ''}
            onChange={(e) => updateApplicationData('resumeDetails', { resumeBuilderLink: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="https://example.com/resume/123"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Link to your resume created using our resume builder
          </p>
        </div>
      )}
    </div>
  );

  const renderInterviewDetails = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Interview Video</h3>
        <p className="text-sm text-gray-600 mb-6">
          Optionally provide a pre-recorded interview video to introduce yourself.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Video URL (Optional)
        </label>
        <input
          type="url"
          value={applicationData.interviewDetails.interviewVideo || ''}
          onChange={(e) => updateApplicationData('interviewDetails', { interviewVideo: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          placeholder="https://youtube.com/watch?v=... or https://drive.google.com/..."
        />
        <p className="text-xs text-gray-500 mt-1">
          Upload your video to YouTube, Google Drive, or similar platform and paste the link here
        </p>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex">
          <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
          <div className="ml-3">
            <h4 className="text-sm font-medium text-yellow-800">
              Tips for Interview Videos
            </h4>
            <div className="mt-2 text-sm text-yellow-700">
              <ul className="list-disc list-inside space-y-1">
                <li>Keep it brief (1-3 minutes)</li>
                <li>Introduce yourself and explain your interest in the position</li>
                <li>Highlight relevant skills or experience</li>
                <li>Ensure good lighting and clear audio</li>
                <li>Dress professionally</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderScreeningQuestions = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Screening Questions</h3>
        <p className="text-sm text-gray-600 mb-6">
          Please answer the following questions from the employer.
        </p>
      </div>

      {job?.screeningQuestions && job.screeningQuestions.length > 0 ? (
        <div className="space-y-6">
          {job.screeningQuestions.map((question, index) => {
            // Parse options if they're a JSON string
            let options: string[] = [];
            if (question.options) {
              if (Array.isArray(question.options)) {
                options = question.options;
              } else if (typeof question.options === 'string') {
                try {
                  options = JSON.parse(question.options);
                } catch {
                  options = [question.options];
                }
              }
            }

            return (
              <div key={question.id} className="border border-gray-200 rounded-lg p-4">
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-900">
                    Question {index + 1}
                    {Boolean(question.is_required) && <span className="text-red-500 ml-1">*</span>}
                  </h4>
                  <p className="text-sm text-gray-700 mt-1">{question.question_text}</p>
                </div>

                {options.length > 0 ? (
                  <div className="space-y-2">
                    {options.map((option, optIndex) => (
                      <label key={optIndex} className="flex items-center">
                        <input
                          type="radio"
                          name={`question_${question.id}`}
                          value={option}
                          checked={applicationData.screeningAnswers[question.id] === option}
                          onChange={(e) => {
                            setApplicationData(prev => ({
                              ...prev,
                              screeningAnswers: {
                                ...prev.screeningAnswers,
                                [question.id]: e.target.value
                              }
                            }));
                          }}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                        />
                        <span className="ml-2 text-sm text-gray-700">{option}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <textarea
                    value={applicationData.screeningAnswers[question.id] || ''}
                    onChange={(e) => {
                      setApplicationData(prev => ({
                        ...prev,
                        screeningAnswers: {
                          ...prev.screeningAnswers,
                          [question.id]: e.target.value
                        }
                      }));
                    }}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Type your answer here..."
                    required={Boolean(question.is_required)}
                  />
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8">
          <ClipboardDocumentListIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No screening questions</h3>
          <p className="mt-1 text-sm text-gray-500">
            No additional questions are required for this position.
          </p>
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white shadow rounded-lg p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading application form...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white shadow rounded-lg p-8 text-center">
            <p className="text-gray-600">Job not found</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(`/jobs/${id}`)}
            className="flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Back to Job Details
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Apply for Position</h1>
          <p className="mt-2 text-gray-600">{job.title} at {job.created_by_name}</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <nav aria-label="Progress">
            <ol className="flex items-center">
              {STEPS.map((step, stepIdx) => (
                <li key={step.name} className={`${stepIdx !== STEPS.length - 1 ? 'pr-8 sm:pr-20' : ''} relative`}>
                  <div className="flex items-center">
                    <div className="flex items-center">
                      <div className={`
                        relative flex h-8 w-8 items-center justify-center rounded-full
                        ${currentStep > step.id 
                          ? 'bg-blue-600' 
                          : currentStep === step.id 
                            ? 'border-2 border-blue-600 bg-white' 
                            : 'border-2 border-gray-300 bg-white'
                        }
                      `}>
                        {currentStep > step.id ? (
                          <CheckIcon className="h-5 w-5 text-white" aria-hidden="true" />
                        ) : (
                          <step.icon className={`h-5 w-5 ${currentStep === step.id ? 'text-blue-600' : 'text-gray-500'}`} />
                        )}
                      </div>
                      <span className={`
                        ml-3 text-sm font-medium
                        ${currentStep >= step.id ? 'text-blue-600' : 'text-gray-500'}
                      `}>
                        {step.name}
                      </span>
                    </div>
                  </div>
                  {stepIdx !== STEPS.length - 1 && (
                    <div className={`
                      absolute top-4 left-4 -ml-px mt-0.5 h-0.5 w-full
                      ${currentStep > step.id ? 'bg-blue-600' : 'bg-gray-300'}
                    `} />
                  )}
                </li>
              ))}
            </ol>
          </nav>
        </div>

        {/* Step Content */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          {renderStepContent()}
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <button
            type="button"
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Previous
          </button>

          {currentStep < STEPS.length ? (
            <button
              type="button"
              onClick={handleNext}
              disabled={!isStepValid(currentStep)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <ArrowRightIcon className="h-4 w-4 ml-2" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!isStepValid(5) || submitting}
              className="inline-flex items-center px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Submitting...' : 'Submit Application'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
