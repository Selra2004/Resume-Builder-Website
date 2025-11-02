import React from 'react';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import { UserIcon } from '@heroicons/react/24/outline';

interface Rating {
  id: number;
  rating: number;
  comment: string | null;
  created_at: string;
  rated_by_type: 'coordinator' | 'company';
  rater_name: string;
  rater_photo: string | null;
  job_title?: string;
}

interface RatingBreakdownProps {
  ratings: Rating[];
  averageRating?: number;
  totalCount?: number;
}

export const RatingBreakdown: React.FC<RatingBreakdownProps> = ({
  ratings,
  averageRating,
  totalCount
}) => {
  // Use provided totalCount if available, otherwise fall back to ratings.length
  const actualTotalCount = totalCount && totalCount > 0 ? totalCount : ratings.length;
  const actualAverageRating = averageRating && Number(averageRating) > 0 ? Number(averageRating) : 0;

  // Calculate rating distribution from actual ratings shown (for the breakdown bars)
  const distribution = [5, 4, 3, 2, 1].map(star => {
    const count = ratings.filter(r => Math.round(Number(r.rating)) === star).length;
    const percentage = ratings.length > 0 ? (count / ratings.length) * 100 : 0;
    return { star, count, percentage };
  });

  const totalRatings = actualTotalCount;

  if (totalRatings === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
        <StarSolidIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
        <p className="text-sm text-gray-600">No ratings yet</p>
        <p className="text-xs text-gray-500 mt-1">Be the first to rate this applicant!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overall Rating Summary */}
      <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="text-center flex-1">
            <p className="text-sm text-gray-600 mb-1">Average Rating</p>
            <div className="flex items-center justify-center space-x-2">
              <StarSolidIcon className="h-8 w-8 text-yellow-500" />
              <span className="text-3xl font-bold text-gray-900">
                {actualAverageRating.toFixed(2)}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">out of 5.0</p>
          </div>
          <div className="text-center flex-1 border-l border-yellow-300 pl-4">
            <p className="text-sm text-gray-600 mb-1">Total Ratings</p>
            <p className="text-3xl font-bold text-gray-900">{actualTotalCount}</p>
            <p className="text-xs text-gray-500 mt-1">
              from all companies & coordinators
            </p>
          </div>
        </div>
      </div>

      {/* Rating Distribution */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-gray-900 mb-4">Rating Distribution</h4>
        <div className="space-y-3">
          {distribution.map(({ star, count, percentage }) => (
            <div key={star} className="flex items-center space-x-3">
              <div className="flex items-center space-x-1 w-16">
                <span className="text-sm font-medium text-gray-700">{star}</span>
                <StarSolidIcon className="h-4 w-4 text-yellow-400" />
              </div>
              <div className="flex-1">
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-yellow-400 h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
              <div className="w-20 text-right">
                <span className="text-sm font-medium text-gray-900">{count}</span>
                <span className="text-xs text-gray-500 ml-1">
                  ({percentage.toFixed(0)}%)
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detailed Ratings List */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-gray-900 mb-4">
          All Ratings ({ratings.length} shown)
        </h4>
        {actualTotalCount > ratings.length && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Showing {ratings.length} individual rating{ratings.length !== 1 ? 's' : ''} below. 
              The total average ({actualAverageRating.toFixed(2)}) includes all {actualTotalCount} ratings from companies and coordinators.
            </p>
          </div>
        )}
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {ratings.map((rating) => (
            <div
              key={rating.id}
              className="border-2 border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  {rating.rater_photo ? (
                    <img
                      src={rating.rater_photo}
                      alt={rating.rater_name}
                      className="h-10 w-10 rounded-full object-cover border-2 border-gray-200"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                      <UserIcon className="h-6 w-6 text-gray-500" />
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {rating.rater_name}
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          rating.rated_by_type === 'company'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {rating.rated_by_type === 'company' ? 'Company' : 'Coordinator'}
                      </span>
                      {rating.job_title && (
                        <span className="text-xs text-gray-600">
                          • {rating.job_title}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <div className="flex items-center space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <StarSolidIcon
                        key={star}
                        className={`h-4 w-4 ${
                          star <= Number(rating.rating || 0)
                            ? 'text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-bold text-gray-900 mt-1">
                    {Number(rating.rating || 0).toFixed(1)} / 5.0
                  </span>
                </div>
              </div>

              {rating.comment && (
                <div className="mt-3 bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <p className="text-xs font-medium text-gray-700 mb-1">Feedback:</p>
                  <p className="text-sm text-gray-800 italic">"{rating.comment}"</p>
                </div>
              )}

              <div className="mt-3 text-xs text-gray-500">
                Rated on {new Date(rating.created_at).toLocaleDateString('en-US', {
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
      </div>
    </div>
  );
};