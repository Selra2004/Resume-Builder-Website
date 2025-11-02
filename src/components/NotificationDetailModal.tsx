import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  XMarkIcon,
  CalendarIcon,
  BriefcaseIcon,
  ExclamationCircleIcon,
  EnvelopeIcon,
  ClockIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { BellIcon } from '@heroicons/react/24/solid';

interface NotificationDetailModalProps {
  notificationId: number | null;
  isOpen: boolean;
  onClose: () => void;
  onNotificationUpdate?: (notificationId: number, updates: any) => void;
}

interface NotificationDetails {
  notification: {
    id: number;
    title: string;
    message: string;
    type: 'interview_reminder' | 'application_status' | 'system';
    related_id?: number;
    is_read: boolean;
    created_at: string;
    expires_at: string;
  };
  emailDetails?: {
    recipient_email: string;
    subject: string;
    body: string;
    type: string;
    is_sent: boolean;
    sent_at: string;
    error_message?: string;
  };
  interviewDetails?: {
    notes: string;
    interview_date: string;
    interview_mode: string;
    interview_location?: string;
    interview_link?: string;
    job_title: string;
    employer_name: string;
  };
  fullMessage: string;
  metadata: {
    auto_marked_read: boolean;
    has_email_details: boolean;
    has_interview_details: boolean;
    is_interview_completed: boolean;
  };
}

