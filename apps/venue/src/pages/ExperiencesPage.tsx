import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Layout } from '../components/Layout';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent } from '@tripslip/ui';
import { Badge } from '@tripslip/ui/components/badge';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { Plus, Edit, Eye, Clock, Users } from 'lucide-react';

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
      
      // Get current user's venue
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in');
        navigate('/login');
        return;
      }
      
      // Get venue_id from venue_users
      const { data: venueUser, error: venueError } = await supabase
        .from('venue_users')
        .select('venue_id')
        .eq('user_id', user.id)
        .single();
      
      if (venueError || !venueUser) {
        toast.error('Could not find venue association');
        return;
      }
      
      // Load experiences for this venue
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
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-600">Loading experiences...</p>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold">Experiences</h2>
            <p className="text-gray-600 mt-2">Manage your educational experiences</p>
          </div>
          <Button
            className="shadow-offset"
            onClick={() => navigate('/experiences/new')}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Experience
          </Button>
        </div>

        {experiences.length === 0 ? (
          <Card className="border-2 border-black shadow-offset">
            <CardContent className="py-12 text-center">
              <p className="text-gray-600 mb-4">No experiences yet</p>
              <Button onClick={() => navigate('/experiences/new')}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Experience
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {experiences.map((experience) => (
              <Card key={experience.id} className="border-2 border-black shadow-offset">
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
                      <Clock className="h-4 w-4" />
                      <span>{formatDuration(experience.duration_minutes)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <Users className="h-4 w-4" />
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
                      className="flex-1"
                      onClick={() => navigate(`/experiences/${experience.id}/edit`)}
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
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
