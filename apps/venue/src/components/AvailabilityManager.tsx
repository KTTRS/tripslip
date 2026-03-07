import { useState, useEffect } from 'react';
import { Button } from '@tripslip/ui/components/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@tripslip/ui/components/card';
import { Input } from '@tripslip/ui/components/input';
import { Label } from '@tripslip/ui/components/label';
import { Alert, AlertDescription } from '@tripslip/ui/components/alert';
import { Calendar, Plus, X, AlertCircle, CheckCircle, Ban } from 'lucide-react';
import { supabase } from '../lib/supabase';

export interface AvailabilityDate {
  id?: string;
  experience_id: string;
  available_date: string;
  start_time?: string;
  end_time?: string;
  capacity: number;
  booked_count: number;
}

interface AvailabilityManagerProps {
  experienceId: string;
  onAvailabilityChange?: () => void;
}

/**
 * AvailabilityManager - Component for managing experience availability dates
 * 
 * Features:
 * - Add/remove specific available dates with capacity
 * - Block dates when venue is unavailable
 * - Real-time updates to availability
 * - Visual indicators for available, blocked, and fully booked dates
 * - Follows TripSlip design system (Yellow #F5C518, Black #0A0A0A, 2px borders, offset shadows)
 * 
 * Requirements:
 * - Requirement 6.2: Availability updates in real-time
 * - Requirement 6.10: Venues can block specific dates
 * 
 * @example
 * ```tsx
 * <AvailabilityManager
 *   experienceId="experience-uuid"
 *   onAvailabilityChange={() => logger.info('Availability updated')}
 * />
 * ```
 */