export const NotificationDetailModal: React.FC<NotificationDetailModalProps> = ({
  notificationId,
  isOpen,
  onClose,
  onNotificationUpdate
}) => {
  const [details, setDetails] = useState<NotificationDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && notificationId) {
      fetchNotificationDetails();
    } else {
      setDetails(null);
      setError(null);
    }
  }, [isOpen, notificationId]);

  const fetchNotificationDetails = async () => {
    if (!notificationId) return;

    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/notifications/${notificationId}/details`);
      setDetails(response.data);

      // If notification was auto-marked as read, update parent component
      if (response.data.metadata.auto_marked_read && onNotificationUpdate) {
        onNotificationUpdate(notificationId, { is_read: true });
      }
    } catch (err: any) {
      console.error('Error fetching notification details:', err);
      setError(err.response?.data?.message || 'Failed to load notification details');
    } finally {
      setLoading(false);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'interview_reminder':
        return <CalendarIcon className="h-6 w-6 text-blue-500" />;
      case 'application_status':
        return <BriefcaseIcon className="h-6 w-6 text-green-500" />;
      case 'system':
        return <ExclamationCircleIcon className="h-6 w-6 text-yellow-500" />;
      default:
        return <BellIcon className="h-6 w-6 text-gray-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };


  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <EnvelopeIcon className="h-6 w-6 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">Notification Details</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <XMarkIcon className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <ExclamationCircleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <p className="text-red-600 font-medium">Error Loading Details</p>
                <p className="text-gray-600 text-sm mt-2">{error}</p>
                <button
                  onClick={fetchNotificationDetails}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            ) : details ? (
              <div className="space-y-6">
                {/* Auto-read notification */}
                {details.metadata.auto_marked_read && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-2">
                    <CheckCircleIcon className="h-5 w-5 text-green-600" />
                    <span className="text-sm text-green-800">
                      This notification has been automatically marked as read.
                    </span>
                  </div>
                )}

                {/* Notification Header */}
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(details.notification.type)}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {details.notification.title}
                    </h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <ClockIcon className="h-4 w-4" />
                        <span>{formatDate(details.notification.created_at)}</span>
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        details.notification.type === 'interview_reminder' 
                          ? 'bg-blue-100 text-blue-800'
                          : details.notification.type === 'application_status'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {details.notification.type.replace('_', ' ').toUpperCase()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notification Message */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Message</h4>
                  <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {details.fullMessage}
                  </p>
                </div>

                {/* Interview Details Section for Interview Completed notifications */}
                {details.metadata.is_interview_completed && details.interviewDetails && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="flex items-center text-lg font-medium text-gray-900 mb-4">
                      <CalendarIcon className="h-5 w-5 text-blue-500 mr-2" />
                      Interview Details
                      <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full ml-2">Completed</span>
                    </h4>
                    <div className="space-y-4">
                      {/* Interview Information */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-600">Job Position:</label>
                          <p className="text-gray-900 mt-1 text-sm font-medium">{details.interviewDetails.job_title}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">Employer:</label>
                          <p className="text-gray-900 mt-1 text-sm">{details.interviewDetails.employer_name}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-600">Interview Date:</label>
                          <p className="text-gray-900 mt-1 text-sm">{formatDate(details.interviewDetails.interview_date)}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">Mode:</label>
                          <p className="text-gray-900 mt-1 text-sm capitalize">{details.interviewDetails.interview_mode}</p>
                        </div>
                      </div>

                      {/* Location or Link */}
                      {(details.interviewDetails.interview_location || details.interviewDetails.interview_link) && (
                        <div>
                          <label className="text-sm font-medium text-gray-600">
                            {details.interviewDetails.interview_mode === 'onsite' ? 'Location:' : 'Meeting Link:'}
                          </label>
                          <p className="text-gray-900 mt-1 text-sm">
                            {details.interviewDetails.interview_location || details.interviewDetails.interview_link}
                          </p>
                        </div>
                      )}

                      {/* Interview Notes */}
                      {details.interviewDetails.notes && (
                        <div>
                          <label className="text-sm font-medium text-gray-600">Interview Notes:</label>
                          <div className="mt-2 bg-white rounded-lg border border-gray-200 p-4">
                            <p className="text-gray-900 text-sm whitespace-pre-wrap">
                              {details.interviewDetails.notes}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Status Information */}
                      <div className="pt-3 border-t border-gray-200">
                        <div className="bg-green-50 border border-green-200 rounded p-3">
                          <div className="flex items-center">
                            <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                            <p className="text-sm text-green-800 font-medium">
                              Interview has been marked as completed. The employer will contact you with their decision.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Gmail Email Details Section (for other notifications) */}
                {!details.metadata.is_interview_completed && details.emailDetails && (
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center space-x-2">
                      <EnvelopeIcon className="h-4 w-4" />
                      <span>Gmail Email Details</span>
                      {details.emailDetails.is_sent ? (
                        <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">Sent via Gmail</span>
                      ) : (
                        <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">Failed to Send</span>
                      )}
                    </h4>
                    <div className="space-y-4">
                      {/* Email Header Information */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-600">To:</label>
                          <p className="text-gray-900 mt-1 text-sm">{details.emailDetails.recipient_email}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">Type:</label>
                          <p className="text-gray-900 mt-1 text-sm capitalize">{details.emailDetails.type.replace('_', ' ')}</p>
                        </div>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-gray-600">Subject:</label>
                        <p className="text-gray-900 mt-1 font-medium">{details.emailDetails.subject}</p>
                      </div>

                      {/* Email Body (HTML) */}
                      <div>
                        <label className="text-sm font-medium text-gray-600">Email Content (As Sent via Gmail):</label>
                        <div className="mt-2 bg-white rounded-lg border border-gray-200 p-4 max-h-96 overflow-y-auto">
                          <div 
                            className="prose prose-sm max-w-none"
                            dangerouslySetInnerHTML={{ 
                              __html: details.emailDetails.body 
                            }}
                          />
                        </div>
                      </div>

                      {/* Delivery Information */}
                      <div className="pt-3 border-t border-gray-200">
                        <div>
                          <label className="text-sm font-medium text-gray-600">Sent via Gmail:</label>
                          <p className="text-gray-900 mt-1 text-sm">
                            {details.emailDetails.sent_at ? formatDate(details.emailDetails.sent_at) : 'Not sent yet'}
                          </p>
                        </div>
                      </div>

                      {/* Error Information */}
                      {details.emailDetails.error_message && (
                        <div className="bg-red-50 border border-red-200 rounded p-3">
                          <label className="text-sm font-medium text-red-800">Error:</label>
                          <p className="text-red-700 mt-1 text-sm">{details.emailDetails.error_message}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Notification Metadata */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Additional Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="font-medium text-gray-600">Status:</span>
                      <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                        details.notification.is_read 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {details.notification.is_read ? 'Read' : 'Unread'}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Expires:</span>
                      <span className="ml-2 text-gray-900">
                        {formatDate(details.notification.expires_at)}
                      </span>
                    </div>
                    {details.notification.related_id && (
                      <div>
                        <span className="font-medium text-gray-600">Related ID:</span>
                        <span className="ml-2 text-gray-900">{details.notification.related_id}</span>
                      </div>
                    )}
                    <div>
                      <span className="font-medium text-gray-600">Email Available:</span>
                      <span className="ml-2 text-gray-900">
                        {details.metadata.has_email_details ? 'Yes' : 'No'}
                      </span>
                    </div>
                    {details.metadata.is_interview_completed && (
                      <div>
                        <span className="font-medium text-gray-600">Interview Details:</span>
                        <span className="ml-2 text-blue-600">Available</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          {/* Footer */}
          <div className="flex justify-end p-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
