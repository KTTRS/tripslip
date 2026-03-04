import { useState, useEffect } from 'react';
import { useTripCreationStore } from '../../stores/tripCreationStore';
import { supabase } from '../../lib/supabase';
import type { Tables } from '@tripslip/database';
import { Button } from '@tripslip/ui/components/button';
import { Input } from '@tripslip/ui/components/input';
import { Label } from '@tripslip/ui/components/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@tripslip/ui/components/card';
import { Badge } from '@tripslip/ui/components/badge';
import { toast } from 'sonner';
import { Search, MapPin, Calendar, DollarSign, Check } from 'lucide-react';

type Experience = Tables<'experiences'>;

export function ExperienceSelectionStep() {
  const { selectedExperience, setSelectedExperience, nextStep, prevStep } = useTripCreationStore();
  
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [filteredExperiences, setFilteredExperiences] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExp, setSelectedExp] = useState<Experience | null>(selectedExperience);
  
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
        .select('*')
        .order('title', { ascending: true });
      
      if (error) throw error;
      
      setExperiences(data || []);
      setFilteredExperiences(data || []);
    } catch (error) {
      console.error('Error fetching experiences:', error);
      toast.error('Failed to load experiences');
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
      exp.location?.toLowerCase().includes(query)
    );
    
    setFilteredExperiences(filtered);
  };
  
  const handleSelectExperience = (experience: Experience) => {
    setSelectedExp(experience);
  };
  
  const handleSubmit = () => {
    if (!selectedExp) {
      toast.error('Please select an experience');
      return;
    }
    
    setSelectedExperience(selectedExp);
    nextStep();
  };
  
  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading experiences...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="space-y-2">
        <Label htmlFor="search">Search Experiences</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            id="search"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, description, or location..."
            className="pl-10"
          />
        </div>
      </div>
      
      {/* Experience List */}
      <div className="space-y-4 max-h-[500px] overflow-y-auto">
        {filteredExperiences.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">
              {searchQuery ? 'No experiences found matching your search' : 'No experiences available'}
            </p>
          </div>
        ) : (
          filteredExperiences.map((experience) => (
            <Card
              key={experience.id}
              className={`cursor-pointer transition-all ${
                selectedExp?.id === experience.id
                  ? 'ring-2 ring-blue-600 border-blue-600'
                  : 'hover:border-gray-400'
              }`}
              onClick={() => handleSelectExperience(experience)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      {experience.title}
                      {selectedExp?.id === experience.id && (
                        <Badge variant="default" className="bg-blue-600">
                          <Check className="h-3 w-3 mr-1" />
                          Selected
                        </Badge>
                      )}
                    </CardTitle>
                    {experience.description && (
                      <CardDescription className="mt-2">
                        {experience.description}
                      </CardDescription>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  {experience.location && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin className="h-4 w-4" />
                      <span>{experience.location}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDate(experience.event_date)}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-gray-600">
                    <DollarSign className="h-4 w-4" />
                    <span className="font-semibold text-gray-900">
                      {formatCurrency(experience.cost_cents)} per student
                    </span>
                  </div>
                </div>
                
                {experience.event_time && (
                  <div className="mt-2 text-sm text-gray-600">
                    Time: {experience.event_time}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
      
      {/* Action Buttons */}
      <div className="flex justify-between pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={prevStep}
        >
          Back
        </Button>
        
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={!selectedExp}
        >
          Next: Add Students
        </Button>
      </div>
    </div>
  );
}
