import { useEffect, useRef } from 'react';
import { useTripCreationStore } from '../stores/tripCreationStore';
import { logger } from '@tripslip/utils';

/**
 * Auto-save hook for trip creation
 * 
 * Automatically saves draft every 30 seconds if there are changes.
 * Also saves on component unmount (navigation away).
 * 
 * @param interval - Auto-save interval in milliseconds (default: 30000 = 30 seconds)
 */
export function useAutoSave(interval: number = 30000) {
  const saveDraft = useTripCreationStore(state => state.saveDraft);
  const teacherId = useTripCreationStore(state => state.teacherId);
  const tripDetails = useTripCreationStore(state => state.tripDetails);
  const selectedStudents = useTripCreationStore(state => state.selectedStudents);
  const lastSavedRef = useRef<Date | null>(null);
  
  // Auto-save on interval
  useEffect(() => {
    if (!teacherId) return;
    
    const timer = setInterval(async () => {
      // Only save if there's content to save
      if (tripDetails || selectedStudents.length > 0) {
        try {
          await saveDraft();
          lastSavedRef.current = new Date();
          logger.debug('Auto-save completed');
        } catch (error) {
          logger.error('Auto-save failed', error as Error);
        }
      }
    }, interval);
    
    return () => clearInterval(timer);
  }, [saveDraft, teacherId, interval, tripDetails, selectedStudents]);
  
  // Save on unmount (navigation away)
  useEffect(() => {
    return () => {
      if (teacherId && (tripDetails || selectedStudents.length > 0)) {
        // Fire and forget - don't wait for completion
        saveDraft().catch(err => {
          logger.error('Failed to save draft on unmount', err);
        });
      }
    };
  }, [saveDraft, teacherId, tripDetails, selectedStudents]);
}
