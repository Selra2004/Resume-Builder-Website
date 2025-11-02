import React, { useState, useEffect } from 'react';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import { StarIcon as StarOutlineIcon } from '@heroicons/react/24/outline';
import { api } from '../services/api';
import { toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

interface JobRatingProps {
  jobId: number;
  currentUserRating?: { rating: number | null; review: string | null };
  onRatingUpdate?: (rating: number, review: string) => void;
  readOnly?: boolean;
}

export const JobRating: React.FC<JobRatingProps> = ({
  jobId,
  currentUserRating,
  onRatingUpdate,
  readOnly = false
}) => {
  const { user } = useAuth();
  const [rating, setRating] = useState(currentUserRating?.rating || 0);
  const [review, setReview] = useState(currentUserRating?.review || '');
  const [hoverRating, setHoverRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userRating, setUserRating] = useState<{ rating: number | null; review: string | null } | null>(null);

  // Fetch current user's rating
  useEffect(() => {
    if (!readOnly && user?.role === 'user') {
      fetchUserRating();
    }
  }, [jobId, readOnly, user]);

  const fetchUserRating = async () => {
    try {
      const response = await api.get(`/jobs/${jobId}/my-rating`);
      setUserRating(response.data);
      if (response.data.rating) {
        setRating(response.data.rating);
        setReview(response.data.review || '');
      }
    } catch (error) {
      console.error('Failed to fetch user rating:', error);
    }
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }
    
    try {
      setIsSubmitting(true);
      await api.post(`/jobs/${jobId}/rate`, {
        rating,
        review
      });

      toast.success('Job rating submitted successfully');
      
      if (onRatingUpdate) {
        onRatingUpdate(rating, review);
      }

      // Update local state
      setUserRating({ rating, review });
    } catch (error: any) {
      console.error('Failed to submit rating:', error);
      toast.error(error.response?.data?.message || 'Failed to submit rating');
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
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <p className="text-sm text-gray-600 mb-2">Rate this job post to help others:</p>
        <div className="flex items-center space-x-2">
          {renderStars(0)}
          <span className="text-sm text-gray-500">Sign in to rate this job</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      {/* Current Rating Display */}
      {userRating?.rating && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-blue-800 mb-2">Your Current Rating:</p>
          <div className="flex items-center space-x-2">
            {renderStars(userRating.rating)}
            <span className="text-sm font-semibold text-blue-700">
              {userRating.rating.toFixed(1)} / 5.0
            </span>
          </div>
          {userRating.review && (
            <p className="text-sm text-blue-700 mt-2 italic">"{userRating.review}"</p>
          )}
        </div>
      )}

      {/* Rating Input */}
      <div className="space-y-4">
        <p className="text-sm font-medium text-gray-900">
          {userRating?.rating ? 'Update Your Rating:' : 'Rate This Job:'}
        </p>
        
        <div className="flex items-center space-x-2">
          {renderStars(hoverRating || rating, true)}
          <span className="text-sm text-gray-600">
            {hoverRating || rating || 0}/5
          </span>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Review (Optional)
          </label>
          <textarea
            value={review}
            onChange={(e) => setReview(e.target.value)}
            placeholder="Share your experience with this job posting..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={isSubmitting || rating === 0}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
        >
          {isSubmitting ? 'Submitting...' : (userRating?.rating ? 'Update Rating' : 'Submit Rating')}
        </button>
      </div>
    </div>
  );
};
