import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { resumeAPI } from '../services/api';
import { 
  ArrowLeftIcon, 
  DocumentArrowDownIcon,
  CheckIcon,
  PlusIcon,
  TrashIcon 
} from '@heroicons/react/24/outline';
import { ProfilePhotoUpload } from '../components/ProfilePhotoUpload';
import { RichTextEditor } from '../components/RichTextEditor';
import { userAPI } from '../services/api';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface ResumeData {
  id: number;
  title: string;
  template_id: string;
  status: 'draft' | 'completed';
  personal_info: any;
  professional_summary: string;
  work_experience: any[];
  education: any[];
  skills: any[];
  websites_social_links: any[];
  custom_sections: any[];
  extracurricular_activities: any[];
  hobbies: string;
  references: any[];
  languages: any[];
  font_family: string;
  paper_size: string;
  template?: any;
}

export const ResumeEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [downloadTriggered, setDownloadTriggered] = useState(false);

  const [resume, setResume] = useState<ResumeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);
  const [activeSection, setActiveSection] = useState('personal');
  const [templates, setTemplates] = useState<Record<string, any>>({});
  const [isMobilePreview, setIsMobilePreview] = useState(false);
  const [showSkillLevels, setShowSkillLevels] = useState(true);
  const [templateColor, setTemplateColor] = useState('blue');

  // Auto-save timer
  const [autoSaveTimer, setAutoSaveTimer] = useState<number | null>(null);

  useEffect(() => {
    if (id) {
      fetchResume();
      fetchTemplates();
    }
  }, [id]);

  // Handle download parameter - only trigger once when page loads
  useEffect(() => {
    const shouldDownload = searchParams.get('download') === 'true';
    
    if (shouldDownload && resume && !downloadTriggered) {
      // Clear the download parameter from URL to prevent re-triggers
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('download');
      setSearchParams(newParams, { replace: true });
      
      // Mark as triggered and download after a short delay
      setDownloadTriggered(true);
      setTimeout(() => {
        handleDownloadPDF();
      }, 500);
    }
  }, [resume, searchParams, downloadTriggered, setSearchParams]);

  // Cleanup auto-save timer on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimer) {
        clearTimeout(autoSaveTimer);
      }
    };
  }, [autoSaveTimer]);

  const fetchResume = async () => {
    try {
      const response = await resumeAPI.getResume(Number(id));
      const resumeData = response.data;
      
      // Ensure all required fields exist with default values
      resumeData.personal_info = resumeData.personal_info || {};
      resumeData.professional_summary = resumeData.professional_summary || '';
      resumeData.work_experience = resumeData.work_experience || [];
      resumeData.education = resumeData.education || [];
      resumeData.skills = resumeData.skills || [];
      resumeData.websites_social_links = resumeData.websites_social_links || [];
      resumeData.custom_sections = resumeData.custom_sections || [];
      resumeData.extracurricular_activities = resumeData.extracurricular_activities || [];
      resumeData.hobbies = resumeData.hobbies || '';
      resumeData.references = resumeData.references || [];
      resumeData.languages = resumeData.languages || [];
      resumeData.font_family = resumeData.font_family || 'times-new-roman';
      resumeData.paper_size = resumeData.paper_size || 'a4';
      
      // Only pre-populate if personal_info is truly empty (no meaningful data)
      const hasPersonalData = resumeData.personal_info && (
        resumeData.personal_info.firstName || 
        resumeData.personal_info.lastName || 
        resumeData.personal_info.email ||
        resumeData.personal_info.phone ||
        resumeData.personal_info.address ||
        resumeData.personal_info.cityState ||
        resumeData.personal_info.country ||
        resumeData.personal_info.jobTitle
      );
      
      if (!hasPersonalData) {
        try {
          const profileResponse = await userAPI.getProfile();
          const profile = profileResponse.data;
          
          // Pre-populate personal details with user profile (excluding photo)
          const personalInfo = {
            firstName: profile.first_name || '',
            lastName: profile.last_name || '',
            email: profile.email || '',
            phone: profile.contact_number || '',
            address: '',
            cityState: '',
            country: '',
            jobTitle: '',
            // Preserve existing profile photo URL if any
            ...(resumeData.personal_info?.profilePhotoUrl && { 
              profilePhotoUrl: resumeData.personal_info.profilePhotoUrl 
            })
          };
          
          resumeData.personal_info = personalInfo;
          
          // Auto-save the pre-populated data
          if (personalInfo.firstName || personalInfo.lastName || personalInfo.email) {
            try {
              await resumeAPI.autoSaveResume(Number(id), { personal_info: personalInfo });
            } catch (saveError) {
              console.error('Failed to auto-save pre-populated data:', saveError);
            }
          }
        } catch (profileError) {
          console.error('Failed to fetch user profile for pre-population:', profileError);
          // Continue without pre-population if profile fetch fails
        }
      }
      
      setResume(resumeData);
    } catch (error) {
      console.error('Failed to fetch resume:', error);
      toast.error('Failed to load resume. Please try refreshing the page.');
      
      // Don't navigate away immediately, give user a chance to refresh
      setTimeout(() => {
        if (!resume) {
          navigate('/resume-builder');
        }
      }, 3000);
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await resumeAPI.getTemplates();
      setTemplates(response.data);
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    }
  };

  const handleTemplateChange = (templateId: string) => {
    if (!resume) return;
    
    const updatedResume = {
      ...resume,
      template_id: templateId,
      template: templates[templateId]
    };
    setResume(updatedResume);
    
    // Auto-save template change
    debouncedAutoSave({ templateId });
    toast.success('Template updated');
  };

  const autoSave = useCallback(async (updates: any) => {
    if (!resume || !id) return;
    
    setAutoSaving(true);
    try {
      await resumeAPI.autoSaveResume(Number(id), updates);
      toast.success('Changes saved automatically', { 
        id: 'autosave-success',
        duration: 2000,
        position: 'bottom-right'
      });
    } catch (error) {
      console.error('Auto-save failed:', error);
      toast.error('Failed to auto-save changes', { 
        id: 'autosave-error',
        position: 'bottom-right'
      });
    } finally {
      setAutoSaving(false);
    }
  }, [resume, id]);

  const debouncedAutoSave = useCallback((updates: any) => {
    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer);
    }
    
    // Longer debounce delay to prevent interference with user typing
    const timer = setTimeout(() => {
      // Only auto-save if the component is still mounted and user isn't actively typing
      if (document.activeElement?.tagName !== 'INPUT' && 
          document.activeElement?.tagName !== 'TEXTAREA' &&
          !(document.activeElement as any)?.contentEditable) {
        autoSave(updates);
      } else {
        // Retry after a short delay if user is still typing
        setTimeout(() => autoSave(updates), 1000);
      }
    }, 3000); // Increased from 2000 to 3000ms
    setAutoSaveTimer(timer);
  }, [autoSave, autoSaveTimer]);

  const updateResumeData = (section: string, data: any) => {
    if (!resume) return;
    
    const updatedResume = {
      ...resume,
      [section]: data
    };
    setResume(updatedResume);
    
    // Trigger auto-save
    debouncedAutoSave({ [section]: data });
  };

  const handleSave = async () => {
    if (!resume || !id) return;
    
    setSaving(true);
    try {
      await resumeAPI.updateResume(Number(id), resume);
      toast.success('Resume saved successfully');
    } catch (error) {
      console.error('Failed to save resume:', error);
      toast.error('Failed to save resume');
    } finally {
      setSaving(false);
    }
  };

  const handleComplete = async () => {
    if (!id) return;
    
    try {
      await resumeAPI.completeResume(Number(id));
      toast.success('Resume completed successfully!');
      if (resume) {
        setResume({ ...resume, status: 'completed' });
      }
      // Redirect to resume builder page after completion
      setTimeout(() => {
        navigate('/resume-builder');
      }, 1000); // Short delay to show success message
    } catch (error) {
      console.error('Failed to complete resume:', error);
      toast.error('Failed to complete resume');
    }
  };

  const handleDownloadPDF = async () => {
    const previewElement = document.querySelector('.resume-preview');
    if (!previewElement || !resume) {
      toast.error('Resume preview not available for download.');
      return;
    }

    toast.loading('Generating PDF...', { id: 'pdf-toast' });

    // Try multiple approaches for better compatibility
    let canvas;
    let attempts = 0;
      const maxAttempts = 2;

    while (!canvas && attempts < maxAttempts) {
      attempts++;
      
      try {
        console.log(`PDF generation attempt ${attempts}/${maxAttempts}`);
        
        // Different configurations for each attempt
        const configs = [
          // Attempt 1: Clean capture without shadows/styling
          {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
            logging: false,
            width: 816, // 8.5 inches at 96dpi
            height: previewElement.scrollHeight,
            onclone: (clonedDoc: Document) => {
              // Remove shadows and fix styling that interferes with PDF
              const clonedElement = clonedDoc.querySelector('.resume-preview') as HTMLElement;
              if (clonedElement) {
                clonedElement.style.boxShadow = 'none';
                clonedElement.style.border = 'none';
                clonedElement.style.background = '#ffffff';
                clonedElement.style.width = '816px';
                clonedElement.style.maxWidth = '816px';
                clonedElement.style.margin = '0';
              }
            }
          },
          // Attempt 2: Basic fallback
          {
            scale: 1,
            backgroundColor: '#ffffff',
            logging: false,
          }
        ];

        canvas = await html2canvas(previewElement as HTMLElement, configs[attempts - 1]);
        
        // Validate canvas
        if (canvas && canvas.width > 0 && canvas.height > 0) {
          console.log(`Canvas generated successfully on attempt ${attempts}`);
          break;
        } else {
          canvas = null;
          console.warn(`Attempt ${attempts} produced invalid canvas`);
        }
        
      } catch (error) {
        console.warn(`Attempt ${attempts} failed:`, error);
        canvas = null;
        
        // Wait a bit before retrying
        if (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
    }

    if (!canvas) {
      throw new Error('All PDF generation attempts failed. Please try refreshing the page and try again.');
    }

      try {
        // Use JPEG format which is more reliable than PNG
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        
        // Validate the generated image data
        if (!imgData || imgData === 'data:,' || imgData.length < 100) {
          throw new Error('Invalid image data generated');
        }

        // Create standard A4 or Letter PDF
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: resume.paper_size === 'a4' ? 'a4' : 'letter',
        });

        const pageWidth = pdf.internal.pageSize.getWidth();
        // const pageHeight = pdf.internal.pageSize.getHeight();
        
        // Use full page - no extra margins, content should fill the page
        const imgWidth = pageWidth;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        // Add the image at full page size
        pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);

      // Create safe filename
      const safeTitle = (resume.title || 'resume').replace(/[^a-z0-9\s]/gi, '').trim();
      pdf.save(`${safeTitle}.pdf`);
      
      toast.success('PDF downloaded successfully!', { id: 'pdf-toast' });

      // Update download count (non-blocking)
      resumeAPI.downloadResume(Number(id)).catch(err => 
        console.warn('Failed to update download count:', err)
      );
      
    } catch (error) {
      console.error('PDF generation failed:', error);
      
      // Provide specific error messages
      let errorMessage = 'Failed to generate PDF';
      if (error instanceof Error) {
        if (error.message.includes('Canvas') || error.message.includes('attempts failed')) {
          errorMessage = 'Failed to render resume content';
        } else if (error.message.includes('image')) {
          errorMessage = 'Failed to process resume image';
        } else if (error.message.includes('PDF')) {
          errorMessage = 'Failed to create PDF file';
        }
      }
      
      toast.error(errorMessage + '. Please try again.', { 
        id: 'pdf-toast',
        duration: 4000 
      });
    }
  };

  const sections = [
    { id: 'personal', label: 'Personal Details', required: true },
    { id: 'summary', label: 'Professional Summary', required: true },
    { id: 'experience', label: 'Work Experience', required: false },
    { id: 'education', label: 'Education', required: true },
    { id: 'skills', label: 'Skills', required: true },
    { id: 'websites', label: 'Websites & Links', required: false },
    { id: 'custom', label: 'Custom Sections', required: false },
    { id: 'activities', label: 'Extra-curricular', required: false },
    { id: 'hobbies', label: 'Hobbies', required: false },
    { id: 'references', label: 'References', required: false },
    { id: 'languages', label: 'Languages', required: false },
  ];

  if (loading || !resume) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading resume...</p>
            </>
          ) : (
            <>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Resume not found</h2>
              <button
                onClick={() => navigate('/resume-builder')}
                className="text-primary-600 hover:text-primary-700"
              >
                Back to Resume Builder
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                navigate('/resume-builder');
              }}
              className="mr-4 p-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-lg font-medium text-gray-900">{resume.title}</h1>
              <div className="flex items-center space-x-2">
                <p className="text-sm text-gray-500">
                  {resume.template?.name} • {resume.status === 'completed' ? 'Completed' : 'Draft'}
                </p>
                {autoSaving && (
                  <div className="flex items-center text-xs text-blue-600">
                    <div className="animate-spin rounded-full h-3 w-3 border-b border-blue-600 mr-1"></div>
                    Saving...
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {autoSaving && (
              <div className="flex items-center space-x-2 text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                <div className="animate-spin h-3 w-3 border-2 border-green-200 border-t-green-600 rounded-full"></div>
                <span>Auto-saving...</span>
              </div>
            )}
            
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                handleDownloadPDF();
              }}
              className="p-2 text-gray-600 hover:text-gray-900 lg:flex hidden"
              title="Download PDF"
            >
              <DocumentArrowDownIcon className="h-5 w-5" />
            </button>
            
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                handleSave();
              }}
              disabled={saving}
              className="px-3 py-2 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 disabled:bg-gray-400"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
            
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                handleComplete();
              }}
              className="px-3 py-2 text-sm bg-primary-600 text-white rounded hover:bg-primary-700 flex items-center"
            >
              <CheckIcon className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Done</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="lg:hidden bg-white border-b border-gray-200">
        <div className="flex items-center justify-between p-4">
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                setIsMobilePreview(false);
              }}
              className={`px-3 py-2 text-sm font-medium rounded ${
                !isMobilePreview
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              Edit
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                setIsMobilePreview(true);
              }}
              className={`px-3 py-2 text-sm font-medium rounded ${
                isMobilePreview
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              Preview
            </button>
          </div>
          
          {/* Mobile Section Selector */}
          {!isMobilePreview && (
            <select
              value={activeSection}
              onChange={(e) => setActiveSection(e.target.value)}
              className="text-sm border border-gray-300 rounded px-3 py-1"
            >
              {sections.map((section) => (
                <option key={section.id} value={section.id}>
                  {section.label}{section.required ? ' *' : ''}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row h-screen">
        {/* Left Sidebar - Form Inputs */}
        <div className={`${
          isMobilePreview ? 'hidden lg:block' : 'block'
        } w-full lg:w-1/2 bg-white border-r border-gray-200 overflow-y-auto`}>
          {/* Desktop Section Navigation */}
          <div className="hidden lg:block border-b border-gray-200 p-4">
            <nav className="space-y-1">
              {sections.map((section) => (
                <button
                  key={section.id}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveSection(section.id);
                  }}
                  className={`w-full text-left px-3 py-2 text-sm rounded transition-colors ${
                    activeSection === section.id
                      ? 'bg-primary-50 text-primary-700 border border-primary-200'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {section.label}
                  {section.required && <span className="text-red-500 ml-1">*</span>}
                </button>
              ))}
            </nav>
          </div>

          {/* Form Content */}
          <div className="p-4 lg:p-6" key={resume.id}>
            {activeSection === 'personal' && resume.personal_info !== undefined && (
              <PersonalDetailsForm 
                key={`personal-${resume.id}`}
                data={resume.personal_info || {}} 
                onChange={(data) => updateResumeData('personal_info', data)}
                hasPhoto={resume.template?.hasPhoto}
              />
            )}
            
            {activeSection === 'summary' && (
              <ProfessionalSummaryForm 
                data={resume.professional_summary || ''} 
                onChange={(data) => updateResumeData('professional_summary', data)}
              />
            )}
            
            {activeSection === 'experience' && (
              <WorkExperienceForm 
                data={resume.work_experience || []} 
                onChange={(data) => updateResumeData('work_experience', data)}
              />
            )}
            
            {activeSection === 'education' && (
              <EducationForm 
                data={resume.education || []} 
                onChange={(data) => updateResumeData('education', data)}
              />
            )}
            
            {activeSection === 'skills' && (
              <SkillsForm 
                data={resume.skills || []} 
                onChange={(data) => updateResumeData('skills', data)}
                showExperienceLevel={showSkillLevels}
                setShowExperienceLevel={setShowSkillLevels}
              />
            )}
            
            {activeSection === 'websites' && (
              <WebsitesSocialLinksForm 
                data={resume.websites_social_links || []} 
                onChange={(data) => updateResumeData('websites_social_links', data)}
              />
            )}
            
            {activeSection === 'custom' && (
              <CustomSectionsForm 
                data={resume.custom_sections || []} 
                onChange={(data) => updateResumeData('custom_sections', data)}
              />
            )}
            
            {activeSection === 'activities' && (
              <ActivitiesForm 
                data={resume.extracurricular_activities || []} 
                onChange={(data) => updateResumeData('extracurricular_activities', data)}
              />
            )}
            
            {activeSection === 'hobbies' && (
              <HobbiesForm 
                data={resume.hobbies || ''} 
                onChange={(data) => updateResumeData('hobbies', data)}
              />
            )}
            
            {activeSection === 'references' && (
              <ReferencesForm 
                data={resume.references || []} 
                onChange={(data) => updateResumeData('references', data)}
              />
            )}
            
            {activeSection === 'languages' && (
              <LanguagesForm 
                data={resume.languages || []} 
                onChange={(data) => updateResumeData('languages', data)}
              />
            )}
          </div>
        </div>

        {/* Right Side - Live Preview */}
        <div className={`${
          !isMobilePreview ? 'hidden lg:block' : 'block'
        } w-full lg:w-1/2 bg-gray-100 overflow-y-auto`}>
          {/* Preview Header with Template Selector */}
          <div className="bg-white border-b border-gray-200 p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h3 className="text-lg font-medium text-gray-900">Live Preview</h3>
              
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Template Selector */}
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                    Template:
                  </label>
                  <select
                    value={resume.template_id}
                    onChange={(e) => handleTemplateChange(e.target.value)}
                    className="text-sm border border-gray-300 rounded px-3 py-1 bg-white"
                  >
                    {Object.entries(templates).map(([id, template]) => (
                      <option key={id} value={id}>
                        {template.name} {template.isATS && '(ATS)'}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* Format Controls */}
                <div className="flex items-center space-x-2">
                  <select
                    value={resume.font_family}
                    onChange={(e) => updateResumeData('font_family', e.target.value)}
                    className="text-sm border border-gray-300 rounded px-2 py-1 bg-white"
                  >
                    <option value="times-new-roman">Times New Roman</option>
                    <option value="arial">Arial</option>
                    <option value="roboto">Roboto</option>
                  </select>
                  
                  <select
                    value={resume.paper_size}
                    onChange={(e) => updateResumeData('paper_size', e.target.value)}
                    className="text-sm border border-gray-300 rounded px-2 py-1 bg-white"
                  >
                    <option value="a4">A4</option>
                    <option value="us-letter">US Letter</option>
                  </select>

                  {/* Color Selector for Photo Templates */}
                  {resume.template?.hasPhoto && (
                    <select
                      value={templateColor}
                      onChange={(e) => setTemplateColor(e.target.value)}
                      className="text-sm border border-gray-300 rounded px-2 py-1 bg-white"
                    >
                      <option value="blue">Blue</option>
                      <option value="green">Green</option>
                      <option value="violet">Violet</option>
                      <option value="yellow">Yellow</option>
                    </select>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Preview Content */}
          <div className="p-4 lg:p-8">
            {resume && (
              <div className="mx-auto bg-white shadow-lg resume-preview" 
                   style={{ 
                     maxWidth: '100%',
                     width: 'min(100%, 8.5in)',
                     minHeight: resume.paper_size === 'a4' ? '11.7in' : '11in'
                   }}>
                <ResumePreview 
                  resume={resume}
                  fontFamily={resume.font_family || 'times-new-roman'}
                  paperSize={resume.paper_size || 'a4'}
                  templateId={resume.template_id}
                  showSkillLevels={showSkillLevels}
                  templateColor={templateColor}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Form Components (I'll create these as separate components for better organization)
const PersonalDetailsForm: React.FC<{ data: any; onChange: (data: any) => void; hasPhoto: boolean }> = ({ data, onChange, hasPhoto }) => {
  const updateField = (field: string, value: any) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Personal Details</h3>
      
      {hasPhoto && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Profile Photo
          </label>
          <ProfilePhotoUpload
            key={`photo-upload-${hasPhoto ? 'with' : 'without'}-${data.profilePhotoUrl || 'none'}`}
            currentPhotoUrl={data.profilePhotoUrl || null}
            onPhotoUpdate={(photoUrl) => updateField('profilePhotoUrl', photoUrl)}
            onUpload={async (file) => {
              const response = await userAPI.uploadPhoto(file);
              return { photoUrl: response.data.photoUrl };
            }}
          />
        </div>
      )}
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            First Name *
          </label>
          <input
            type="text"
            value={data.firstName || ''}
            onChange={(e) => updateField('firstName', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Last Name *
          </label>
          <input
            type="text"
            value={data.lastName || ''}
            onChange={(e) => updateField('lastName', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Job Title
        </label>
        <input
          type="text"
          value={data.jobTitle || ''}
          onChange={(e) => updateField('jobTitle', e.target.value)}
          placeholder="e.g., Software Developer, Marketing Manager"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email *
          </label>
          <input
            type="email"
            value={data.email || ''}
            onChange={(e) => updateField('email', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Phone
          </label>
          <input
            type="tel"
            value={data.phone || ''}
            onChange={(e) => updateField('phone', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Address
        </label>
        <input
          type="text"
          value={data.address || ''}
          onChange={(e) => updateField('address', e.target.value)}
          placeholder="e.g., 123 Main Street"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            City / State
          </label>
          <input
            type="text"
            value={data.cityState || ''}
            onChange={(e) => updateField('cityState', e.target.value)}
            placeholder="e.g., New York, NY"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Country
          </label>
          <input
            type="text"
            value={data.country || ''}
            onChange={(e) => updateField('country', e.target.value)}
            placeholder="e.g., United States"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
      </div>
    </div>
  );
};

const ProfessionalSummaryForm: React.FC<{ data: string; onChange: (data: string) => void }> = ({ data, onChange }) => {
  const getTextContent = (html: string) => {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900">Professional Summary</h3>
      <p className="text-sm text-gray-600">
        Write 2-4 short, energetic sentences about how great you are. Mention the role and what you did. What were the big achievements? Describe your motivation and list your skills.
      </p>
      
      <div>
        <RichTextEditor
          value={data}
          onChange={onChange}
          placeholder="Curious science teacher with 8+ years of experience and a track record of..."
          className="w-full"
        />
        <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
          <span>Recruiter tip: write 400-600 characters to increase interview chances</span>
          <span>{getTextContent(data).length} / 400+</span>
        </div>
      </div>
    </div>
  );
};

// Enhanced ResumePreview component with template support
const ResumePreview: React.FC<{ 
  resume: ResumeData; 
  fontFamily: string; 
  paperSize: string; 
  templateId: string;
  showSkillLevels: boolean;
  templateColor: string;
}> = ({ resume, fontFamily, paperSize, templateId, showSkillLevels, templateColor }) => {
  const fontClass = {
    'times-new-roman': 'font-serif',
    'arial': 'font-sans',
    'roboto': 'font-sans'
  }[fontFamily] || 'font-serif';

  // Color schemes for photo templates
  const colorSchemes = {
    blue: {
      primary: 'text-blue-900',
      secondary: 'text-blue-700',
      accent: 'text-blue-600',
      bg: 'bg-blue-200',
      bgAccent: 'bg-blue-100',
      bgLight: 'bg-blue-50',
      border: 'border-blue-300',
      gradient: 'bg-gradient-to-br from-blue-50 to-indigo-100'
    },
    green: {
      primary: 'text-green-900',
      secondary: 'text-green-700',
      accent: 'text-green-600',
      bg: 'bg-green-200',
      bgAccent: 'bg-green-100',
      bgLight: 'bg-green-50',
      border: 'border-green-300',
      gradient: 'bg-gradient-to-br from-green-50 to-emerald-100'
    },
    violet: {
      primary: 'text-violet-900',
      secondary: 'text-violet-700',
      accent: 'text-violet-600',
      bg: 'bg-violet-200',
      bgAccent: 'bg-violet-100',
      bgLight: 'bg-violet-50',
      border: 'border-violet-300',
      gradient: 'bg-gradient-to-br from-violet-50 to-purple-100'
    },
    yellow: {
      primary: 'text-yellow-900',
      secondary: 'text-yellow-700',
      accent: 'text-yellow-600',
      bg: 'bg-yellow-200',
      bgAccent: 'bg-yellow-100',
      bgLight: 'bg-yellow-50',
      border: 'border-yellow-300',
      gradient: 'bg-gradient-to-br from-yellow-50 to-amber-100'
    }
  };

  const colors = colorSchemes[templateColor as keyof typeof colorSchemes] || colorSchemes.blue;

  const hasPhoto = resume.template?.hasPhoto ?? false;
  const isATS = resume.template?.isATS ?? false;

  // Different template layouts
  const renderClassicWithPhoto = () => (
    <div className={`p-4 lg:p-6 ${fontClass} text-xs leading-tight`}>
      {/* Classic Header with Photo on Left - Colored Background */}
      <div className={`${colors.bgLight} rounded-lg p-4 mb-3 shadow-sm border-l-4 ${colors.border}`}>
        <div className="flex items-start space-x-3">
          {hasPhoto && (
            <div className={`w-16 h-16 ${colors.bg} flex items-center justify-center flex-shrink-0 rounded-lg shadow-sm`}>
              {resume.personal_info?.profilePhotoUrl ? (
                <img 
                  src={resume.personal_info.profilePhotoUrl}
                  alt="Profile"
                  className="w-16 h-16 object-cover rounded-lg"
                  onError={(e) => {
                    // Hide image on error and show placeholder
                    e.currentTarget.style.display = 'none';
                    const parent = e.currentTarget.parentElement;
                    if (parent) {
                      parent.innerHTML = `<span class="${colors.accent} text-xs">Photo</span>`;
                    }
                  }}
                />
              ) : (
                <span className={`${colors.accent} text-xs`}>Photo</span>
              )}
            </div>
          )}
          <div className="flex-1">
            <h1 className={`text-lg font-bold ${colors.primary} mb-1`}>
              {resume.personal_info?.firstName || 'First Name'} {resume.personal_info?.lastName || 'Last Name'}
            </h1>
            {resume.personal_info?.jobTitle && (
              <p className={`text-sm ${colors.secondary} mb-2 font-medium`}>{resume.personal_info.jobTitle}</p>
            )}
            <div className={`space-y-0.5 text-xs ${colors.accent}`}>
              {resume.personal_info?.email && <div>✉ {resume.personal_info.email}</div>}
              {resume.personal_info?.phone && <div>📞 {resume.personal_info.phone}</div>}
              {resume.personal_info?.address && <div>🏠 {resume.personal_info.address}</div>}
              {(resume.personal_info?.cityState || resume.personal_info?.country) && (
                <div>📍 {[resume.personal_info?.cityState, resume.personal_info?.country].filter(Boolean).join(', ')}</div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {renderCommonSections(colors, hasPhoto, templateId)}
    </div>
  );

  const renderElegantWithPhoto = () => (
    <div className={`p-4 lg:p-6 ${fontClass} text-xs leading-tight`}>
      {/* Elegant Header with Photo on Right - Gradient Background */}
      <div className={`bg-gradient-to-r ${colors.bgLight} to-white rounded-xl p-5 mb-3 shadow-md border-r-4 ${colors.border}`}>
        <div className="flex items-start justify-between">
          <div className="flex-1 pr-3">
            <h1 className={`text-lg font-bold ${colors.primary} mb-0.5 tracking-tight`}>
              {resume.personal_info?.firstName || 'First Name'}
            </h1>
            <h1 className={`text-lg font-bold ${colors.primary} mb-2 tracking-tight`}>
              {resume.personal_info?.lastName || 'Last Name'}
            </h1>
            {resume.personal_info?.jobTitle && (
              <p className={`text-sm ${colors.secondary} mb-2 italic ${colors.border} border-l-2 pl-2`}>
                {resume.personal_info.jobTitle}
              </p>
            )}
            <div className={`space-y-1 text-xs ${colors.accent}`}>
              {resume.personal_info?.email && (
                <div className="flex items-center">
                  <span className={`w-16 ${colors.secondary} uppercase text-xs font-semibold`}>Email</span>
                  <span className="break-all">{resume.personal_info.email}</span>
                </div>
              )}
              {resume.personal_info?.phone && (
                <div className="flex items-center">
                  <span className={`w-16 ${colors.secondary} uppercase text-xs font-semibold`}>Phone</span>
                  <span>{resume.personal_info.phone}</span>
                </div>
              )}
              {resume.personal_info?.address && (
                <div className="flex items-center">
                  <span className={`w-16 ${colors.secondary} uppercase text-xs font-semibold`}>Address</span>
                  <span>{resume.personal_info.address}</span>
                </div>
              )}
              {(resume.personal_info?.cityState || resume.personal_info?.country) && (
                <div className="flex items-center">
                  <span className={`w-16 ${colors.secondary} uppercase text-xs font-semibold`}>Location</span>
                  <span>{[resume.personal_info?.cityState, resume.personal_info?.country].filter(Boolean).join(', ')}</span>
                </div>
              )}
            </div>
          </div>
          
          {hasPhoto && (
            <div className={`w-16 h-16 ${colors.bg} flex items-center justify-center flex-shrink-0 shadow-md rounded-xl`}>
              {resume.personal_info?.profilePhotoUrl ? (
                <img 
                  src={resume.personal_info.profilePhotoUrl}
                  alt="Profile"
                  className="w-16 h-16 object-cover rounded-xl"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const parent = e.currentTarget.parentElement;
                    if (parent) {
                      parent.innerHTML = `<span class="${colors.accent} text-xs">Photo</span>`;
                    }
                  }}
                />
              ) : (
                <span className={`${colors.accent} text-xs`}>Photo</span>
              )}
            </div>
          )}
        </div>
      </div>
      
      {renderCommonSections(colors, hasPhoto, templateId)}
    </div>
  );

  const renderModernWithPhoto = () => (
    <div className={`p-4 lg:p-6 ${fontClass} text-xs leading-tight ${colors.gradient}`}>
      {/* Modern Header */}
      <div className="bg-white rounded-lg p-3 mb-3 shadow-md">
        <div className="flex items-start space-x-3">
          {hasPhoto && (
            <div className={`w-16 h-16 ${colors.bg} flex items-center justify-center flex-shrink-0 rounded-md overflow-hidden`}>
              {resume.personal_info?.profilePhotoUrl ? (
                <img 
                  src={resume.personal_info.profilePhotoUrl}
                  alt="Profile"
                  className="w-16 h-16 object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const parent = e.currentTarget.parentElement;
                    if (parent) {
                      parent.innerHTML = `<span class="${colors.accent} text-xs">Photo</span>`;
                    }
                  }}
                />
              ) : (
                <span className={`${colors.accent} text-xs`}>Photo</span>
              )}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h1 className={`text-lg font-bold ${colors.primary} mb-1`}>
              {resume.personal_info?.firstName || 'First Name'} {resume.personal_info?.lastName || 'Last Name'}
            </h1>
            {resume.personal_info?.jobTitle && (
              <p className={`text-sm ${colors.secondary} mb-2 font-medium`}>{resume.personal_info.jobTitle}</p>
            )}
            
            {/* Contact Information Grid */}
            <div className={`space-y-1 text-xs ${colors.accent}`}>
              {resume.personal_info?.email && (
                <div className="flex items-center">
                  <span className={`mr-3 ${colors.secondary}`}>📧</span>
                  <span className="break-all">{resume.personal_info.email}</span>
                </div>
              )}
              {resume.personal_info?.phone && (
                <div className="flex items-center">
                  <span className={`mr-3 ${colors.secondary}`}>📱</span>
                  <span>{resume.personal_info.phone}</span>
                </div>
              )}
              {resume.personal_info?.address && (
                <div className="flex items-center">
                  <span className={`mr-3 ${colors.secondary}`}>🏠</span>
                  <span>{resume.personal_info.address}</span>
                </div>
              )}
              {(resume.personal_info?.cityState || resume.personal_info?.country) && (
                <div className="flex items-center">
                  <span className={`mr-3 ${colors.secondary}`}>🌍</span>
                  <span>
                    {[resume.personal_info?.cityState, resume.personal_info?.country]
                      .filter(Boolean)
                      .join(', ')}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg p-3 shadow-sm">
        {renderCommonSections(colors, hasPhoto, templateId)}
      </div>
    </div>
  );

  const renderClassicATS = () => (
    <div className={`p-4 lg:p-6 ${fontClass} text-xs leading-tight`}>
      {/* Classic ATS - Centered Header */}
      <div className="text-center mb-3 border-b border-gray-300 pb-2">
        <h1 className="text-lg font-bold text-gray-900 uppercase tracking-wide">
          {resume.personal_info?.firstName || 'First Name'} {resume.personal_info?.lastName || 'Last Name'}
        </h1>
        {resume.personal_info?.jobTitle && (
          <p className="text-sm text-gray-700 mt-1 font-medium">{resume.personal_info.jobTitle}</p>
        )}
        <div className="flex flex-wrap justify-center gap-2 mt-2 text-xs text-gray-600">
          {resume.personal_info?.email && <span>{resume.personal_info.email}</span>}
          {resume.personal_info?.phone && <span>{resume.personal_info.phone}</span>}
          {resume.personal_info?.address && <span>{resume.personal_info.address}</span>}
          {(resume.personal_info?.cityState || resume.personal_info?.country) && (
            <span>{[resume.personal_info?.cityState, resume.personal_info?.country].filter(Boolean).join(', ')}</span>
          )}
        </div>
      </div>
      
      {renderCommonSections(colors, hasPhoto, templateId)}
    </div>
  );

  const renderModernATS = () => (
    <div className={`p-4 lg:p-6 ${fontClass} text-xs leading-tight`}>
      {/* Modern ATS - Left-aligned Header */}
      <div className="mb-3 pb-2 border-b border-gray-400">
        <h1 className="text-lg font-bold text-gray-900 mb-0.5">
          {resume.personal_info?.firstName || 'First Name'} {resume.personal_info?.lastName || 'Last Name'}
        </h1>
        {resume.personal_info?.jobTitle && (
          <p className="text-sm text-gray-600 mb-2">{resume.personal_info.jobTitle}</p>
        )}
        <div className="flex flex-wrap gap-1 text-xs text-gray-600">
          {resume.personal_info?.email && (
            <span className="bg-gray-50 px-2 py-0.5 rounded text-xs">{resume.personal_info.email}</span>
          )}
          {resume.personal_info?.phone && (
            <span className="bg-gray-50 px-2 py-0.5 rounded text-xs">{resume.personal_info.phone}</span>
          )}
          {resume.personal_info?.address && (
            <span className="bg-gray-50 px-2 py-0.5 rounded text-xs">{resume.personal_info.address}</span>
          )}
          {(resume.personal_info?.cityState || resume.personal_info?.country) && (
            <span className="bg-gray-50 px-2 py-0.5 rounded text-xs">
              {[resume.personal_info?.cityState, resume.personal_info?.country].filter(Boolean).join(', ')}
            </span>
          )}
        </div>
      </div>
      
      {renderCommonSections(colors, hasPhoto, templateId)}
    </div>
  );

  const renderSimpleATS = () => (
    <div className={`p-4 lg:p-6 ${fontClass} text-xs leading-tight`}>
      {/* Simple ATS - Minimal Header */}
      <div className="mb-3">
        <h1 className="text-lg font-bold text-gray-900 mb-1">
          {resume.personal_info?.firstName || 'First Name'} {resume.personal_info?.lastName || 'Last Name'}
        </h1>
        {resume.personal_info?.jobTitle && (
          <p className="text-sm text-gray-600 mb-2">{resume.personal_info.jobTitle}</p>
        )}
        
        {/* Two-column contact info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-gray-600 mb-2">
          <div>
            {resume.personal_info?.email && (
              <div className="mb-1">
                <span className="font-medium">Email:</span> <span className="break-all">{resume.personal_info.email}</span>
              </div>
            )}
            {resume.personal_info?.phone && (
              <div className="mb-1">
                <span className="font-medium">Phone:</span> {resume.personal_info.phone}
              </div>
            )}
            {resume.personal_info?.address && (
              <div className="mb-1">
                <span className="font-medium">Address:</span> {resume.personal_info.address}
              </div>
            )}
          </div>
          <div>
            {(resume.personal_info?.cityState || resume.personal_info?.country) && (
              <div className="mb-1">
                <span className="font-medium">Location:</span> {[resume.personal_info?.cityState, resume.personal_info?.country].filter(Boolean).join(', ')}
              </div>
            )}
          </div>
        </div>
        
        <div className="border-t border-gray-200 pt-2">
          {renderCommonSections(colors, hasPhoto, templateId)}
        </div>
      </div>
    </div>
  );

  // Helper function to get header styling based on template
  const getHeaderStyle = (templateId?: string, colors?: any, isATS?: boolean) => {
    if (isATS) {
      return 'border-b border-gray-300 pb-0.5 text-gray-800';
    }
    
    if (templateId === 'classic-with-photo' && colors) {
      return `${colors.bgAccent} ${colors.primary} px-3 py-1.5 rounded-md shadow-sm`;
    }
    
    if (templateId === 'elegant-with-photo' && colors) {
      return `bg-gradient-to-r ${colors.bgLight} to-transparent ${colors.primary} px-4 py-1.5 rounded-r-full border-l-4 ${colors.border} shadow-sm`;
    }
    
    if (hasPhoto && colors) {
      return colors.primary;
    }
    
    return 'text-gray-800';
  };

  const renderCommonSections = (colors?: any, _hasPhoto?: boolean, templateId?: string) => (
    <>
      {/* Professional Summary */}
      {resume.professional_summary && (
        <div className="mb-3">
          <h2 className={`text-sm font-semibold mb-1 ${getHeaderStyle(templateId, colors, isATS)}`}>
            Professional Summary
          </h2>
          <div 
            className="text-gray-700 leading-tight text-xs prose prose-xs max-w-none [&_ul]:list-disc [&_ul]:ml-4 [&_ol]:list-decimal [&_ol]:ml-4 [&_li]:mb-0.5"
            dangerouslySetInnerHTML={{ __html: resume.professional_summary }}
          />
        </div>
      )}

      {/* Work Experience */}
      {resume.work_experience && resume.work_experience.length > 0 && (
        <div className="mb-3">
          <h2 className={`text-sm font-semibold mb-1 ${getHeaderStyle(templateId, colors, isATS)}`}>
            Work Experience
          </h2>
          {resume.work_experience.map((exp, index) => (
            <div key={index} className="mb-2">
              <div className="flex justify-between items-start mb-0.5">
                <h3 className="font-medium text-gray-900 text-xs">{exp.jobTitle || 'Job Title'}</h3>
                <span className="text-xs text-gray-600">{exp.startDate} - {exp.endDate || 'Present'}</span>
              </div>
              <p className="text-gray-700 mb-0.5 text-xs">{exp.company} • {exp.city}</p>
              {exp.description && (
                <div 
                  className="text-gray-600 text-xs leading-tight prose prose-xs max-w-none [&_ul]:list-disc [&_ul]:ml-4 [&_ol]:list-decimal [&_ol]:ml-4 [&_li]:mb-0.5"
                  dangerouslySetInnerHTML={{ __html: exp.description }}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Education */}
      {resume.education && resume.education.length > 0 && (
        <div className="mb-3">
          <h2 className={`text-sm font-semibold mb-1 ${getHeaderStyle(templateId, colors, isATS)}`}>
            Education
          </h2>
          {resume.education.map((edu, index) => (
            <div key={index} className="mb-2">
              <div className="flex justify-between items-start mb-0.5">
                <h3 className="font-medium text-gray-900 text-xs">{edu.degree || 'Degree'}</h3>
                <span className="text-xs text-gray-600">{edu.startDate} - {edu.endDate}</span>
              </div>
              <p className="text-gray-700 text-xs">{edu.school} • {edu.city}</p>
              {edu.description && (
                <div 
                  className="text-gray-600 text-xs mt-0.5 leading-tight prose prose-xs max-w-none [&_ul]:list-disc [&_ul]:ml-4 [&_ol]:list-decimal [&_ol]:ml-4 [&_li]:mb-0.5"
                  dangerouslySetInnerHTML={{ __html: edu.description }}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Skills */}
      {resume.skills && resume.skills.length > 0 && (
        <div className="mb-3">
          <h2 className={`text-sm font-semibold mb-1 ${getHeaderStyle(templateId, colors, isATS)}`}>
            Skills
          </h2>
          <div className="flex flex-wrap gap-2">
            {resume.skills.map((skill, index) => (
              <span key={index} className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded">
                {typeof skill === 'string' ? skill : (skill.name || 'Skill')}
                {showSkillLevels && typeof skill === 'object' && skill.level && (
                  <span className="text-gray-500 ml-1">({skill.level})</span>
                )}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Languages */}
      {resume.languages && resume.languages.length > 0 && (
        <div className="mb-3">
          <h2 className={`text-sm font-semibold mb-1 ${getHeaderStyle(templateId, colors, isATS)}`}>
            Languages
          </h2>
          <div className="grid grid-cols-2 gap-1">
            {resume.languages.map((lang, index) => (
              <div key={index} className="text-xs">
                <span className="font-medium text-gray-900 text-xs">
                  {typeof lang === 'string' ? lang : (lang.language || 'Language')}
                </span>
                {typeof lang === 'object' && lang.level && (
                  <span className="text-gray-600 text-xs"> - {lang.level}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Websites & Social Links */}
      {resume.websites_social_links && resume.websites_social_links.length > 0 && (
        <div className="mb-3">
          <h2 className={`text-sm font-semibold mb-1 ${getHeaderStyle(templateId, colors, isATS)}`}>
            Links
          </h2>
          <div className="space-y-1">
            {resume.websites_social_links.map((link, index) => (
              <div key={index} className="text-sm">
                <span className="font-medium text-gray-900">{link.label || 'Link'}: </span>
                <a href={link.url} className="text-primary-600 hover:text-primary-700 break-all">
                  {link.url}
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Custom Sections */}
      {resume.custom_sections && resume.custom_sections.length > 0 && (
        <>
          {resume.custom_sections.map((section, index) => (
            <div key={index} className="mb-6">
              <h2 className={`text-lg font-semibold mb-3 ${
                isATS ? 'border-b border-gray-300 pb-1' : 'text-gray-800'
              }`}>
                {section.title || 'Custom Section'}
              </h2>
              {section.activityName && (
                <div className="mb-4">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-medium text-gray-900 text-xs">{section.activityName}</h3>
                    {(section.startDate || section.endDate) && (
                      <span className="text-xs text-gray-600">
                        {section.startDate} {section.startDate && section.endDate && '- '}{section.endDate}
                      </span>
                    )}
                  </div>
                  {section.city && <p className="text-gray-700 mb-1">{section.city}</p>}
                  {section.description && (
                    <div 
                      className="text-gray-600 text-sm leading-tight prose prose-xs max-w-none [&_ul]:list-disc [&_ul]:ml-4 [&_ol]:list-decimal [&_ol]:ml-4 [&_li]:mb-0.5"
                      dangerouslySetInnerHTML={{ __html: section.description }}
                    />
                  )}
                </div>
              )}
            </div>
          ))}
        </>
      )}

      {/* Extra-curricular Activities */}
      {resume.extracurricular_activities && resume.extracurricular_activities.length > 0 && (
        <div className="mb-3">
          <h2 className={`text-sm font-semibold mb-1 ${getHeaderStyle(templateId, colors, isATS)}`}>
            Extra-curricular Activities
          </h2>
          {resume.extracurricular_activities.map((activity, index) => (
            <div key={index} className="mb-2">
              <div className="flex justify-between items-start mb-1">
                <h3 className="font-medium text-gray-900 text-xs">{activity.functionTitle || 'Activity'}</h3>
                {(activity.startDate || activity.endDate) && (
                  <span className="text-xs text-gray-600">
                    {activity.startDate} {activity.startDate && (activity.endDate || activity.currentlyActive) && '- '}
                    {activity.currentlyActive ? 'Present' : activity.endDate}
                  </span>
                )}
              </div>
              {activity.employer && <p className="text-gray-700 mb-1">{activity.employer} • {activity.city}</p>}
              {activity.description && (
                <div 
                  className="text-gray-600 text-sm leading-tight prose prose-xs max-w-none [&_ul]:list-disc [&_ul]:ml-4 [&_ol]:list-decimal [&_ol]:ml-4 [&_li]:mb-0.5"
                  dangerouslySetInnerHTML={{ __html: activity.description }}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {/* References */}
      {resume.references && resume.references.length > 0 && (
        <div className="mb-3">
          <h2 className={`text-sm font-semibold mb-1 ${getHeaderStyle(templateId, colors, isATS)}`}>
            References
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {resume.references.map((ref, index) => (
              <div key={index} className="text-xs">
                <div className="font-medium text-gray-900 text-xs">{ref.fullName || 'Reference'}</div>
                {ref.company && <div className="text-gray-700 text-xs">{ref.company}</div>}
                {ref.phone && <div className="text-gray-600 text-xs">{ref.phone}</div>}
                {ref.email && <div className="text-gray-600 text-xs">{ref.email}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hobbies */}
      {resume.hobbies && (
        <div className="mb-3">
          <h2 className={`text-sm font-semibold mb-1 ${getHeaderStyle(templateId, colors, isATS)}`}>
            Hobbies & Interests
          </h2>
          <div 
            className="text-gray-700 text-xs leading-tight prose prose-xs max-w-none [&_ul]:list-disc [&_ul]:ml-4 [&_ol]:list-decimal [&_ol]:ml-4 [&_li]:mb-0.5"
            dangerouslySetInnerHTML={{ __html: resume.hobbies }}
          />
        </div>
      )}

      {/* Empty state message if no content */}
      {!resume.personal_info?.firstName && !resume.professional_summary && (
        <div className="text-center text-gray-400 py-8">
          <p>Start filling out your resume to see the live preview</p>
        </div>
      )}
    </>
  );

  // Render based on template
  const renderTemplate = () => {
    switch (templateId) {
      case 'classic-with-photo':
        return renderClassicWithPhoto();
      case 'modern-with-photo':
        return renderModernWithPhoto();
      case 'elegant-with-photo':
        return renderElegantWithPhoto();
      case 'classic-ats':
        return renderClassicATS();
      case 'modern-ats':
        return renderModernATS();
      case 'simple-ats':
        return renderSimpleATS();
      default:
        return renderClassicATS();
    }
  };

  return (
    <div style={{ minHeight: paperSize === 'a4' ? '11.7in' : '11in' }}>
      {renderTemplate()}
    </div>
  );
};

// Placeholder components - these would be fully implemented
const WorkExperienceForm: React.FC<{ data: any[]; onChange: (data: any[]) => void }> = ({ data, onChange }) => {
  const addExperience = () => {
    const newExperience = {
      id: Date.now(),
      jobTitle: '',
      company: '',
      startDate: '',
      endDate: '',
      currentlyWorking: false,
      city: '',
      description: ''
    };
    onChange([...data, newExperience]);
  };

  const updateExperience = (id: number, field: string, value: any) => {
    onChange(data.map(exp => 
      exp.id === id ? { ...exp, [field]: value } : exp
    ));
  };

  const removeExperience = (id: number) => {
    onChange(data.filter(exp => exp.id !== id));
  };

  const moveExperience = (id: number, direction: 'up' | 'down') => {
    const index = data.findIndex(exp => exp.id === id);
    if (index === -1) return;
    
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= data.length) return;
    
    const newData = [...data];
    [newData[index], newData[newIndex]] = [newData[newIndex], newData[index]];
    onChange(newData);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900">Employment History</h3>
        <p className="text-sm text-gray-600 mt-1">
          Show your relevant experience (last 10 years). Use bullet points to note your achievements, if possible – use numbers/facts (Achieved X, measured by Y, by doing Z).
        </p>
      </div>

      <div className="space-y-4">
        {data.map((experience, index) => (
          <div key={experience.id} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-gray-500">
                {!experience.jobTitle ? '(Not specified)' : experience.jobTitle}
              </span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => moveExperience(experience.id, 'up')}
                  disabled={index === 0}
                  className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                  title="Move up"
                >
                  ↑
                </button>
                <button
                  onClick={() => moveExperience(experience.id, 'down')}
                  disabled={index === data.length - 1}
                  className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                  title="Move down"
                >
                  ↓
                </button>
                <button
                  onClick={() => removeExperience(experience.id)}
                  className="p-1 text-red-400 hover:text-red-600"
                  title="Delete"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Job title
                </label>
                <input
                  type="text"
                  value={experience.jobTitle || ''}
                  onChange={(e) => updateExperience(experience.id, 'jobTitle', e.target.value)}
                  placeholder="e.g. Marketing Manager"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Employer
                </label>
                <input
                  type="text"
                  value={experience.company || ''}
                  onChange={(e) => updateExperience(experience.id, 'company', e.target.value)}
                  placeholder="e.g. Microsoft"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start & End Date <span className="text-xs text-gray-500">ⓘ</span>
                </label>
                <input
                  type="text"
                  value={experience.startDate || ''}
                  onChange={(e) => updateExperience(experience.id, 'startDate', e.target.value)}
                  placeholder="MM / YYYY"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  &nbsp;
                </label>
                <input
                  type="text"
                  value={experience.currentlyWorking ? 'Present' : (experience.endDate || '')}
                  onChange={(e) => updateExperience(experience.id, 'endDate', e.target.value)}
                  placeholder="MM / YYYY"
                  disabled={experience.currentlyWorking}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City
                </label>
                <input
                  type="text"
                  value={experience.city || ''}
                  onChange={(e) => updateExperience(experience.id, 'city', e.target.value)}
                  placeholder="e.g. New York"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={experience.currentlyWorking || false}
                  onChange={(e) => {
                    updateExperience(experience.id, 'currentlyWorking', e.target.checked);
                    if (e.target.checked) {
                      updateExperience(experience.id, 'endDate', '');
                    }
                  }}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-gray-700">I currently work here</span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <div className="border border-gray-300 rounded-md">
                <RichTextEditor
                  value={experience.description || ''}
                  onChange={(value) => updateExperience(experience.id, 'description', value)}
                  placeholder="e.g. Created and implemented lesson plans based on child-led interests and curiosities."
                  className="w-full border-0 rounded-none rounded-b-md"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={addExperience}
        className="flex items-center px-4 py-2 text-primary-600 hover:text-primary-700 font-medium"
      >
        <PlusIcon className="h-4 w-4 mr-2" />
        Add employment
      </button>
    </div>
  );
};

const EducationForm: React.FC<{ data: any[]; onChange: (data: any[]) => void }> = ({ data, onChange }) => {
  const addEducation = () => {
    const newEducation = {
      id: Date.now(),
      school: '',
      degree: '',
      startDate: '',
      endDate: '',
      currentlyStudying: false,
      city: '',
      description: ''
    };
    onChange([...data, newEducation]);
  };

  const updateEducation = (id: number, field: string, value: any) => {
    onChange(data.map(edu => 
      edu.id === id ? { ...edu, [field]: value } : edu
    ));
  };

  const removeEducation = (id: number) => {
    onChange(data.filter(edu => edu.id !== id));
  };

  const moveEducation = (id: number, direction: 'up' | 'down') => {
    const index = data.findIndex(edu => edu.id === id);
    if (index === -1) return;
    
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= data.length) return;
    
    const newData = [...data];
    [newData[index], newData[newIndex]] = [newData[newIndex], newData[index]];
    onChange(newData);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900">Education</h3>
        <p className="text-sm text-gray-600 mt-1">
          A varied education on your resume sums up the value that your learnings and background will bring to job.
        </p>
      </div>

      <div className="space-y-4">
        {data.map((education, index) => (
          <div key={education.id} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-gray-500">
                {!education.school ? '(Not specified)' : education.school}
              </span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => moveEducation(education.id, 'up')}
                  disabled={index === 0}
                  className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                  title="Move up"
                >
                  ↑
                </button>
                <button
                  onClick={() => moveEducation(education.id, 'down')}
                  disabled={index === data.length - 1}
                  className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                  title="Move down"
                >
                  ↓
                </button>
                <button
                  onClick={() => removeEducation(education.id)}
                  className="p-1 text-red-400 hover:text-red-600"
                  title="Delete"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  School
                </label>
                <input
                  type="text"
                  value={education.school || ''}
                  onChange={(e) => updateEducation(education.id, 'school', e.target.value)}
                  placeholder="e.g. Northwestern University"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Degree
                </label>
                <input
                  type="text"
                  value={education.degree || ''}
                  onChange={(e) => updateEducation(education.id, 'degree', e.target.value)}
                  placeholder="e.g. Bachelor's"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start & End Date <span className="text-xs text-gray-500">ⓘ</span>
                </label>
                <input
                  type="text"
                  value={education.startDate || ''}
                  onChange={(e) => updateEducation(education.id, 'startDate', e.target.value)}
                  placeholder="MM / YYYY"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  &nbsp;
                </label>
                <input
                  type="text"
                  value={education.currentlyStudying ? 'Present' : (education.endDate || '')}
                  onChange={(e) => updateEducation(education.id, 'endDate', e.target.value)}
                  placeholder="MM / YYYY"
                  disabled={education.currentlyStudying}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City
                </label>
                <input
                  type="text"
                  value={education.city || ''}
                  onChange={(e) => updateEducation(education.id, 'city', e.target.value)}
                  placeholder="e.g. Boston"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={education.currentlyStudying || false}
                  onChange={(e) => {
                    updateEducation(education.id, 'currentlyStudying', e.target.checked);
                    if (e.target.checked) {
                      updateEducation(education.id, 'endDate', '');
                    }
                  }}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-gray-700">I currently study here</span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <div className="border border-gray-300 rounded-md">
                <RichTextEditor
                  value={education.description || ''}
                  onChange={(value) => updateEducation(education.id, 'description', value)}
                  placeholder="e.g. Graduated with High Honors."
                  className="w-full border-0 rounded-none rounded-b-md"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={addEducation}
        className="flex items-center px-4 py-2 text-primary-600 hover:text-primary-700 font-medium"
      >
        <PlusIcon className="h-4 w-4 mr-2" />
        Add education
      </button>
    </div>
  );
};

const SkillsForm: React.FC<{ 
  data: any[]; 
  onChange: (data: any[]) => void;
  showExperienceLevel: boolean;
  setShowExperienceLevel: (show: boolean) => void;
}> = ({ data, onChange, showExperienceLevel, setShowExperienceLevel }) => {

  const addSkill = () => {
    const newSkill = {
      id: Date.now(),
      name: '',
      level: 'Expert'
    };
    onChange([...data, newSkill]);
  };

  const updateSkill = (id: number, field: string, value: any) => {
    onChange(data.map((skill, index) => {
      const skillId = skill.id || Date.now() + index;
      if (skillId === id) {
        // Ensure the skill has proper structure
        const updatedSkill = typeof skill === 'string' 
          ? { id: skillId, name: skill, level: 'Expert' }
          : { ...skill, id: skillId };
        return { ...updatedSkill, [field]: value };
      }
      return skill;
    }));
  };

  const removeSkill = (id: number) => {
    onChange(data.filter((skill, index) => {
      const skillId = skill.id || Date.now() + index;
      return skillId !== id;
    }));
  };

  const skillLevels = [
    'Novice',
    'Beginner', 
    'Skillful',
    'Experienced',
    'Expert'
  ];

  const getSliderValue = (level: string) => {
    return skillLevels.indexOf(level) + 1;
  };

  const getLevelFromSlider = (value: number) => {
    return skillLevels[value - 1] || 'Expert';
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900">Skills</h3>
        <p className="text-sm text-gray-600 mt-1">
          Choose 5 important skills that show you fit the position. Make sure they match the key skills mentioned in the job listing (especially when applying via an online system).
        </p>
      </div>

      <div>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={!showExperienceLevel}
            onChange={(e) => setShowExperienceLevel(!e.target.checked)}
            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          <span className="ml-2 text-sm text-gray-700">Don't show experience level</span>
        </label>
      </div>

      <div className="space-y-4">
        {data.map((skill, index) => {
          // Ensure skill has proper structure and ID
          const skillId = skill.id || Date.now() + index;
          const skillName = typeof skill === 'string' ? skill : (skill.name || '');
          const skillLevel = typeof skill === 'string' ? 'Expert' : (skill.level || 'Expert');
          
          return (
          <div key={skillId} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-gray-500">
                {!skillName ? '(Not specified)' : skillName}
                {showExperienceLevel && skillLevel && (
                  <span className="text-gray-400"> — {skillLevel}</span>
                )}
              </span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => removeSkill(skillId)}
                  className="p-1 text-red-400 hover:text-red-600"
                  title="Delete"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Skill
                </label>
                <input
                  type="text"
                  value={skillName}
                  onChange={(e) => updateSkill(skillId, 'name', e.target.value)}
                  placeholder="e.g. Adobe Photoshop"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              {showExperienceLevel && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Level — <span className="text-primary-600">{skillLevel}</span>
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="range"
                      min="1"
                      max="5"
                      value={getSliderValue(skillLevel)}
                      onChange={(e) => updateSkill(skillId, 'level', getLevelFromSlider(parseInt(e.target.value)))}
                      className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                      style={{
                        background: `linear-gradient(to right, #primary-600 0%, #primary-600 ${(getSliderValue(skillLevel) - 1) * 25}%, #e5e7eb ${(getSliderValue(skillLevel) - 1) * 25}%, #e5e7eb 100%)`
                      }}
                    />
                    <div className="flex space-x-1">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <div
                          key={level}
                          className={`w-3 h-3 rounded-sm ${
                            level <= getSliderValue(skillLevel)
                              ? 'bg-primary-600'
                              : 'bg-gray-200'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          );
        })}
      </div>

      <button
        onClick={addSkill}
        className="flex items-center px-4 py-2 text-primary-600 hover:text-primary-700 font-medium"
      >
        <PlusIcon className="h-4 w-4 mr-2" />
        Add one more skill
      </button>
    </div>
  );
};

const WebsitesSocialLinksForm: React.FC<{ data: any[]; onChange: (data: any[]) => void }> = ({ data, onChange }) => {
  const addLink = () => {
    const newLink = {
      id: Date.now(),
      label: '',
      url: ''
    };
    onChange([...data, newLink]);
  };

  const updateLink = (id: number, field: string, value: any) => {
    onChange(data.map(link => 
      link.id === id ? { ...link, [field]: value } : link
    ));
  };

  const removeLink = (id: number) => {
    onChange(data.filter(link => link.id !== id));
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900">Websites & Social Links</h3>
        <p className="text-sm text-gray-600 mt-1">
          You can add links to websites you want hiring managers to see! Perhaps it will be a link to your portfolio, LinkedIn profile, or personal website.
        </p>
      </div>

      <div className="space-y-4">
        {data.map((link, _index) => (
          <div key={link.id} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-gray-500">
                {!link.label ? '(Not specified)' : link.label}
              </span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => removeLink(link.id)}
                  className="p-1 text-red-400 hover:text-red-600"
                  title="Delete"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Label
                </label>
                <input
                  type="text"
                  value={link.label || ''}
                  onChange={(e) => updateLink(link.id, 'label', e.target.value)}
                  placeholder="e.g. LinkedIn Profile"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Link
                </label>
                <input
                  type="url"
                  value={link.url || ''}
                  onChange={(e) => updateLink(link.id, 'url', e.target.value)}
                  placeholder="e.g. linkedin.com/in/john-doe"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={addLink}  
        className="flex items-center px-4 py-2 text-primary-600 hover:text-primary-700 font-medium"
      >
        <PlusIcon className="h-4 w-4 mr-2" />
        Add one more link
      </button>
    </div>
  );
};

const CustomSectionsForm: React.FC<{ data: any[]; onChange: (data: any[]) => void }> = ({ data, onChange }) => {
  const addCustomSection = () => {
    const newSection = {
      id: Date.now(),
      title: 'Untitled',
      activityName: '',
      city: '',
      startDate: '',
      endDate: '',
      description: ''
    };
    onChange([...data, newSection]);
  };

  const updateCustomSection = (id: number, field: string, value: any) => {
    onChange(data.map(section => 
      section.id === id ? { ...section, [field]: value } : section
    ));
  };

  const removeCustomSection = (id: number) => {
    onChange(data.filter(section => section.id !== id));
  };

  const moveCustomSection = (id: number, direction: 'up' | 'down') => {
    const index = data.findIndex(section => section.id === id);
    if (index === -1) return;
    
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= data.length) return;
    
    const newData = [...data];
    [newData[index], newData[newIndex]] = [newData[newIndex], newData[index]];
    onChange(newData);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900">Custom Sections</h3>
        <p className="text-sm text-gray-600 mt-1">
          Create custom sections to highlight additional achievements, certifications, projects, or any other relevant information.
        </p>
      </div>

      <div className="space-y-4">
        {data.map((section, index) => (
          <div key={section.id} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <input
                type="text"
                value={section.title || 'Untitled'}
                onChange={(e) => updateCustomSection(section.id, 'title', e.target.value)}
                className="text-sm font-medium text-gray-900 bg-transparent border-0 p-0 focus:outline-none focus:ring-0"
                placeholder="Section Title"
              />
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => moveCustomSection(section.id, 'up')}
                  disabled={index === 0}
                  className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                  title="Move up"
                >
                  ↑
                </button>
                <button
                  onClick={() => moveCustomSection(section.id, 'down')}
                  disabled={index === data.length - 1}
                  className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                  title="Move down"
                >
                  ↓
                </button>
                <button
                  onClick={() => removeCustomSection(section.id)}
                  className="p-1 text-red-400 hover:text-red-600"
                  title="Delete"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <span className="text-sm font-medium text-gray-500">
                {!section.activityName ? '(Not specified)' : section.activityName}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Activity name, job title, book title etc.
                </label>
                <input
                  type="text"
                  value={section.activityName || ''}
                  onChange={(e) => updateCustomSection(section.id, 'activityName', e.target.value)}
                  placeholder="e.g. Volunteer Work"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City
                </label>
                <input
                  type="text"
                  value={section.city || ''}
                  onChange={(e) => updateCustomSection(section.id, 'city', e.target.value)}
                  placeholder="e.g. New York"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start & End Date <span className="text-xs text-gray-500">ⓘ</span>
                </label>
                <input
                  type="text"
                  value={section.startDate || ''}
                  onChange={(e) => updateCustomSection(section.id, 'startDate', e.target.value)}
                  placeholder="MM / YYYY"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  &nbsp;
                </label>
                <input
                  type="text"
                  value={section.endDate || ''}
                  onChange={(e) => updateCustomSection(section.id, 'endDate', e.target.value)}
                  placeholder="MM / YYYY"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <div className="border border-gray-300 rounded-md">
                <div className="flex items-center space-x-2 p-2 border-b border-gray-200">
                  <button
                    type="button"
                    className="p-1 text-gray-600 hover:text-gray-800"
                    title="Bold"
                  >
                    <strong>B</strong>
                  </button>
                  <button
                    type="button"
                    className="p-1 text-gray-600 hover:text-gray-800"
                    title="Italic"
                  >
                    <em>I</em>
                  </button>
                  <button
                    type="button"
                    className="p-1 text-gray-600 hover:text-gray-800"
                    title="Underline"
                  >
                    <u>U</u>
                  </button>
                  <button
                    type="button"
                    className="p-1 text-gray-600 hover:text-gray-800"
                    title="Strikethrough"
                  >
                    <s>S</s>
                  </button>
                  <div className="w-px h-6 bg-gray-300"></div>
                  <button
                    type="button"
                    className="p-1 text-gray-600 hover:text-gray-800"
                    title="Bullet List"
                  >
                    • List
                  </button>
                  <button
                    type="button"
                    className="p-1 text-gray-600 hover:text-gray-800"
                    title="Numbered List"
                  >
                    1. List
                  </button>
                  <button
                    type="button"
                    className="p-1 text-gray-600 hover:text-gray-800"
                    title="Link"
                  >
                    🔗
                  </button>
                </div>
                <RichTextEditor
                  value={section.description || ''}
                  onChange={(value) => updateCustomSection(section.id, 'description', value)}
                  placeholder="Describe your custom section..."
                  className="w-full border-0 rounded-none rounded-b-md"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={addCustomSection}
        className="flex items-center px-4 py-2 text-primary-600 hover:text-primary-700 font-medium"
      >
        <PlusIcon className="h-4 w-4 mr-2" />
        Add custom section
      </button>
    </div>
  );
};

const ActivitiesForm: React.FC<{ data: any[]; onChange: (data: any[]) => void }> = ({ data, onChange }) => {
  const addActivity = () => {
    const newActivity = {
      id: Date.now(),
      functionTitle: '',
      employer: '',
      startDate: '',
      endDate: '',
      currentlyActive: false,
      city: '',
      description: ''
    };
    onChange([...data, newActivity]);
  };

  const updateActivity = (id: number, field: string, value: any) => {
    onChange(data.map(activity => 
      activity.id === id ? { ...activity, [field]: value } : activity
    ));
  };

  const removeActivity = (id: number) => {
    onChange(data.filter(activity => activity.id !== id));
  };

  const moveActivity = (id: number, direction: 'up' | 'down') => {
    const index = data.findIndex(activity => activity.id === id);
    if (index === -1) return;
    
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= data.length) return;
    
    const newData = [...data];
    [newData[index], newData[newIndex]] = [newData[newIndex], newData[index]];
    onChange(newData);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900">Extra-curricular Activities</h3>
        <p className="text-sm text-gray-600 mt-1">
          Highlight your involvement in activities outside of work and education that demonstrate leadership, teamwork, and other valuable skills.
        </p>
      </div>

      <div className="space-y-4">
        {data.map((activity, index) => (
          <div key={activity.id} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-gray-500">
                {!activity.functionTitle ? '(Not specified)' : activity.functionTitle}
              </span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => moveActivity(activity.id, 'up')}
                  disabled={index === 0}
                  className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                  title="Move up"
                >
                  ↑
                </button>
                <button
                  onClick={() => moveActivity(activity.id, 'down')}
                  disabled={index === data.length - 1}
                  className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                  title="Move down"
                >
                  ↓
                </button>
                <button
                  onClick={() => removeActivity(activity.id)}
                  className="p-1 text-red-400 hover:text-red-600"
                  title="Delete"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Function Title
                </label>
                <input
                  type="text"
                  value={activity.functionTitle || ''}
                  onChange={(e) => updateActivity(activity.id, 'functionTitle', e.target.value)}
                  placeholder="e.g. Team Captain"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Employer
                </label>
                <input
                  type="text"
                  value={activity.employer || ''}
                  onChange={(e) => updateActivity(activity.id, 'employer', e.target.value)}
                  placeholder="e.g. Basketball Club"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start & End Date <span className="text-xs text-gray-500">ⓘ</span>
                </label>
                <input
                  type="text"
                  value={activity.startDate || ''}
                  onChange={(e) => updateActivity(activity.id, 'startDate', e.target.value)}
                  placeholder="MM / YYYY"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  &nbsp;
                </label>
                <input
                  type="text"
                  value={activity.currentlyActive ? 'Present' : (activity.endDate || '')}
                  onChange={(e) => updateActivity(activity.id, 'endDate', e.target.value)}
                  placeholder="MM / YYYY"
                  disabled={activity.currentlyActive}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City
                </label>
                <input
                  type="text"
                  value={activity.city || ''}
                  onChange={(e) => updateActivity(activity.id, 'city', e.target.value)}
                  placeholder="e.g. Boston"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={activity.currentlyActive || false}
                  onChange={(e) => {
                    updateActivity(activity.id, 'currentlyActive', e.target.checked);
                    if (e.target.checked) {
                      updateActivity(activity.id, 'endDate', '');
                    }
                  }}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-gray-700">I'm currently active in this</span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <div className="border border-gray-300 rounded-md">
                <RichTextEditor
                  value={activity.description || ''}
                  onChange={(value) => updateActivity(activity.id, 'description', value)}
                  placeholder="Describe your role and achievements in this activity..."
                  className="w-full border-0 rounded-none rounded-b-md"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={addActivity}
        className="flex items-center px-4 py-2 text-primary-600 hover:text-primary-700 font-medium"
      >
        <PlusIcon className="h-4 w-4 mr-2" />
        Add one more activity
      </button>
    </div>
  );
};

const HobbiesForm: React.FC<{ data: string; onChange: (data: string) => void }> = ({ data, onChange }) => (
  <div>
    <h3 className="text-lg font-medium text-gray-900 mb-4">Hobbies</h3>
    <RichTextEditor
      value={data}
      onChange={onChange}
      placeholder="e.g., Skiing, Skydiving, Painting"
      className="w-full"
    />
  </div>
);

const ReferencesForm: React.FC<{ data: any[]; onChange: (data: any[]) => void }> = ({ data, onChange }) => {

  const addReference = () => {
    const newReference = {
      id: Date.now(),
      fullName: '',
      company: '',
      phone: '',
      email: ''
    };
    onChange([...data, newReference]);
  };

  const updateReference = (id: number, field: string, value: any) => {
    onChange(data.map(ref => 
      ref.id === id ? { ...ref, [field]: value } : ref
    ));
  };

  const removeReference = (id: number) => {
    onChange(data.filter(ref => ref.id !== id));
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900">References</h3>
        <p className="text-sm text-gray-600 mt-1">
          Include professional references who can speak to your work experience and character.
        </p>
      </div>

      <div className="space-y-4">
          {data.map((reference, _index) => (
            <div key={reference.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-gray-500">
                  {!reference.fullName ? '(Not specified)' : reference.fullName}
                </span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => removeReference(reference.id)}
                    className="p-1 text-red-400 hover:text-red-600"
                    title="Delete"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Referent's Full Name
                  </label>
                  <input
                    type="text"
                    value={reference.fullName || ''}
                    onChange={(e) => updateReference(reference.id, 'fullName', e.target.value)}
                    placeholder="e.g. John Smith"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company
                  </label>
                  <input
                    type="text"
                    value={reference.company || ''}
                    onChange={(e) => updateReference(reference.id, 'company', e.target.value)}
                    placeholder="e.g. Microsoft"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={reference.phone || ''}
                    onChange={(e) => updateReference(reference.id, 'phone', e.target.value)}
                    placeholder="e.g. (555) 123-4567"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={reference.email || ''}
                    onChange={(e) => updateReference(reference.id, 'email', e.target.value)}
                    placeholder="e.g. john.smith@microsoft.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

      <button
        onClick={addReference}
        className="flex items-center px-4 py-2 text-primary-600 hover:text-primary-700 font-medium"
      >
        <PlusIcon className="h-4 w-4 mr-2" />
        Add one more reference
      </button>
    </div>
  );
};

const LanguagesForm: React.FC<{ data: any[]; onChange: (data: any[]) => void }> = ({ data, onChange }) => {
  const addLanguage = () => {
    const newLanguage = {
      id: Date.now(),
      language: '',
      level: 'Native'
    };
    onChange([...data, newLanguage]);
  };

  const updateLanguage = (id: number, field: string, value: any) => {
    onChange(data.map(lang => 
      lang.id === id ? { ...lang, [field]: value } : lang
    ));
  };

  const removeLanguage = (id: number) => {
    onChange(data.filter(lang => lang.id !== id));
  };

  const languageLevels = [
    'Native',
    'Fluent',
    'Professional',
    'Conversational',
    'Basic'
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900">Languages</h3>
        <p className="text-sm text-gray-600 mt-1">
          List languages you speak and your proficiency level for each.
        </p>
      </div>

      <div className="space-y-4">
        {data.map((language, _index) => (
          <div key={language.id} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-gray-500">
                {!language.language ? '(Not specified)' : language.language}
              </span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => removeLanguage(language.id)}
                  className="p-1 text-red-400 hover:text-red-600"
                  title="Delete"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Language
                </label>
                <input
                  type="text"
                  value={language.language || ''}
                  onChange={(e) => updateLanguage(language.id, 'language', e.target.value)}
                  placeholder="e.g. Spanish"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Level
                </label>
                <select
                  value={language.level || 'Native'}
                  onChange={(e) => updateLanguage(language.id, 'level', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Select level</option>
                  {languageLevels.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={addLanguage}
        className="flex items-center px-4 py-2 text-primary-600 hover:text-primary-700 font-medium"
      >
        <PlusIcon className="h-4 w-4 mr-2" />
        Add one more language
      </button>
    </div>
  );
};
