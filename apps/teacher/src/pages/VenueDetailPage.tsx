/**
 * Venue Detail Page
 * 
 * Comprehensive venue profile display with:
 * - Venue information (name, description, location, contact)
 * - Photo gallery with lightbox
 * - Available experiences with pricing
 * - Reviews and ratings
 * - "Book Experience" call-to-action
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { VenueInfo } from '../components/venue-detail/VenueInfo';
import { PhotoGallery } from '../components/venue-detail/PhotoGallery';
import { ExperienceList } from '../components/venue-detail/ExperienceList';
import { ReviewList } from '../components/venue-detail/ReviewList';
import {
  createVenueProfileService,
  createExperienceService,
  createVenueReviewService,
  type VenueProfile,
  type Experience,
  type VenueReview,
  type VenuePhoto,
} from '@tripslip/database';
import { supabase } from '../lib/supabase';

export default function VenueDetailPage() {
  const { venueId } = useParams<{ venueId: string }>();
  const navigate = useNavigate();

  const [venue, setVenue] = useState<VenueProfile | null>(null);
  const [photos, setPhotos] = useState<VenuePhoto[]>([]);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [reviews, setReviews] = useState<VenueReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const venueProfileService = createVenueProfileService(supabase);
  const experienceService = createExperienceService(supabase);
  const reviewService = createVenueReviewService(supabase);

  useEffect(() => {
    if (venueId) {
      loadVenueData();
    }
  }, [venueId]);

  const loadVenueData = async () => {
    if (!venueId) return;

    setLoading(true);
    setError(null);

    try {
      // Load venue profile
      const { data: venueData, error: venueError } = await venueProfileService.getVenueProfile(venueId);
      if (venueError) throw venueError;
      setVenue(venueData);

      // Load photos
      const { data: photoData, error: photoError } = await venueProfileService.getVenuePhotos(venueId);
      if (photoError) throw photoError;
      setPhotos(photoData || []);

      // Load experiences
      const experienceData = await experienceService.getVenueExperiences(venueId, false);
      setExperiences(experienceData);

      // Load reviews
      const reviewData = await reviewService.getVenueReviews(venueId, {
        limit: 10,
        sortBy: 'created_at',
        sortOrder: 'desc',
      });
      setReviews(reviewData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load venue details');
      console.error('Error loading venue:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBookExperience = (experienceId: string) => {
    // Navigate to trip creation with pre-selected venue and experience
    navigate(`/trips/create?venueId=${venueId}&experienceId=${experienceId}`);
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading venue details...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !venue) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto py-12">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error || 'Venue not found'}
          </div>
          <button
            onClick={() => navigate('/venues/search')}
            className="mt-4 text-blue-600 hover:text-blue-800"
          >
            ← Back to search
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto py-6 space-y-8">
        {/* Back Button */}
        <button
          onClick={() => navigate('/venues/search')}
          className="flex items-center text-blue-600 hover:text-blue-800"
        >
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to search
        </button>

        {/* Photo Gallery */}
        <PhotoGallery
          primaryPhotoUrl={venue.primary_photo_url}
          photos={photos}
          venueName={venue.name}
        />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Venue Info */}
            <VenueInfo venue={venue} />

            {/* Experiences */}
            <ExperienceList
              experiences={experiences}
              onBookExperience={handleBookExperience}
            />

            {/* Reviews */}
            <ReviewList
              reviews={reviews}
              venueRating={venue.rating}
              reviewCount={venue.review_count}
            />
          </div>

          {/* Right Column - Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 space-y-6">
              {/* Quick Info Card */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">Quick Info</h3>
                
                {/* Rating */}
                <div className="mb-4">
                  <div className="flex items-center">
                    <span className="text-2xl font-bold text-gray-900">{venue.rating.toFixed(1)}</span>
                    <div className="ml-2 flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <svg
                          key={i}
                          className={`w-5 h-5 ${
                            i < Math.floor(venue.rating) ? 'text-yellow-400' : 'text-gray-300'
                          } fill-current`}
                          viewBox="0 0 20 20"
                        >
                          <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                        </svg>
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{venue.review_count} reviews</p>
                </div>

                {/* Capacity */}
                {venue.capacity_min && venue.capacity_max && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700">Capacity</p>
                    <p className="text-gray-900">
                      {venue.capacity_min} - {venue.capacity_max} students
                    </p>
                  </div>
                )}

                {/* Booking Lead Time */}
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700">Booking Lead Time</p>
                  <p className="text-gray-900">{venue.booking_lead_time_days} days in advance</p>
                </div>

                {/* Contact */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">Contact</p>
                  {venue.contact_phone && (
                    <a
                      href={`tel:${venue.contact_phone}`}
                      className="flex items-center text-blue-600 hover:text-blue-800 text-sm"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                        />
                      </svg>
                      {venue.contact_phone}
                    </a>
                  )}
                  <a
                    href={`mailto:${venue.contact_email}`}
                    className="flex items-center text-blue-600 hover:text-blue-800 text-sm"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                    Email venue
                  </a>
                  {venue.website && (
                    <a
                      href={venue.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-blue-600 hover:text-blue-800 text-sm"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                        />
                      </svg>
                      Visit website
                    </a>
                  )}
                </div>
              </div>

              {/* Verified Badge */}
              {venue.verified && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <svg className="w-6 h-6 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <div>
                      <p className="font-semibold text-blue-900">Verified Venue</p>
                      <p className="text-sm text-blue-700">Profile verified by TripSlip</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
