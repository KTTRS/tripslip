import { describe, it, expect } from 'vitest';
import {
  calculateCapacity,
  wouldExceedCapacity,
  getCapacityWarning,
} from '../capacity-utils';

describe('capacity-utils', () => {
  describe('calculateCapacity', () => {
    it('should calculate remaining capacity correctly', () => {
      const result = calculateCapacity(100, 30);
      
      expect(result.totalCapacity).toBe(100);
      expect(result.bookedCount).toBe(30);
      expect(result.remainingCapacity).toBe(70);
      expect(result.percentageBooked).toBe(30);
      expect(result.isLowAvailability).toBe(false);
      expect(result.isFullyBooked).toBe(false);
    });

    it('should identify low availability when 80% or more booked', () => {
      const result = calculateCapacity(100, 80);
      
      expect(result.remainingCapacity).toBe(20);
      expect(result.percentageBooked).toBe(80);
      expect(result.isLowAvailability).toBe(true);
      expect(result.isFullyBooked).toBe(false);
    });

    it('should identify fully booked when capacity reached', () => {
      const result = calculateCapacity(100, 100);
      
      expect(result.remainingCapacity).toBe(0);
      expect(result.percentageBooked).toBe(100);
      expect(result.isLowAvailability).toBe(true);
      expect(result.isFullyBooked).toBe(true);
    });

    it('should handle zero capacity', () => {
      const result = calculateCapacity(0, 0);
      
      expect(result.totalCapacity).toBe(0);
      expect(result.bookedCount).toBe(0);
      expect(result.remainingCapacity).toBe(0);
      expect(result.percentageBooked).toBe(0);
      expect(result.isFullyBooked).toBe(true);
    });

    it('should not allow negative remaining capacity', () => {
      const result = calculateCapacity(100, 110);
      
      expect(result.remainingCapacity).toBe(0);
      expect(result.isFullyBooked).toBe(true);
    });
  });

  describe('wouldExceedCapacity', () => {
    it('should return false when booking fits within capacity', () => {
      expect(wouldExceedCapacity(100, 30, 50)).toBe(false);
    });

    it('should return false when booking exactly fills capacity', () => {
      expect(wouldExceedCapacity(100, 30, 70)).toBe(false);
    });

    it('should return true when booking exceeds capacity', () => {
      expect(wouldExceedCapacity(100, 30, 71)).toBe(true);
    });

    it('should return true when already at capacity', () => {
      expect(wouldExceedCapacity(100, 100, 1)).toBe(true);
    });

    it('should handle zero requested count', () => {
      expect(wouldExceedCapacity(100, 50, 0)).toBe(false);
    });
  });

  describe('getCapacityWarning', () => {
    it('should return null when capacity is available', () => {
      const capacityInfo = calculateCapacity(100, 50);
      expect(getCapacityWarning(capacityInfo)).toBeNull();
    });

    it('should return warning when low availability', () => {
      const capacityInfo = calculateCapacity(100, 85);
      const warning = getCapacityWarning(capacityInfo);
      
      expect(warning).toBe('Only 15 spots remaining');
    });

    it('should return fully booked message when no capacity', () => {
      const capacityInfo = calculateCapacity(100, 100);
      const warning = getCapacityWarning(capacityInfo);
      
      expect(warning).toBe('This experience is fully booked');
    });

    it('should prioritize fully booked over low availability', () => {
      const capacityInfo = calculateCapacity(100, 100);
      const warning = getCapacityWarning(capacityInfo);
      
      expect(warning).toBe('This experience is fully booked');
    });
  });
});
