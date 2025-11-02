import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  BuildingOfficeIcon, 
  MapPinIcon, 
  BriefcaseIcon, 
  ClockIcon 
} from '@heroicons/react/24/outline';

export const CompanyDetails: React.FC = () => {
  const { id } = useParams();

  // Mock data - replace with API call
  const company = {
    id: parseInt(id || '1'),
    name: 'Tech Solutions Inc.',
    summary: 'Leading software development company specializing in web and mobile applications. We pride ourselves on creating innovative solutions that help businesses transform digitally.',
    keyRequirements: 'We look for passionate individuals with strong programming skills, team collaboration abilities, and a continuous learning mindset. Experience with modern frameworks and agile methodologies is preferred.',
    jobs: [
      {
        id: 1,
        title: 'Software Developer Intern',
        type: 'Internship',
        location: 'Makati City',
        salary: '₱15,000 - ₱20,000',
        posted: '2 days ago',
        description: 'Join our development team and work on exciting web applications...'
      },
      {
        id: 2,
        title: 'Frontend Developer',
        type: 'Full Time',
        location: 'Makati City',
        salary: '₱25,000 - ₱35,000',
        posted: '1 week ago',
        description: 'Create amazing user interfaces using React and modern CSS...'
      },
      {
        id: 3,
        title: 'QA Tester',
        type: 'Part Time',
        location: 'Remote',
        salary: '₱12,000 - ₱18,000',
        posted: '3 days ago',
        description: 'Help ensure our software quality through comprehensive testing...'
      }
    ]
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Company Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-8">
        <div className="flex items-start space-x-6">
          <div className="w-20 h-20 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <BuildingOfficeIcon className="h-10 w-10 text-primary-600" />
          </div>
          
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{company.name}</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="flex items-center text-gray-600">
                <BriefcaseIcon className="h-5 w-5 mr-2" />
                <span>{company.jobs.length} Open Positions</span>
              </div>
              <div className="flex items-center text-gray-600">
                <MapPinIcon className="h-5 w-5 mr-2" />
                <span>Multiple Locations</span>
              </div>
              <div className="flex items-center text-gray-600">
                <ClockIcon className="h-5 w-5 mr-2" />
                <span>Hiring Now</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* About Company */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">About {company.name}</h2>
            <p className="text-gray-700 leading-relaxed">{company.summary}</p>
          </div>

          {/* What We Look For */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">What We Look For</h2>
            <p className="text-gray-700 leading-relaxed">{company.keyRequirements}</p>
          </div>

          {/* Job Openings */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Current Openings</h2>
              <span className="text-sm text-gray-500">{company.jobs.length} positions</span>
            </div>
            
            <div className="space-y-4">
              {company.jobs.map((job) => (
                <div key={job.id} className="border border-gray-200 rounded-lg p-4 hover:border-primary-300 transition-colors">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{job.title}</h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                        <span className="flex items-center">
                          <BriefcaseIcon className="h-4 w-4 mr-1" />
                          {job.type}
                        </span>
                        <span className="flex items-center">
                          <MapPinIcon className="h-4 w-4 mr-1" />
                          {job.location}
                        </span>
                        <span className="flex items-center">
                          <ClockIcon className="h-4 w-4 mr-1" />
                          {job.posted}
                        </span>
                      </div>
                    </div>
                    <span className="px-2 py-1 text-xs font-medium text-primary-700 bg-primary-100 rounded-full">
                      {job.type}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 mb-3">{job.description}</p>
                  
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-primary-600">{job.salary}</span>
                    <Link
                      to={`/jobs/${job.id}`}
                      className="btn-primary text-sm px-4 py-2"
                    >
                      View Job
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Interested in Working Here?</h3>
            <div className="space-y-3">
              <Link
                to={`/jobs?company=${company.id}`}
                className="w-full btn-primary text-center block"
              >
                View All Jobs
              </Link>
              <button className="w-full btn-secondary">
                Follow Company
              </button>
            </div>
          </div>

          {/* Company Stats */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Company Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Active Jobs</span>
                <span className="font-medium">{company.jobs.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Students Hired</span>
                <span className="font-medium">25+</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Average Response Time</span>
                <span className="font-medium">2 days</span>
              </div>
            </div>
          </div>

          {/* Similar Companies */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Similar Companies</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <BuildingOfficeIcon className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Digital Marketing Pro</p>
                  <p className="text-sm text-gray-500">3 jobs available</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <BuildingOfficeIcon className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Hotel Excellence Group</p>
                  <p className="text-sm text-gray-500">8 jobs available</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
