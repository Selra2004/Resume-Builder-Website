import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { userAPI } from '../services/api';
import { 
  BriefcaseIcon,
  DocumentTextIcon,
  UserGroupIcon,
  ChartBarIcon,
  StarIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';

interface RecentActivity {
  applications: Array<{
    id: number;
    status: string;
    created_at: string;
    job_title: string;
    display_company: string;
  }>;
  resumes: Array<{
    id: number;
    title: string;
    updated_at: string;
    status: string;
  }>;
}

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    applications: 0,
    resumes: 0,
    matches: 0,
    jobs: 0
  });
  const [userName, setUserName] = useState<string>('');
  const [recentActivity, setRecentActivity] = useState<RecentActivity>({
    applications: [],
    resumes: []
  });
  const [ratingsStats, setRatingsStats] = useState({
    total_ratings: 0,
    average_rating: 0,
    highest_rating: 0,
    lowest_rating: 0,
    company_ratings_count: 0,
    coordinator_ratings_count: 0
  });
  const [recentRatings, setRecentRatings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Redirect coordinators to their own dashboard
  if (user?.role === 'coordinator') {
    window.location.href = '/coordinator/dashboard';
    return null;
  }

  // Redirect companies to their own dashboard
  if (user?.role === 'company') {
    window.location.href = '/company/dashboard';
    return null;
  }

  // Fetch user name for welcome message
  useEffect(() => {
    const fetchUserName = async () => {
      try {
        if (user?.role === 'user') {
          const response = await userAPI.getNavbarInfo();
          const { firstName, lastName } = response.data;
          if (firstName && lastName) {
            setUserName(`${firstName} ${lastName}`);
          } else {
            // Fallback to email prefix if name not available
            setUserName(user?.email.split('@')[0] || '');
          }
        } else {
          // For non-user roles, use email prefix for now
          setUserName(user?.email.split('@')[0] || '');
        }
      } catch (error) {
        console.error('Failed to fetch user name:', error);
        // Fallback to email prefix on error
        setUserName(user?.email.split('@')[0] || '');
      }
    };

    if (user) {
      fetchUserName();
    }
  }, [user]);

  // Fetch real-time dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch stats
        const statsResponse = await userAPI.getDashboardStats();
    setStats({
          applications: statsResponse.data.applications,
          resumes: statsResponse.data.resumes,
          matches: statsResponse.data.matches,
          jobs: statsResponse.data.jobs
        });

        // Fetch recent activity
        const activityResponse = await userAPI.getRecentActivity();
        setRecentActivity(activityResponse.data);

        // Fetch ratings
        const ratingsResponse = await userAPI.getMyRatings();
        setRatingsStats(ratingsResponse.data.statistics);
        setRecentRatings(ratingsResponse.data.ratings.slice(0, 5)); // Show 5 most recent
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user?.role === 'user') {
      fetchDashboardData();
    }
  }, [user]);

  const renderUserDashboard = () => (
    <div className="space-y-8">
      {/* Welcome Message */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">
          Welcome back, {userName || user?.email.split('@')[0]}!
        </h2>
        <p className="text-primary-100">Ready to take the next step in your career journey?</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <BriefcaseIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Applications</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.applications}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <DocumentTextIcon className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Resumes</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.resumes}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ChartBarIcon className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Job Matches</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.matches}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <UserGroupIcon className="h-8 w-8 text-indigo-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Available Jobs</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.jobs}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg shadow p-6 border border-yellow-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <StarSolidIcon className="h-8 w-8 text-yellow-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-700">My Rating</p>
              {ratingsStats.total_ratings > 0 && ratingsStats.average_rating ? (
                <div className="flex items-center space-x-2">
                  <p className="text-2xl font-semibold text-gray-900">
                    {Number(ratingsStats.average_rating || 0).toFixed(1)}
                  </p>
                  <span className="text-sm text-gray-500">/ 5.0</span>
                </div>
              ) : (
                <p className="text-sm text-gray-500">No ratings yet</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link
          to="/resume-builder"
          className="block bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6"
        >
          <div className="flex items-center">
            <DocumentTextIcon className="h-8 w-8 text-primary-600" />
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Build Resume</h3>
              <p className="text-gray-500">Create or update your professional resume</p>
            </div>
          </div>
        </Link>

        <Link
          to="/jobs"
          className="block bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6"
        >
          <div className="flex items-center">
            <BriefcaseIcon className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Browse Jobs</h3>
              <p className="text-gray-500">Explore available job opportunities</p>
            </div>
          </div>
        </Link>

        <Link
          to="/profile"
          className="block bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6"
        >
          <div className="flex items-center">
            <UserGroupIcon className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Update Profile</h3>
              <p className="text-gray-500">Keep your profile information current</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
          {loading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mx-auto"></div>
            </div>
          ) : recentActivity.applications.length === 0 && recentActivity.resumes.length === 0 ? (
            <p className="text-gray-500 text-sm">No recent activity. Start by building your resume or applying to jobs!</p>
          ) : (
          <div className="space-y-3">
              {recentActivity.applications.map((app) => (
                <div key={`app-${app.id}`} className="flex items-center text-sm">
                  <div className={`w-2 h-2 rounded-full mr-3 ${
                    app.status === 'accepted' ? 'bg-green-400' :
                    app.status === 'qualified' ? 'bg-blue-400' :
                    app.status === 'rejected' ? 'bg-red-400' :
                    'bg-yellow-400'
                  }`}></div>
                  <span className="text-gray-600 flex-1">
                    Applied to {app.job_title} at {app.display_company}
                  </span>
                  <span className="ml-auto text-gray-400">
                    {new Date(app.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
              {recentActivity.resumes.map((resume) => (
                <div key={`resume-${resume.id}`} className="flex items-center text-sm">
                  <div className="w-2 h-2 bg-purple-400 rounded-full mr-3"></div>
                  <span className="text-gray-600 flex-1">
                    Updated resume "{resume.title}"
                  </span>
                  <span className="ml-auto text-gray-400">
                    {new Date(resume.updated_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Ratings */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <StarSolidIcon className="h-5 w-5 text-yellow-500 mr-2" />
              My Ratings & Feedback
            </h3>
            <Link
              to="/profile"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              View All
            </Link>
          </div>

          {loading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mx-auto"></div>
            </div>
          ) : ratingsStats.total_ratings === 0 ? (
            <div className="text-center py-8">
              <StarIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No ratings yet. Keep applying to jobs to receive feedback!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Rating Summary */}
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-xs text-gray-600 mb-1">Average Rating</p>
                    <div className="flex items-center justify-center space-x-1">
                      <StarSolidIcon className="h-6 w-6 text-yellow-500" />
                      <span className="text-2xl font-bold text-gray-900">
                        {Number(ratingsStats.average_rating || 0).toFixed(2)}
                      </span>
                      <span className="text-sm text-gray-500">/ 5.0</span>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-600 mb-1">Total Ratings</p>
                    <p className="text-2xl font-bold text-gray-900">{ratingsStats.total_ratings || 0}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {ratingsStats.company_ratings_count || 0} from companies, {ratingsStats.coordinator_ratings_count || 0} from coordinators
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-600 mb-1">Rating Range</p>
                    <div className="flex items-center justify-center space-x-2">
                      <span className="text-lg font-semibold text-green-600">{Number(ratingsStats.highest_rating || 0).toFixed(1)}</span>
                      <span className="text-gray-400">-</span>
                      <span className="text-lg font-semibold text-blue-600">{Number(ratingsStats.lowest_rating || 0).toFixed(1)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Ratings List */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-700">Recent Feedback</h4>
                {recentRatings.map((rating) => (
                  <div key={rating.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        {rating.rater_photo ? (
                          <img
                            src={rating.rater_photo}
                            alt={rating.rater_name}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <UserGroupIcon className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-gray-900">{rating.rater_name}</p>
                          <p className="text-xs text-gray-500">
                            {rating.rated_by_type === 'company' ? 'Company' : 'Coordinator'} • {rating.job_title}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <StarSolidIcon
                            key={star}
                            className={`h-4 w-4 ${star <= Number(rating.rating || 0) ? 'text-yellow-400' : 'text-gray-300'}`}
                          />
                        ))}
                        <span className="ml-1 text-sm font-semibold text-gray-900">{Number(rating.rating || 0).toFixed(1)}</span>
                      </div>
                    </div>
                    {rating.comment && (
                      <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded mt-2">
                        "{rating.comment}"
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-2">
                      {new Date(rating.created_at).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                  </div>
                ))}
            </div>
          </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderAdminDashboard = () => (
    <div className="space-y-8">
      {/* Admin Welcome */}
      <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Admin Dashboard</h2>
        <p className="text-red-100">System administration and management</p>
      </div>

      {/* Admin Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Admin Actions</h3>
        <Link
          to="/admin"
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
        >
          Go to Admin Panel
        </Link>
      </div>
    </div>
  );

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {user.role === 'user' && renderUserDashboard()}
      {user.role === 'admin' && renderAdminDashboard()}
    </div>
  );
};