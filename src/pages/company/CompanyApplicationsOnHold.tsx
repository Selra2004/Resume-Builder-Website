import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { toast } from 'react-hot-toast';
import {
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  ExclamationCircleIcon,
  EyeIcon,
  ArrowLeftIcon,
  CalendarIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

interface OnHoldApplication {
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
  held_at: string;
  hold_reason: string;
  company_comments_count: number;
  notification_sent: boolean;
  can_be_reconsidered: boolean;
}

export const CompanyApplicationsOnHold: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<OnHoldApplication[]>([]);

  useEffect(() => {
    fetchOnHoldApplications();
  }, []);

  const handleReconsider = async (applicationId: number) => {
    try {
      await api.post(`/companies/applications/${applicationId}/reconsider`);
      toast.success('Application moved back to review');
      fetchOnHoldApplications(); // Refresh data
    } catch (error: any) {
      console.error('Failed to reconsider application:', error);
      toast.error('Failed to reconsider application');
    }
  };

  const fetchOnHoldApplications = async () => {
    try {
      setLoading(true);
      const response = await api.get('/companies/applications/on-hold');
      setApplications(response.data.applications);
    } catch (error: any) {
      console.error('Failed to fetch on-hold applications:', error);
      toast.error('Failed to load on-hold applications');
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
                  <ExclamationCircleIcon className="h-8 w-8 text-yellow-500 mr-3" />
                  On-Hold Applications
                </h1>
                <p className="mt-1 text-sm text-gray-600">
                  Applications on hold that may be reconsidered later
                </p>
              </div>
            </div>
            <div className="text-sm text-gray-600">
              {applications.length} on-hold application{applications.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>

        {/* Info Notice */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex">
            <ExclamationCircleIcon className="h-5 w-5 text-yellow-400 mt-0.5" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">About On-Hold Applications</h3>
              <p className="mt-2 text-sm text-yellow-700">
                These applications are temporarily paused. You can reconsider them at any time or move them to accepted/rejected status.
              </p>
            </div>
          </div>
        </div>

        {/* Applications List */}
        <div className="space-y-4">
          {applications.length === 0 ? (
            <div className="bg-white shadow rounded-lg p-12">
              <div className="text-center">
                <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No on-hold applications</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Applications you put on hold will appear here for future review.
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
              <div key={application.id} className="bg-white shadow rounded-lg p-6 border-l-4 border-yellow-400">
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
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          On Hold
                        </span>
                        {application.notification_sent && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Notified
                          </span>
                        )}
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
                          Put on hold {new Date(application.held_at).toLocaleDateString()}
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

                      {/* Hold Reason */}
                      {application.hold_reason && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-3">
                          <h4 className="text-sm font-medium text-yellow-800 mb-1">Hold Reason:</h4>
                          <p className="text-sm text-yellow-700">{application.hold_reason}</p>
                        </div>
                      )}

                      <div className="flex items-center space-x-4 text-sm">
                        {application.company_comments_count > 0 && (
                          <div className="flex items-center text-gray-600">
                            <ChatBubbleLeftRightIcon className="h-4 w-4 mr-1" />
                            {application.company_comments_count} comment{application.company_comments_count !== 1 ? 's' : ''}
                          </div>
                        )}
                        {application.can_be_reconsidered && (
                          <div className="flex items-center text-green-600">
                            <CheckCircleIcon className="h-4 w-4 mr-1" />
                            Can be reconsidered
                          </div>
                        )}
                      </div>
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
                    
                    {application.can_be_reconsidered && (
                      <button
                        onClick={() => {
                          if (confirm('Are you sure you want to reconsider this application?')) {
                            handleReconsider(application.id);
                          }
                        }}
                        className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircleIcon className="h-4 w-4 mr-1" />
                        Reconsider
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center space-x-4">
                    <span className="flex items-center text-yellow-600">
                      <ClockIcon className="h-4 w-4 mr-1" />
                      You put this applicant on hold
                    </span>
                    {application.notification_sent && (
                      <span className="flex items-center text-green-600">
                        Email notification sent to applicant
                      </span>
                    )}
                  </div>
                  <div>
                    Applied: {new Date(application.created_at).toLocaleDateString()}
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
