import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  UserGroupIcon,
  BuildingOfficeIcon,
  BriefcaseIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { api } from '../../services/api';
import { toast } from 'react-hot-toast';
import { AdminApprovals } from './AdminApprovals';
import { AdminUsers } from './AdminUsers';
import { AdminCompanies } from './AdminCompanies';
import { AdminCoordinators } from './AdminCoordinators';
import { AdminJobs } from './AdminJobs';
import { AdminManagement } from './AdminManagement';

// Note: Coordinators store full URLs directly, no processing needed

const AdminOverview: React.FC = () => {
  const [stats, setStats] = useState({
    pendingApprovals: 0,
    totalUsers: 0,
    totalCompanies: 0,
    totalJobs: 0
  });
  const [recentApprovals, setRecentApprovals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOverviewData();
  }, []);

  const fetchOverviewData = async () => {
    try {
      const [pendingRes, usersRes, companiesRes, jobsRes] = await Promise.all([
        api.get('/admin/pending-approvals'),
        api.get('/admin/users'),
        api.get('/admin/companies'),
        api.get('/admin/jobs')
      ]);

      setStats({
        pendingApprovals: pendingRes.data.length,
        totalUsers: usersRes.data.length,
        totalCompanies: companiesRes.data.filter((c: any) => c.is_approved).length,
        totalJobs: jobsRes.data.filter((j: any) => j.is_active).length
      });

      // Get recent approvals (last 5)
      setRecentApprovals(pendingRes.data.slice(0, 5));
    } catch (error) {
      console.error('Failed to fetch overview data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (id: number, type: string, action: 'approve' | 'reject') => {
    try {
      await api.post(`/admin/${action}/${type}/${id}`);
      toast.success(`${type} ${action}d successfully`); 
      // Refresh data
      fetchOverviewData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || `Failed to ${action} ${type}`);
      console.error(error);
    }
  };

  const canApprove = (approval: any) => {
    if (approval.type === 'admin' || approval.type === 'coordinator') {
      // Handle both boolean true and number 1 from database
      return approval.is_profile_complete === true || approval.is_profile_complete === 1;
    }
    return true; // Companies can be approved without profile completion
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <ClockIcon className="h-8 w-8 text-yellow-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Pending Approvals</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.pendingApprovals}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <UserGroupIcon className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Users</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalUsers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <BuildingOfficeIcon className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Companies</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalCompanies}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <BriefcaseIcon className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active Jobs</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalJobs}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Approvals */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Pending Approvals</h3>
        </div>
        <div className="p-6">
          {recentApprovals.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircleIcon className="mx-auto h-8 w-8 text-gray-400" />
              <p className="mt-2 text-sm text-gray-500">No pending approvals</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentApprovals.map((approval) => {
                // Get display name for the approval
                const getDisplayName = (approval: any) => {
                  if (approval.type === 'company' && approval.profile?.company_name) {
                    return approval.profile.company_name;
                  }
                  if ((approval.type === 'admin' || approval.type === 'coordinator') && approval.first_name && approval.last_name) {
                    return `${approval.first_name} ${approval.last_name}`;
                  }
                  return approval.email;
                };

                // Get subtitle with additional info
                const getSubtitle = (approval: any) => {
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

                return (
                <div key={`${approval.type}-${approval.id}`} 
                     className={`flex items-center justify-between p-4 rounded-lg ${
                       (approval.type === 'admin' || approval.type === 'coordinator') && !approval.is_profile_complete 
                         ? 'bg-orange-50 border border-orange-200' 
                         : 'bg-yellow-50'
                     }`}>
                  <div className="flex items-center space-x-3">
                    {/* Profile Photo Display */}
                    {(approval.type === 'admin' && approval.profile_photo_url) ? (
                      <img 
                        src={approval.profile_photo_url} 
                        alt="Profile" 
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (approval.type === 'coordinator' && approval.profile_photo) ? (
                      <img 
                        src={approval.profile_photo} 
                        alt="Profile" 
                        className="h-8 w-8 rounded-full object-cover"
                        onError={(e) => {
                          console.log('Coordinator photo failed to load:', approval.profile_photo);
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium text-gray-600">
                          {approval.type === 'coordinator' ? 'C' : approval.type === 'admin' ? 'A' : 'CO'}
                        </span>
                      </div>
                    )}
                    <div>
                      <div className="flex items-center space-x-2">
                        <p className="font-medium text-gray-900">
                          {getDisplayName(approval)}
                        </p>
                        {(approval.type === 'admin' || approval.type === 'coordinator') && !approval.is_profile_complete && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                            Incomplete
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        {getSubtitle(approval)}
                      </p>
                      {(approval.type === 'admin' || approval.type === 'coordinator') && !approval.is_profile_complete && (
                        <p className="text-xs text-orange-600 mt-1">
                          ⚠️ Profile completion required
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => handleApproval(approval.id, approval.type, 'approve')}
                      disabled={!canApprove(approval)}
                      className="flex items-center px-3 py-1 text-sm font-medium text-green-700 bg-green-100 rounded-md hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      title={!canApprove(approval) ? 'Profile must be completed before approval' : 'Approve user'}
                    >
                      <CheckCircleIcon className="h-4 w-4 mr-1" />
                      Approve
                    </button>
                    <button 
                      onClick={() => handleApproval(approval.id, approval.type, 'reject')}
                      className="flex items-center px-3 py-1 text-sm font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200"
                    >
                      <XCircleIcon className="h-4 w-4 mr-1" />
                      Reject
                    </button>
                  </div>
                </div>
                );
              })}
            </div>
          )}
          
          <div className="mt-4">
            <Link
              to="/admin/approvals"
              className="text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              View all pending approvals →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export const AdminDashboard: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [profileCheckComplete, setProfileCheckComplete] = useState(false);

  // Check if admin profile is complete on dashboard access
  useEffect(() => {
    const checkProfileCompletion = async () => {
      try {
        const response = await api.get('/admin/profile');
        const profileData = response.data;
        
        // Handle both boolean and number values from database
        const isComplete = profileData.is_profile_complete === true || profileData.is_profile_complete === 1;
        
        if (!isComplete) {
          toast.error('Please complete your admin profile to access the dashboard');
          navigate('/admin/complete-profile');
          return;
        }
        
        setProfileCheckComplete(true);
      } catch (error) {
        console.error('Failed to check profile status:', error);
        toast.error('Please complete your admin profile to access the dashboard');
        navigate('/admin/complete-profile');
      }
    };

    checkProfileCompletion();
  }, [navigate]);

  // Don't render dashboard content until profile check is complete
  if (!profileCheckComplete) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking your profile status...</p>
        </div>
      </div>
    );
  }

  const navigation = [
    { name: 'Overview', href: '/admin', current: location.pathname === '/admin' },
    { name: 'Approvals', href: '/admin/approvals', current: location.pathname === '/admin/approvals' },
    { name: 'Users', href: '/admin/users', current: location.pathname === '/admin/users' },
    { name: 'Coordinators', href: '/admin/coordinators', current: location.pathname === '/admin/coordinators' },
    { name: 'Companies', href: '/admin/companies', current: location.pathname === '/admin/companies' },
    { name: 'Jobs', href: '/admin/jobs', current: location.pathname === '/admin/jobs' },
    { name: 'Admin Management', href: '/admin/management', current: location.pathname === '/admin/management' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <Link
              to="/"
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              ← Back to Site
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex">
          {/* Sidebar */}
          <div className="w-64 flex-shrink-0 mr-8">
            <nav className="space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`
                    group flex items-center px-2 py-2 text-sm font-medium rounded-md
                    ${item.current
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }
                  `}
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <Routes>
              <Route index element={<AdminOverview />} />
              <Route path="approvals" element={<AdminApprovals />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="coordinators" element={<AdminCoordinators />} />
              <Route path="companies" element={<AdminCompanies />} />
              <Route path="jobs" element={<AdminJobs />} />
              <Route path="management" element={<AdminManagement />} />
            </Routes>
          </div>
        </div>
      </div>
    </div>
  );
};
