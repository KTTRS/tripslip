import { Badge } from '@tripslip/ui';

interface CapacityDisplayProps {
  totalCapacity: number;
  bookedCount: number;
  className?: string;
}

export function CapacityDisplay({ totalCapacity, bookedCount, className = '' }: CapacityDisplayProps) {
  const remainingCapacity = totalCapacity - bookedCount;
  const percentageBooked = (bookedCount / totalCapacity) * 100;
  
  // Determine warning level
  const isLow = percentageBooked >= 80; // Less than 20% remaining
  const isMedium = percentageBooked >= 60 && percentageBooked < 80;
  
  const getVariant = (): 'default' | 'success' | 'error' | 'outline' | 'yellow' | 'black' | 'inactive' => {
    if (remainingCapacity === 0) return 'error';
    if (isLow) return 'yellow';
    if (isMedium) return 'outline';
    return 'success';
  };
  
  const getStatusText = () => {
    if (remainingCapacity === 0) return 'Fully Booked';
    if (isLow) return 'Low Availability';
    if (isMedium) return 'Limited Availability';
    return 'Available';
  };
  
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="font-mono text-sm">
        <span className="font-semibold">{remainingCapacity}</span>
        <span className="text-gray-500"> / {totalCapacity}</span>
      </div>
      <Badge variant={getVariant()}>
        {getStatusText()}
      </Badge>
    </div>
  );
}
