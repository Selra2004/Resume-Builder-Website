import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { 
  ShieldCheckIcon,
  MagnifyingGlassIcon,
  EnvelopeIcon,
  CalendarIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  XMarkIcon,
  UserIcon,
  PhoneIcon,
  BriefcaseIcon,
  PencilIcon
} from '@heroicons/react/24/outline';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

interface Admin {
  id: number;
  email: string;
  is_approved: boolean;
  created_at: string;
  first_name?: string;
  last_name?: string;
  contact_number?: string;
  age?: number;
  birthdate?: string;
  gender?: string;
  position?: string;
  department?: string;
  profile_photo_url?: string;
  is_profile_complete?: boolean;
  role: string;
}

export const AdminManagement: React.FC = () => {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<Admin | null>(null);
  const [showProfileModal, setShowProfileModal] = useState<Admin | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    contactNumber: '',
    age: '',
    birthdate: '',
    gender: '',
    position: '',
    department: ''
  });
  const { user } = useAuth();

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      const response = await api.get('/admin/admins');
      setAdmins(response.data);
    } catch (error: any) {
      toast.error('Failed to fetch admins');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAdmin = async (admin: Admin) => {
    setDeletingId(admin.id);
    
    try {
      await api.delete(`/admin/admins/${admin.id}`);
      toast.success(`Admin ${admin.email} deleted successfully`);
      
      // Remove from list
      setAdmins(prev => prev.filter(a => a.id !== admin.id));
      setShowDeleteModal(null);
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to delete admin';
      toast.error(message);
    } finally {
      setDeletingId(null);
    }
  };

  const filteredAdmins = admins.filter(admin => {
    const matchesSearch = 
      admin.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (admin.first_name && admin.first_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (admin.last_name && admin.last_name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesSearch;
  });

  const getDisplayName = (admin: Admin) => {
    if (admin.first_name && admin.last_name) {
      return `${admin.first_name} ${admin.last_name}`;
    }
    return admin.email.split('@')[0];
  };

  const isCurrentUser = (admin: Admin) => {
    return user?.id === admin.id;
  };

  const isBootstrapAdmin = (admin: Admin) => {
    return admin.email === 'admin@acc4.com' && admin.first_name === 'System';
  };

  const handleEditProfile = (admin: Admin) => {
    setEditForm({
      firstName: admin.first_name || '',
      lastName: admin.last_name || '',
      contactNumber: admin.contact_number || '',
      age: admin.age?.toString() || '',
      birthdate: admin.birthdate || '',
      gender: admin.gender || '',
      position: admin.position || '',
      department: admin.department || ''
    });
    setIsEditingProfile(true);
  };

  const handleFormChange = (field: string, value: string) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveProfile = async () => {
    if (!showProfileModal || !isCurrentUser(showProfileModal)) {
      toast.error('You can only edit your own profile');
      return;
    }

    try {
      await api.put('/admin/profile', {
        firstName: editForm.firstName,
        lastName: editForm.lastName,
        contactNumber: editForm.contactNumber,
        age: editForm.age ? parseInt(editForm.age) : null,
        birthdate: editForm.birthdate,
        gender: editForm.gender,
        position: editForm.position,
        department: editForm.department
      });

      toast.success('Profile updated successfully');
      
      // Refresh admin list to show updated data
      await fetchAdmins();
      
      // Update the modal data
      const updatedAdmin = admins.find(a => a.id === showProfileModal.id);
      if (updatedAdmin) {
        setShowProfileModal(updatedAdmin);
      }
      
      setIsEditingProfile(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
      console.error('Error updating profile:', error);
    }
  };

  const handleCancelEdit = () => {
    setIsEditingProfile(false);
    // Reset form to original values
    if (showProfileModal) {
      setEditForm({
        firstName: showProfileModal.first_name || '',
        lastName: showProfileModal.last_name || '',
        contactNumber: showProfileModal.contact_number || '',
        age: showProfileModal.age?.toString() || '',
        birthdate: showProfileModal.birthdate || '',
        gender: showProfileModal.gender || '',
        position: showProfileModal.position || '',
        department: showProfileModal.department || ''
      });
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-100 rounded"></div>
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
              <h2 className="text-xl font-semibold text-gray-900">Admin Management</h2>
              <p className="text-sm text-gray-600 mt-1">
                Manage admin accounts and permissions
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <ShieldCheckIcon className="h-5 w-5 text-purple-500" />
              <span className="text-sm font-medium text-gray-900">
                {filteredAdmins.length} admins
              </span>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Search admins by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Admins List */}
        <div className="p-6">
          {filteredAdmins.length === 0 ? (
            <div className="text-center py-12">
              <ShieldCheckIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No admins found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm 
                  ? 'Try adjusting your search criteria.'
                  : 'No admins are registered yet.'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAdmins.map((admin) => (
                <div
                  key={admin.id}
                  className={`flex items-center justify-between p-4 border rounded-lg transition-colors ${
                    isCurrentUser(admin) 
                      ? 'bg-blue-50 border-blue-200' 
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                        isCurrentUser(admin) ? 'bg-blue-100' : 'bg-purple-100'
                      }`}>
                        <ShieldCheckIcon className={`h-6 w-6 ${
                          isCurrentUser(admin) ? 'text-blue-600' : 'text-purple-600'
                        }`} />
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {getDisplayName(admin)}
                        </p>
                        {isCurrentUser(admin) && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            You
                          </span>
                        )}
                        {isBootstrapAdmin(admin) && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Bootstrap
                          </span>
                        )}
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Active
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-4 mt-1">
                        <div className="flex items-center text-sm text-gray-500">
                          <EnvelopeIcon className="h-4 w-4 mr-1" />
                          {admin.email}
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                          <CalendarIcon className="h-4 w-4 mr-1" />
                          {new Date(admin.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex-shrink-0 space-x-2">
                    <button
                      onClick={() => setShowProfileModal(admin)}
                      className="flex items-center px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-100 border border-blue-300 rounded-md hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      <EyeIcon className="h-4 w-4 mr-1" />
                      View Profile
                    </button>
                    {!isCurrentUser(admin) && (
                      <button
                        onClick={() => setShowDeleteModal(admin)}
                        className="flex items-center px-3 py-1.5 text-sm font-medium text-red-700 bg-red-100 border border-red-300 rounded-md hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                      >
                        <TrashIcon className="h-4 w-4 mr-1" />
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bootstrap Admin Info */}
      {admins.some(admin => isBootstrapAdmin(admin)) && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Bootstrap Admin Account Detected
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  The bootstrap admin account is still active. For security purposes, 
                  it's recommended to create personal admin accounts for each administrator 
                  and then delete this bootstrap account.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <ShieldCheckIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Admins</p>
              <p className="text-2xl font-semibold text-gray-900">
                {admins.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Bootstrap Accounts</p>
              <p className="text-2xl font-semibold text-gray-900">
                {admins.filter(admin => isBootstrapAdmin(admin)).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CalendarIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">This Month</p>
              <p className="text-2xl font-semibold text-gray-900">
                {admins.filter(admin => {
                  const adminDate = new Date(admin.created_at);
                  const now = new Date();
                  return adminDate.getMonth() === now.getMonth() && 
                         adminDate.getFullYear() === now.getFullYear();
                }).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Profile View Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-0 border w-full max-w-2xl shadow-lg rounded-lg bg-white">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                {isEditingProfile ? 'Edit Profile' : 'Admin Profile Details'}
              </h3>
              <div className="flex items-center space-x-2">
                {!isEditingProfile && isCurrentUser(showProfileModal) && (
                  <button
                    onClick={() => handleEditProfile(showProfileModal)}
                    className="flex items-center px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-100 border border-blue-300 rounded-md hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    <PencilIcon className="h-4 w-4 mr-1" />
                    Edit Profile
                  </button>
                )}
                <button
                  onClick={() => {
                    setShowProfileModal(null);
                    setIsEditingProfile(false);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Header with photo and basic info */}
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  {showProfileModal.profile_photo_url ? (
                    <img
                      src={showProfileModal.profile_photo_url}
                      alt="Profile"
                      className="h-16 w-16 rounded-full object-cover border-2 border-gray-200"
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-full bg-purple-100 flex items-center justify-center">
                      <UserIcon className="h-8 w-8 text-purple-600" />
                    </div>
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {showProfileModal.first_name && showProfileModal.last_name
                      ? `${showProfileModal.first_name} ${showProfileModal.last_name}`
                      : showProfileModal.email.split('@')[0]
                    }
                  </h2>
                  <p className="text-sm text-gray-500">{showProfileModal.email}</p>
                  <div className="flex items-center mt-1 space-x-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      Administrator
                    </span>
                    {showProfileModal.is_profile_complete ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Profile Complete
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Profile Incomplete
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Personal Information */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">First Name</label>
                    {isEditingProfile ? (
                      <input
                        type="text"
                        value={editForm.firstName}
                        onChange={(e) => handleFormChange('firstName', e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="Enter first name"
                      />
                    ) : (
                      <p className="mt-1 text-sm text-gray-900">{showProfileModal.first_name || 'Not provided'}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Last Name</label>
                    {isEditingProfile ? (
                      <input
                        type="text"
                        value={editForm.lastName}
                        onChange={(e) => handleFormChange('lastName', e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="Enter last name"
                      />
                    ) : (
                      <p className="mt-1 text-sm text-gray-900">{showProfileModal.last_name || 'Not provided'}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Contact Number</label>
                    {isEditingProfile ? (
                      <input
                        type="tel"
                        value={editForm.contactNumber}
                        onChange={(e) => handleFormChange('contactNumber', e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="Enter contact number"
                      />
                    ) : (
                      <p className="mt-1 text-sm text-gray-900 flex items-center">
                        <PhoneIcon className="h-4 w-4 mr-1 text-gray-400" />
                        {showProfileModal.contact_number || 'Not provided'}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Age</label>
                    {isEditingProfile ? (
                      <input
                        type="number"
                        value={editForm.age}
                        onChange={(e) => handleFormChange('age', e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="Enter age"
                        min="18"
                        max="120"
                      />
                    ) : (
                      <p className="mt-1 text-sm text-gray-900">{showProfileModal.age || 'Not provided'}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Birthdate</label>
                    {isEditingProfile ? (
                      <input
                        type="date"
                        value={editForm.birthdate}
                        onChange={(e) => handleFormChange('birthdate', e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    ) : (
                      <p className="mt-1 text-sm text-gray-900">
                        {showProfileModal.birthdate 
                          ? new Date(showProfileModal.birthdate).toLocaleDateString()
                          : 'Not provided'
                        }
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Gender</label>
                    {isEditingProfile ? (
                      <select
                        value={editForm.gender}
                        onChange={(e) => handleFormChange('gender', e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      >
                        <option value="">Select gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    ) : (
                      <p className="mt-1 text-sm text-gray-900 capitalize">{showProfileModal.gender || 'Not provided'}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Professional Information */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Professional Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Position/Title</label>
                    {isEditingProfile ? (
                      <input
                        type="text"
                        value={editForm.position}
                        onChange={(e) => handleFormChange('position', e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="Enter your position/title"
                      />
                    ) : (
                      <p className="mt-1 text-sm text-gray-900 flex items-center">
                        <BriefcaseIcon className="h-4 w-4 mr-1 text-gray-400" />
                        {showProfileModal.position || 'Not provided'}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Department</label>
                    {isEditingProfile ? (
                      <input
                        type="text"
                        value={editForm.department}
                        onChange={(e) => handleFormChange('department', e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="Enter your department"
                      />
                    ) : (
                      <p className="mt-1 text-sm text-gray-900">{showProfileModal.department || 'Not provided'}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Account Information */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Account Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Registration Date</label>
                    <p className="mt-1 text-sm text-gray-900 flex items-center">
                      <CalendarIcon className="h-4 w-4 mr-1 text-gray-400" />
                      {new Date(showProfileModal.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Account Status</label>
                    <p className="mt-1 text-sm text-gray-900">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Active & Approved
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg">
              <div className="flex justify-end space-x-3">
                {isEditingProfile ? (
                  <>
                    <button
                      onClick={handleCancelEdit}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveProfile}
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Save Changes
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setShowProfileModal(null)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Close
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg leading-6 font-medium text-gray-900 mt-4">
                Delete Admin Account
              </h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete the admin account for{' '}
                  <span className="font-medium">{showDeleteModal.email}</span>?
                  This action cannot be undone.
                </p>
                {isBootstrapAdmin(showDeleteModal) && (
                  <p className="text-sm text-yellow-600 mt-2 font-medium">
                    ⚠️ This is the bootstrap admin account.
                  </p>
                )}
              </div>
              <div className="flex gap-3 px-6 py-3">
                <button
                  onClick={() => setShowDeleteModal(null)}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteAdmin(showDeleteModal)}
                  disabled={deletingId === showDeleteModal.id}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deletingId === showDeleteModal.id ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Deleting...
                    </div>
                  ) : (
                    'Delete'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
