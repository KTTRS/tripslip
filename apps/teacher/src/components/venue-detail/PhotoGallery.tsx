/**
 * Photo Gallery Component
 * 
 * Displays venue photos with lightbox functionality:
 * - Primary photo with large display
 * - Thumbnail grid for additional photos
 * - Lightbox modal for full-size viewing
 * - Navigation between photos
 * 
 * Requirements: 4.1
 */

import { useState } from 'react';
import type { VenuePhoto } from '@tripslip/database';

interface PhotoGalleryProps {
  primaryPhotoUrl: string | null;
  photos: VenuePhoto[];
  venueName: string;
}

export function PhotoGallery({ primaryPhotoUrl, photos, venueName }: PhotoGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  // Combine primary photo with additional photos
  const allPhotos = [
    ...(primaryPhotoUrl ? [{ url: primaryPhotoUrl, caption: venueName }] : []),
    ...photos.map((p) => ({ url: p.url, caption: p.caption || '' })),
  ];

  const openLightbox = (index: number) => {
    setCurrentPhotoIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
  };

  const goToPrevious = () => {
    setCurrentPhotoIndex((prev) => (prev === 0 ? allPhotos.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentPhotoIndex((prev) => (prev === allPhotos.length - 1 ? 0 : prev + 1));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') goToPrevious();
    if (e.key === 'ArrowRight') goToNext();
  };

  if (allPhotos.length === 0) {
    return (
      <div className="bg-gray-200 rounded-lg h-96 flex items-center justify-center">
        <div className="text-center text-gray-400">
          <svg className="w-24 h-24 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <p>No photos available</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Gallery Grid */}
      <div className="grid grid-cols-4 gap-2">
        {/* Main Photo */}
        <div
          className="col-span-4 md:col-span-3 row-span-2 cursor-pointer relative group overflow-hidden rounded-lg"
          onClick={() => openLightbox(0)}
        >
          <img
            src={allPhotos[0].url}
            alt={allPhotos[0].caption}
            className="w-full h-96 object-cover transition-transform group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity flex items-center justify-center">
            <svg
              className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition-opacity"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
              />
            </svg>
          </div>
        </div>

        {/* Thumbnail Grid */}
        {allPhotos.slice(1, 5).map((photo, index) => (
          <div
            key={index}
            className="cursor-pointer relative group overflow-hidden rounded-lg"
            onClick={() => openLightbox(index + 1)}
          >
            <img
              src={photo.url}
              alt={photo.caption}
              className="w-full h-44 object-cover transition-transform group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity" />
          </div>
        ))}

        {/* Show More Button */}
        {allPhotos.length > 5 && (
          <div
            className="cursor-pointer relative group overflow-hidden rounded-lg bg-gray-900"
            onClick={() => openLightbox(5)}
          >
            <img
              src={allPhotos[5].url}
              alt={allPhotos[5].caption}
              className="w-full h-44 object-cover opacity-50"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-white text-center">
                <p className="text-2xl font-bold">+{allPhotos.length - 5}</p>
                <p className="text-sm">More Photos</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 bg-black bg-opacity-95 flex items-center justify-center"
          onClick={closeLightbox}
          onKeyDown={handleKeyDown}
          tabIndex={0}
        >
          {/* Close Button */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
            aria-label="Close lightbox"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Previous Button */}
          {allPhotos.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                goToPrevious();
              }}
              className="absolute left-4 text-white hover:text-gray-300 z-10"
              aria-label="Previous photo"
            >
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          {/* Image */}
          <div
            className="max-w-7xl max-h-screen p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={allPhotos[currentPhotoIndex].url}
              alt={allPhotos[currentPhotoIndex].caption}
              className="max-w-full max-h-[85vh] object-contain mx-auto"
            />
            {allPhotos[currentPhotoIndex].caption && (
              <p className="text-white text-center mt-4 text-lg">
                {allPhotos[currentPhotoIndex].caption}
              </p>
            )}
            <p className="text-gray-400 text-center mt-2">
              {currentPhotoIndex + 1} / {allPhotos.length}
            </p>
          </div>

          {/* Next Button */}
          {allPhotos.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                goToNext();
              }}
              className="absolute right-4 text-white hover:text-gray-300 z-10"
              aria-label="Next photo"
            >
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>
      )}
    </>
  );
}
