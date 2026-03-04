/**
 * Capacity calculation utilities for venue experiences
 */

export interface CapacityInfo {
  totalCapacity: number;
  bookedCount: number;
  remainingCapacity: number;
  percentageBooked: number;
  isLowAvailability: boolean;
  isFullyBooked: boolean;
}

/**
 * Calculate capacity information for an experience
 */
export function calculateCapacity(
  totalCapacity: number,
  bookedCount: number
): CapacityInfo {
  const remainingCapacity = Math.max(0, totalCapacity - bookedCount);
  const percentageBooked = totalCapacity > 0 ? (bookedCount / totalCapacity) * 100 : 0;
  
  return {
    totalCapacity,
    bookedCount,
    remainingCapacity,
    percentageBooked,
    isLowAvailability: percentageBooked >= 80, // Less than 20% remaining
    isFullyBooked: remainingCapacity === 0,
  };
}

/**
 * Check if a booking would exceed capacity
 */
export function wouldExceedCapacity(
  totalCapacity: number,
  currentBookedCount: number,
  requestedCount: number
): boolean {
  return (currentBookedCount + requestedCount) > totalCapacity;
}

/**
 * Get capacity warning message
 */
export function getCapacityWarning(capacityInfo: CapacityInfo): string | null {
  if (capacityInfo.isFullyBooked) {
    return 'This experience is fully booked';
  }
  
  if (capacityInfo.isLowAvailability) {
    return `Only ${capacityInfo.remainingCapacity} spots remaining`;
  }
  
  return null;
}
