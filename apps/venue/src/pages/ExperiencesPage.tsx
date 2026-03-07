import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Layout } from '../components/Layout';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent } from '@tripslip/ui';
import { Badge } from '@tripslip/ui/components/badge';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { Plus, Edit, Eye } from 'lucide-react';

interface Experience {
  id: string;
  title: string;
  description: string | null;
  duration_minutes: number;
  capacity: number;
  min_students: number | null;
  max_students: number | null;
  published: boolean;
  grade_levels: string[];
  subjects: string[];
}

export default function ExperiencesPage() {
  const navigate = useNavigate();
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadExperiences();
  }, []);
  
  const loadExperiences = async () => {
    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in');
        navigate('/login');
        return;
      }
      
      const { data: venueUser, error: venueError } = await supabase
        .from('venue_users')
        .select('venue_id')
        .eq('user_id', user.id)
        .single();
      
      if (venueError || !venueUser) {
        toast.error('Could not find venue association');
        return;
      }
      
      const { data, error } = await supabase
        .from('experiences')
        .select('*')
        .eq('venue_id', venueUser.venue_id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setExperiences(data || []);
    } catch (error) {
      console.error('Error loading experiences:', error);
      toast.error('Failed to load experiences');
    } finally {
      setLoading(false);
    }
  };
  
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0 && mins > 0) {
      return `${hours}h ${mins}m`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else {
      return `${mins}m`;
    }
  };
  
  if (loading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F5C518]"></div>
          <p className="text-gray-600 font-medium">Loading experiences...</p>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="space-y-8">
        <div className="relative bg-gradient-to-r from-[#F5C518]/20 via-white to-[#4ECDC4]/20 border-2 border-[#0A0A0A] rounded-xl shadow-[4px_4px_0px_#0A0A0A] p-6 overflow-hidden">
          <div className="absolute top-2 right-4 w-16 h-16 animate-bounce" style={{ animationDuration: '3s' }}>
            <img src="/images/char-green-octagon.png" alt="" className="w-full h-full object-contain" />
          </div>
          <div className="absolute top-1 right-24 w-8 h-8 opacity-40 animate-pulse">
            <img src="/images/icon-magic.png" alt="" className="w-full h-full object-contain" />
          </div>
          <div className="absolute bottom-1 right-40 w-7 h-7 opacity-30 animate-pulse" style={{ animationDelay: '1s' }}>
            <img src="/images/icon-venue.png" alt="" className="w-full h-full object-contain" />
          </div>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-[#F5C518]/20 border-2 border-[#0A0A0A] flex items-center justify-center p-2">
                <img src="/images/icon-venue.png" alt="" className="w-full h-full object-contain" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-[#0A0A0A]">Experiences</h2>
                <p className="text-gray-600 mt-1">Manage your educational experiences</p>
              </div>
            </div>
            <Button
              className="bg-[#F5C518] text-[#0A0A0A] border-2 border-[#0A0A0A] shadow-[3px_3px_0px_#0A0A0A] hover:shadow-[1px_1px_0px_#0A0A0A] hover:translate-x-[2px] hover:translate-y-[2px] transition-all font-semibold"
              onClick={() => navigate('/experiences/new')}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Experience
            </Button>
          </div>
        </div>

        {experiences.length === 0 ? (
          <Card className="border-2 border-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A] rounded-xl">
            <CardContent className="py-12 text-center">
              <div className="flex justify-center mb-4">
                <div className="w-20 h-20 rounded-xl bg-[#F5C518]/20 border-2 border-[#0A0A0A] flex items-center justify-center p-3">
                  <img src="/images/icon-magic.png" alt="" className="w-full h-full object-contain" />
                </div>
              </div>
              <p className="text-gray-600 mb-4 font-medium">No experiences yet</p>
              <Button
                className="bg-[#F5C518] text-[#0A0A0A] border-2 border-[#0A0A0A] shadow-[3px_3px_0px_#0A0A0A] hover:shadow-[1px_1px_0px_#0A0A0A] hover:translate-x-[2px] hover:translate-y-[2px] transition-all font-semibold"
                onClick={() => navigate('/experiences/new')}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Experience
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {experiences.map((experience) => (
              <Card key={experience.id} className="border-2 border-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A] rounded-xl hover:shadow-[2px_2px_0px_#0A0A0A] hover:translate-x-[1px] hover:translate-y-[1px] transition-all">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="line-clamp-1">{experience.title}</CardTitle>
                      <CardDescription className="line-clamp-2 mt-1">
                        {experience.description || 'No description'}
                      </CardDescription>
                    </div>
                    <Badge variant={experience.published ? 'success' : 'inactive'}>
                      {experience.published ? 'Published' : 'Draft'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-700">
                      <div className="w-6 h-6 flex-shrink-0">
                        <img src="/images/icon-calendar.png" alt="" className="w-full h-full object-contain" />
                      </div>
                      <span>{formatDuration(experience.duration_minutes)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <div className="w-6 h-6 flex-shrink-0">
                        <img src="/images/icon-team.png" alt="" className="w-full h-full object-contain" />
                      </div>
                      <span>
                        {experience.min_students && experience.max_students
                          ? `${experience.min_students}-${experience.max_students} students`
                          : `Up to ${experience.capacity} students`}
                      </span>
                    </div>
                    {experience.grade_levels && experience.grade_levels.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {experience.grade_levels.slice(0, 3).map((grade, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            Grade {grade}
                          </Badge>
                        ))}
                        {experience.grade_levels.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{experience.grade_levels.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 border-2 border-[#0A0A0A] rounded-xl hover:bg-[#F5C518]/10 transition-all"
                      onClick={() => navigate(`/experiences/${experience.id}/edit`)}
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 border-2 border-[#0A0A0A] rounded-xl hover:bg-[#F5C518]/10 transition-all"
                      onClick={() => navigate(`/experiences/${experience.id}`)}
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
