import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { RatingDisplay } from '../components/RatingDisplay';
import { ProfileRating } from '../components/ProfileRating';
import { 
  UserCircleIcon, 
  UserIcon,
  AcademicCapIcon, 
  BuildingOfficeIcon,
  UsersIcon,
  BookOpenIcon,
  StarIcon,
  XMarkIcon,
  EyeIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  EnvelopeIcon,
  PhoneIcon
} from '@heroicons/react/24/outline';

interface Coordinator {
  id: number;
  first_name: string;
  last_name: string;
  designated_course: string;
  profile_photo?: string;
  average_rating?: number;
  rating_count?: number;
  contact_number?: string;
  email?: string;
}

interface CompanyPartner {
  id: number;
  company_name: string;
  profile_type: 'company' | 'business_owner';
  first_name?: string;
  last_name?: string;
  business_summary?: string;
  profile_photo?: string;
  average_rating?: number;
  rating_count?: number;
}

export const Companies: React.FC = () => {
  const { user } = useAuth();
  const [coordinators, setCoordinators] = useState<Coordinator[]>([]);
  const [companies, setCompanies] = useState<CompanyPartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [companiesLoading, setCompaniesLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [companiesError, setCompaniesError] = useState<string | null>(null);
  
  // Modal state
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState<{
    id: number;
    name: string;
    type: 'coordinator' | 'company';
    averageRating?: number;
    ratingCount?: number;
  } | null>(null);
  
  // New modal states
  const [showLearnMoreModal, setShowLearnMoreModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [expandedCoordinator, setExpandedCoordinator] = useState<number | null>(null);

  useEffect(() => {
    // Only fetch on initial mount
    fetchCoordinators();
    fetchCompanies();
  }, []); // Empty dependency array - only run on mount

  const fetchCoordinators = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users/coordinators/approved');
      setCoordinators(response.data);
      setError(null); // Clear any previous errors
    } catch (err: any) {
      setError('Failed to load coordinators');
      console.error('Error fetching coordinators:', err);
      toast.error('Failed to load coordinators');
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanies = async () => {
    try {
      setCompaniesLoading(true);
      const response = await api.get('/users/companies/approved');
      setCompanies(response.data);
      setCompaniesError(null); // Clear any previous errors
    } catch (err: any) {
      setCompaniesError('Failed to load business partners');
      console.error('Error fetching companies:', err);
      toast.error('Failed to load business partners');
    } finally {
      setCompaniesLoading(false);
    }
  };

  const openRatingModal = (entity: {
    id: number;
    name: string;
    type: 'coordinator' | 'company';
    averageRating?: number;
    ratingCount?: number;
  }) => {
    setSelectedEntity(entity);
    setShowRatingModal(true);
  };

  const closeRatingModal = () => {
    setShowRatingModal(false);
    setSelectedEntity(null);
  };

  const toggleCoordinatorExpansion = (coordinatorId: number) => {
    setExpandedCoordinator(expandedCoordinator === coordinatorId ? null : coordinatorId);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Our Team</h1>
        <p className="mt-2 text-gray-600">
          Meet our coordinators and business partners who make OJT placements possible.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
          <AcademicCapIcon className="h-8 w-8 text-blue-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">{coordinators.length}</div>
          <div className="text-sm text-gray-600">Active Coordinators</div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
          <BuildingOfficeIcon className="h-8 w-8 text-green-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">{companies.length}</div>
          <div className="text-sm text-gray-600">Business Partners</div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
          <UsersIcon className="h-8 w-8 text-purple-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">500+</div>
          <div className="text-sm text-gray-600">Students Placed</div>
        </div>
      </div>

      {/* Coordinators Section */}
      <div className="mb-16">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <AcademicCapIcon className="h-6 w-6 mr-2 text-blue-600" />
            Course Coordinators
          </h2>
          <p className="mt-2 text-gray-600">
            Our dedicated coordinators who guide students through their OJT journey and connect them with opportunities.
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="animate-pulse">
                  <div className="w-20 h-20 bg-gray-200 rounded-full mx-auto mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-full mx-auto"></div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12 bg-red-50 rounded-lg border border-red-200">
            <div className="text-red-600">
              <AcademicCapIcon className="h-12 w-12 mx-auto mb-4" />
              <p className="text-lg font-medium">{error}</p>
              <button 
                onClick={fetchCoordinators}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                Try Again
              </button>
            </div>
          </div>
        ) : coordinators.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
            <AcademicCapIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Coordinators Available</h3>
            <p className="text-gray-600">
              There are currently no active coordinators to display.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {coordinators.map((coordinator) => (
              <div key={coordinator.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                {/* Profile Photo */}
                <div className="text-center mb-4">
                  {coordinator.profile_photo ? (
                    <img
                      src={coordinator.profile_photo}
                      alt={`${coordinator.first_name} ${coordinator.last_name}`}
                      className="w-20 h-20 rounded-full object-cover mx-auto ring-2 ring-blue-100"
                      onError={(e) => {
                        // Hide the image and show fallback icon if image fails to load
                        e.currentTarget.style.display = 'none';
                        const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                        if (fallback) fallback.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div 
                    className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center mx-auto"
                    style={{ display: coordinator.profile_photo ? 'none' : 'flex' }}
                  >
                    <UserCircleIcon className="h-12 w-12 text-blue-600" />
                  </div>
                </div>

                {/* Name */}
                <div className="text-center mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {coordinator.first_name} {coordinator.last_name}
                  </h3>
                </div>

                {/* Designated Course */}
                <div className="text-center mb-4">
                  <div className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-50 text-blue-700 border border-blue-200">
                    <BookOpenIcon className="h-4 w-4 mr-1.5" />
                    <span className="font-medium">{coordinator.designated_course}</span>
                  </div>
                </div>

                {/* Rating Display */}
                <div className="mb-4">
                  <div className="flex items-center justify-between">
                    <RatingDisplay
                      entityId={coordinator.id}
                      entityType="coordinator"
                      averageRating={coordinator.average_rating}
                      totalCount={coordinator.rating_count}
                      showDetails={false}
                    />
                    {coordinator.average_rating && coordinator.average_rating > 0 && (
                      <button
                        onClick={() => openRatingModal({
                          id: coordinator.id,
                          name: `${coordinator.first_name} ${coordinator.last_name}`,
                          type: 'coordinator',
                          averageRating: coordinator.average_rating,
                          ratingCount: coordinator.rating_count
                        })}
                        className="ml-2 p-1 text-gray-500 hover:text-blue-600 transition-colors"
                        title="View detailed ratings"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Rating Input for Users */}
                {user?.role === 'user' && (
                  <div className="border-t border-gray-200 pt-4">
                    <ProfileRating
                      profileId={coordinator.id}
                      profileType="coordinator"
                      profileName={`${coordinator.first_name} ${coordinator.last_name}`}
                      context="team_page"
                      readOnly={false}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Business Partners Section */}
      <div className="mb-12">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <BuildingOfficeIcon className="h-6 w-6 mr-2 text-green-600" />
            Business Partners
          </h2>
          <p className="mt-2 text-gray-600">
            Companies and organizations that provide valuable OJT opportunities for our students.
          </p>
        </div>

        {companiesLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="animate-pulse">
                  <div className="w-20 h-20 bg-gray-200 rounded-full mx-auto mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-full mx-auto"></div>
                </div>
              </div>
            ))}
          </div>
        ) : companiesError ? (
          <div className="text-center py-12 bg-red-50 rounded-lg border border-red-200">
            <div className="text-red-600">
              <BuildingOfficeIcon className="h-12 w-12 mx-auto mb-4" />
              <p className="text-lg font-medium">{companiesError}</p>
              <button 
                onClick={fetchCompanies}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                Try Again
              </button>
            </div>
          </div>
        ) : companies.length === 0 ? (
          <div className="bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
            <BuildingOfficeIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">No Business Partners Yet</h3>
            <p className="text-gray-600">
              There are currently no registered business partners to display.
              <br />
              Check back soon to see companies offering OJT opportunities.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {companies.map((company) => (
              <div key={company.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                {/* Profile Photo/Logo */}
                <div className="text-center mb-4">
                  {company.profile_photo ? (
                    <img
                      src={company.profile_photo}
                      alt={company.company_name}
                      className="w-20 h-20 rounded-full object-cover mx-auto ring-2 ring-green-100"
                      onError={(e) => {
                        // Hide the image and show fallback icon if image fails to load
                        e.currentTarget.style.display = 'none';
                        const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                        if (fallback) fallback.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div 
                    className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto"
                    style={{ display: company.profile_photo ? 'none' : 'flex' }}
                  >
                    {company.profile_type === 'business_owner' ? (
                      <UserCircleIcon className="h-12 w-12 text-green-600" />
                    ) : (
                      <BuildingOfficeIcon className="h-12 w-12 text-green-600" />
                    )}
                  </div>
                </div>

                {/* Company Name */}
                <div className="text-center mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {company.company_name}
                  </h3>
                  {company.profile_type === 'business_owner' && company.first_name && company.last_name && (
                    <p className="text-sm text-gray-600 mt-1">
                      {company.first_name} {company.last_name}
                    </p>
                  )}
                </div>

                {/* Business Description */}
                {company.business_summary && (
                  <div className="text-center mb-3">
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {company.business_summary}
                    </p>
                  </div>
                )}

                {/* Profile Type Badge */}
                <div className="text-center mb-4">
                  <div className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-50 text-green-700 border border-green-200">
                    {company.profile_type === 'business_owner' ? (
                      <>
                        <UserIcon className="h-4 w-4 mr-1.5" />
                        <span className="font-medium">Business Owner</span>
                      </>
                    ) : (
                      <>
                        <BuildingOfficeIcon className="h-4 w-4 mr-1.5" />
                        <span className="font-medium">Company</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Rating Display */}
                <div className="mb-4">
                  <div className="flex items-center justify-between">
                    <RatingDisplay
                      entityId={company.id}
                      entityType="company"
                      averageRating={company.average_rating}
                      totalCount={company.rating_count}
                      showDetails={false}
                    />
                    {company.average_rating && company.average_rating > 0 && (
                      <button
                        onClick={() => openRatingModal({
                          id: company.id,
                          name: company.company_name,
                          type: 'company',
                          averageRating: company.average_rating,
                          ratingCount: company.rating_count
                        })}
                        className="ml-2 p-1 text-gray-500 hover:text-green-600 transition-colors"
                        title="View detailed ratings"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Rating Input for Users */}
                {user?.role === 'user' && (
                  <div className="border-t border-gray-200 pt-4">
                    <ProfileRating
                      profileId={company.id}
                      profileType="company"
                      profileName={company.company_name}
                      context="team_page"
                      readOnly={false}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-8 text-center text-white">
        <h2 className="text-2xl font-bold mb-4">Join Our Network</h2>
        <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
          Whether you're a student looking for guidance or a company seeking talented interns, 
          our coordinators are here to help make the perfect match.
        </p>
        <div className="space-x-4">
          <button 
            onClick={() => setShowContactModal(true)}
            className="bg-white text-blue-600 px-6 py-3 rounded-lg font-medium hover:bg-blue-50 transition-colors"
          >
            Contact a Coordinator
          </button>
          <button 
            onClick={() => setShowLearnMoreModal(true)}
            className="border-2 border-white text-white px-6 py-3 rounded-lg font-medium hover:bg-white hover:text-blue-600 transition-colors"
          >
            Learn More
          </button>
        </div>
      </div>

      {/* Rating Details Modal */}
      {showRatingModal && selectedEntity && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-lg">
              <div className="flex items-center space-x-3">
                {selectedEntity.type === 'coordinator' ? (
                  <AcademicCapIcon className="h-6 w-6 text-blue-600" />
                ) : (
                  <BuildingOfficeIcon className="h-6 w-6 text-green-600" />
                )}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {selectedEntity.name} - Ratings Overview
                  </h3>
                  <p className="text-sm text-gray-600">
                    {selectedEntity.type === 'coordinator' ? 'Course Coordinator' : 'Business Partner'}
                  </p>
                </div>
              </div>
              <button
                onClick={closeRatingModal}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <XMarkIcon className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <RatingDisplay
                entityId={selectedEntity.id}
                entityType={selectedEntity.type}
                averageRating={selectedEntity.averageRating}
                totalCount={selectedEntity.ratingCount}
                showDetails={true}
              />
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 rounded-b-lg">
              <div className="flex justify-end">
                <button
                  onClick={closeRatingModal}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Learn More Modal */}
      {showLearnMoreModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-lg">
              <div className="flex items-center space-x-3">
                <UsersIcon className="h-6 w-6 text-blue-600" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">About Our Team</h3>
                  <p className="text-sm text-gray-600">Who we are and how we help</p>
                </div>
              </div>
              <button
                onClick={() => setShowLearnMoreModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <XMarkIcon className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Who Section */}
              <div className="bg-blue-50 rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <AcademicCapIcon className="h-6 w-6 text-blue-600 mr-2" />
                  <h4 className="text-xl font-semibold text-gray-900">Who We Are</h4>
                </div>
                <p className="text-gray-700 leading-relaxed">
                  Our team consists of dedicated <strong>Course Coordinators</strong> from various academic programs 
                  and trusted <strong>Business Partners</strong> including companies and business owners. 
                  The coordinators are experienced faculty members who specialize in connecting students 
                  with real-world opportunities in their respective fields.
                </p>
              </div>

              {/* What Section */}
              <div className="bg-green-50 rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <BuildingOfficeIcon className="h-6 w-6 text-green-600 mr-2" />
                  <h4 className="text-xl font-semibold text-gray-900">What We Do</h4>
                </div>
                <div className="space-y-3 text-gray-700">
                  <p><strong>Course Coordinators:</strong></p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Guide students through their OJT journey</li>
                    <li>Match students with suitable internship opportunities</li>
                    <li>Provide mentorship and career guidance</li>
                    <li>Oversee academic requirements and assessments</li>
                    <li>Post job opportunities for their own businesses and ventures</li>
                  </ul>
                  <p><strong>Business Partners:</strong></p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Offer valuable internship and job opportunities</li>
                    <li>Provide real-world work experience</li>
                    <li>Contribute to student skill development</li>
                    <li>Bridge the gap between academia and industry</li>
                  </ul>
                </div>
              </div>

              {/* How Section */}
              <div className="bg-purple-50 rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <StarIcon className="h-6 w-6 text-purple-600 mr-2" />
                  <h4 className="text-xl font-semibold text-gray-900">How We Help</h4>
                </div>
                <div className="grid md:grid-cols-2 gap-4 text-gray-700">
                  <div>
                    <h5 className="font-semibold mb-2">For Students:</h5>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>Personalized career guidance</li>
                      <li>Industry connections and networking</li>
                      <li>Skill assessment and development</li>
                      <li>Job placement assistance</li>
                      <li>Professional development support</li>
                    </ul>
                  </div>
                  <div>
                    <h5 className="font-semibold mb-2">For Companies:</h5>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>Access to talented students</li>
                      <li>Streamlined recruitment process</li>
                      <li>Academic partnership opportunities</li>
                      <li>Fresh perspectives and innovation</li>
                      <li>Future talent pipeline development</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Statistics */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h4 className="text-xl font-semibold text-gray-900 mb-4">Our Impact</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{coordinators.length}</div>
                    <div className="text-sm text-gray-600">Active Coordinators</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{companies.length}</div>
                    <div className="text-sm text-gray-600">Business Partners</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">500+</div>
                    <div className="text-sm text-gray-600">Students Placed</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 rounded-b-lg">
              <div className="flex justify-end">
                <button
                  onClick={() => setShowLearnMoreModal(false)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Got it!
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Contact Coordinator Modal */}
      {showContactModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-lg">
              <div className="flex items-center space-x-3">
                <AcademicCapIcon className="h-6 w-6 text-blue-600" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Contact Our Coordinators</h3>
                  <p className="text-sm text-gray-600">Reach out to our course coordinators for guidance</p>
                </div>
              </div>
              <button
                onClick={() => setShowContactModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <XMarkIcon className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {coordinators.length === 0 ? (
                <div className="text-center py-8">
                  <AcademicCapIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No coordinators available at this time.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {coordinators.map((coordinator) => (
                    <div key={coordinator.id} className="border border-gray-200 rounded-lg overflow-hidden">
                      {/* Coordinator Header */}
                      <div 
                        className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors"
                        onClick={() => toggleCoordinatorExpansion(coordinator.id)}
                      >
                        <div className="flex items-center space-x-4">
                          {/* Profile Photo */}
                          <div className="flex-shrink-0">
                            {coordinator.profile_photo ? (
                              <img
                                src={coordinator.profile_photo}
                                alt={`${coordinator.first_name} ${coordinator.last_name}`}
                                className="w-12 h-12 rounded-full object-cover ring-2 ring-blue-100"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                                <UserCircleIcon className="h-8 w-8 text-blue-600" />
                              </div>
                            )}
                          </div>
                          
                          {/* Coordinator Info */}
                          <div>
                            <h4 className="text-lg font-medium text-gray-900">
                              {coordinator.first_name} {coordinator.last_name}
                            </h4>
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                              <BookOpenIcon className="h-4 w-4" />
                              <span>{coordinator.designated_course}</span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Expand/Collapse Icon */}
                        <div className="flex-shrink-0">
                          {expandedCoordinator === coordinator.id ? (
                            <ChevronUpIcon className="h-5 w-5 text-gray-500" />
                          ) : (
                            <ChevronDownIcon className="h-5 w-5 text-gray-500" />
                          )}
                        </div>
                      </div>

                      {/* Coordinator Contact Details (Expandable) */}
                      {expandedCoordinator === coordinator.id && (
                        <div className="p-4 bg-white border-t border-gray-200">
                          <div className="space-y-4">
                            {/* Contact Information */}
                            <div>
                              <h5 className="text-sm font-medium text-gray-900 mb-3">Contact Information</h5>
                              <div className="space-y-2">
                                {coordinator.email ? (
                                  <div className="flex items-center space-x-3">
                                    <EnvelopeIcon className="h-4 w-4 text-gray-500 flex-shrink-0" />
                                    <span className="text-gray-700 text-sm">
                                      {coordinator.email}
                                    </span>
                                  </div>
                                ) : (
                                  <div className="flex items-center space-x-3">
                                    <EnvelopeIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                    <span className="text-gray-500 text-sm">Email not available</span>
                                  </div>
                                )}
                                
                                {coordinator.contact_number ? (
                                  <div className="flex items-center space-x-3">
                                    <PhoneIcon className="h-4 w-4 text-gray-500 flex-shrink-0" />
                                    <span className="text-gray-700 text-sm">
                                      {coordinator.contact_number}
                                    </span>
                                  </div>
                                ) : (
                                  <div className="flex items-center space-x-3">
                                    <PhoneIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                    <span className="text-gray-500 text-sm">Phone not available</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Rating */}
                            {coordinator.average_rating && coordinator.average_rating > 0 && (
                              <div>
                                <h5 className="text-sm font-medium text-gray-900 mb-2">Rating</h5>
                                <RatingDisplay
                                  entityId={coordinator.id}
                                  entityType="coordinator"
                                  averageRating={coordinator.average_rating}
                                  totalCount={coordinator.rating_count}
                                  showDetails={false}
                                />
                              </div>
                            )}

                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 rounded-b-lg">
              <div className="flex justify-end">
                <button
                  onClick={() => setShowContactModal(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
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