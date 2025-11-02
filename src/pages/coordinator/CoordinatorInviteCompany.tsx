import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import { toast } from 'react-hot-toast';
import { 
  EnvelopeIcon,
  PaperAirplaneIcon,
  UserPlusIcon,
  CheckCircleIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';

interface InvitationHistory {
  id: number;
  email: string;
  message: string;
  token: string;
  status: 'pending' | 'used' | 'expired';
  created_at: string;
  used_at: string | null;
}

export const CoordinatorInviteCompany: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [coordinatorInfo, setCoordinatorInfo] = useState<{ 
    email: string; 
    name: string; 
  }>({ email: '', name: '' });
  const [formData, setFormData] = useState({
    email: '',
    message: ''
  });
  const [invitationHistory, setInvitationHistory] = useState<InvitationHistory[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    fetchCoordinatorInfo();
    fetchInvitationHistory();
  }, []);

  const fetchCoordinatorInfo = async () => {
    try {
      const response = await api.get('/coordinators/profile');
      const profile = response.data;
      setCoordinatorInfo({
        email: user?.email || '',
        name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Coordinator'
      });
    } catch (error) {
      console.error('Failed to fetch coordinator info:', error);
    }
  };

  const fetchInvitationHistory = async () => {
    try {
      const response = await api.get('/coordinators/invitations');
      setInvitationHistory(response.data);
    } catch (error) {
      console.error('Failed to fetch invitation history:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email.trim()) {
      toast.error('Please enter a company email address');
      return;
    }

    if (!formData.message.trim()) {
      toast.error('Please enter a message');
      return;
    }

    setLoading(true);
    try {
      await api.post('/coordinators/invite-company', {
        email: formData.email.trim(),
        message: formData.message.trim()
      });

      toast.success('Invitation sent successfully!');
      setFormData({ email: '', message: '' });
      fetchInvitationHistory(); // Refresh the history
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to send invitation');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'used':
        return 'bg-green-100 text-green-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'used':
        return <CheckCircleIcon className="h-4 w-4" />;
      case 'expired':
        return <ExclamationCircleIcon className="h-4 w-4" />;
      default:
        return <EnvelopeIcon className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Invite Companies</h1>
          <p className="mt-2 text-gray-600">
            Send invitations to companies and business owners to join your job posting network.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Invitation Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center">
                  <UserPlusIcon className="h-6 w-6 text-blue-600 mr-3" />
                  <h2 className="text-lg font-medium text-gray-900">Send Company Invitation</h2>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Coordinator Info Display */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-blue-900 mb-2">Invitation From:</h3>
                  <div className="space-y-1">
                    <p className="text-sm text-blue-800">
                      <span className="font-medium">Coordinator:</span> {coordinatorInfo.name}
                    </p>
                    <p className="text-sm text-blue-800">
                      <span className="font-medium">Email:</span> {coordinatorInfo.email}
                    </p>
                  </div>
                </div>

                {/* Company Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Company Email Address *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="company@example.com"
                      required
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Enter the email address of the company or business owner you want to invite.
                  </p>
                </div>

                {/* Message */}
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                    Personal Message *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={4}
                    value={formData.message}
                    onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                    className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Hi! I'm inviting you to join our job posting platform where you can find talented students and alumni. We'd love to have your company as a partner in providing opportunities to our students..."
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Write a personalized message explaining why you're inviting this company and the benefits of joining your platform.
                  </p>
                </div>

                {/* Submit Button */}
                <div className="flex items-center justify-between pt-4">
                  <button
                    type="button"
                    onClick={() => setShowHistory(!showHistory)}
                    className="text-sm text-blue-600 hover:text-blue-500"
                  >
                    {showHistory ? 'Hide' : 'Show'} Invitation History
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Sending...
                      </>
                    ) : (
                      <>
                        <PaperAirplaneIcon className="h-5 w-5 mr-2" />
                        Send Invitation
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Instructions */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">How it works</h3>
              <div className="space-y-3">
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium mr-3 mt-0.5">
                    1
                  </div>
                  <p className="text-sm text-gray-600">
                    Enter the company's email address and write a personalized invitation message.
                  </p>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium mr-3 mt-0.5">
                    2
                  </div>
                  <p className="text-sm text-gray-600">
                    An email with a unique registration code will be sent to the company.
                  </p>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium mr-3 mt-0.5">
                    3
                  </div>
                  <p className="text-sm text-gray-600">
                    The company can use the code to register and start posting jobs on your platform.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
              <div className="flex items-start">
                <ExclamationCircleIcon className="h-5 w-5 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-medium text-yellow-800">Important Note</h4>
                  <p className="mt-1 text-sm text-yellow-700">
                    Each invitation code is valid for 7 days and can only be used once. Make sure to send invitations to verified company email addresses.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Invitation History */}
        {showHistory && (
          <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Invitation History</h3>
            </div>
            <div className="p-6">
              {invitationHistory.length === 0 ? (
                <div className="text-center py-8">
                  <EnvelopeIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No invitations sent yet</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Your invitation history will appear here after you send your first invitation.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {invitationHistory.map((invitation) => (
                    <div key={invitation.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <h4 className="text-sm font-medium text-gray-900 mr-3">
                            {invitation.email}
                          </h4>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(invitation.status)}`}>
                            {getStatusIcon(invitation.status)}
                            <span className="ml-1 capitalize">{invitation.status}</span>
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(invitation.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                        "{invitation.message}"
                      </p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Code: {invitation.token}</span>
                        {invitation.used_at && (
                          <span>Used: {new Date(invitation.used_at).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
