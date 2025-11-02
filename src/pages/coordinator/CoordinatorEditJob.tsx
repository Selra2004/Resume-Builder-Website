import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import { toast } from 'react-hot-toast';
import { formatNumberWithCommas, handleCommaFormattedInput, removeCommasFromNumber } from '../../utils/formatUtils';
import {
  BriefcaseIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  Cog6ToothIcon,
  PlusIcon,
  TrashIcon,
  ArrowLeftIcon,
  EyeIcon,
  XCircleIcon,
  BuildingOfficeIcon,
  UserIcon
} from '@heroicons/react/24/outline';

interface JobCategory {
  course_name: string;
  categories: string[];
}

interface ScreeningQuestion {
  id?: number;
  questionText: string;
  questionType: string;
  options?: string[];
  isRequired: boolean;
}

export const CoordinatorEditJob: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [jobCategories, setJobCategories] = useState<JobCategory[]>([]);
  const [coordinatorProfile, setCoordinatorProfile] = useState<{ first_name?: string; last_name?: string } | null>(null);
  const [existingQuestions, setExistingQuestions] = useState<ScreeningQuestion[]>([]);
  const [customQuestions, setCustomQuestions] = useState<ScreeningQuestion[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  const [formData, setFormData] = useState({
    // Business Type Selection
    businessType: 'my_business', // 'my_business' or 'other_business'
    
    title: '',
    location: '',
    category: '',
    workType: 'internship',
    workArrangement: 'on-site',
    currency: 'PHP',
    minSalary: '',
    maxSalary: '',
    description: '',
    summary: '',
    videoUrl: '',
    
    // Company Information (for other business)
    companyName: '',
    businessOwnerName: '',
    
    applicationDeadline: '',
    positionsAvailable: '1',
    applicationLimit: '',
    experienceLevel: 'entry-level',
    targetStudentType: 'both',
    status: 'active',
    filterPreScreening: false
  });

  // Predefined screening questions (exactly matching CreateJob)
  const PREDEFINED_QUESTIONS: { [key: string]: ScreeningQuestion } = {
    salary_range: {
      questionText: "What's your expected monthly basic salary range?",
      questionType: 'salary_range',
      isRequired: false
    },
    qualifications: {
      questionText: "Which of the following types of qualifications do you have?",
      questionType: 'qualifications',
      options: [
        'High School Diploma',
        'National Certificate 1',
        'National Certificate 2', 
        'National Certificate 3',
        'National Certificate 4',
        'Diploma',
        'Bachelor Degree',
        'Post Graduate Diploma',
        'Master Degree',
        'Doctoral Degree'
      ],
      isRequired: false
    },
    english_skills: {
      questionText: "How would you rate your English language skills?",
      questionType: 'english_skills',
      options: [
        'Speaks proficiently in a professional setting',
        'Writes proficiently in a professional setting',
        'Limited proficiency'
      ],
      isRequired: false
    },
    customer_service: {
      questionText: "Do you have customer service experience?",
      questionType: 'customer_service',
      options: ['Yes', 'No'],
      isRequired: false
    },
    notice_period: {
      questionText: "How much notice are you required to give your current employer?",
      questionType: 'notice_period',
      options: [
        "None, I'm ready to go now",
        'Less than 2 weeks',
        '1 month',
        '2 months',
        '3 months',
        'More than 3 months'
      ],
      isRequired: false
    },
    background_check: {
      questionText: "Are you willing to undergo a pre-employment background check?",
      questionType: 'background_check',
      options: ['Yes', 'No'],
      isRequired: false
    },
    medical_check: {
      questionText: "Are you willing to undergo a pre-employment medical check?",
      questionType: 'medical_check',
      options: ['Yes', 'No'],
      isRequired: false
    },
    public_holidays: {
      questionText: "Are you available to work public holidays?",
      questionType: 'public_holidays',
      options: ['Yes', 'No'],
      isRequired: false
    },
    work_right: {
      questionText: "Which of the following statements best describes your right to work in the Philippines?",
      questionType: 'work_right',
      options: [
        'Filipino citizen',
        'Permanent resident',
        'Work permit holder',
        'Foreign national (require sponsorship)'
      ],
      isRequired: false
    },
    relocation: {
      questionText: "Are you willing to relocate for this role?",
      questionType: 'relocation',
      options: ['Yes', 'No'],
      isRequired: false
    }
  };

  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);

  useEffect(() => {
    fetchJobCategories();
    fetchJobDetails();
    fetchCoordinatorProfile();
  }, [id]);

  const fetchCoordinatorProfile = async () => {
    try {
      const response = await api.get('/coordinators/profile');
      setCoordinatorProfile(response.data);
    } catch (error) {
      console.error('Failed to fetch coordinator profile:', error);
    }
  };

  const fetchJobCategories = async () => {
    try {
      const response = await api.get('/jobs/categories');
      setJobCategories(response.data);
    } catch (error) {
      console.error('Failed to fetch job categories:', error);
    }
  };

  const fetchJobDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/jobs/${id}`);
      const job = response.data;

      // Check if the current user is the creator of this job
      if (job.created_by_type !== user?.role || job.created_by_id !== user?.id) {
        toast.error('You are not authorized to edit this job');
        navigate('/coordinator/jobs');
        return;
      }

      // Determine business type based on existing data
      const businessType = job.company_name || job.business_owner_name ? 'other_business' : 'my_business';
      
      setFormData({
        // Business Type Selection
        businessType: businessType,
        
        title: job.title || '',
        location: job.location || '',
        category: job.category || '',
        workType: job.work_type || 'internship',
        workArrangement: job.work_arrangement || 'on-site',
        currency: job.currency || 'PHP',
        minSalary: job.min_salary ? formatNumberWithCommas(job.min_salary.toString()) : '',
        maxSalary: job.max_salary ? formatNumberWithCommas(job.max_salary.toString()) : '',
        description: job.description || '',
        summary: job.summary || '',
        videoUrl: job.video_url || '',
        
        // Company Information (for other business)
        companyName: job.company_name || '',
        businessOwnerName: job.business_owner_name || '',
        
        applicationDeadline: job.application_deadline || '',
        positionsAvailable: job.positions_available ? job.positions_available.toString() : '1',
        applicationLimit: job.application_limit ? formatNumberWithCommas(job.application_limit.toString()) : '',
        experienceLevel: job.experience_level || 'entry-level',
        targetStudentType: job.target_student_type || 'both',
        status: job.status || 'active',
        filterPreScreening: job.filter_pre_screening || false
      });

      // Process existing screening questions
      if (job.screeningQuestions && job.screeningQuestions.length > 0) {
        const existingQuestions: ScreeningQuestion[] = [];
        const selectedPredefined: string[] = [];

        job.screeningQuestions.forEach((q: any) => {
          const predefinedKey = Object.keys(PREDEFINED_QUESTIONS).find(
            key => PREDEFINED_QUESTIONS[key].questionType === q.question_type
          );

          if (predefinedKey) {
            selectedPredefined.push(predefinedKey);
          } else {
            existingQuestions.push({
              id: q.id,
              questionText: q.question_text,
              questionType: q.question_type,
              options: Array.isArray(q.options) ? q.options : 
                      (typeof q.options === 'string' ? JSON.parse(q.options || '[]') : []),
              isRequired: q.is_required
            });
          }
        });

        setSelectedQuestions(selectedPredefined);
        setExistingQuestions(existingQuestions);
      }

    } catch (error: any) {
      console.error('Failed to fetch job details:', error);
      toast.error('Failed to load job details');
      navigate('/coordinator/jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFieldChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const addCustomQuestion = () => {
    setCustomQuestions(prev => [...prev, {
      questionText: '',
      questionType: 'text',
      options: [],
      isRequired: false
    }]);
  };

  const removeCustomQuestion = (index: number) => {
    setCustomQuestions(prev => prev.filter((_, i) => i !== index));
  };

  const updateCustomQuestion = (index: number, field: keyof ScreeningQuestion, value: any) => {
    setCustomQuestions(prev => prev.map((q, i) => 
      i === index ? { ...q, [field]: value } : q
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.location || !formData.category || !formData.description || !formData.applicationLimit) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Validate business type specific requirements
    if (formData.businessType === 'other_business') {
      if (!formData.companyName || !formData.businessOwnerName) {
        toast.error('Company name and business owner name are required when posting for other business');
        return;
      }
    }

    setSaving(true);

    try {
      // Combine all screening questions
      const allScreeningQuestions = [
        ...selectedQuestions.map(key => ({
          ...PREDEFINED_QUESTIONS[key],
          id: undefined // Remove ID for predefined questions
        })),
        ...existingQuestions,
        ...customQuestions.filter(q => q.questionText.trim() !== '')
      ];

      // Parse salary values, removing commas first
      const parsedMinSalary = formData.minSalary ? parseFloat(removeCommasFromNumber(formData.minSalary)) : null;
      const parsedMaxSalary = formData.maxSalary ? parseFloat(removeCommasFromNumber(formData.maxSalary)) : null;
      const parsedApplicationLimit = formData.applicationLimit ? parseInt(removeCommasFromNumber(formData.applicationLimit)) : null;

      const jobData = {
        ...formData,
        minSalary: parsedMinSalary && !isNaN(parsedMinSalary) ? parsedMinSalary : null,
        maxSalary: parsedMaxSalary && !isNaN(parsedMaxSalary) ? parsedMaxSalary : null,
        positionsAvailable: parseInt(formData.positionsAvailable) || 1,
        applicationLimit: parsedApplicationLimit && !isNaN(parsedApplicationLimit) ? parsedApplicationLimit : null,
        // Set coordinator name automatically based on user info for my_business, or use provided names for other_business
        coordinatorName: formData.businessType === 'my_business' ? `${coordinatorProfile?.first_name || ''} ${coordinatorProfile?.last_name || ''}`.trim() : null,
        companyName: formData.businessType === 'other_business' ? formData.companyName : null,
        businessOwnerName: formData.businessType === 'other_business' ? formData.businessOwnerName : null,
        screeningQuestions: allScreeningQuestions
      };

      await api.put(`/jobs/${id}`, jobData);
      toast.success('Job updated successfully!');
      navigate(`/jobs/${id}`);
    } catch (error: any) {
      console.error('Error updating job:', error);
      toast.error(error.response?.data?.message || 'Failed to update job');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white shadow rounded-lg p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading job details...</p>
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
          <div className="flex items-center justify-between">
            <div>
              <button
                onClick={() => navigate('/coordinator/jobs')}
                className="flex items-center text-sm text-gray-500 hover:text-gray-700 mb-2"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-1" />
                Back to Manage Jobs
              </button>
              <h1 className="text-3xl font-bold text-gray-900">Edit Job Posting</h1>
              <p className="mt-2 text-gray-600">
                Update your job posting details and requirements.
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => setShowPreview(!showPreview)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <EyeIcon className="h-4 w-4 mr-2" />
                {showPreview ? 'Hide Preview' : 'Show Preview'}
              </button>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Business Type Selection */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <BriefcaseIcon className="h-6 w-6 mr-2 text-blue-600" />
                Job Posting Type
              </h2>
              <p className="text-sm text-gray-600 mt-1">Are you posting this job for your organization or another business?</p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div className="flex space-x-4">
                <label className="flex items-center p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 flex-1">
                  <input
                    type="radio"
                    name="businessType"
                    value="my_business"
                    checked={formData.businessType === 'my_business'}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <div className="ml-3">
                    <div className="flex items-center">
                      <UserIcon className="h-5 w-5 text-blue-600 mr-2" />
                      <span className="text-sm font-medium text-gray-900">For My Organization</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Posting for my coordinator organization</p>
                  </div>
                </label>

                <label className="flex items-center p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 flex-1">
                  <input
                    type="radio"
                    name="businessType"
                    value="other_business"
                    checked={formData.businessType === 'other_business'}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <div className="ml-3">
                    <div className="flex items-center">
                      <BuildingOfficeIcon className="h-5 w-5 text-blue-600 mr-2" />
                      <span className="text-sm font-medium text-gray-900">For Other Business</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Posting on behalf of a company/business</p>
                  </div>
                </label>
              </div>

              {/* Conditional Company/Business Owner Fields */}
              {formData.businessType === 'other_business' && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Company Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="companyName"
                        value={formData.companyName}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter company name"
                        required={formData.businessType === 'other_business'}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Business Owner Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="businessOwnerName"
                        value={formData.businessOwnerName}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter business owner name"
                        required={formData.businessType === 'other_business'}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Basic Information */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center mb-4">
              <BriefcaseIcon className="h-5 w-5 text-gray-400 mr-2" />
              <h2 className="text-lg font-medium text-gray-900">Job Information</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Job Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Software Developer Intern"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location *
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Makati City, Metro Manila"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select a category</option>
                  {jobCategories.map((course) => (
                    <optgroup key={course.course_name} label={course.course_name}>
                      {course.categories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Work Type
                </label>
                <select
                  name="workType"
                  value={formData.workType}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="internship">Internship</option>
                  <option value="part-time">Part-time</option>
                  <option value="full-time">Full-time</option>
                  <option value="contract">Contract</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Work Arrangement
                </label>
                <select
                  name="workArrangement"
                  value={formData.workArrangement}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="on-site">On-site</option>
                  <option value="remote">Remote</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Experience Level
                </label>
                <select
                  name="experienceLevel"
                  value={formData.experienceLevel}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="entry-level">Entry Level</option>
                  <option value="mid-level">Mid Level</option>
                  <option value="senior-level">Senior Level</option>
                  <option value="executive">Executive</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Positions Available
                </label>
                <input
                  type="number"
                  name="positionsAvailable"
                  value={formData.positionsAvailable}
                  onChange={handleInputChange}
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Application Limit
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="applicationLimit"
                  value={formData.applicationLimit}
                  onChange={(e) => handleCommaFormattedInput(e.target.value, (value) => handleFieldChange('applicationLimit', value))}
                  min="1"
                  placeholder="Enter maximum applications (e.g., 50)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Maximum number of applications allowed for this job posting.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Student Type
                </label>
                <select
                  name="targetStudentType"
                  value={formData.targetStudentType}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="both">Both OJT & Graduated</option>
                  <option value="ojt">OJT Students Only</option>
                  <option value="graduated">Graduated Students Only</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">Who can apply for this position</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Application Deadline
                </label>
                <input
                  type="date"
                  name="applicationDeadline"
                  value={formData.applicationDeadline}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Salary Information */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center mb-4">
              <CurrencyDollarIcon className="h-5 w-5 text-gray-400 mr-2" />
              <h2 className="text-lg font-medium text-gray-900">Salary Information</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Currency
                </label>
                <select
                  name="currency"
                  value={formData.currency}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="PHP">PHP</option>
                  <option value="USD">USD</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Salary
                </label>
                <input
                  type="text"
                  name="minSalary"
                  value={formData.minSalary}
                  onChange={(e) => handleCommaFormattedInput(e.target.value, (value) => handleFieldChange('minSalary', value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter minimum salary (e.g., 15,000)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum Salary
                </label>
                <input
                  type="text"
                  name="maxSalary"
                  value={formData.maxSalary}
                  onChange={(e) => handleCommaFormattedInput(e.target.value, (value) => handleFieldChange('maxSalary', value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter maximum salary (e.g., 25,000)"
                />
              </div>
            </div>
          </div>

          {/* Job Description */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center mb-4">
              <DocumentTextIcon className="h-5 w-5 text-gray-400 mr-2" />
              <h2 className="text-lg font-medium text-gray-900">Job Details</h2>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Job Summary
                </label>
                <textarea
                  name="summary"
                  value={formData.summary}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Brief summary of the position..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Job Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Detailed job description, responsibilities, requirements..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Video URL (Optional)
                </label>
                <input
                  type="url"
                  name="videoUrl"
                  value={formData.videoUrl}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="https://youtube.com/watch?v=..."
                />
              </div>


              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Job Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
            </div>
          </div>

          {/* Screening Questions */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <Cog6ToothIcon className="h-6 w-6 mr-2 text-blue-600" />
                Edit screening questions and filters
              </h2>
              <p className="text-sm text-gray-600 mt-1">Update questions to help you find the best fit</p>
            </div>

            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-medium text-gray-700">
                  {selectedQuestions.length}/10 questions selected
                </p>
                <div className="w-full max-w-xs bg-gray-200 rounded-full h-2 ml-4">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(selectedQuestions.length / 10) * 100}%` }}
                  ></div>
                </div>
              </div>

              <h3 className="text-lg font-medium text-gray-900 mb-4">Questions we recommend for your role</h3>
              <p className="text-sm text-gray-600 mb-6">
                Update your question selection and criteria. These questions will create filters for your applications.
              </p>

              <div className="space-y-4">
                {Object.entries(PREDEFINED_QUESTIONS).map(([key, question]) => (
                  <div key={key} className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                    <div className="flex items-start">
                    <input
                      type="checkbox"
                        id={key}
                      checked={selectedQuestions.includes(key)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedQuestions(prev => [...prev, key]);
                        } else {
                          setSelectedQuestions(prev => prev.filter(q => q !== key));
                        }
                      }}
                        className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <div className="ml-3 flex-1">
                        <label htmlFor={key} className="text-sm font-medium text-gray-900 cursor-pointer">
                          {question.questionText}
                        {!question.isRequired && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                            Optional
                          </span>
                        )}
                  </label>
                        {selectedQuestions.includes(key) && (
                          <div className="mt-2">
                            {question.questionType === 'salary_range' ? (
                              <div>
                                <p className="text-xs text-gray-600 mb-2">
                                  Enter the acceptable salary range:
                                </p>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-xs text-gray-700 mb-1 block">Minimum Salary (PHP)</label>
                                    <input
                                      type="text"
                                      onChange={(e) => {
                                        const formatted = formatNumberWithCommas(e.target.value);
                                        e.target.value = formatted;
                                      }}
                                      className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                                      placeholder="e.g., 15,000"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-xs text-gray-700 mb-1 block">Maximum Salary (PHP)</label>
                                    <input
                                      type="text"
                                      onChange={(e) => {
                                        const formatted = formatNumberWithCommas(e.target.value);
                                        e.target.value = formatted;
                                      }}
                                      className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                                      placeholder="e.g., 25,000"
                                    />
                                  </div>
                                </div>
                                <div className="mt-2 flex items-center">
                                  <input
                                    type="checkbox"
                                    checked={question.isRequired}
                                    onChange={(e) => {
                                      const updatedQuestion = { ...PREDEFINED_QUESTIONS[key], isRequired: e.target.checked };
                                      PREDEFINED_QUESTIONS[key] = updatedQuestion;
                                    }}
                                    className="h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                  />
                                  <span className="ml-2 text-xs text-gray-700">This is a <strong>must answer</strong> question</span>
                                </div>
                              </div>
                            ) : question.options ? (
                              <div>
                                <p className="text-xs text-gray-600 mb-2">
                                  I will accept any of these answers:
                                </p>
                                <div className="grid grid-cols-2 gap-2">
                                  {question.options.map((option, index) => (
                                    <div key={index} className="flex items-center">
                                      <input
                                        type="checkbox"
                                        className="h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                        defaultChecked={index < 2} // Default some options checked
                                      />
                                      <span className="ml-2 text-xs text-gray-700">{option}</span>
                                    </div>
                                  ))}
                                </div>
                                <div className="mt-2 flex items-center">
                                  <input
                                    type="checkbox"
                                    className="h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                  />
                                  <span className="ml-2 text-xs text-gray-700">This is a <strong>must answer</strong> question</span>
                                </div>
                              </div>
                            ) : (
                              <div className="mt-2 flex items-center">
                                <input
                                  type="checkbox"
                                  className="h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <span className="ml-2 text-xs text-gray-700">This is a <strong>must-have</strong> requirement</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Custom Questions */}
            {(existingQuestions.length > 0 || customQuestions.length > 0) && (
              <div className="mt-6">
                <h4 className="text-sm font-medium text-gray-900 mb-4">Custom Questions</h4>
                <div className="space-y-4">
                  {existingQuestions.map((question, index) => (
                    <div key={`existing-${index}`} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                      <input
                        type="text"
                        value={question.questionText}
                        onChange={(e) => {
                          const newQuestions = [...existingQuestions];
                          newQuestions[index] = { ...question, questionText: e.target.value };
                          setExistingQuestions(newQuestions);
                        }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Enter your custom question"
                      />
                          <div className="mt-2 flex items-center">
                        <input
                          type="checkbox"
                          checked={question.isRequired}
                          onChange={(e) => {
                            const newQuestions = [...existingQuestions];
                            newQuestions[index] = { ...question, isRequired: e.target.checked };
                            setExistingQuestions(newQuestions);
                          }}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                            <span className="ml-2 text-sm text-gray-700">Required question</span>
                    </div>
                </div>
                        <button
                          type="button"
                          onClick={() => setExistingQuestions(prev => prev.filter((_, i) => i !== index))}
                          className="ml-4 text-red-600 hover:text-red-800"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {customQuestions.map((question, index) => (
                    <div key={`new-${index}`} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                      <input
                        type="text"
                        value={question.questionText}
                        onChange={(e) => updateCustomQuestion(index, 'questionText', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Enter your custom question"
                      />
                          <div className="mt-2 flex items-center">
                        <input
                          type="checkbox"
                          checked={question.isRequired}
                          onChange={(e) => updateCustomQuestion(index, 'isRequired', e.target.checked)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <span className="ml-2 text-sm text-gray-700">Required question</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeCustomQuestion(index)}
                          className="ml-4 text-red-600 hover:text-red-800"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={addCustomQuestion}
              className="mt-4 inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Custom Question
            </button>

            {/* Pre-Screening Filter Settings */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Pre-Screening Filter Settings</h4>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 ml-2">
                    Smart Filter
                  </span>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-start">
                  <input
                    type="checkbox"
                    id="filterPreScreening"
                    checked={formData.filterPreScreening}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      filterPreScreening: e.target.checked
                    }))}
                    className="mt-0.5 h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <div className="ml-3">
                    <label htmlFor="filterPreScreening" className="text-sm text-gray-700 cursor-pointer">
                      <strong>Filter out applicants who did not reach the standards of the pre-screening questions</strong>
                    </label>
                    <p className="text-xs text-gray-600 mt-1">
                      When enabled, coordinators and business owners can automatically filter applications based on screening question responses that don't meet your requirements.
                    </p>
                  </div>
                </div>
                
                {formData.filterPreScreening && (
                  <div className="ml-7 p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <p className="text-xs text-blue-700">
                      <strong>Note:</strong> This filter can be adjusted after posting the job. Both coordinators and business owners will be able to modify the filtering criteria in the application review section.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex">
                <div className="flex-shrink-0">
                  <Cog6ToothIcon className="h-5 w-5 text-blue-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-700">
                    Questions, answers and other settings can be edited after you update your job ad to improve candidate matching.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate('/coordinator/jobs')}
              className="px-6 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Updating...' : 'Update Job'}
            </button>
          </div>
        </form>

        {/* Job Preview Modal */}
        {showPreview && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-10 mx-auto p-0 border w-full max-w-4xl shadow-lg rounded-lg bg-white">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Job Preview</h3>
                <button
                  onClick={() => setShowPreview(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircleIcon className="h-6 w-6" />
                </button>
              </div>

              {/* Job Preview Content */}
              <div className="p-6 max-h-96 overflow-y-auto">
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  {/* Job Header */}
                  <div className="mb-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">
                          {formData.title || 'Job Title'}
                        </h1>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
                          <span className="flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {formData.location || 'Location'}
                          </span>
                          <span className="flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            {formData.workType ? formData.workType.charAt(0).toUpperCase() + formData.workType.slice(1) : 'Work Type'}
                          </span>
                          <span className="flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            {formData.workArrangement ? formData.workArrangement.charAt(0).toUpperCase() + formData.workArrangement.slice(1) : 'Work Arrangement'}
                          </span>
                        </div>
                        
                        {/* Salary Range */}
                        {(formData.minSalary || formData.maxSalary) && (
                <div className="mb-4">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                              💰 {formData.currency || 'PHP'} {formData.minSalary && formData.maxSalary 
                                ? `${formData.minSalary} - ${formData.maxSalary}`
                                : formData.minSalary 
                                  ? `${formData.minSalary}+`
                                  : `Up to ${formData.maxSalary}`
                              }
                            </span>
                </div>
                        )}

                        {/* Category */}
                        {formData.category && (
                    <div className="mb-4">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                              📂 {formData.category}
                            </span>
                    </div>
                  )}
                      </div>

                      {/* Preview Note */}
                      <div className="ml-6">
                        <div className="bg-gray-100 text-gray-500 px-6 py-3 rounded-lg font-medium cursor-not-allowed">
                          Apply Button (Preview)
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Job Description */}
                  <div className="mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-3">Job Description</h2>
                    <div className="text-gray-700 whitespace-pre-wrap">
                      {formData.description || 'Job description will appear here...'}
                    </div>
                  </div>

                  {/* Summary */}
                  {formData.summary && (
                    <div className="mb-6">
                      <h2 className="text-lg font-semibold text-gray-900 mb-3">Summary</h2>
                      <div className="text-gray-700 whitespace-pre-wrap">
                        {formData.summary}
                      </div>
                    </div>
                  )}

                  {/* Video */}
                  {formData.videoUrl && (
                    <div className="mb-6">
                      <h2 className="text-lg font-semibold text-gray-900 mb-3">Company Video</h2>
                      <div className="bg-gray-100 p-4 rounded-lg">
                        <a href={formData.videoUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                          🎥 Watch Company Video
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Job Details */}
                  <div className="grid grid-cols-2 gap-6 mb-6">
                  <div>
                      <h3 className="font-medium text-gray-900 mb-2">Job Details</h3>
                      <ul className="space-y-1 text-sm text-gray-600">
                        <li>Experience Level: {formData.experienceLevel || 'Entry Level'}</li>
                        <li>Positions Available: {formData.positionsAvailable || '1'} position{formData.positionsAvailable !== '1' ? 's' : ''}</li>
                        {formData.applicationLimit && <li>Application Limit: {formData.applicationLimit} application{formData.applicationLimit !== '1' ? 's' : ''}</li>}
                        {formData.applicationDeadline && <li>Deadline: {new Date(formData.applicationDeadline).toLocaleDateString()}</li>}
                        <li>Target Students: {formData.targetStudentType === 'both' ? 'OJT & Graduated' : formData.targetStudentType === 'ojt' ? 'OJT Students Only' : 'Graduated Students Only'}</li>
                        <li>Status: {formData.status.charAt(0).toUpperCase() + formData.status.slice(1)}</li>
                      </ul>
                  </div>
                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">Posted By</h3>
                      <ul className="space-y-1 text-sm text-gray-600">
                        {formData.businessType === 'my_business' ? (
                          <li>Coordinator: {coordinatorProfile?.first_name || ''} {coordinatorProfile?.last_name || ''}</li>
                        ) : (
                          <>
                            {formData.companyName && <li>Company: {formData.companyName}</li>}
                            {formData.businessOwnerName && <li>Business Owner: {formData.businessOwnerName}</li>}
                          </>
                        )}
                      </ul>
                    </div>
                  </div>

                  {/* Screening Questions Preview */}
                  {(selectedQuestions.length > 0 || existingQuestions.length > 0 || customQuestions.length > 0) && (
                    <div className="mb-6">
                      <h2 className="text-lg font-semibold text-gray-900 mb-3">Application Questions</h2>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600 mb-2">Applicants will be asked to answer these questions:</p>
                        <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                          {selectedQuestions.map(key => (
                            <li key={key}>{PREDEFINED_QUESTIONS[key].questionText}</li>
                          ))}
                          {existingQuestions.map((q, index) => (
                            <li key={`existing-${index}`}>{q.questionText}</li>
                          ))}
                          {customQuestions.map((q, index) => (
                            <li key={`new-${index}`}>{q.questionText}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg">
                <div className="flex justify-end space-x-3">
                  <button 
                    onClick={() => setShowPreview(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Close Preview
                  </button>
                  <button 
                    onClick={() => {
                      setShowPreview(false);
                      handleSubmit(new Event('submit') as any);
                    }}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Update This Job
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
