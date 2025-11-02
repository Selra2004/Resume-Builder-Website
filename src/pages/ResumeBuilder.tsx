import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  DocumentTextIcon, 
  PlusIcon, 
  TrashIcon, 
  StarIcon,
  ArrowDownTrayIcon,
  DocumentDuplicateIcon 
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { resumeAPI } from '../services/api';

interface Resume {
  id: number;
  title: string;
  template_id: string;
  status: 'draft' | 'completed';
  is_primary: boolean;
  download_count: number;
  created_at: string;
  updated_at: string;
  template?: {
    name: string;
    hasPhoto: boolean;
    isATS: boolean;
  };
}

export const ResumeBuilder: React.FC = () => {
  const navigate = useNavigate();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'draft' | 'completed'>('all');

  useEffect(() => {
    fetchResumes();
  }, [filter]);

  const fetchResumes = async () => {
    try {
      setLoading(true);
      const status = filter === 'all' ? undefined : filter;
      const response = await resumeAPI.getResumes(status);
      setResumes(response.data);
    } catch (error) {
      console.error('Failed to fetch resumes:', error);
      toast.error('Failed to load resumes');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateResume = () => {
    navigate('/resume-builder/templates');
  };

  const handleEditResume = (resumeId: number) => {
    navigate(`/resume-builder/edit/${resumeId}`);
  };

  const handleDuplicateResume = async (resumeId: number, title: string) => {
    try {
      await resumeAPI.duplicateResume(resumeId, `${title} - Copy`);
      toast.success('Resume duplicated successfully');
      fetchResumes();
    } catch (error) {
      console.error('Failed to duplicate resume:', error);
      toast.error('Failed to duplicate resume');
    }
  };

  const handleDeleteResume = async (resumeId: number, title: string) => {
    if (window.confirm(`Are you sure you want to delete "${title}"?`)) {
      try {
        await resumeAPI.deleteResume(resumeId);
        toast.success('Resume deleted successfully');
        fetchResumes();
      } catch (error) {
        console.error('Failed to delete resume:', error);
        toast.error('Failed to delete resume');
      }
    }
  };

  const handleSetPrimary = async (resumeId: number) => {
    try {
      await resumeAPI.setPrimaryResume(resumeId);
      toast.success('Primary resume updated');
      fetchResumes();
    } catch (error) {
      console.error('Failed to set primary resume:', error);
      toast.error('Failed to set primary resume');
    }
  };

  const handleDownloadResume = async (resumeId: number) => {
    try {
      await resumeAPI.downloadResume(resumeId);
      // For now, just navigate to the resume editor with download=true
      // In a full implementation, this would generate and download a PDF
      navigate(`/resume-builder/edit/${resumeId}?download=true`);
    } catch (error) {
      console.error('Failed to download resume:', error);
      toast.error('Failed to download resume');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Resume Builder</h1>
        <p className="mt-2 text-gray-600">
          Create and manage your professional resumes with our easy-to-use builder.
        </p>
      </div>

      {/* Create Resume Button */}
      <div className="mb-8">
        <button 
          onClick={handleCreateResume}
          className="inline-flex items-center px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Create New Resume
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="mb-6">
        <nav className="flex flex-wrap space-x-1 bg-gray-100 rounded-lg p-1">
          {[
            { key: 'all', label: 'All Resumes' },
            { key: 'draft', label: 'Drafts' },
            { key: 'completed', label: 'Completed' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key as any)}
              className={`flex-1 sm:flex-none px-3 py-2 text-sm font-medium rounded-md transition-colors text-center ${
                filter === tab.key
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* My Resumes */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6">
          <h2 className="text-xl font-semibold text-gray-900">My Resumes</h2>
          <span className="text-sm text-gray-500">
            {resumes.length} {resumes.length === 1 ? 'resume' : 'resumes'}
          </span>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="text-gray-500 mt-2">Loading resumes...</p>
          </div>
        ) : resumes.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No resumes yet</h3>
            <p className="text-gray-500 mb-6">Get started by creating your first resume</p>
            <button 
              onClick={handleCreateResume}
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Create Resume
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {resumes.map((resume) => (
              <div key={resume.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3 flex-1">
                      <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                        <DocumentTextIcon className="h-6 w-6 text-primary-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 truncate">{resume.title}</h3>
                        <p className="text-sm text-gray-500">
                          {resume.template?.name} {resume.template?.isATS && '(ATS)'}
                        </p>
                        <p className="text-xs text-gray-400">
                          Updated {new Date(resume.updated_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      {resume.is_primary && (
                        <span className="px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-full">
                          Primary
                        </span>
                      )}
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        resume.status === 'completed' 
                          ? 'text-blue-700 bg-blue-100' 
                          : 'text-yellow-700 bg-yellow-100'
                      }`}>
                        {resume.status === 'completed' ? 'Complete' : 'Draft'}
                      </span>
                    </div>
                  </div>

                  <div className="text-xs text-gray-500 mb-4">
                    Downloads: {resume.download_count}
                  </div>

                  <div className="flex space-x-2">
                    <button 
                      onClick={() => handleEditResume(resume.id)}
                      className="flex-1 flex items-center justify-center py-2 px-3 text-sm font-medium text-primary-600 bg-primary-50 rounded-md hover:bg-primary-100 transition-colors"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDownloadResume(resume.id)}
                      className="flex items-center justify-center p-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                      title="Download PDF"
                    >
                      <ArrowDownTrayIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <div className="flex space-x-1">
                      {!resume.is_primary && (
                        <button 
                          onClick={() => handleSetPrimary(resume.id)}
                          className="p-1 text-gray-400 hover:text-yellow-500 transition-colors"
                          title="Set as Primary"
                        >
                          <StarIcon className="h-4 w-4" />
                        </button>
                      )}
                      <button 
                        onClick={() => handleDuplicateResume(resume.id, resume.title)}
                        className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
                        title="Duplicate"
                      >
                        <DocumentDuplicateIcon className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteResume(resume.id, resume.title)}
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                        title="Delete"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Resume Tips */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Resume Tips</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Essential Sections</h4>
            <ul className="space-y-1 text-sm text-gray-600">
              <li>• Contact Information</li>
              <li>• Professional Summary</li>
              <li>• Education</li>
              <li>• Skills & Technologies</li>
              <li>• Work Experience</li>
              <li>• Projects (if applicable)</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Best Practices</h4>
            <ul className="space-y-1 text-sm text-gray-600">
              <li>• Keep it to 1-2 pages maximum</li>
              <li>• Use action verbs to describe achievements</li>
              <li>• Quantify your accomplishments</li>
              <li>• Customize for each job application</li>
              <li>• Use a clean, professional format</li>
              <li>• Proofread for errors</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
