import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { toast } from 'react-hot-toast';
import { formatNumberWithCommas, handleCommaFormattedInput, removeCommasFromNumber } from '../utils/formatUtils';
import {
  BriefcaseIcon,
  Cog6ToothIcon,
  PlusIcon,
  TrashIcon,
  BuildingOfficeIcon,
  UserIcon
} from '@heroicons/react/24/outline';

interface JobCategory {
  course_name: string;
  categories: string[];
}

interface ScreeningQuestion {
  questionText: string;
  questionType: string;
  options?: string[];
  isRequired: boolean;
}

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

export const CreateJob: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [coordinatorProfile, setCoordinatorProfile] = useState<{ first_name?: string; last_name?: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [jobCategories, setJobCategories] = useState<JobCategory[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  
  const [formData, setFormData] = useState({
    // Business Type Selection
    businessType: 'my_business', // 'my_business' or 'other_business'
    
    // Basic Information
    title: '',
    location: '',
    category: '',
    workType: 'internship',
    workArrangement: 'on-site',
    
    // Salary Information
    currency: 'PHP',
    minSalary: '',
    maxSalary: '',
    
    // Job Details
    description: '',
    summary: '',
    videoUrl: '',
    
    // Company Information (for other business)
    companyName: '',
    businessOwnerName: '',
    
    // Additional Settings
    applicationDeadline: '',
    positionsAvailable: '1',
    applicationLimit: '',
    experienceLevel: 'entry-level',
    targetStudentType: 'both', // 'graduated', 'ojt', 'both'
    filterPreScreening: false
  });
  
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const [customQuestions, setCustomQuestions] = useState<ScreeningQuestion[]>([]);

  useEffect(() => {
    fetchJobCategories();
    if (user?.role === 'coordinator') {
      fetchCoordinatorProfile();
    }
  }, [user]);

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
      toast.error('Failed to load job categories');
    }
  };

  const handleCourseChange = (course: string) => {
    setSelectedCourse(course);
    const courseData = jobCategories.find(c => c.course_name === course);
    setAvailableCategories(courseData?.categories || []);
    setFormData(prev => ({ ...prev, category: '' }));
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleQuestionToggle = (questionKey: string) => {
    setSelectedQuestions(prev => 
      prev.includes(questionKey)
        ? prev.filter(q => q !== questionKey)
        : [...prev, questionKey]
    );
  };

  const addCustomQuestion = () => {
    setCustomQuestions(prev => [...prev, {
      questionText: '',
      questionType: 'custom',
      isRequired: false
    }]);
  };

  const updateCustomQuestion = (index: number, field: string, value: any) => {
    setCustomQuestions(prev => 
      prev.map((q, i) => i === index ? { ...q, [field]: value } : q)
    );
  };

  const removeCustomQuestion = (index: number) => {
    setCustomQuestions(prev => prev.filter((_, i) => i !== index));
  };

  const [showPreview, setShowPreview] = useState(false);

  const createJobData = () => {
    const screeningQuestions = [
      ...selectedQuestions.map(key => PREDEFINED_QUESTIONS[key]),
      ...customQuestions.filter(q => q.questionText.trim() !== '')
    ];

    // Parse salary values, removing commas first
    const parsedMinSalary = formData.minSalary ? parseFloat(removeCommasFromNumber(formData.minSalary)) : null;
    const parsedMaxSalary = formData.maxSalary ? parseFloat(removeCommasFromNumber(formData.maxSalary)) : null;
    const parsedApplicationLimit = formData.applicationLimit ? parseInt(removeCommasFromNumber(formData.applicationLimit)) : null;

    return {
      ...formData,
      minSalary: parsedMinSalary && !isNaN(parsedMinSalary) ? parsedMinSalary : null,
      maxSalary: parsedMaxSalary && !isNaN(parsedMaxSalary) ? parsedMaxSalary : null,
      positionsAvailable: parseInt(formData.positionsAvailable) || 1,
      applicationLimit: parsedApplicationLimit && !isNaN(parsedApplicationLimit) ? parsedApplicationLimit : null,
      // Set coordinator name automatically based on user info for my_business, or use provided names for other_business
      coordinatorName: formData.businessType === 'my_business' ? `${coordinatorProfile?.first_name || ''} ${coordinatorProfile?.last_name || ''}`.trim() : null,
      companyName: formData.businessType === 'other_business' ? formData.companyName : null,
      businessOwnerName: formData.businessType === 'other_business' ? formData.businessOwnerName : null,
      screeningQuestions,
      status: 'active' // This will post the job live
    };
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

    setLoading(true);

    try {
      const jobData = createJobData();
      const response = await api.post('/jobs', jobData);
      toast.success('Job posted successfully and is now live!');
      navigate(`/jobs/${response.data.jobId}`);
    } catch (error: any) {
      if (error.response?.status === 403) {
        toast.error('Permission denied. Please make sure you are logged in as a coordinator.');
      } else if (error.response?.status === 401) {
        toast.error('Authentication failed. Please log in again.');
      } else {
        toast.error(error.response?.data?.message || 'Failed to post job');
      }
      console.error('Error creating job:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!formData.title) {
      toast.error('Please enter a job title to save as draft');
      return;
    }

    setLoading(true);

    try {
      const jobData = {
        ...createJobData(),
        status: 'draft' // Save as draft
      };
      
      await api.post('/jobs', jobData);
      toast.success('Job saved as draft successfully!');
      navigate('/coordinator/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save draft');
      console.error('Error saving draft:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = () => {
    if (!formData.title || !formData.description) {
      toast.error('Please fill in at least the title and description to preview');
      return;
    }
    setShowPreview(true);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Create New Job Posting</h1>
        <p className="mt-2 text-gray-600">
          Post a new job opportunity and connect with talented students.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Business Type Selection */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <BriefcaseIcon className="h-6 w-6 mr-2 text-green-600" />
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
                  onChange={(e) => handleInputChange('businessType', e.target.value)}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                />
                <div className="ml-3">
                  <div className="flex items-center">
                    <UserIcon className="h-5 w-5 text-green-600 mr-2" />
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
                  onChange={(e) => handleInputChange('businessType', e.target.value)}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                />
                <div className="ml-3">
                  <div className="flex items-center">
                    <BuildingOfficeIcon className="h-5 w-5 text-green-600 mr-2" />
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
                      value={formData.companyName}
                      onChange={(e) => handleInputChange('companyName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
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
                      value={formData.businessOwnerName}
                      onChange={(e) => handleInputChange('businessOwnerName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
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
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <div className="w-6 h-6 rounded-full bg-green-600 text-white flex items-center justify-center text-sm mr-2">1</div>
              Basic Information
            </h2>
            <p className="text-sm text-gray-600 mt-1">Essential details about the job position</p>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Job Title *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="e.g., Senior Software Developer"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location *
              </label>
              <input
                type="text"
                required
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="e.g., Manila, Metro Manila"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Course
              </label>
              <select
                value={selectedCourse}
                onChange={(e) => handleCourseChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="">Select a course</option>
                {jobCategories.map((course) => (
                  <option key={course.course_name} value={course.course_name}>
                    {course.course_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <select
                required
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                disabled={!selectedCourse}
              >
                <option value="">Select a category</option>
                {availableCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {/* Work Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">Work Type</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { value: 'full-time', label: 'Full-time' },
                  { value: 'part-time', label: 'Part-time' },
                  { value: 'contract', label: 'Contract' },
                  { value: 'internship', label: 'Internship' }
                ].map((option) => (
                  <label key={option.value} className="flex items-center">
                    <input
                      type="radio"
                      name="workType"
                      value={option.value}
                      checked={formData.workType === option.value}
                      onChange={(e) => handleInputChange('workType', e.target.value)}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-700">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Work Arrangement */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">Work Arrangement</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { value: 'on-site', label: 'On-site' },
                  { value: 'remote', label: 'Remote' },
                  { value: 'hybrid', label: 'Hybrid' }
                ].map((option) => (
                  <label key={option.value} className="flex items-center">
                    <input
                      type="radio"
                      name="workArrangement"
                      value={option.value}
                      checked={formData.workArrangement === option.value}
                      onChange={(e) => handleInputChange('workArrangement', e.target.value)}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-700">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Salary Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <div className="w-6 h-6 rounded-full bg-green-600 text-white flex items-center justify-center text-sm mr-2">2</div>
              Salary Information
            </h2>
            <p className="text-sm text-gray-600 mt-1">Set the compensation range for this position</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
              <select
                value={formData.currency}
                onChange={(e) => handleInputChange('currency', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="PHP">PHP</option>
                <option value="USD">USD</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Salary</label>
              <input
                type="text"
                value={formData.minSalary}
                onChange={(e) => handleCommaFormattedInput(e.target.value, (value) => handleInputChange('minSalary', value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="Enter minimum salary (e.g., 15,000)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Maximum Salary</label>
              <input
                type="text"
                value={formData.maxSalary}
                onChange={(e) => handleCommaFormattedInput(e.target.value, (value) => handleInputChange('maxSalary', value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="Enter maximum salary (e.g., 25,000)"
              />
            </div>
          </div>
        </div>

        {/* Job Details */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <div className="w-6 h-6 rounded-full bg-green-600 text-white flex items-center justify-center text-sm mr-2">3</div>
              Job Details
            </h2>
            <p className="text-sm text-gray-600 mt-1">Detailed description and requirements</p>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Job Description *
              </label>
              <textarea
                required
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={8}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="Describe the job role, responsibilities, requirements, and what makes this opportunity exciting..."
              />
              <p className="text-xs text-gray-500 mt-1">0 / 15,000 characters</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Job Summary
              </label>
              <textarea
                value={formData.summary}
                onChange={(e) => handleInputChange('summary', e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="Brief overview of the position, key requirements, and what you offer..."
              />
              <p className="text-xs text-gray-500 mt-1">0 / 500 characters</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Video URL (optional)
              </label>
              <input
                type="url"
                value={formData.videoUrl}
                onChange={(e) => handleInputChange('videoUrl', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="https://www.youtube.com/watch?v=example123"
              />
              <p className="text-xs text-gray-500 mt-1">
                Add a YouTube video link to showcase your company or position.
              </p>
            </div>
          </div>
        </div>

        {/* Additional Settings */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <div className="w-6 h-6 rounded-full bg-green-600 text-white flex items-center justify-center text-sm mr-2">4</div>
              Additional Settings
            </h2>
            <p className="text-sm text-gray-600 mt-1">Configure posting preferences and deadlines</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Application Deadline
              </label>
              <input
                type="date"
                value={formData.applicationDeadline}
                onChange={(e) => handleInputChange('applicationDeadline', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
              <p className="text-xs text-gray-500 mt-1">Applications will close on this date</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Positions Available
              </label>
              <input
                type="number"
                min="1"
                value={formData.positionsAvailable}
                onChange={(e) => handleInputChange('positionsAvailable', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
              <p className="text-xs text-gray-500 mt-1">Number of openings for this position</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Application Limit
                <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                min="1"
                value={formData.applicationLimit}
                onChange={(e) => handleCommaFormattedInput(e.target.value, (value) => handleInputChange('applicationLimit', value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="Enter maximum applications (e.g., 50)"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Maximum number of applications allowed for this job posting.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Student Type
              </label>
              <select
                value={formData.targetStudentType}
                onChange={(e) => handleInputChange('targetStudentType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="both">Both OJT & Graduated</option>
                <option value="ojt">OJT Students Only</option>
                <option value="graduated">Graduated Students Only</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">Who can apply for this position</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-4">Experience Level</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { value: 'entry-level', label: 'Entry Level' },
                { value: 'mid-level', label: 'Mid Level' },
                { value: 'senior-level', label: 'Senior Level' },
                { value: 'executive', label: 'Executive' }
              ].map((option) => (
                <label key={option.value} className="flex items-center">
                  <input
                    type="radio"
                    name="experienceLevel"
                    value={option.value}
                    checked={formData.experienceLevel === option.value}
                    onChange={(e) => handleInputChange('experienceLevel', e.target.value)}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">{option.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Screening Questions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <div className="w-6 h-6 rounded-full bg-green-600 text-white flex items-center justify-center text-sm mr-2">5</div>
              Set up your screening questions and filters
            </h2>
            <p className="text-sm text-gray-600 mt-1">Ask candidates questions to help you find the best fit</p>
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
              We've pre-selected some questions based on what most employers select. These questions will create filters for your applications. You can also add more questions.
            </p>

            <div className="space-y-4">
              {Object.entries(PREDEFINED_QUESTIONS).map(([key, question]) => (
                <div key={key} className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                  <div className="flex items-start">
                    <input
                      type="checkbox"
                      id={key}
                      checked={selectedQuestions.includes(key)}
                      onChange={() => handleQuestionToggle(key)}
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

            {/* Custom Questions */}
            {customQuestions.length > 0 && (
              <div className="mt-6">
                <h4 className="text-sm font-medium text-gray-900 mb-4">Custom Questions</h4>
                <div className="space-y-4">
                  {customQuestions.map((question, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <input
                            type="text"
                            value={question.questionText}
                            onChange={(e) => updateCustomQuestion(index, 'questionText', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            placeholder="Enter your custom question"
                          />
                          <div className="mt-2 flex items-center">
                            <input
                              type="checkbox"
                              checked={question.isRequired}
                              onChange={(e) => updateCustomQuestion(index, 'isRequired', e.target.checked)}
                              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
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
              className="mt-4 inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
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
                    Questions, answers and other settings can be edited after you post your job ad to improve candidate matching.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-between">
          <button
            type="button"
            onClick={() => navigate('/coordinator/dashboard')}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            ← Back
          </button>
          
          <div className="space-x-4">
            <button
              type="button"
              onClick={handlePreview}
              className="px-6 py-3 border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              👁️ Preview
            </button>
            
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={loading}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              💾 Save Draft
            </button>
            
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Posting...' : '+ Continue & Post Job'}
            </button>
          </div>
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
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
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
                {(selectedQuestions.length > 0 || customQuestions.length > 0) && (
                  <div className="mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-3">Application Questions</h2>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600 mb-2">Applicants will be asked to answer these questions:</p>
                      <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                        {selectedQuestions.map(key => (
                          <li key={key}>{PREDEFINED_QUESTIONS[key].questionText}</li>
                        ))}
                        {customQuestions.map((q, index) => (
                          <li key={index}>{q.questionText}</li>
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
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Post This Job
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

