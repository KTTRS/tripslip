import { useState } from 'react';
import { Button } from '@tripslip/ui/components/button';
import { Card, CardContent } from '@tripslip/ui/components/card';
import { Input } from '@tripslip/ui/components/input';
import { Label } from '@tripslip/ui/components/label';
import { Checkbox } from '@tripslip/ui/components/checkbox';
import { Plus, X } from 'lucide-react';

export interface AvailabilitySlot {
  id: string;
  day_of_week: number; // 0 = Sunday, 6 = Saturday
  start_time: string;
  end_time: string;
  capacity: number;
}

export interface BlackoutDate {
  id: string;
  date: string;
  reason: string;
}

interface AvailabilityConfigurationProps {
  availabilitySlots: AvailabilitySlot[];
  blackoutDates: BlackoutDate[];
  onSlotsChange: (slots: AvailabilitySlot[]) => void;
  onBlackoutDatesChange: (dates: BlackoutDate[]) => void;
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' }
];

export function AvailabilityConfiguration({
  availabilitySlots,
  blackoutDates,
  onSlotsChange,
  onBlackoutDatesChange
}: AvailabilityConfigurationProps) {
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]); // Mon-Fri default
  
  const addTimeSlot = () => {
    const newSlots = selectedDays.map(day => ({
      id: `temp-${Date.now()}-${day}`,
      day_of_week: day,
      start_time: '09:00',
      end_time: '15:00',
      capacity: 30
    }));
    onSlotsChange([...availabilitySlots, ...newSlots]);
  };
  
  const removeSlot = (index: number) => {
    onSlotsChange(availabilitySlots.filter((_, i) => i !== index));
  };
  
  const updateSlot = (index: number, field: keyof AvailabilitySlot, value: any) => {
    const newSlots = [...availabilitySlots];
    newSlots[index] = { ...newSlots[index], [field]: value };
    onSlotsChange(newSlots);
  };
  
  const addBlackoutDate = () => {
    const newDate: BlackoutDate = {
      id: `temp-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      reason: ''
    };
    onBlackoutDatesChange([...blackoutDates, newDate]);
  };
  
  const removeBlackoutDate = (index: number) => {
    onBlackoutDatesChange(blackoutDates.filter((_, i) => i !== index));
  };
  
  const updateBlackoutDate = (index: number, field: keyof BlackoutDate, value: string) => {
    const newDates = [...blackoutDates];
    newDates[index] = { ...newDates[index], [field]: value };
    onBlackoutDatesChange(newDates);
  };
  
  const toggleDay = (day: number) => {
    setSelectedDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };
  
  const getDayLabel = (dayOfWeek: number) => {
    return DAYS_OF_WEEK.find(d => d.value === dayOfWeek)?.label || 'Unknown';
  };
  
  return (
    <div className="space-y-6">
      {/* Time Slots */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h4 className="font-semibold">Available Time Slots</h4>
        </div>
        
        <div className="space-y-4">
          <div>
            <Label className="mb-2 block">Select Days of Week</Label>
            <div className="flex flex-wrap gap-2">
              {DAYS_OF_WEEK.map(day => (
                <label
                  key={day.value}
                  className="flex items-center gap-2 px-3 py-2 border rounded cursor-pointer hover:bg-gray-50"
                >
                  <Checkbox
                    checked={selectedDays.includes(day.value)}
                    onCheckedChange={() => toggleDay(day.value)}
                  />
                  <span className="text-sm">{day.label}</span>
                </label>
              ))}
            </div>
          </div>
          
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addTimeSlot}
            disabled={selectedDays.length === 0}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Time Slots for Selected Days
          </Button>
        </div>
        
        {availabilitySlots.length === 0 ? (
          <Card className="border-2 border-dashed">
            <CardContent className="py-8 text-center">
              <p className="text-gray-600 mb-2">No time slots configured</p>
              <p className="text-sm text-gray-500">
                Select days and add time slots to set your availability
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {availabilitySlots.map((slot, index) => (
              <Card key={slot.id} className="border">
                <CardContent className="py-3">
                  <div className="flex items-center gap-4">
                    <div className="flex-1 grid grid-cols-4 gap-4">
                      <div>
                        <Label className="text-xs">Day</Label>
                        <p className="font-medium">{getDayLabel(slot.day_of_week)}</p>
                      </div>
                      <div>
                        <Label className="text-xs">Start Time</Label>
                        <Input
                          type="time"
                          value={slot.start_time}
                          onChange={(e) => updateSlot(index, 'start_time', e.target.value)}
                          className="h-8"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">End Time</Label>
                        <Input
                          type="time"
                          value={slot.end_time}
                          onChange={(e) => updateSlot(index, 'end_time', e.target.value)}
                          className="h-8"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Capacity</Label>
                        <Input
                          type="number"
                          value={slot.capacity}
                          onChange={(e) => updateSlot(index, 'capacity', parseInt(e.target.value))}
                          className="h-8"
                        />
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSlot(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      
      {/* Blackout Dates */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h4 className="font-semibold">Blackout Dates</h4>
          <Button type="button" variant="outline" size="sm" onClick={addBlackoutDate}>
            <Plus className="h-4 w-4 mr-2" />
            Add Blackout Date
          </Button>
        </div>
        
        {blackoutDates.length === 0 ? (
          <Card className="border-2 border-dashed">
            <CardContent className="py-8 text-center">
              <p className="text-gray-600 mb-2">No blackout dates</p>
              <p className="text-sm text-gray-500">
                Add dates when your experience is unavailable
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {blackoutDates.map((blackout, index) => (
              <Card key={blackout.id} className="border">
                <CardContent className="py-3">
                  <div className="flex items-center gap-4">
                    <div className="flex-1 grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs">Date</Label>
                        <Input
                          type="date"
                          value={blackout.date}
                          onChange={(e) => updateBlackoutDate(index, 'date', e.target.value)}
                          className="h-8"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Reason (optional)</Label>
                        <Input
                          type="text"
                          value={blackout.reason}
                          onChange={(e) => updateBlackoutDate(index, 'reason', e.target.value)}
                          placeholder="e.g., Holiday, Maintenance"
                          className="h-8"
                        />
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeBlackoutDate(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
