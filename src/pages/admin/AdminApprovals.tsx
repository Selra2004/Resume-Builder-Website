import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  ClockIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import { api } from '../../services/api';

// Note: Coordinators store full URLs directly, no processing needed

interface PendingApproval {
  id: number;
  email: string;
  type: 'coordinator' | 'company' | 'admin';
  created_at: string;
  first_name?: string;
  last_name?: string;
  position?: string;
  department?: string;
  designated_course?: string;
  profile_photo?: string;
  profile_photo_url?: string;
  is_profile_complete?: boolean | number;
  profile?: {
    first_name?: string;
    last_name?: string;
    company_name?: string;
    designated_course?: string;
  };
}

export const AdminApprovals: React.FC = () => {
  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingIds, setProcessingIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetchPendingApprovals();
  }, []);

  const fetchPendingApprovals = async () => {
    try {
      const response = await api.get('/admin/pending-approvals');
      setPendingApprovals(response.data);
    } catch (error: any) {
      toast.error('Failed to fetch pending approvals');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (id: number, type: string, action: 'approve' | 'reject') => {
    setProcessingIds(prev => new Set(prev).add(id));
    
    try {
      await api.post(`/admin/${action}/${type}/${id}`);
      toast.success(`${type} ${action}d successfully`);
      
      // Remove from list
      setPendingApprovals(prev => prev.filter(item => item.id !== id));
    } catch (error: any) {
      toast.error(`Failed to ${action} ${type}`);
      console.error(error);
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'coordinator':
        return <UserGroupIcon className="h-5 w-5 text-blue-500" />;
      case 'company':
        return <BuildingOfficeIcon className="h-5 w-5 text-green-500" />;
      case 'admin':
        return <ShieldCheckIcon className="h-5 w-5 text-purple-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getDisplayName = (approval: PendingApproval) => {
    if (approval.type === 'company' && approval.profile?.company_name) {
      return approval.profile.company_name;
    }
    if ((approval.type === 'admin' || approval.type === 'coordinator') && approval.first_name && approval.last_name) {
      return `${approval.first_name} ${approval.last_name}`;
    }
    if (approval.profile?.first_name && approval.profile?.last_name) {
      return `${approval.profile.first_name} ${approval.profile.last_name}`;
    }
    return approval.email;
  };

  const getSubtitle = (approval: PendingApproval) => {
    const timeAgo = new Date(approval.created_at).toLocaleDateString();
    let subtitle = `${approval.type.charAt(0).toUpperCase() + approval.type.slice(1)} • Registered ${timeAgo}`;
    
    if (approval.type === 'coordinator' && approval.designated_course) {
      subtitle += ` • ${approval.designated_course}`;
    } else if (approval.type === 'admin' && approval.position) {
      subtitle += ` • ${approval.position}`;
      if (approval.department) {
        subtitle += ` (${approval.department})`;
      }
    }
    
    return subtitle;
  };

  const canApprove = (approval: PendingApproval) => {
    if (approval.type === 'admin' || approval.type === 'coordinator') {
      // Handle both boolean true and number 1 from database
      return approval.is_profile_complete === true || approval.is_profile_complete === 1;
    }
    return true; // Companies can be approved without profile completion
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
              <h2 className="text-xl font-semibold text-gray-900">Pending Approvals</h2>
              <p className="text-sm text-gray-600 mt-1">
                Review and approve new registrations
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <ClockIcon className="h-5 w-5 text-yellow-500" />
              <span className="text-sm font-medium text-gray-900">
                {pendingApprovals.length} pending
              </span>
            </div>
          </div>
        </div>

        {/* Approvals List */}
        <div className="p-6">
          {pendingApprovals.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircleIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No pending approvals</h3>
              <p className="mt-1 text-sm text-gray-500">
                All registrations have been processed.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingApprovals.map((approval) => (
                <div
                  key={`${approval.type}-${approval.id}`}
                  className={`flex items-center justify-between p-4 border rounded-lg hover:bg-yellow-100 transition-colors ${
                    (approval.type === 'admin' || approval.type === 'coordinator') && !approval.is_profile_complete 
                      ? 'bg-orange-50 border-orange-200' 
                      : 'bg-yellow-50 border-yellow-200'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    {/* Profile Photo Display */}
                    {(approval.type === 'admin' && approval.profile_photo_url) ? (
                      <img 
                        src={approval.profile_photo_url} 
                        alt="Profile" 
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (approval.type === 'coordinator' && approval.profile_photo) ? (
                      <img 
                        src={approval.profile_photo} 
                        alt="Profile" 
                        className="h-10 w-10 rounded-full object-cover"
                        onError={(e) => {
                          console.log('Coordinator photo failed to load:', approval.profile_photo);
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      getTypeIcon(approval.type)
                    )}
                    <div>
                      <div className="flex items-center space-x-2">
                        <p className="font-medium text-gray-900">
                          {getDisplayName(approval)}
                        </p>
                        {(approval.type === 'admin' || approval.type === 'coordinator') && !approval.is_profile_complete && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                            Profile Incomplete
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        {approval.email}
                      </p>
                      <p className="text-xs text-gray-500">
                        {getSubtitle(approval)}
                      </p>
                      {(approval.type === 'admin' || approval.type === 'coordinator') && !approval.is_profile_complete && (
                        <p className="text-xs text-orange-600 mt-1">
                          ⚠️ {approval.type === 'admin' ? 'Admin' : 'Coordinator'} must complete their profile before approval
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleApproval(approval.id, approval.type, 'approve')}
                      disabled={processingIds.has(approval.id) || !canApprove(approval)}
                      className="flex items-center px-3 py-1.5 text-sm font-medium text-green-700 bg-green-100 border border-green-300 rounded-md hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      title={!canApprove(approval) ? 'Profile must be completed before approval' : 'Approve user'}
                    >
                      {processingIds.has(approval.id) ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-700 mr-1"></div>
                      ) : (
                        <CheckCircleIcon className="h-4 w-4 mr-1" />
                      )}
                      Approve
                    </button>
                    
                    <button
                      onClick={() => handleApproval(approval.id, approval.type, 'reject')}
                      disabled={processingIds.has(approval.id)}
                      className="flex items-center px-3 py-1.5 text-sm font-medium text-red-700 bg-red-100 border border-red-300 rounded-md hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {processingIds.has(approval.id) ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-700 mr-1"></div>
                      ) : (
                        <XCircleIcon className="h-4 w-4 mr-1" />
                      )}
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <UserGroupIcon className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Coordinators</p>
              <p className="text-2xl font-semibold text-gray-900">
                {pendingApprovals.filter(a => a.type === 'coordinator').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <BuildingOfficeIcon className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Companies</p>
              <p className="text-2xl font-semibold text-gray-900">
                {pendingApprovals.filter(a => a.type === 'company').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <ShieldCheckIcon className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Admins</p>
              <p className="text-2xl font-semibold text-gray-900">
                {pendingApprovals.filter(a => a.type === 'admin').length}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
