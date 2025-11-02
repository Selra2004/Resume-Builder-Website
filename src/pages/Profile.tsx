import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { userAPI } from '../services/api';
import { toast } from 'react-hot-toast';
import { ProfilePhotoUpload } from '../components/ProfilePhotoUpload';
import { EmploymentHistory } from '../components/EmploymentHistory';
import { 
  UserCircleIcon, 
  PencilIcon, 
  EnvelopeIcon,
  PhoneIcon,
  CalendarIcon,
  AcademicCapIcon,
  XMarkIcon,
  CheckIcon,
  StarIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';

interface ProfileData {
  id: number;
  email: string;
  role: string;
  first_name: string;
  last_name: string;
  student_type?: string;
  contact_number: string;
  age: number;
  birthdate: string;
  gender: string;
  profile_photo: string | null;
  profile_photo_url: string | null;
  profile_completed: boolean;
  courses: Array<{ id: number; course_name: string }>;
}

export const Profile: React.FC = () => {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    studentType: 'ojt',
    contactNumber: '',
    age: '',
    birthdate: '',
    gender: '',
    courseIds: [] as number[],
  });
  const [courses, setCourses] = useState<Array<{ id: number; course_name: string; course_type: string }>>([]);
  const [allRatings, setAllRatings] = useState<any[]>([]);
  const [ratingsStats, setRatingsStats] = useState({
    total_ratings: 0,
    average_rating: 0,
    highest_rating: 0,
    lowest_rating: 0,
    company_ratings_count: 0,
    coordinator_ratings_count: 0
  });

  useEffect(() => {
    if (user?.role === 'user') {
      fetchProfile();
      fetchCourses();
      fetchRatings();
    } else {
      // Non-user roles (admin, coordinator, company) don't use this profile page
      setIsLoading(false);
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const response = await userAPI.getProfile();
      setProfileData(response.data);
      
      // Initialize edit form with current data
      const data = response.data;
      setEditForm({
        firstName: data.first_name || '',
        lastName: data.last_name || '',
        studentType: data.student_type || 'ojt',
        contactNumber: data.contact_number || '',
        age: data.age?.toString() || '',
        birthdate: data.birthdate || '',
        gender: data.gender || '',
        courseIds: data.courses?.map((c: any) => c.id) || [],
      });
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const response = await userAPI.getCourses();
      setCourses(response.data);
    } catch (error) {
      console.error('Failed to fetch courses:', error);
    }
  };

  const fetchRatings = async () => {
    try {
      const response = await userAPI.getMyRatings();
      setAllRatings(response.data.ratings);
      setRatingsStats(response.data.statistics);
    } catch (error) {
      console.error('Failed to fetch ratings:', error);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reset form to current profile data
    if (profileData) {
      setEditForm({
        firstName: profileData.first_name || '',
        lastName: profileData.last_name || '',
        studentType: profileData.student_type || 'ojt',
        contactNumber: profileData.contact_number || '',
        age: profileData.age?.toString() || '',
        birthdate: profileData.birthdate || '',
        gender: profileData.gender || '',
        courseIds: profileData.courses?.map((c: any) => c.id) || [],
      });
    }
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      await userAPI.updateProfile({
        firstName: editForm.firstName,
        lastName: editForm.lastName,
        studentType: editForm.studentType,
        contactNumber: editForm.contactNumber,
        age: editForm.age ? parseInt(editForm.age) : null,
        birthdate: editForm.birthdate,
        gender: editForm.gender,
        courseIds: editForm.courseIds,
      });
      
      toast.success('Profile updated successfully!');
      setIsEditing(false);
      await fetchProfile(); // Refresh data
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCourseToggle = (courseId: number) => {
    setEditForm(prev => ({
      ...prev,
      courseIds: prev.courseIds.includes(courseId)
        ? prev.courseIds.filter(id => id !== courseId)
        : [...prev.courseIds, courseId]
    }));
  };

  const handlePhotoUpdate = (photoUrl: string) => {
    if (profileData) {
      setProfileData({
        ...profileData,
        profile_photo_url: photoUrl
      });
    }
  };

  if (isLoading && !profileData) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Handle admin users - redirect them to admin dashboard
  if (user?.role === 'admin') {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserCircleIcon className="h-8 w-8 text-purple-600" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Admin Profile</h2>
          <p className="text-gray-600 mb-6">
            As an administrator, your profile settings are managed through the admin dashboard.
          </p>
          <div className="space-y-3">
            <a 
              href="/admin" 
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              Go to Admin Dashboard
            </a>
            <p className="text-sm text-gray-500">
              Manage your admin profile, approve users, and oversee the platform from the admin dashboard.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Handle coordinator users - redirect them to coordinator profile
  if (user?.role === 'coordinator') {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AcademicCapIcon className="h-8 w-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Coordinator Profile</h2>
          <p className="text-gray-600 mb-6">
            Manage your coordinator profile and course information.
          </p>
          <div className="space-y-3">
            <a 
              href="/coordinator/profile" 
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Go to Coordinator Profile
            </a>
            <p className="text-sm text-gray-500">
              View and edit your personal information, contact details, and designated course.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No profile data available</p>
      </div>
    );
  }

  const renderUserProfile = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {profileData.profile_photo_url ? (
              <img
                src={profileData.profile_photo_url}
                alt="Profile"
                className="w-16 h-16 rounded-full object-cover border-2 border-white border-opacity-30"
              />
            ) : (
              <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <UserCircleIcon className="h-10 w-10" />
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold">
                {profileData.first_name && profileData.last_name 
                  ? `${profileData.first_name} ${profileData.last_name}`
                  : 'Complete Your Profile'
                }
              </h1>
              <p className="text-primary-100 capitalize">
                {profileData.student_type || 'Student'}
              </p>
            </div>
          </div>
          <div className="flex space-x-2">
            {isEditing ? (
              <>
                <button 
                  onClick={handleCancel}
                  className="flex items-center space-x-2 bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-lg transition-colors"
                >
                  <XMarkIcon className="h-4 w-4" />
                  <span>Cancel</span>
                </button>
                <button 
                  onClick={handleSave}
                  disabled={isLoading}
                  className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                >
                  <CheckIcon className="h-4 w-4" />
                  <span>{isLoading ? 'Saving...' : 'Save'}</span>
                </button>
              </>
            ) : (
              <button 
                onClick={handleEdit}
                className="flex items-center space-x-2 bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-lg transition-colors"
              >
                <PencilIcon className="h-4 w-4" />
                <span>Edit Profile</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Profile Photo Section */}
      {isEditing && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Profile Photo</h2>
          <ProfilePhotoUpload
            currentPhotoUrl={profileData.profile_photo_url}
            onPhotoUpdate={handlePhotoUpdate}
            onUpload={async (file) => {
              const response = await userAPI.uploadPhoto(file);
              return { photoUrl: response.data.photoUrl };
            }}
          />
        </div>
      )}

      {/* Personal Information */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Personal Information</h2>
        {isEditing ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name *
                </label>
                <input
                  type="text"
                  value={editForm.firstName}
                  onChange={(e) => setEditForm(prev => ({ ...prev, firstName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name *
                </label>
                <input
                  type="text"
                  value={editForm.lastName}
                  onChange={(e) => setEditForm(prev => ({ ...prev, lastName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Number
                </label>
                <input
                  type="tel"
                  value={editForm.contactNumber}
                  onChange={(e) => setEditForm(prev => ({ ...prev, contactNumber: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Age
                </label>
                <input
                  type="number"
                  min="16"
                  max="100"
                  value={editForm.age}
                  onChange={(e) => setEditForm(prev => ({ ...prev, age: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Birthdate
                </label>
                <input
                  type="date"
                  value={editForm.birthdate}
                  onChange={(e) => setEditForm(prev => ({ ...prev, birthdate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gender
                </label>
                <select
                  value={editForm.gender}
                  onChange={(e) => setEditForm(prev => ({ ...prev, gender: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer_not_to_say">Prefer not to say</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Student Type *
                </label>
                <select
                  value={editForm.studentType}
                  onChange={(e) => setEditForm(prev => ({ ...prev, studentType: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="ojt">OJT Student</option>
                  <option value="alumni">Alumni</option>
                </select>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center space-x-3">
              <EnvelopeIcon className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium">{profileData.email}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <PhoneIcon className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Contact Number</p>
                <p className="font-medium">{profileData.contact_number || 'Not provided'}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <CalendarIcon className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Age</p>
                <p className="font-medium">{profileData.age || 'Not provided'}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <UserCircleIcon className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Gender</p>
                <p className="font-medium capitalize">{profileData.gender?.replace('_', ' ') || 'Not provided'}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Academic Information */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Academic Information</h2>
        {isEditing ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Courses * (Select multiple courses)
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto border border-gray-300 rounded-md p-4">
              {courses.map((course) => (
                <label key={course.id} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={editForm.courseIds.includes(course.id)}
                    onChange={() => handleCourseToggle(course.id)}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">{course.course_name}</span>
                </label>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex items-center space-x-3">
            <AcademicCapIcon className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">Courses</p>
              <div className="flex flex-wrap gap-2 mt-1">
                {profileData.courses && profileData.courses.length > 0 ? (
                  profileData.courses.map((course) => (
                    <span key={course.id} className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm">
                      {course.course_name}
                    </span>
                  ))
                ) : (
                  <span className="text-gray-500 text-sm">No courses selected</span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* My Ratings & Feedback */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
          <StarSolidIcon className="h-6 w-6 text-yellow-500 mr-2" />
          My Ratings & Feedback
        </h2>

        {ratingsStats.total_ratings === 0 ? (
          <div className="text-center py-12">
            <StarIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">No Ratings Yet</h3>
            <p className="text-gray-500 text-sm">
              Keep applying to jobs to receive feedback from companies and coordinators!
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Rating Summary */}
            <div className="bg-gradient-to-r from-yellow-50 via-orange-50 to-yellow-50 border-2 border-yellow-300 rounded-xl p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-2">Average Rating</p>
                  <div className="flex items-center justify-center space-x-2">
                    <StarSolidIcon className="h-8 w-8 text-yellow-500" />
                    <span className="text-3xl font-bold text-gray-900">
                      {Number(ratingsStats.average_rating || 0).toFixed(2)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">out of 5.0</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-2">Total Ratings</p>
                  <p className="text-3xl font-bold text-gray-900">{ratingsStats.total_ratings || 0}</p>
                  <p className="text-xs text-gray-500 mt-1">from all reviewers</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-2">Best Rating</p>
                  <div className="flex items-center justify-center space-x-1">
                    <StarSolidIcon className="h-6 w-6 text-green-500" />
                    <span className="text-2xl font-bold text-green-600">
                      {Number(ratingsStats.highest_rating || 0).toFixed(1)}
                    </span>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-2">Ratings From</p>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div className="bg-white rounded-lg p-2">
                      <p className="text-xs text-gray-500">Companies</p>
                      <p className="text-lg font-bold text-purple-600">{ratingsStats.company_ratings_count}</p>
                    </div>
                    <div className="bg-white rounded-lg p-2">
                      <p className="text-xs text-gray-500">Coordinators</p>
                      <p className="text-lg font-bold text-blue-600">{ratingsStats.coordinator_ratings_count}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* All Ratings List */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">All Feedback ({allRatings.length})</h3>
              <div className="space-y-4">
                {allRatings.map((rating) => (
                  <div key={rating.id} className="border-2 border-gray-200 rounded-lg p-5 hover:border-blue-300 hover:shadow-md transition-all">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-4">
                        {rating.rater_photo ? (
                          <img
                            src={rating.rater_photo}
                            alt={rating.rater_name}
                            className="h-12 w-12 rounded-full object-cover border-2 border-gray-200"
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                            <UserGroupIcon className="h-7 w-7 text-gray-500" />
                          </div>
                        )}
                        <div>
                          <p className="text-base font-semibold text-gray-900">{rating.rater_name}</p>
                          <p className="text-sm text-gray-600">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              rating.rated_by_type === 'company' 
                                ? 'bg-purple-100 text-purple-800' 
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {rating.rated_by_type === 'company' ? 'Company' : 'Coordinator'}
                            </span>
                            <span className="mx-2">•</span>
                            {rating.job_title}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <div className="flex items-center space-x-1 mb-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <StarSolidIcon
                              key={star}
                              className={`h-5 w-5 ${star <= Number(rating.rating || 0) ? 'text-yellow-400' : 'text-gray-300'}`}
                            />
                          ))}
                        </div>
                        <span className="text-lg font-bold text-gray-900">{Number(rating.rating || 0).toFixed(1)} / 5.0</span>
                      </div>
                    </div>
                    
                    {rating.comment && (
                      <div className="mt-3 bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <p className="text-sm font-medium text-gray-700 mb-1">Feedback:</p>
                        <p className="text-sm text-gray-800 italic">"{rating.comment}"</p>
                      </div>
                    )}
                    
                    <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                      <span>
                        <CalendarIcon className="h-4 w-4 inline mr-1" />
                        Received on {new Date(rating.created_at).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Employment History */}
      <EmploymentHistory />
    </div>
  );

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (user?.role !== 'user') {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
        <p className="text-gray-500">Profile page is currently only available for users (students).</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {renderUserProfile()}
    </div>
  );
};
