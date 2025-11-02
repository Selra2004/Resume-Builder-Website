import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { toast } from 'react-hot-toast';
import {
  BriefcaseIcon,
  BuildingOfficeIcon,
  UserIcon,
  CalendarIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleIconSolid } from '@heroicons/react/24/solid';

interface EmploymentRecord {
  id: number;
  application_id: number;
  job_id: number;
  employer_type: 'coordinator' | 'company';
  employer_id: number;
  employer_name: string;
  employer_display_name: string;
  employer_photo_url?: string;
  job_title: string;
  job_description?: string;
  hired_date: string;
  employment_status: 'active' | 'contract_ended';
  contract_end_date?: string;
}

interface EmploymentHistoryProps {
  className?: string;
}

export const EmploymentHistory: React.FC<EmploymentHistoryProps> = ({ className = '' }) => {
  const [employmentHistory, setEmploymentHistory] = useState<EmploymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [endingContract, setEndingContract] = useState<number | null>(null);

  useEffect(() => {
    fetchEmploymentHistory();
  }, []);

  const fetchEmploymentHistory = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users/employment-history');
      setEmploymentHistory(response.data);
    } catch (error) {
      console.error('Error fetching employment history:', error);
      toast.error('Failed to load employment history');
    } finally {
      setLoading(false);
    }
  };

  const handleEndContract = async (employmentId: number) => {
    const confirmEnd = window.confirm(
      'Are you sure you want to mark this employment contract as ended? This action cannot be undone.'
    );

    if (!confirmEnd) return;

    try {
      setEndingContract(employmentId);
      await api.patch(`/users/employment/${employmentId}/end-contract`);
      
      // Update local state
      setEmploymentHistory(prev => 
        prev.map(record => 
          record.id === employmentId 
            ? { 
                ...record, 
                employment_status: 'contract_ended',
                contract_end_date: new Date().toISOString()
              }
            : record
        )
      );
      
      toast.success('Contract ended successfully');
    } catch (error: any) {
      console.error('Error ending contract:', error);
      toast.error(error.response?.data?.message || 'Failed to end contract');
    } finally {
      setEndingContract(null);
    }
  };

  const getStatusBadge = (status: string, contractEndDate?: string) => {
    if (status === 'active') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircleIconSolid className="h-3 w-3 mr-1" />
          Active Employment
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          <XMarkIcon className="h-3 w-3 mr-1" />
          Contract Ended {contractEndDate && `(${formatDate(contractEndDate)})`}
        </span>
      );
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const calculateDuration = (startDate: string, endDate?: string) => {
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 30) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months} month${months !== 1 ? 's' : ''}`;
    } else {
      const years = Math.floor(diffDays / 365);
      const remainingMonths = Math.floor((diffDays % 365) / 30);
      return `${years} year${years !== 1 ? 's' : ''}${remainingMonths > 0 ? `, ${remainingMonths} month${remainingMonths !== 1 ? 's' : ''}` : ''}`;
    }
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm ${className}`}>
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 flex items-center">
          <BriefcaseIcon className="h-5 w-5 mr-2 text-gray-600" />
          Employment History
        </h3>
        <p className="mt-1 text-sm text-gray-600">
          Your employment records from job applications through this platform
        </p>
      </div>

      <div className="p-6">
        {employmentHistory.length === 0 ? (
          <div className="text-center py-8">
            <BriefcaseIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">No Employment History</h4>
            <p className="text-gray-600">
              You haven't been hired through any job applications yet. Keep applying!
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {employmentHistory.map((record) => (
              <div
                key={record.id}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    {/* Employer Logo/Avatar */}
                    <div className="flex-shrink-0">
                      {record.employer_photo_url ? (
                        <img
                          src={record.employer_photo_url}
                          alt={record.employer_display_name}
                          className="h-12 w-12 rounded-full object-cover border border-gray-200"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                            (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                      ) : null}
                      <div className={`h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center ${record.employer_photo_url ? 'hidden' : ''}`}>
                        {record.employer_type === 'company' ? (
                          <BuildingOfficeIcon className="h-6 w-6 text-gray-500" />
                        ) : (
                          <UserIcon className="h-6 w-6 text-gray-500" />
                        )}
                      </div>
                    </div>

                    {/* Employment Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="text-lg font-medium text-gray-900">
                            {record.job_title}
                          </h4>
                          <p className="text-sm text-gray-600">
                            at {record.employer_display_name}
                          </p>
                        </div>
                        {getStatusBadge(record.employment_status, record.contract_end_date)}
                      </div>

                      <div className="flex items-center text-sm text-gray-500 space-x-4 mb-3">
                        <div className="flex items-center">
                          <CalendarIcon className="h-4 w-4 mr-1" />
                          <span>Hired: {formatDate(record.hired_date)}</span>
                        </div>
                        {record.contract_end_date && (
                          <div className="flex items-center">
                            <CalendarIcon className="h-4 w-4 mr-1" />
                            <span>Ended: {formatDate(record.contract_end_date)}</span>
                          </div>
                        )}
                        <div className="flex items-center">
                          <span className="font-medium">
                            Duration: {calculateDuration(record.hired_date, record.contract_end_date)}
                          </span>
                        </div>
                      </div>

                      {record.job_description && (
                        <p className="text-sm text-gray-700 line-clamp-2 mb-3">
                          {record.job_description}
                        </p>
                      )}

                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                          {record.employer_type === 'company' ? 'Company' : 'Coordinator'} Hire
                        </span>

                        {record.employment_status === 'active' && (
                          <button
                            onClick={() => handleEndContract(record.id)}
                            disabled={endingContract === record.id}
                            className="inline-flex items-center px-3 py-1 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded hover:bg-red-100 disabled:opacity-50 transition-colors"
                          >
                            {endingContract === record.id ? (
                              <>
                                <div className="animate-spin h-3 w-3 border border-red-600 border-t-transparent rounded-full mr-1"></div>
                                Ending...
                              </>
                            ) : (
                              <>
                                <XMarkIcon className="h-3 w-3 mr-1" />
                                End Contract
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
