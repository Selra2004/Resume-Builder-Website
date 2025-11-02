import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { resumeAPI } from '../services/api';
import { ArrowLeftIcon, CheckCircleIcon, PhotoIcon } from '@heroicons/react/24/outline';

interface Template {
  id: string;
  name: string;
  hasPhoto: boolean;
  isATS: boolean;
}

export const ResumeTemplateSelection: React.FC = () => {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<Record<string, Template>>({});
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [resumeTitle, setResumeTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await resumeAPI.getTemplates();
      setTemplates(response.data);
    } catch (error) {
      console.error('Failed to fetch templates:', error);
      toast.error('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateResume = async () => {
    if (!selectedTemplate || !resumeTitle.trim()) {
      toast.error('Please select a template and enter a resume title');
      return;
    }

    setCreating(true);
    try {
      const response = await resumeAPI.createResume({
        title: resumeTitle.trim(),
        templateId: selectedTemplate,
      });

      toast.success('Resume created successfully!');
      navigate(`/resume-builder/edit/${response.data.resumeId}`);
    } catch (error) {
      console.error('Failed to create resume:', error);
      toast.error('Failed to create resume');
    } finally {
      setCreating(false);
    }
  };

  const templatePreviews = {
    'classic-with-photo': (
      <div className="bg-white border border-gray-200 rounded-lg p-4 h-64 text-xs">
        {/* Classic: Photo on left, info on right */}
        <div className="flex items-start space-x-4 mb-3">
          <div className="w-12 h-12 bg-gray-200 flex items-center justify-center">
            <PhotoIcon className="w-6 h-6 text-gray-400" />
          </div>
          <div className="flex-1">
            <div className="h-4 bg-gray-900 rounded w-32 mb-1"></div>
            <div className="h-3 bg-gray-600 rounded w-24 mb-2"></div>
            <div className="space-y-1">
              <div className="h-2 bg-gray-400 rounded w-20 flex items-center">
                <span className="text-xs">✉</span>
              </div>
              <div className="h-2 bg-gray-400 rounded w-24"></div>
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-2 bg-gray-300 rounded w-full"></div>
          <div className="h-2 bg-gray-300 rounded w-3/4"></div>
          <div className="h-3 bg-gray-700 rounded w-20 mt-3"></div>
        </div>
      </div>
    ),
    'modern-with-photo': (
      <div className="bg-gradient-to-br from-blue-50 to-indigo-100 border border-gray-200 rounded-lg p-4 h-64 text-xs">
        {/* Modern: Rounded containers with gradient */}
        <div className="bg-white rounded-lg p-3 mb-2 shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-200 rounded-lg flex items-center justify-center">
              <PhotoIcon className="w-5 h-5 text-blue-400" />
            </div>
            <div className="flex-1">
              <div className="h-3 bg-blue-900 rounded w-28 mb-1"></div>
              <div className="h-2 bg-blue-700 rounded w-20 mb-2"></div>
              <div className="grid grid-cols-3 gap-1">
                <div className="h-1 bg-blue-600 rounded"></div>
                <div className="h-1 bg-blue-600 rounded"></div>
                <div className="h-1 bg-blue-600 rounded"></div>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg p-3 space-y-2">
          <div className="h-2 bg-gray-200 rounded w-full"></div>
          <div className="h-2 bg-gray-200 rounded w-4/5"></div>
        </div>
      </div>
    ),
    'elegant-with-photo': (
      <div className="bg-white border border-gray-200 rounded-lg p-4 h-64 text-xs">
        {/* Elegant: Photo on right, sophisticated layout */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1 pr-3">
            <div className="h-3 bg-gray-800 rounded w-20 mb-1"></div>
            <div className="h-3 bg-gray-800 rounded w-24 mb-3"></div>
            <div className="h-2 bg-gray-600 rounded w-28 mb-3 border-l-2 border-gray-300 pl-2"></div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-1 bg-gray-400 rounded"></div>
                <div className="h-2 bg-gray-600 rounded w-16"></div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-1 bg-gray-400 rounded"></div>
                <div className="h-2 bg-gray-600 rounded w-20"></div>
              </div>
            </div>
          </div>
          <div className="w-14 h-14 bg-gray-100 shadow-md flex items-center justify-center">
            <PhotoIcon className="w-6 h-6 text-gray-500" />
          </div>
        </div>
        <hr className="border-gray-300 mb-2" />
        <div className="space-y-1">
          <div className="h-2 bg-gray-300 rounded w-full"></div>
          <div className="h-2 bg-gray-300 rounded w-3/4"></div>
        </div>
      </div>
    ),
    'classic-ats': (
      <div className="bg-white border border-gray-200 rounded-lg p-4 h-64 text-xs">
        {/* Classic ATS: Centered header, uppercase name */}
        <div className="text-center mb-4 border-b-2 border-gray-300 pb-3">
          <div className="h-3 bg-gray-900 rounded w-32 mx-auto mb-1 uppercase tracking-wider"></div>
          <div className="h-2 bg-gray-600 rounded w-24 mx-auto mb-2"></div>
          <div className="flex justify-center space-x-3">
            <div className="h-1 bg-gray-400 rounded w-16"></div>
            <div className="h-1 bg-gray-400 rounded w-20"></div>
            <div className="h-1 bg-gray-400 rounded w-18"></div>
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-2 bg-gray-300 rounded w-full"></div>
          <div className="h-2 bg-gray-300 rounded w-3/4"></div>
          <div className="h-3 bg-gray-700 rounded w-20 mt-3"></div>
          <div className="space-y-1">
            <div className="h-2 bg-gray-300 rounded w-full"></div>
            <div className="h-2 bg-gray-300 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    ),
    'modern-ats': (
      <div className="bg-white border border-gray-200 rounded-lg p-4 h-64 text-xs">
        {/* Modern ATS: Left-aligned header with tags */}
        <div className="mb-4 pb-2 border-b border-gray-400">
          <div className="h-4 bg-gray-900 rounded w-32 mb-1"></div>
          <div className="h-2 bg-gray-600 rounded w-24 mb-3"></div>
          <div className="flex space-x-2">
            <div className="bg-gray-100 px-2 py-1 rounded">
              <div className="h-1 bg-gray-600 rounded w-12"></div>
            </div>
            <div className="bg-gray-100 px-2 py-1 rounded">
              <div className="h-1 bg-gray-600 rounded w-16"></div>
            </div>
            <div className="bg-gray-100 px-2 py-1 rounded">
              <div className="h-1 bg-gray-600 rounded w-14"></div>
            </div>
          </div>
        </div>
        <div className="space-y-3">
          <div>
            <div className="h-3 bg-gray-700 rounded w-20 mb-2"></div>
            <div className="space-y-1">
              <div className="h-2 bg-gray-300 rounded w-full"></div>
              <div className="h-2 bg-gray-300 rounded w-4/5"></div>
            </div>
          </div>
        </div>
      </div>
    ),
    'simple-ats': (
      <div className="bg-white border border-gray-200 rounded-lg p-4 h-64 text-xs">
        {/* Simple ATS: Minimal header with two-column layout */}
        <div className="mb-4">
          <div className="h-3 bg-gray-900 rounded w-28 mb-2"></div>
          <div className="h-2 bg-gray-600 rounded w-20 mb-3"></div>
          <div className="grid grid-cols-2 gap-4 mb-3">
            <div className="space-y-1">
              <div className="flex items-center gap-1">
                <div className="h-1 bg-gray-500 rounded w-6"></div>
                <div className="h-1 bg-gray-600 rounded w-16"></div>
              </div>
              <div className="flex items-center gap-1">
                <div className="h-1 bg-gray-500 rounded w-6"></div>
                <div className="h-1 bg-gray-600 rounded w-20"></div>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1">
                <div className="h-1 bg-gray-500 rounded w-8"></div>
                <div className="h-1 bg-gray-600 rounded w-18"></div>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-200 pt-2">
            <div className="space-y-1">
              <div className="h-2 bg-gray-300 rounded w-full"></div>
              <div className="h-2 bg-gray-300 rounded w-3/4"></div>
            </div>
          </div>
        </div>
      </div>
    )
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="text-gray-500 mt-2">Loading templates...</p>
        </div>
      </div>
    );
  }

  const photoTemplates = Object.entries(templates).filter(([_, template]) => template.hasPhoto);
  const atsTemplates = Object.entries(templates).filter(([_, template]) => template.isATS);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/resume-builder')}
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Back to Resume Builder
        </button>
        <h1 className="text-3xl font-bold text-gray-900">Choose a Template</h1>
        <p className="mt-2 text-gray-600">
          Select a professionally designed template to get started with your resume.
        </p>
      </div>

      {/* Resume Title Input */}
      <div className="mb-8">
        <label htmlFor="resumeTitle" className="block text-sm font-medium text-gray-700 mb-2">
          Resume Title
        </label>
        <input
          type="text"
          id="resumeTitle"
          value={resumeTitle}
          onChange={(e) => setResumeTitle(e.target.value)}
          placeholder="e.g., Software Developer Resume, Marketing Professional Resume"
          className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
        />
      </div>

      {/* Templates with Photos */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Templates with Photo</h2>
          <span className="text-sm text-gray-500">Perfect for creative roles</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {photoTemplates.map(([id, template]) => (
            <div
              key={id}
              onClick={() => setSelectedTemplate(id)}
              className={`relative cursor-pointer rounded-lg border-2 transition-all ${
                selectedTemplate === id
                  ? 'border-primary-500 ring-2 ring-primary-200'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {selectedTemplate === id && (
                <div className="absolute -top-2 -right-2 z-10">
                  <CheckCircleIcon className="h-6 w-6 text-primary-600 bg-white rounded-full" />
                </div>
              )}
              <div className="p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-3">{template.name}</h3>
                {templatePreviews[id as keyof typeof templatePreviews]}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ATS Templates */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">ATS-Friendly Templates</h2>
          <span className="text-sm text-gray-500">Optimized for Applicant Tracking Systems</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {atsTemplates.map(([id, template]) => (
            <div
              key={id}
              onClick={() => setSelectedTemplate(id)}
              className={`relative cursor-pointer rounded-lg border-2 transition-all ${
                selectedTemplate === id
                  ? 'border-primary-500 ring-2 ring-primary-200'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {selectedTemplate === id && (
                <div className="absolute -top-2 -right-2 z-10">
                  <CheckCircleIcon className="h-6 w-6 text-primary-600 bg-white rounded-full" />
                </div>
              )}
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-medium text-gray-900">{template.name}</h3>
                  <span className="px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-full">
                    ATS
                  </span>
                </div>
                {templatePreviews[id as keyof typeof templatePreviews]}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/resume-builder')}
          className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium"
        >
          Cancel
        </button>
        <button
          onClick={handleCreateResume}
          disabled={!selectedTemplate || !resumeTitle.trim() || creating}
          className="px-6 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {creating ? 'Creating...' : 'Create Resume'}
        </button>
      </div>

      {/* Template Info */}
      <div className="mt-12 bg-blue-50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-blue-900 mb-4">Template Guidelines</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-blue-800">
          <div>
            <h4 className="font-medium mb-2">Templates with Photo:</h4>
            <ul className="space-y-1">
              <li>• Best for creative and customer-facing roles</li>
              <li>• Include professional headshot</li>
              <li>• Show personality and professionalism</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">ATS-Friendly Templates:</h4>
            <ul className="space-y-1">
              <li>• Optimized for Applicant Tracking Systems</li>
              <li>• Simple formatting for better parsing</li>
              <li>• Higher chance of passing initial screenings</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
