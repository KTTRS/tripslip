/**
 * Venue Map View Component
 * 
 * Displays venues on a map with markers using Google Maps API
 * Falls back to list view if API key is not configured
 * 
 * Requirements: 3.7
 */

import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import type { VenueSearchHit } from '@tripslip/database';
import { logger } from '@tripslip/utils';

interface VenueMapViewProps {
  venues: VenueSearchHit[];
  loading: boolean;
  center?: { lat: number; lng: number };
}

export function VenueMapView({ venues, loading, center }: VenueMapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [mapError, setMapError] = useState<string | null>(null);
  const [mapInitialized, setMapInitialized] = useState(false);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);

  const hasApiKey = !!import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  useEffect(() => {
    if (!hasApiKey || !mapRef.current) return;

    const initMap = async () => {
      try {
        // Dynamically import Google Maps loader
        const { Loader } = await import('@googlemaps/js-api-loader');
        
        const loader = new Loader({
          apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
          version: 'weekly',
          libraries: ['places']
        });

        const google = await loader.load();
        
        // Initialize map
        const map = new google.maps.Map(mapRef.current!, {
          center: center || { lat: 37.7749, lng: -122.4194 }, // Default to San Francisco
          zoom: 10,
          mapTypeControl: true,
          streetViewControl: true,
          fullscreenControl: true,
        });

        googleMapRef.current = map;
        setMapInitialized(true);
        logger.info('Google Maps initialized successfully');
      } catch (error) {
        logger.error('Failed to initialize Google Maps', { error });
        setMapError('Failed to load map. Please check your API key configuration.');
      }
    };

    initMap();
  }, [hasApiKey, center]);

  // Update markers when venues change
  useEffect(() => {
    if (!mapInitialized || !googleMapRef.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Add new markers
    venues.forEach(venue => {
      if (!venue.location) return;

      const marker = new google.maps.Marker({
        position: venue.location,
        map: googleMapRef.current!,
        title: venue.name,
        animation: google.maps.Animation.DROP,
      });

      // Add click listener to navigate to venue detail
      marker.addListener('click', () => {
        logger.debug('Marker clicked', { venueId: venue.id, venueName: venue.name });
        navigate(`/venues/${venue.id}`);
      });

      // Add info window
      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="padding: 8px; max-width: 200px;">
            <h3 style="margin: 0 0 4px 0; font-weight: 600;">${venue.name}</h3>
            <p style="margin: 0; font-size: 12px; color: #666;">
              ⭐ ${venue.rating.toFixed(1)} • ${venue.experienceCount} experiences
            </p>
            ${venue.distanceMiles !== undefined ? 
              `<p style="margin: 4px 0 0 0; font-size: 12px; color: #666;">${venue.distanceMiles.toFixed(1)} miles away</p>` 
              : ''}
          </div>
        `,
      });

      marker.addListener('mouseover', () => {
        infoWindow.open(googleMapRef.current!, marker);
      });

      marker.addListener('mouseout', () => {
        infoWindow.close();
      });

      markersRef.current.push(marker);
    });

    // Fit bounds to show all markers
    if (venues.length > 0 && markersRef.current.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      markersRef.current.forEach(marker => {
        const position = marker.getPosition();
        if (position) bounds.extend(position);
      });
      googleMapRef.current!.fitBounds(bounds);
    }
  }, [venues, mapInitialized, navigate]);

  return (
    <div className="relative">
      {/* Map Container */}
      <div
        ref={mapRef}
        className="w-full h-[600px] bg-gray-100 rounded-lg flex items-center justify-center"
      >
        {/* Fallback Content - shown when API key is missing */}
        {!hasApiKey && (
          <div className="text-center p-8">
            <svg
              className="mx-auto h-16 w-16 text-gray-400 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
              />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Map View</h3>
            <p className="text-sm text-gray-600 mb-4">
              Map functionality requires Google Maps API configuration
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left max-w-md mx-auto">
              <p className="text-sm text-blue-800 mb-2">
                <strong>To enable map view:</strong>
              </p>
              <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                <li>Add VITE_GOOGLE_MAPS_API_KEY to .env file</li>
                <li>Install: npm install @googlemaps/js-api-loader</li>
                <li>Restart the development server</li>
              </ol>
            </div>
            
            {/* Show venue count */}
            {!loading && venues.length > 0 && (
              <div className="mt-6">
                <p className="text-sm text-gray-600">
                  {venues.length} {venues.length === 1 ? 'venue' : 'venues'} ready to display on map
                </p>
              </div>
            )}
          </div>
        )}

        {/* Error Message */}
        {mapError && (
          <div className="text-center p-8">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md mx-auto">
              <p className="text-sm text-red-800">{mapError}</p>
            </div>
          </div>
        )}
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Venue List Sidebar (for map view) */}
      {!loading && venues.length > 0 && (
        <div className="mt-4 bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Venues ({venues.length})
          </h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {venues.map(venue => (
              <div
                key={venue.id}
                className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                onClick={() => {
                  logger.debug('Navigating to venue detail from map', { venueId: venue.id, venueName: venue.name });
                  navigate(`/venues/${venue.id}`);
                }}
              >
                {venue.primaryPhotoUrl ? (
                  <img
                    src={venue.primaryPhotoUrl}
                    alt={venue.name}
                    className="w-16 h-16 object-cover rounded"
                  />
                ) : (
                  <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      />
                    </svg>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-gray-900 truncate">
                    {venue.name}
                  </h4>
                  <div className="flex items-center text-xs text-gray-500 mt-1">
                    <span className="flex items-center">
                      ⭐ {venue.rating.toFixed(1)}
                    </span>
                    {venue.distanceMiles !== undefined && (
                      <>
                        <span className="mx-1">•</span>
                        <span>{venue.distanceMiles.toFixed(1)} mi</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
