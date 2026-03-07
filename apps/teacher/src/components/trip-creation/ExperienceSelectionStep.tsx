import { useState, useEffect } from 'react';
import { useTripCreationStore } from '../../stores/tripCreationStore';
import { supabase } from '../../lib/supabase';
import { Button } from '@tripslip/ui/components/button';
import { Input } from '@tripslip/ui/components/input';
import { Label } from '@tripslip/ui/components/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@tripslip/ui/components/card';
import { Badge } from '@tripslip/ui/components/badge';
import { toast } from 'sonner';
import { Search, MapPin, Clock, Check, Users, GraduationCap, Plus } from 'lucide-react';
import { CustomVenueForm } from './CustomVenueForm';

interface ExperienceWithDetails {
  id: string;
  venue_id: string;
  title: string;
  description: string | null;
  duration_minutes: number;
  capacity: number;
  min_students: number | null;
  max_students: number | null;
  grade_levels: string[] | null;
  subjects: string[] | null;
  active: boolean;
  published: boolean;
  created_at: string;
  updated_at: string;
  venue?: { name: string; address: any } | null;
  pricing_tiers?: { price_cents: number; min_students: number; max_students: number }[];
}

export function ExperienceSelectionStep() {
  const { selectedExperience, setSelectedExperience, nextStep, prevStep } = useTripCreationStore();

  const [experiences, setExperiences] = useState<ExperienceWithDetails[]>([]);
  const [filteredExperiences, setFilteredExperiences] = useState<ExperienceWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [selectedExp, setSelectedExp] = useState<ExperienceWithDetails | null>(
    selectedExperience as ExperienceWithDetails | null
  );

  useEffect(() => {
    fetchExperiences();
  }, []);

  useEffect(() => {
    filterExperiences();
  }, [searchQuery, experiences]);

  const fetchExperiences = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('experiences')
        .select('*, venue:venues(name, address), pricing_tiers(price_cents, min_students, max_students)')
        .eq('active', true)
        .eq('published', true)
        .order('title', { ascending: true });

      if (error) throw error;

      setExperiences(data || []);
      setFilteredExperiences(data || []);
    } catch (error) {
      console.error('Error fetching experiences:', error);
      toast.error('Failed to load experiences');
      setExperiences([]);
      setFilteredExperiences([]);
    } finally {
      setLoading(false);
    }
  };

  const filterExperiences = () => {
    if (!searchQuery.trim()) {
      setFilteredExperiences(experiences);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = experiences.filter((exp) =>
      exp.title.toLowerCase().includes(query) ||
      exp.description?.toLowerCase().includes(query) ||
      exp.venue?.name?.toLowerCase().includes(query) ||
      exp.subjects?.some(s => s.toLowerCase().includes(query)) ||
      exp.grade_levels?.some(g => g.toLowerCase().includes(query))
    );

    setFilteredExperiences(filtered);
  };

  const handleSelectExperience = (experience: ExperienceWithDetails) => {
    setSelectedExp(experience);
  };

  const handleCustomCreated = (experience: ExperienceWithDetails) => {
    setExperiences((prev) => [experience, ...prev]);
    setSelectedExp(experience);
    setShowCustomForm(false);
    setSelectedExperience(experience as any);
    nextStep();
  };

  const handleSubmit = () => {
    if (!selectedExp) {
      toast.error('Please select an experience');
      return;
    }

    setSelectedExperience(selectedExp as any);
    nextStep();
  };

  const getLowestPrice = (exp: ExperienceWithDetails): number | null => {
    if (!exp.pricing_tiers || exp.pricing_tiers.length === 0) return null;
    return Math.min(...exp.pricing_tiers.map(t => t.price_cents));
  };

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const getVenueLocation = (exp: ExperienceWithDetails): string | null => {
    if (!exp.venue) return null;
    const addr = exp.venue.address;
    if (!addr) return exp.venue.name;
    return `${exp.venue.name}, ${addr.city || ''} ${addr.state || ''}`.trim();
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}min`;
    if (mins === 0) return `${hours}hr`;
    return `${hours}hr ${mins}min`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F5C518] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading experiences...</p>
        </div>
      </div>
    );
  }

  if (showCustomForm) {
    return (
      <CustomVenueForm
        onCreated={handleCustomCreated}
        onCancel={() => setShowCustomForm(false)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="search" className="text-sm font-semibold text-[#0A0A0A]">Search Experiences</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            id="search"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, venue, subject, or grade..."
            className="pl-10 border-2 border-[#0A0A0A] focus:ring-[#F5C518] focus:border-[#F5C518]"
          />
        </div>
      </div>

      <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
        {filteredExperiences.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
            <Search className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600 font-medium">
              {searchQuery ? 'No experiences found matching your search' : 'No experiences available yet'}
            </p>
            <p className="text-sm text-gray-400 mt-1">
              {searchQuery ? 'Try adjusting your search terms' : 'Check back later for new experiences'}
            </p>
          </div>
        ) : (
          filteredExperiences.map((experience) => {
            const isSelected = selectedExp?.id === experience.id;
            const price = getLowestPrice(experience);
            const location = getVenueLocation(experience);

            return (
              <Card
                key={experience.id}
                className={`cursor-pointer transition-all duration-200 border-2 ${
                  isSelected
                    ? 'border-[#F5C518] shadow-[4px_4px_0px_#0A0A0A] bg-[#FFFDE7]'
                    : 'border-[#0A0A0A] hover:shadow-[4px_4px_0px_#0A0A0A] hover:translate-x-[-2px] hover:translate-y-[-2px]'
                }`}
                onClick={() => handleSelectExperience(experience)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2 text-[#0A0A0A]">
                        {experience.title}
                        {isSelected && (
                          <Badge className="bg-[#F5C518] text-[#0A0A0A] border border-[#0A0A0A]">
                            <Check className="h-3 w-3 mr-1" />
                            Selected
                          </Badge>
                        )}
                      </CardTitle>
                      {experience.description && (
                        <CardDescription className="mt-2 line-clamp-2">
                          {experience.description}
                        </CardDescription>
                      )}
                    </div>
                    {price !== null && (
                      <div className="text-right shrink-0">
                        <p className="text-xs text-gray-500 uppercase tracking-wide">From</p>
                        <p className="text-xl font-bold text-[#0A0A0A]">{formatCurrency(price)}</p>
                        <p className="text-xs text-gray-500">per student</p>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex flex-wrap gap-3 text-sm">
                    {location && (
                      <div className="flex items-center gap-1.5 text-gray-600">
                        <MapPin className="h-3.5 w-3.5" />
                        <span>{location}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 text-gray-600">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{formatDuration(experience.duration_minutes)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-gray-600">
                      <Users className="h-3.5 w-3.5" />
                      <span>{experience.min_students || 1}–{experience.max_students || experience.capacity} students</span>
                    </div>
                  </div>
                  {(experience.grade_levels?.length || experience.subjects?.length) && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {experience.grade_levels?.map((grade) => (
                        <Badge key={grade} variant="outline" className="text-xs border-[#0A0A0A] bg-gray-50">
                          <GraduationCap className="h-3 w-3 mr-1" />
                          {grade}
                        </Badge>
                      ))}
                      {experience.subjects?.map((subject) => (
                        <Badge key={subject} variant="outline" className="text-xs border-gray-400 text-gray-600">
                          {subject}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      <div className="text-center py-4">
        <p className="text-sm text-gray-500 mb-2">Don't see your destination?</p>
        <Button
          type="button"
          variant="outline"
          onClick={() => setShowCustomForm(true)}
          className="border-2 border-dashed border-[#F5C518] text-[#0A0A0A] hover:bg-[#FFFDE7] hover:border-solid font-semibold"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add a Custom Destination
        </Button>
      </div>

      <div className="flex justify-between pt-4 border-t border-gray-200">
        <Button
          type="button"
          variant="outline"
          onClick={prevStep}
          className="border-2 border-[#0A0A0A] hover:bg-gray-100"
        >
          Back
        </Button>

        <Button
          type="button"
          onClick={handleSubmit}
          disabled={!selectedExp}
          className="bg-[#F5C518] text-[#0A0A0A] border-2 border-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A] hover:shadow-[8px_8px_0px_#0A0A0A] hover:-translate-x-1 hover:-translate-y-1 transition-all duration-200 font-semibold disabled:opacity-50 disabled:shadow-none disabled:translate-x-0 disabled:translate-y-0"
        >
          Next: Add Students
        </Button>
      </div>
    </div>
  );
}
