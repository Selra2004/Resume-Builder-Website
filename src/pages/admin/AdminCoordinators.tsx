import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import {
  AcademicCapIcon,
  EyeIcon,
  XMarkIcon,
  PhoneIcon,
  CalendarIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';
import { api } from '../../services/api';

interface Coordinator {
  id: number;
  email: string;
  is_verified: boolean;
  is_approved: boolean;
  created_at: string;
  first_name?: string;
  last_name?: string;
  contact_number?: string;
  age?: number;
  birthdate?: string;
  gender?: string;
  designated_course?: string;
  profile_photo?: string;
  is_profile_complete?: boolean;
}

export const AdminCoordinators: React.FC = () => {
  const [coordinators, setCoordinators] = useState<Coordinator[]>([]);
  const [loading, setLoading] = useState(true);
  const [showProfileModal, setShowProfileModal] = useState<Coordinator | null>(null);

  useEffect(() => {
    fetchCoordinators();
  }, []);

  const fetchCoordinators = async () => {
    try {
      const response = await api.get('/admin/coordinators');
      setCoordinators(response.data);
    } catch (error: any) {
      toast.error('Failed to fetch coordinators');
      console.error('Error fetching coordinators:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (coordinator: Coordinator) => {
    if (!coordinator.is_verified) {
      return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Not Verified</span>;
    }
    if (!coordinator.is_approved) {
      return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Pending Approval</span>;
    }
    if (!coordinator.is_profile_complete) {
      return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">Profile Incomplete</span>;
    }
    return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Active</span>;
  };

  const getDisplayName = (coordinator: Coordinator) => {
    if (coordinator.first_name && coordinator.last_name) {
      return `${coordinator.first_name} ${coordinator.last_name}`;
    }
    return coordinator.email;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <AcademicCapIcon className="h-6 w-6 mr-2 text-blue-600" />
                Coordinator Management
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                View and manage course coordinators
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-900">
                {coordinators.length} total coordinators
              </span>
            </div>
          </div>
        </div>

        {/* Coordinators List */}
        <div className="p-6">
          {coordinators.length === 0 ? (
            <div className="text-center py-12">
              <AcademicCapIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No coordinators</h3>
              <p className="mt-1 text-sm text-gray-500">
                No coordinators have been registered yet.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Coordinator
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Designated Course
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Registered
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {coordinators.map((coordinator) => (
                    <tr key={coordinator.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {coordinator.profile_photo ? (
                            <img 
                              src={coordinator.profile_photo} 
                              alt="Profile" 
                              className="h-10 w-10 rounded-full object-cover mr-3"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                              <AcademicCapIcon className="h-6 w-6 text-blue-600" />
                            </div>
                          )}
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {getDisplayName(coordinator)}
                            </div>
                            <div className="text-sm text-gray-500">{coordinator.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {coordinator.designated_course || 'Not specified'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(coordinator)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(coordinator.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => setShowProfileModal(coordinator)}
                          className="text-blue-600 hover:text-blue-900 flex items-center"
                        >
                          <EyeIcon className="h-4 w-4 mr-1" />
                          View Profile
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Profile Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-0 border w-full max-w-2xl shadow-lg rounded-lg bg-white">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Coordinator Profile Details
              </h3>
              <button
                onClick={() => setShowProfileModal(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Header with photo and basic info */}
              <div className="flex items-center space-x-4">
                {showProfileModal.profile_photo ? (
                  <img 
                    src={showProfileModal.profile_photo} 
                    alt="Profile" 
                    className="h-20 w-20 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-20 w-20 rounded-full bg-blue-100 flex items-center justify-center">
                    <AcademicCapIcon className="h-10 w-10 text-blue-600" />
                  </div>
                )}
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {getDisplayName(showProfileModal)}
                  </h2>
                  <p className="text-sm text-gray-500">{showProfileModal.email}</p>
                  <div className="mt-2">{getStatusBadge(showProfileModal)}</div>
                </div>
              </div>

              {/* Personal Information */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">First Name</label>
                    <p className="mt-1 text-sm text-gray-900">{showProfileModal.first_name || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Last Name</label>
                    <p className="mt-1 text-sm text-gray-900">{showProfileModal.last_name || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Contact Number</label>
                    <p className="mt-1 text-sm text-gray-900 flex items-center">
                      <PhoneIcon className="h-4 w-4 mr-1 text-gray-400" />
                      {showProfileModal.contact_number || 'Not provided'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Age</label>
                    <p className="mt-1 text-sm text-gray-900">{showProfileModal.age || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Birthdate</label>
                    <p className="mt-1 text-sm text-gray-900 flex items-center">
                      <CalendarIcon className="h-4 w-4 mr-1 text-gray-400" />
                      {showProfileModal.birthdate ? new Date(showProfileModal.birthdate).toLocaleDateString() : 'Not provided'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Gender</label>
                    <p className="mt-1 text-sm text-gray-900 capitalize">{showProfileModal.gender || 'Not provided'}</p>
                  </div>
                </div>
              </div>

              {/* Course Information */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Course Information</h3>
                <div>
                  <label className="text-sm font-medium text-gray-500">Designated Course</label>
                  <p className="mt-1 text-sm text-gray-900 flex items-center">
                    <AcademicCapIcon className="h-4 w-4 mr-1 text-gray-400" />
                    {showProfileModal.designated_course || 'Not specified'}
                  </p>
                </div>
              </div>

              {/* Account Information */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Account Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Email Address</label>
                    <p className="mt-1 text-sm text-gray-900 flex items-center">
                      <EnvelopeIcon className="h-4 w-4 mr-1 text-gray-400" />
                      {showProfileModal.email}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Registration Date</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {new Date(showProfileModal.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Verification Status</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {showProfileModal.is_verified ? (
                        <span className="text-green-600 font-medium">✓ Verified</span>
                      ) : (
                        <span className="text-red-600 font-medium">✗ Not Verified</span>
                      )}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Approval Status</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {showProfileModal.is_approved ? (
                        <span className="text-green-600 font-medium">✓ Approved</span>
                      ) : (
                        <span className="text-yellow-600 font-medium">⏳ Pending</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg">
              <div className="flex justify-end">
                <button
                  onClick={() => setShowProfileModal(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
