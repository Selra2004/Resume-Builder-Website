import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  BriefcaseIcon,
  BuildingOfficeIcon,
  DocumentTextIcon,
  MagnifyingGlassIcon,
  StarIcon,
  UserGroupIcon,
  TrophyIcon,
  ChartBarIcon,
  FireIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { api } from '../services/api';

interface PlatformStats {
  activeStudents: number;
  partnerOrganizations: number;
  jobPlacements: number;
  activeJobs: number;
  successStories: number;
  successRate: number;
}

export const Home: React.FC = () => {
  const [platformStats, setPlatformStats] = useState<PlatformStats>({
    activeStudents: 500,
    partnerOrganizations: 50,
    jobPlacements: 200,
    activeJobs: 75,
    successStories: 170,
    successRate: 85
  });
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  useEffect(() => {
    fetchPlatformStats();
  }, []);

  const fetchPlatformStats = async () => {
    try {
      const response = await api.get('/jobs/platform-stats');
      setPlatformStats(response.data);
    } catch (error) {
      console.error('Failed to fetch platform stats:', error);
      // Keep default stats if fetch fails
    } finally {
      setIsLoadingStats(false);
    }
  };
  const features = [
    {
      icon: DocumentTextIcon,
      title: 'Resume Builder',
      description: 'Create professional resumes with our intuitive builder tool designed for students and graduates.',
    },
    {
      icon: MagnifyingGlassIcon,
      title: 'AI Job Matching',
      description: 'Get personalized job recommendations based on your skills, experience, and career preferences.',
    },
    {
      icon: BriefcaseIcon,
      title: 'Quality Job Listings',
      description: 'Access curated job opportunities specifically for OJT students and recent graduates.',
    },
    {
      icon: BuildingOfficeIcon,
      title: 'Verified Companies',
      description: 'Connect with legitimate companies and employers who are actively hiring students.',
    },
  ];

  const stats = [
    { 
      label: 'Active Students', 
      value: isLoadingStats ? '...' : `${platformStats.activeStudents.toLocaleString()}+`,
      icon: UserGroupIcon,
      color: 'text-blue-600'
    },
    { 
      label: 'Partner Organizations', 
      value: isLoadingStats ? '...' : `${platformStats.partnerOrganizations.toLocaleString()}+`,
      icon: BuildingOfficeIcon,
      color: 'text-green-600'
    },
    { 
      label: 'Job Placements', 
      value: isLoadingStats ? '...' : `${platformStats.jobPlacements.toLocaleString()}+`,
      icon: TrophyIcon,
      color: 'text-purple-600'
    },
    { 
      label: 'Success Rate', 
      value: isLoadingStats ? '...' : `${platformStats.successRate}%`,
      icon: ChartBarIcon,
      color: 'text-orange-600'
    },
    { 
      label: 'Active Jobs', 
      value: isLoadingStats ? '...' : `${platformStats.activeJobs.toLocaleString()}+`,
      icon: FireIcon,
      color: 'text-red-600'
    },
    { 
      label: 'Success Stories', 
      value: isLoadingStats ? '...' : `${platformStats.successStories.toLocaleString()}+`,
      icon: SparklesIcon,
      color: 'text-yellow-600'
    },
  ];

  const testimonials = [
    {
      name: 'Maria Santos',
      role: 'BS Information Technology Graduate',
      content: 'ACC helped me land my first job as a software developer. The resume builder was amazing!',
      rating: 5,
    },
    {
      name: 'John Carlo Reyes',
      role: 'BS Business Administration Student',
      content: 'The AI job matching feature connected me with the perfect OJT opportunity. Highly recommended!',
      rating: 5,
    },
    {
      name: 'Sarah Mae Cruz',
      role: 'BS Hospitality Management Graduate',
      content: 'Thanks to ACC, I found a great job in the hospitality industry right after graduation.',
      rating: 5,
    },
  ];

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-600 to-primary-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Your Gateway to Career Success
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-primary-100">
              Connecting Asiatech students and alumni with their dream careers through intelligent job matching and professional tools.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="bg-white text-primary-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors"
              >
                Get Started Today
              </Link>
              <Link
                to="/jobs"
                className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white hover:text-primary-600 transition-colors"
              >
                Browse Jobs
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Stats Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Our Impact in Numbers
          </h2>
          <p className="text-xl text-gray-600">
            Real-time data showing the success of our platform
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-xl shadow-lg p-6 text-center hover:shadow-xl transition-shadow duration-300">
              <div className={`w-12 h-12 ${stat.color.replace('text-', 'bg-').replace('-600', '-100')} rounded-lg flex items-center justify-center mx-auto mb-4`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div className={`text-2xl md:text-3xl font-bold ${stat.color} mb-2 ${isLoadingStats ? 'animate-pulse' : ''}`}>
                {stat.value}
              </div>
              <div className="text-gray-600 font-medium text-sm">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Everything You Need to Succeed
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Our comprehensive platform provides all the tools and resources you need to launch your career successfully.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="text-center group">
              <div className="w-16 h-16 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-6 group-hover:bg-primary-200 transition-colors">
                <feature.icon className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works Section */}
      <section className="bg-gray-100 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How ACC Works
            </h2>
            <p className="text-xl text-gray-600">
              Get started in just three simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-6">
                1
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Create Your Profile
              </h3>
              <p className="text-gray-600">
                Sign up with your Asiatech email and complete your profile with your skills, education, and career preferences.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-6">
                2
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Build Your Resume
              </h3>
              <p className="text-gray-600">
                Use our professional resume builder to create a standout resume that highlights your strengths and achievements.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-6">
                3
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Get Matched & Apply
              </h3>
              <p className="text-gray-600">
                Receive personalized job recommendations and apply to positions that match your skills and career goals.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Success Stories
          </h2>
          <p className="text-xl text-gray-600">
            See how ACC has helped students and graduates achieve their career goals
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="bg-white rounded-xl shadow-lg p-8">
              <div className="flex items-center mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <StarIcon key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <blockquote className="text-gray-600 mb-6">
                "{testimonial.content}"
              </blockquote>
              <div>
                <div className="font-semibold text-gray-900">{testimonial.name}</div>
                <div className="text-sm text-gray-500">{testimonial.role}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Launch Your Career?
          </h2>
          <p className="text-xl mb-8 text-primary-100">
            Join thousands of Asiatech students and alumni who have found their dream jobs through ACC.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="bg-white text-primary-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors"
            >
              Start Your Journey
            </Link>
            <Link
              to="/companies"
              className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white hover:text-primary-600 transition-colors"
            >
              View Companies
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
