import { useState, useEffect } from 'react';
import { Card, CardContent } from '@tripslip/ui/components/card';
import { Button } from '@tripslip/ui/components/button';
import { Input } from '@tripslip/ui/components/input';
import { Label } from '@tripslip/ui/components/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@tripslip/ui/components/select';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { X } from 'lucide-react';

interface BookingFiltersProps {
  onFilterChange: (filters: {
    status?: string;
    experienceId?: string;
    startDate?: string;
    endDate?: string;
  }) => void;
}

interface Experience {
  id: string;
  title: string;
}

export function BookingFilters({ onFilterChange }: BookingFiltersProps) {
  const { user } = useAuth();
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [filters, setFilters] = useState({
    status: '',
    experienceId: '',
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    if (user) {
      loadExperiences();
    }
  }, [user]);

  const loadExperiences = async () => {
    try {
      // Get venue_id for current user
      const { data: venueUser, error: venueError } = await supabase
        .from('venue_users')
        .select('venue_id')
        .eq('user_id', user!.id)
        .single();

      if (venueError) throw venueError;
      if (!venueUser) return;

      // Load experiences for this venue
      const { data, error } = await supabase
        .from('experiences')
        .select('id, title')
        .eq('venue_id', venueUser.venue_id)
        .eq('active', true)
        .order('title');

      if (error) throw error;
      setExperiences(data || []);
    } catch (error) {
      console.error('Error loading experiences:', error);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    
    // Remove empty filters
    const cleanFilters = Object.fromEntries(
      Object.entries(newFilters).filter(([_, v]) => v !== '')
    );
    
    onFilterChange(cleanFilters);
  };

  const clearFilters = () => {
    const emptyFilters = {
      status: '',
      experienceId: '',
      startDate: '',
      endDate: ''
    };
    setFilters(emptyFilters);
    onFilterChange({});
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== '');

  return (
    <Card className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(10,10,10,1)]">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold font-['Plus_Jakarta_Sans']">Filters</h3>
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
              className="border-2 border-black hover:bg-gray-100 font-['Plus_Jakarta_Sans'] font-semibold"
            >
              <X className="h-4 w-4 mr-2" />
              Clear All
            </Button>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          {/* Status Filter */}
          <div className="space-y-2">
            <Label htmlFor="status" className="font-['Plus_Jakarta_Sans'] font-semibold">
              Status
            </Label>
            <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
              <SelectTrigger className="border-2 border-black focus:ring-[#F5C518] focus:border-[#F5C518]">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="modified">Modified</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Experience Filter */}
          <div className="space-y-2">
            <Label htmlFor="experience" className="font-['Plus_Jakarta_Sans'] font-semibold">
              Experience
            </Label>
            <Select value={filters.experienceId} onValueChange={(value) => handleFilterChange('experienceId', value)}>
              <SelectTrigger className="border-2 border-black focus:ring-[#F5C518] focus:border-[#F5C518]">
                <SelectValue placeholder="All experiences" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All experiences</SelectItem>
                {experiences.map((experience) => (
                  <SelectItem key={experience.id} value={experience.id}>
                    {experience.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Start Date Filter */}
          <div className="space-y-2">
            <Label htmlFor="startDate" className="font-['Plus_Jakarta_Sans'] font-semibold">
              From Date
            </Label>
            <Input
              id="startDate"
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="border-2 border-black focus:ring-[#F5C518] focus:border-[#F5C518] font-['Space_Mono']"
            />
          </div>

          {/* End Date Filter */}
          <div className="space-y-2">
            <Label htmlFor="endDate" className="font-['Plus_Jakarta_Sans'] font-semibold">
              To Date
            </Label>
            <Input
              id="endDate"
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="border-2 border-black focus:ring-[#F5C518] focus:border-[#F5C518] font-['Space_Mono']"
            />
          </div>
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="mt-4 pt-4 border-t-2 border-gray-200">
            <p className="text-sm text-gray-600 mb-2 font-['Plus_Jakarta_Sans']">Active filters:</p>
            <div className="flex flex-wrap gap-2">
              {filters.status && (
                <span className="px-2 py-1 bg-[#F5C518] text-black text-xs font-semibold rounded border-2 border-black">
                  Status: {filters.status}
                </span>
              )}
              {filters.experienceId && (
                <span className="px-2 py-1 bg-[#F5C518] text-black text-xs font-semibold rounded border-2 border-black">
                  Experience: {experiences.find(e => e.id === filters.experienceId)?.title || 'Selected'}
                </span>
              )}
              {filters.startDate && (
                <span className="px-2 py-1 bg-[#F5C518] text-black text-xs font-semibold rounded border-2 border-black">
                  From: {filters.startDate}
                </span>
              )}
              {filters.endDate && (
                <span className="px-2 py-1 bg-[#F5C518] text-black text-xs font-semibold rounded border-2 border-black">
                  To: {filters.endDate}
                </span>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}