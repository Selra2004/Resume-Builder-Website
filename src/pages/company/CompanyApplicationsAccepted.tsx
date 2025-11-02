import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { toast } from 'react-hot-toast';
import {
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  CheckCircleIcon,
  EyeIcon,
  ArrowLeftIcon,
  CalendarIcon,
  ChatBubbleLeftRightIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface AcceptedApplication {
  id: number;
  job_id: number;
  job_title: string;
  user_id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  position_applying_for: string;
  profile_photo: string;
  created_at: string;
  accepted_at: string;
  acceptance_reason: string;
  coordinator_approved: boolean;
  final_status: 'pending_coordinator' | 'hired' | 'declined_by_coordinator';
  company_comments_count: number;
  interview_details?: any;
}

export const CompanyApplicationsAccepted: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<AcceptedApplication[]>([]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'hired':
        return 'bg-green-100 text-green-800';
      case 'pending_coordinator':
        return 'bg-yellow-100 text-yellow-800';
      case 'declined_by_coordinator':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'hired':
        return 'Hired';
      case 'pending_coordinator':
        return 'Awaiting Coordinator';
      case 'declined_by_coordinator':
        return 'Coordinator Declined';
      default:
        return 'Unknown';
    }
  };

  useEffect(() => {
    fetchAcceptedApplications();
  }, []);

  const fetchAcceptedApplications = async () => {
    try {
      setLoading(true);
      const response = await api.get('/companies/applications/accepted');
      setApplications(response.data.applications);
    } catch (error: any) {
      console.error('Failed to fetch accepted applications:', error);
      toast.error('Failed to load accepted applications');
    } finally {
      setLoading(false);
    }
  };

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
                to="/company/dashboard"
                className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-1" />
                Back to Dashboard
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                  <CheckCircleIcon className="h-8 w-8 text-green-500 mr-3" />
                  Accepted Applications
                </h1>
                <p className="mt-1 text-sm text-gray-600">
                  Applications you have accepted, pending final coordinator approval
                </p>
              </div>
            </div>
            <div className="text-sm text-gray-600">
              {applications.length} accepted application{applications.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>

        {/* Status Legend */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-3">Application Flow</h3>
          <div className="flex flex-wrap items-center space-x-6 text-sm">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
              <span className="text-gray-700">You Accepted</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
              <span className="text-gray-700">Awaiting Coordinator</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
              <span className="text-gray-700">Finally Hired</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
              <span className="text-gray-700">Coordinator Declined</span>
            </div>
          </div>
        </div>

        {/* Applications List */}
        <div className="space-y-4">
          {applications.length === 0 ? (
            <div className="bg-white shadow rounded-lg p-12">
              <div className="text-center">
                <CheckCircleIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No accepted applications</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Applications you accept will appear here for coordinator final approval.
                </p>
                <div className="mt-6">
                  <Link
                    to="/company/applications"
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                  >
                    View Pending Applications
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            applications.map((application) => (
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
                        />
                      ) : (
                        <div className="h-14 w-14 rounded-full bg-gray-300 flex items-center justify-center">
                          <UserIcon className="h-7 w-7 text-gray-600" />
                        </div>
                      )}
                    </div>

                    {/* Application Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-medium text-gray-900">
                          {application.first_name} {application.last_name}
                        </h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(application.final_status)}`}>
                          {getStatusText(application.final_status)}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center text-sm text-gray-500 space-x-4 mb-3">
                        <div className="flex items-center">
                          <EnvelopeIcon className="h-4 w-4 mr-1" />
                          <a href={`mailto:${application.email}`} className="text-blue-600 hover:text-blue-500">
                            {application.email}
                          </a>
                        </div>
                        <div className="flex items-center">
                          <PhoneIcon className="h-4 w-4 mr-1" />
                          {application.phone}
                        </div>
                        <div className="flex items-center">
                          <CalendarIcon className="h-4 w-4 mr-1" />
                          Accepted {new Date(application.accepted_at).toLocaleDateString()}
                        </div>
                      </div>

                      <div className="flex items-center space-x-4 text-sm mb-3">
                        <div>
                          <strong>Job:</strong> {application.job_title}
                        </div>
                        <div>
                          <strong>Position:</strong> {application.position_applying_for}
                        </div>
                      </div>

                      {application.acceptance_reason && (
                        <div className="bg-green-50 border border-green-200 rounded-md p-3 mb-3">
                          <p className="text-sm text-green-800">
                            <strong>Acceptance Reason:</strong> {application.acceptance_reason}
                          </p>
                        </div>
                      )}

                      {application.interview_details && (
                        <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-3">
                          <h4 className="text-sm font-medium text-blue-800 mb-2">Interview Details:</h4>
                          <div className="text-sm text-blue-700 space-y-1">
                            {application.interview_details.date && (
                              <div>Date: {new Date(application.interview_details.date).toLocaleDateString()}</div>
                            )}
                            {application.interview_details.time && (
                              <div>Time: {application.interview_details.time}</div>
                            )}
                            {application.interview_details.link && (
                              <div>
                                Link: <a href={application.interview_details.link} className="text-blue-600 hover:text-blue-500" target="_blank" rel="noopener noreferrer">
                                  {application.interview_details.link}
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {application.company_comments_count > 0 && (
                        <div className="text-sm text-gray-600">
                          <ChatBubbleLeftRightIcon className="h-4 w-4 inline mr-1" />
                          {application.company_comments_count} comment{application.company_comments_count !== 1 ? 's' : ''}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2 ml-4">
                    <Link
                      to={`/company/applications/${application.id}/details`}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <EyeIcon className="h-4 w-4 mr-1" />
                      View Details
                    </Link>

                    <Link
                      to={`/company/jobs/${application.job_id}/applications?applicant=${application.id}`}
                      className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                    >
                      <EnvelopeIcon className="h-4 w-4 mr-1" />
                      Send Email
                    </Link>
                  </div>
                </div>

                {/* Status Progress */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center space-x-4">
                      <span className="flex items-center text-green-600">
                        <CheckCircleIcon className="h-4 w-4 mr-1" />
                        You accepted this applicant
                      </span>
                      {!application.coordinator_approved && (
                        <span className="flex items-center text-yellow-600">
                          <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                          Pending coordinator approval
                        </span>
                      )}
                    </div>
                    <div>
                      Applied: {new Date(application.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
