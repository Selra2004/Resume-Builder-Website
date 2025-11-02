import React, { useState } from 'react';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import { StarIcon as StarOutlineIcon } from '@heroicons/react/24/outline';

interface ApplicantRatingProps {
  currentRating?: number;
  currentComment?: string;
  averageRating?: number;
  ratingCount?: number;
  onSubmit: (rating: number, comment: string) => Promise<void>;
  readOnly?: boolean;
}

export const ApplicantRating: React.FC<ApplicantRatingProps> = ({
  currentRating,
  currentComment,
  averageRating,
  ratingCount,
  onSubmit,
  readOnly = false
}) => {
  const [rating, setRating] = useState(currentRating || 0);
  const [comment, setComment] = useState(currentComment || '');
  const [hoverRating, setHoverRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) return;
    
    try {
      setIsSubmitting(true);
      await onSubmit(rating, comment);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = (starRating: number, interactive = false) => {
    return [1, 2, 3, 4, 5].map((star) => {
      const filled = star <= starRating;
      const StarComponent = filled ? StarSolidIcon : StarOutlineIcon;
      
      return (
        <StarComponent
          key={star}
          className={`h-6 w-6 cursor-pointer transition-colors ${
            filled ? 'text-yellow-400' : 'text-gray-300'
          } ${interactive ? 'hover:text-yellow-300' : ''}`}
          onClick={() => interactive && setRating(star)}
          onMouseEnter={() => interactive && setHoverRating(star)}
          onMouseLeave={() => interactive && setHoverRating(0)}
        />
      );
    });
  };

  if (readOnly) {
    return (
      <div className="space-y-3">
        {averageRating && Number(averageRating || 0) > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {renderStars(Math.round(Number(averageRating || 0)))}
                <span className="text-sm font-semibold text-blue-700">
                  {Number(averageRating || 0).toFixed(2)} / 5.00
                </span>
              </div>
              <span className="text-sm text-gray-600">
                {ratingCount || 0} rating{(ratingCount || 0) !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Current Rating Display */}
      {Number(currentRating || 0) > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-800 mb-2">Your Current Rating:</p>
          <div className="flex items-center space-x-2">
            {renderStars(Number(currentRating || 0))}
            <span className="text-sm font-semibold text-blue-700">
              {Number(currentRating || 0).toFixed(1)} / 5.0
            </span>
          </div>
          {currentComment && (
            <p className="text-sm text-blue-700 mt-2 italic">"{currentComment}"</p>
          )}
        </div>
      )}

      {/* Average Rating Display */}
      {averageRating && Number(averageRating || 0) > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-sm text-gray-700 mb-2">Applicant's Overall Rating (All Applications):</p>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {renderStars(Math.round(Number(averageRating || 0)))}
              <span className="text-sm font-semibold text-blue-700">
                {Number(averageRating || 0).toFixed(2)} / 5.00
              </span>
            </div>
            <span className="text-sm text-gray-600">
              {ratingCount || 0} total rating{(ratingCount || 0) !== 1 ? 's' : ''} from all job applications
            </span>
          </div>
        </div>
      )}

      {/* Rating Input */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <p className="text-sm font-medium text-gray-900 mb-3">
          {Number(currentRating || 0) > 0 ? 'Update Your Rating:' : 'Rate This Applicant:'}
        </p>
        
        <div className="flex items-center space-x-1 mb-4">
          {renderStars(hoverRating || rating, true)}
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Comment (Optional)
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Share your thoughts about this applicant..."
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={rating === 0 || isSubmitting}
          className="w-full px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Submitting...' : Number(currentRating || 0) > 0 ? 'Update Rating' : 'Submit Rating'}
        </button>
      </div>
    </div>
  );
};