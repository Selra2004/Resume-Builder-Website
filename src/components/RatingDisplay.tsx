import React, { useState, useEffect } from 'react';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import { StarIcon as StarOutlineIcon } from '@heroicons/react/24/outline';
import { UserIcon, ChatBubbleBottomCenterTextIcon } from '@heroicons/react/24/outline';
import { api } from '../services/api';

interface Rating {
  id: number;
  rating: number;
  review: string | null;
  created_at: string;
  first_name: string;
  last_name: string;
  profile_photo: string | null;
  context?: string;
  job_title?: string;
}

interface RatingDisplayProps {
  entityId: number;
  entityType: 'job' | 'coordinator' | 'company';
  averageRating?: number;
  totalCount?: number;
  showDetails?: boolean;
}

export const RatingDisplay: React.FC<RatingDisplayProps> = ({
  entityId,
  entityType,
  averageRating = 0,
  totalCount = 0,
  showDetails = true
}) => {
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAllRatings, setShowAllRatings] = useState(false);

  useEffect(() => {
    if (showDetails) {
      fetchRatings();
    }
  }, [entityId, entityType, showDetails]);

  const fetchRatings = async () => {
    try {
      setLoading(true);
      let endpoint = '';
      
      switch (entityType) {
        case 'job':
          endpoint = `/jobs/${entityId}/ratings`;
          break;
        case 'coordinator':
          endpoint = `/coordinators/${entityId}/ratings`;
          break;
        case 'company':
          endpoint = `/companies/${entityId}/ratings`;
          break;
      }

      const response = await api.get(endpoint);
      setRatings(response.data.ratings || []);
    } catch (error) {
      console.error('Failed to fetch ratings:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number, size: 'sm' | 'md' | 'lg' = 'md') => {
    const sizeClasses = {
      sm: 'h-4 w-4',
      md: 'h-5 w-5',
      lg: 'h-6 w-6'
    };

    return [1, 2, 3, 4, 5].map((star) => {
      const filled = star <= rating;
      const StarComponent = filled ? StarSolidIcon : StarOutlineIcon;
      
      return (
        <StarComponent
          key={star}
          className={`${sizeClasses[size]} ${filled ? 'text-yellow-400' : 'text-gray-300'}`}
        />
      );
    });
  };

  // Calculate rating distribution
  const distribution = [5, 4, 3, 2, 1].map(star => {
    const count = ratings.filter(r => Math.round(r.rating) === star).length;
    const percentage = ratings.length > 0 ? (count / ratings.length) * 100 : 0;
    return { star, count, percentage };
  });

  if (!showDetails && (!averageRating || averageRating === 0)) {
    return null;
  }

  // Simple rating display (for lists)
  if (!showDetails) {
    return (
      <div className="flex items-center space-x-1">
        {renderStars(Number(averageRating || 0), 'sm')}
        <span className="text-sm text-gray-600">
          {Number(averageRating || 0).toFixed(1)} ({totalCount || 0})
        </span>
      </div>
    );
  }

  // Detailed rating display
  return (
    <div className="space-y-6">
      {/* Overall Rating Summary */}
      {(averageRating > 0 || ratings.length > 0) && (
        <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="text-center flex-1">
              <p className="text-sm text-gray-600 mb-1">Average Rating</p>
              <div className="flex items-center justify-center space-x-2">
                <StarSolidIcon className="h-8 w-8 text-yellow-500" />
                <span className="text-3xl font-bold text-gray-900">
                  {Number(averageRating || (ratings.length > 0 ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length : 0)).toFixed(2)}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">out of 5.0</p>
            </div>
            <div className="text-center flex-1 border-l border-yellow-300 pl-4">
              <p className="text-sm text-gray-600 mb-1">Total Ratings</p>
              <p className="text-3xl font-bold text-gray-900">{totalCount || ratings.length}</p>
              <p className="text-xs text-gray-500 mt-1">from users</p>
            </div>
          </div>
        </div>
      )}

      {/* Rating Distribution */}
      {ratings.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-4">Rating Distribution</h4>
          <div className="space-y-2">
            {distribution.map(({ star, count, percentage }) => (
              <div key={star} className="flex items-center space-x-3">
                <span className="text-sm font-medium text-gray-700 w-6">{star}</span>
                <StarSolidIcon className="h-4 w-4 text-yellow-400" />
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="text-sm text-gray-600 w-8">{count}</span>
                <span className="text-xs text-gray-500 w-12">({percentage.toFixed(0)}%)</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Individual Ratings */}
      {ratings.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-semibold text-gray-900 flex items-center">
              <ChatBubbleBottomCenterTextIcon className="h-5 w-5 text-blue-500 mr-2" />
              All Ratings ({ratings.length})
            </h4>
            {ratings.length > 3 && (
              <button
                onClick={() => setShowAllRatings(!showAllRatings)}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                {showAllRatings ? 'Show Less' : 'Show All'}
              </button>
            )}
          </div>
          
          {loading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {(showAllRatings ? ratings : ratings.slice(0, 3)).map((rating) => (
                <div key={rating.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      {rating.profile_photo ? (
                        <img
                          src={rating.profile_photo}
                          alt={`${rating.first_name} ${rating.last_name}`}
                          className="h-10 w-10 rounded-full object-cover border-2 border-gray-200"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                          <UserIcon className="h-6 w-6 text-gray-500" />
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {rating.first_name} {rating.last_name}
                        </p>
                        {rating.context && (
                          <p className="text-xs text-gray-500">
                            Rated from {rating.context === 'job_post' ? 'job post' : 'team page'}
                            {rating.job_title && ` • ${rating.job_title}`}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <div className="flex items-center space-x-1">
                        {renderStars(Number(rating.rating || 0), 'sm')}
                      </div>
                      <span className="text-sm font-bold text-gray-900 mt-1">
                        {Number(rating.rating || 0).toFixed(1)} / 5.0
                      </span>
                    </div>
                  </div>
                  
                  {rating.review && (
                    <div className="mt-3 bg-gray-50 border border-gray-200 rounded-lg p-3">
                      <p className="text-xs font-medium text-gray-700 mb-1">Review:</p>
                      <p className="text-sm text-gray-800 italic">"{rating.review}"</p>
                    </div>
                  )}
                  
                  <div className="mt-3 text-xs text-gray-500">
                    {new Date(rating.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* No ratings message */}
      {ratings.length === 0 && !loading && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
          <StarSolidIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-600">No ratings yet</p>
          <p className="text-xs text-gray-500 mt-1">Be the first to rate!</p>
        </div>
      )}
    </div>
  );
};