export function AvailabilityManager({
  experienceId,
  onAvailabilityChange,
}: AvailabilityManagerProps) {
  const [availabilityDates, setAvailabilityDates] = useState<AvailabilityDate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Form state for adding new dates
  const [newDate, setNewDate] = useState('');
  const [newStartTime, setNewStartTime] = useState('09:00');
  const [newEndTime, setNewEndTime] = useState('15:00');
  const [newCapacity, setNewCapacity] = useState(30);

  // Load existing availability dates
  useEffect(() => {
    loadAvailability();
  }, [experienceId]);

  const loadAvailability = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('availability')
        .select('*')
        .eq('experience_id', experienceId)
        .order('available_date', { ascending: true });

      if (fetchError) throw fetchError;

      setAvailabilityDates(data || []);
    } catch (err) {
      console.error('Error loading availability:', err);
      setError('Failed to load availability dates. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const addAvailabilityDate = async () => {
    if (!newDate) {
      setError('Please select a date');
      return;
    }

    if (newCapacity < 1) {
      setError('Capacity must be at least 1');
      return;
    }

    // Check if date already exists
    const existingDate = availabilityDates.find(
      (d) => d.available_date === newDate
    );

    if (existingDate) {
      setError('This date already has availability configured');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      setSuccess(null);

      const { data, error: insertError } = await supabase
        .from('availability')
        .insert({
          experience_id: experienceId,
          available_date: newDate,
          start_time: newStartTime || null,
          end_time: newEndTime || null,
          capacity: newCapacity,
          booked_count: 0,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      setAvailabilityDates([...availabilityDates, data]);
      setSuccess('Availability date added successfully');
      
      // Reset form
      setNewDate('');
      setNewCapacity(30);
      
      onAvailabilityChange?.();
    } catch (err) {
      console.error('Error adding availability:', err);
      setError('Failed to add availability date. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const removeAvailabilityDate = async (dateId: string) => {
    try {
      setIsSaving(true);
      setError(null);
      setSuccess(null);

      const { error: deleteError } = await supabase
        .from('availability')
        .delete()
        .eq('id', dateId);

      if (deleteError) throw deleteError;

      setAvailabilityDates(availabilityDates.filter((d) => d.id !== dateId));
      setSuccess('Availability date removed successfully');
      
      onAvailabilityChange?.();
    } catch (err) {
      console.error('Error removing availability:', err);
      setError('Failed to remove availability date. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const updateCapacity = async (dateId: string, newCapacity: number) => {
    if (newCapacity < 1) {
      setError('Capacity must be at least 1');
      return;
    }

    try {
      setError(null);
      setSuccess(null);

      const { error: updateError } = await supabase
        .from('availability')
        .update({ capacity: newCapacity })
        .eq('id', dateId);

      if (updateError) throw updateError;

      setAvailabilityDates(
        availabilityDates.map((d) =>
          d.id === dateId ? { ...d, capacity: newCapacity } : d
        )
      );
      
      setSuccess('Capacity updated successfully');
      onAvailabilityChange?.();
    } catch (err) {
      console.error('Error updating capacity:', err);
      setError('Failed to update capacity. Please try again.');
    }
  };

  const getDateStatus = (date: AvailabilityDate) => {
    if (date.capacity === 0) {
      return { label: 'Blocked', color: 'text-red-600', icon: Ban };
    }
    if (date.booked_count >= date.capacity) {
      return { label: 'Fully Booked', color: 'text-orange-600', icon: AlertCircle };
    }
    return { label: 'Available', color: 'text-green-600', icon: CheckCircle };
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <Card className="border-2 border-black">
        <CardContent className="py-8 text-center">
          <p className="text-gray-600">Loading availability...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(10,10,10,1)]">
        <CardHeader>
          <CardTitle className="font-fraunces text-2xl flex items-center gap-2">
            <Calendar className="h-6 w-6" />
            Availability Management
          </CardTitle>
          <CardDescription>
            Set available dates and capacity for your experience. Block dates when unavailable.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Error/Success Messages */}
          {error && (
            <Alert variant="destructive" className="border-2 border-black">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-2 border-black bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">{success}</AlertDescription>
            </Alert>
          )}

          {/* Add New Date Form */}
          <div className="space-y-4 p-4 border-2 border-black rounded-md bg-yellow-50">
            <h4 className="font-semibold font-jakarta">Add Available Date</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="new-date" className="font-jakarta">
                  Date *
                </Label>
                <Input
                  id="new-date"
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="border-2 border-black"
                />
              </div>

              <div>
                <Label htmlFor="new-start-time" className="font-jakarta">
                  Start Time
                </Label>
                <Input
                  id="new-start-time"
                  type="time"
                  value={newStartTime}
                  onChange={(e) => setNewStartTime(e.target.value)}
                  className="border-2 border-black"
                />
              </div>

              <div>
                <Label htmlFor="new-end-time" className="font-jakarta">
                  End Time
                </Label>
                <Input
                  id="new-end-time"
                  type="time"
                  value={newEndTime}
                  onChange={(e) => setNewEndTime(e.target.value)}
                  className="border-2 border-black"
                />
              </div>

              <div>
                <Label htmlFor="new-capacity" className="font-jakarta">
                  Capacity *
                </Label>
                <Input
                  id="new-capacity"
                  type="number"
                  min="0"
                  value={newCapacity}
                  onChange={(e) => setNewCapacity(parseInt(e.target.value) || 0)}
                  className="border-2 border-black"
                  placeholder="Set to 0 to block"
                />
              </div>
            </div>

            <Button
              onClick={addAvailabilityDate}
              disabled={isSaving || !newDate}
              className="bg-[#F5C518] text-black border-2 border-black shadow-[4px_4px_0px_0px_rgba(10,10,10,1)] hover:shadow-[8px_8px_0px_0px_rgba(10,10,10,1)] hover:-translate-x-1 hover:-translate-y-1 transition-all font-jakarta font-semibold"
            >
              <Plus className="h-4 w-4 mr-2" />
              {newCapacity === 0 ? 'Block Date' : 'Add Available Date'}
            </Button>
          </div>

          {/* Existing Availability Dates */}
          <div className="space-y-4">
            <h4 className="font-semibold font-jakarta">Configured Dates</h4>

            {availabilityDates.length === 0 ? (
              <Card className="border-2 border-dashed border-gray-300">
                <CardContent className="py-8 text-center">
                  <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                  <p className="text-gray-600 mb-2 font-jakarta">No availability dates configured</p>
                  <p className="text-sm text-gray-500 font-jakarta">
                    Add dates above to set when your experience is available
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {availabilityDates.map((date) => {
                  const status = getDateStatus(date);
                  const StatusIcon = status.icon;

                  return (
                    <Card
                      key={date.id}
                      className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(10,10,10,1)]"
                    >
                      <CardContent className="py-4">
                        <div className="flex items-center gap-4">
                          {/* Date Info */}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-semibold font-jakarta">
                                {formatDate(date.available_date)}
                              </p>
                              <span className={`flex items-center gap-1 text-sm ${status.color} font-jakarta`}>
                                <StatusIcon className="h-4 w-4" />
                                {status.label}
                              </span>
                            </div>
                            {date.start_time && date.end_time && (
                              <p className="text-sm text-gray-600 font-mono">
                                {date.start_time} - {date.end_time}
                              </p>
                            )}
                          </div>

                          {/* Capacity */}
                          <div className="flex items-center gap-2">
                            <Label htmlFor={`capacity-${date.id}`} className="text-sm font-jakarta">
                              Capacity:
                            </Label>
                            <Input
                              id={`capacity-${date.id}`}
                              type="number"
                              min="0"
                              value={date.capacity}
                              onChange={(e) =>
                                updateCapacity(date.id!, parseInt(e.target.value) || 0)
                              }
                              className="w-20 border-2 border-black font-mono"
                            />
                          </div>

                          {/* Booked Count */}
                          <div className="text-center">
                            <p className="text-sm text-gray-600 font-jakarta">Booked</p>
                            <p className="font-semibold font-mono">
                              {date.booked_count} / {date.capacity}
                            </p>
                          </div>

                          {/* Remove Button */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeAvailabilityDate(date.id!)}
                            disabled={isSaving || date.booked_count > 0}
                            className="border-2 border-black hover:bg-red-50"
                            title={
                              date.booked_count > 0
                                ? 'Cannot remove date with bookings'
                                : 'Remove date'
                            }
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* Help Text */}
          <div className="text-sm text-gray-600 space-y-1 font-jakarta">
            <p>• Set capacity to 0 to block a date (venue closed or unavailable)</p>
            <p>• Dates with bookings cannot be removed</p>
            <p>• Capacity changes take effect immediately for new bookings</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
