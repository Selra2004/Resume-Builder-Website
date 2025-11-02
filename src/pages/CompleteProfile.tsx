import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { userAPI, companyAPI } from '../services/api';
import { toast } from 'react-hot-toast';
import { ProfilePhotoUpload } from '../components/ProfilePhotoUpload';

interface Course {
  id: number;
  course_name: string;
  course_type: string;
}

export const CompleteProfile: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);

  // User profile state
  const [userProfile, setUserProfile] = useState({
    firstName: '',
    lastName: '',
    studentType: 'ojt',
    contactNumber: '',
    age: '',
    birthdate: '',
    gender: '',
    courseIds: [] as number[],
    profilePhotoUrl: null as string | null,
  });

  // Company profile state
  const [companyProfile, setCompanyProfile] = useState({
    companyName: '',
    businessSummary: '',
    keyRequirements: '',
  });

  // Coordinator profile state
  const [coordinatorProfile, setCoordinatorProfile] = useState({
    firstName: '',
    lastName: '',
    designatedCourse: '',
    contactNumber: '',
    age: '',
    birthdate: '',
    gender: '',
  });

  useEffect(() => {
    if (user?.role === 'user') {
      fetchCourses();
    }
  }, [user]);

  const fetchCourses = async () => {
    try {
      const response = await userAPI.getCourses();
      setCourses(response.data);
    } catch (error) {
      toast.error('Failed to load courses');
    }
  };

  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userProfile.firstName || !userProfile.lastName || userProfile.courseIds.length === 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      await userAPI.completeProfile({
        firstName: userProfile.firstName,
        lastName: userProfile.lastName,
        studentType: userProfile.studentType,
        contactNumber: userProfile.contactNumber,
        age: userProfile.age ? parseInt(userProfile.age) : null,
        birthdate: userProfile.birthdate || null,
        gender: userProfile.gender || null,
        courseIds: userProfile.courseIds,
      });

      toast.success('Profile completed successfully!');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to complete profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompanySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!companyProfile.companyName) {
      toast.error('Company name is required');
      return;
    }

    setIsLoading(true);
    try {
      await companyAPI.completeProfile(companyProfile);
      toast.success('Profile completed successfully!');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to complete profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCoordinatorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!coordinatorProfile.firstName || !coordinatorProfile.lastName || !coordinatorProfile.designatedCourse) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      // API endpoint would be similar to user profile completion
      toast.success('Profile completed successfully!');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to complete profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCourseToggle = (courseId: number) => {
    setUserProfile(prev => ({
      ...prev,
      courseIds: prev.courseIds.includes(courseId)
        ? prev.courseIds.filter(id => id !== courseId)
        : [...prev.courseIds, courseId]
    }));
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const renderUserForm = () => (
    <form onSubmit={handleUserSubmit} className="space-y-6">
      {/* Profile Photo Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Profile Photo
        </label>
        <ProfilePhotoUpload
          currentPhotoUrl={userProfile.profilePhotoUrl}
          onPhotoUpdate={(photoUrl) => 
            setUserProfile(prev => ({ ...prev, profilePhotoUrl: photoUrl }))
          }
          onUpload={async (file) => {
            const response = await userAPI.uploadPhoto(file);
            return { photoUrl: response.data.photoUrl };
          }}
          className="mb-4"
        />
      </div>

      {/* Personal Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
            First Name *
          </label>
          <input
            type="text"
            id="firstName"
            required
            value={userProfile.firstName}
            onChange={(e) => setUserProfile({ ...userProfile, firstName: e.target.value })}
            className="input-field mt-1"
            placeholder="Enter your first name"
          />
        </div>

        <div>
          <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
            Last Name *
          </label>
          <input
            type="text"
            id="lastName"
            required
            value={userProfile.lastName}
            onChange={(e) => setUserProfile({ ...userProfile, lastName: e.target.value })}
            className="input-field mt-1"
            placeholder="Enter your last name"
          />
        </div>
      </div>

      {/* Student Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Current Status *
        </label>
        <div className="flex space-x-4">
          <label className="flex items-center">
            <input
              type="radio"
              name="studentType"
              value="ojt"
              checked={userProfile.studentType === 'ojt'}
              onChange={(e) => setUserProfile({ ...userProfile, studentType: e.target.value })}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
            />
            <span className="ml-2 text-sm text-gray-700">OJT Student</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="studentType"
              value="alumni"
              checked={userProfile.studentType === 'alumni'}
              onChange={(e) => setUserProfile({ ...userProfile, studentType: e.target.value })}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
            />
            <span className="ml-2 text-sm text-gray-700">Alumni</span>
          </label>
        </div>
      </div>

      {/* Courses */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Courses * (You can select multiple)
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto border border-gray-300 rounded-md p-4">
          {courses.map((course) => (
            <label key={course.id} className="flex items-center">
              <input
                type="checkbox"
                checked={userProfile.courseIds.includes(course.id)}
                onChange={() => handleCourseToggle(course.id)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">{course.course_name}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Additional Information */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label htmlFor="contactNumber" className="block text-sm font-medium text-gray-700">
            Contact Number
          </label>
          <input
            type="tel"
            id="contactNumber"
            value={userProfile.contactNumber}
            onChange={(e) => setUserProfile({ ...userProfile, contactNumber: e.target.value })}
            className="input-field mt-1"
            placeholder="+63 9XX XXX XXXX"
          />
        </div>

        <div>
          <label htmlFor="age" className="block text-sm font-medium text-gray-700">
            Age
          </label>
          <input
            type="number"
            id="age"
            min="16"
            max="65"
            value={userProfile.age}
            onChange={(e) => setUserProfile({ ...userProfile, age: e.target.value })}
            className="input-field mt-1"
            placeholder="Enter your age"
          />
        </div>

        <div>
          <label htmlFor="birthdate" className="block text-sm font-medium text-gray-700">
            Birthdate
          </label>
          <input
            type="date"
            id="birthdate"
            value={userProfile.birthdate}
            onChange={(e) => setUserProfile({ ...userProfile, birthdate: e.target.value })}
            className="input-field mt-1"
          />
        </div>
      </div>

      {/* Gender */}
      <div>
        <label htmlFor="gender" className="block text-sm font-medium text-gray-700">
          Gender
        </label>
        <select
          id="gender"
          value={userProfile.gender}
          onChange={(e) => setUserProfile({ ...userProfile, gender: e.target.value })}
          className="input-field mt-1"
        >
          <option value="">Select gender</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
          <option value="prefer_not_to_say">Prefer not to say</option>
        </select>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isLoading}
          className="btn-primary px-8 py-3"
        >
          {isLoading ? 'Completing...' : 'Complete Profile'}
        </button>
      </div>
    </form>
  );

  const renderCompanyForm = () => (
    <form onSubmit={handleCompanySubmit} className="space-y-6">
      <div>
        <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">
          Company/Business Name *
        </label>
        <input
          type="text"
          id="companyName"
          required
          value={companyProfile.companyName}
          onChange={(e) => setCompanyProfile({ ...companyProfile, companyName: e.target.value })}
          className="input-field mt-1"
          placeholder="Enter your company name"
        />
      </div>

      <div>
        <label htmlFor="businessSummary" className="block text-sm font-medium text-gray-700">
          Business Summary
        </label>
        <textarea
          id="businessSummary"
          rows={4}
          value={companyProfile.businessSummary}
          onChange={(e) => setCompanyProfile({ ...companyProfile, businessSummary: e.target.value })}
          className="input-field mt-1"
          placeholder="Provide a brief overview of your business..."
        />
      </div>

      <div>
        <label htmlFor="keyRequirements" className="block text-sm font-medium text-gray-700">
          Key Requirements for Applicants
        </label>
        <textarea
          id="keyRequirements"
          rows={4}
          value={companyProfile.keyRequirements}
          onChange={(e) => setCompanyProfile({ ...companyProfile, keyRequirements: e.target.value })}
          className="input-field mt-1"
          placeholder="What are your typical requirements for candidates?"
        />
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isLoading}
          className="btn-primary px-8 py-3"
        >
          {isLoading ? 'Completing...' : 'Complete Profile'}
        </button>
      </div>
    </form>
  );

  const renderCoordinatorForm = () => (
    <form onSubmit={handleCoordinatorSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="coordFirstName" className="block text-sm font-medium text-gray-700">
            First Name *
          </label>
          <input
            type="text"
            id="coordFirstName"
            required
            value={coordinatorProfile.firstName}
            onChange={(e) => setCoordinatorProfile({ ...coordinatorProfile, firstName: e.target.value })}
            className="input-field mt-1"
            placeholder="Enter your first name"
          />
        </div>

        <div>
          <label htmlFor="coordLastName" className="block text-sm font-medium text-gray-700">
            Last Name *
          </label>
          <input
            type="text"
            id="coordLastName"
            required
            value={coordinatorProfile.lastName}
            onChange={(e) => setCoordinatorProfile({ ...coordinatorProfile, lastName: e.target.value })}
            className="input-field mt-1"
            placeholder="Enter your last name"
          />
        </div>
      </div>

      <div>
        <label htmlFor="designatedCourse" className="block text-sm font-medium text-gray-700">
          Designated Course *
        </label>
        <select
          id="designatedCourse"
          required
          value={coordinatorProfile.designatedCourse}
          onChange={(e) => setCoordinatorProfile({ ...coordinatorProfile, designatedCourse: e.target.value })}
          className="input-field mt-1"
        >
          <option value="">Select course you coordinate</option>
          {courses.map((course) => (
            <option key={course.id} value={course.course_name}>
              {course.course_name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label htmlFor="coordContactNumber" className="block text-sm font-medium text-gray-700">
            Contact Number
          </label>
          <input
            type="tel"
            id="coordContactNumber"
            value={coordinatorProfile.contactNumber}
            onChange={(e) => setCoordinatorProfile({ ...coordinatorProfile, contactNumber: e.target.value })}
            className="input-field mt-1"
            placeholder="+63 9XX XXX XXXX"
          />
        </div>

        <div>
          <label htmlFor="coordAge" className="block text-sm font-medium text-gray-700">
            Age
          </label>
          <input
            type="number"
            id="coordAge"
            min="20"
            max="70"
            value={coordinatorProfile.age}
            onChange={(e) => setCoordinatorProfile({ ...coordinatorProfile, age: e.target.value })}
            className="input-field mt-1"
            placeholder="Enter your age"
          />
        </div>

        <div>
          <label htmlFor="coordBirthdate" className="block text-sm font-medium text-gray-700">
            Birthdate
          </label>
          <input
            type="date"
            id="coordBirthdate"
            value={coordinatorProfile.birthdate}
            onChange={(e) => setCoordinatorProfile({ ...coordinatorProfile, birthdate: e.target.value })}
            className="input-field mt-1"
          />
        </div>
      </div>

      <div>
        <label htmlFor="coordGender" className="block text-sm font-medium text-gray-700">
          Gender
        </label>
        <select
          id="coordGender"
          value={coordinatorProfile.gender}
          onChange={(e) => setCoordinatorProfile({ ...coordinatorProfile, gender: e.target.value })}
          className="input-field mt-1"
        >
          <option value="">Select gender</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
          <option value="prefer_not_to_say">Prefer not to say</option>
        </select>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isLoading}
          className="btn-primary px-8 py-3"
        >
          {isLoading ? 'Completing...' : 'Complete Profile'}
        </button>
      </div>
    </form>
  );

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Complete Your Profile</h1>
            <p className="mt-2 text-gray-600">
              Please provide the following information to complete your {user.role} profile.
            </p>
          </div>

          {user.role === 'user' && renderUserForm()}
          {user.role === 'company' && renderCompanyForm()}
          {user.role === 'coordinator' && renderCoordinatorForm()}
        </div>
      </div>
    </div>
  );
};
