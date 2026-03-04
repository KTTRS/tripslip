import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Layout } from '../components/Layout';
import { Button } from '@tripslip/ui/components/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@tripslip/ui/components/card';
import { Badge } from '@tripslip/ui/components/badge';
import { Switch } from '@tripslip/ui/components/switch';
import { Label } from '@tripslip/ui/components/label';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { ArrowLeft, Edit, Eye, Clock, Users, DollarSign } from 'lucide-react';

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
  created_at: string;
  updated_at: string;
}

interface PricingTier {
  id: string;
  min_students: number;
  max_students: number;
  price_cents: number;
  free_chaperones: number;
}

export default function ExperienceDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [experience, setExperience] = useState<Experience | null>(null);
  const [pricingTiers, setPricingTiers] = useState<PricingTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  
  useEffect(() => {
    if (id) {
      loadExperience();
    }
  }, [id]);
  
  const loadExperience = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      
      // Load experience
      const { data: expData, error: expError } = await supabase
        .from('experiences')
        .select('*')
        .eq('id', id)
        .single();
      
      if (expError) throw expError;
      setExperience(expData);
      
      // Load pricing tiers
      const { data: pricingData, error: pricingError } = await supabase
        .from('pricing_tiers')
        .select('*')
        .eq('experience_id', id)
        .order('min_students');
      
      if (!pricingError && pricingData) {
        setPricingTiers(pricingData);
      }
    } catch (error) {
      console.error('Error loading experience:', error);
      toast.error('Failed to load experience');
    } finally {
      setLoading(false);
    }
  };
  
  const togglePublished = async () => {
    if (!experience) return;
    
    try {
      setUpdating(true);
      const newPublishedState = !experience.published;
      
      const { error } = await supabase
        .from('experiences')
        .update({ published: newPublishedState })
        .eq('id', experience.id);
      
      if (error) throw error;
      
      setExperience({ ...experience, published: newPublishedState });
      toast.success(
        newPublishedState
          ? 'Experience published successfully'
          : 'Experience unpublished successfully'
      );
    } catch (error) {
      console.error('Error updating experience:', error);
      toast.error('Failed to update experience');
    } finally {
      setUpdating(false);
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
  
  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(cents / 100);
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-600">Loading experience...</p>
        </div>
      </Layout>
    );
  }
  
  if (!experience) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-gray-600 mb-4">Experience not found</p>
            <Button onClick={() => navigate('/experiences')}>
              Back to Experiences
            </Button>
          </div>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/experiences')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-3xl font-bold">{experience.title}</h2>
                <Badge variant={experience.published ? 'success' : 'inactive'}>
                  {experience.published ? 'Published' : 'Draft'}
                </Badge>
              </div>
              <p className="text-gray-600 mt-1">
                Last updated: {formatDate(experience.updated_at)}
              </p>
            </div>
          </div>
          <Button onClick={() => navigate(`/experiences/${id}/edit`)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </div>
        
        {/* Publish/Unpublish Control */}
        <Card className="border-2 border-black shadow-offset">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="published" className="text-base font-semibold">
                  {experience.published ? 'Published' : 'Unpublished'}
                </Label>
                <p className="text-sm text-gray-600 mt-1">
                  {experience.published
                    ? 'This experience is visible to teachers'
                    : 'This experience is hidden from teachers'}
                </p>
              </div>
              <Switch
                id="published"
                checked={experience.published}
                onCheckedChange={togglePublished}
                disabled={updating}
              />
            </div>
          </CardContent>
        </Card>
        
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm text-gray-600">Description</Label>
              <p className="mt-1">{experience.description || 'No description provided'}</p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-sm text-gray-600 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Duration
                </Label>
                <p className="mt-1 font-semibold">{formatDuration(experience.duration_minutes)}</p>
              </div>
              
              <div>
                <Label className="text-sm text-gray-600 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Capacity
                </Label>
                <p className="mt-1 font-semibold">{experience.capacity} students</p>
              </div>
              
              <div>
                <Label className="text-sm text-gray-600 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Student Range
                </Label>
                <p className="mt-1 font-semibold">
                  {experience.min_students}-{experience.max_students} students
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Educational Details */}
        {(experience.grade_levels.length > 0 || experience.subjects.length > 0) && (
          <Card>
            <CardHeader>
              <CardTitle>Educational Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {experience.grade_levels.length > 0 && (
                <div>
                  <Label className="text-sm text-gray-600">Grade Levels</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {experience.grade_levels.map((grade, idx) => (
                      <Badge key={idx} variant="outline">
                        Grade {grade}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {experience.subjects.length > 0 && (
                <div>
                  <Label className="text-sm text-gray-600">Subjects</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {experience.subjects.map((subject, idx) => (
                      <Badge key={idx} variant="outline">
                        {subject}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
        
        {/* Pricing */}
        {pricingTiers.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Pricing Tiers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pricingTiers.map((tier) => (
                  <div
                    key={tier.id}
                    className="flex justify-between items-center p-4 bg-gray-50 rounded"
                  >
                    <div>
                      <p className="font-semibold">
                        {tier.min_students}-{tier.max_students} students
                      </p>
                      {tier.free_chaperones > 0 && (
                        <p className="text-sm text-gray-600">
                          {tier.free_chaperones} free chaperone(s)
                        </p>
                      )}
                    </div>
                    <p className="text-lg font-bold">{formatCurrency(tier.price_cents)}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Teacher Preview */}
        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Teacher Preview
            </CardTitle>
            <CardDescription>
              This is how teachers will see your experience
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Card className="border-2 border-black shadow-offset bg-white">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{experience.title}</CardTitle>
                    <CardDescription className="mt-1">
                      {experience.description}
                    </CardDescription>
                  </div>
                  <Badge variant={experience.published ? 'success' : 'inactive'}>
                    {experience.published ? 'Available' : 'Unavailable'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-gray-700">
                    <Clock className="h-4 w-4" />
                    <span>{formatDuration(experience.duration_minutes)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <Users className="h-4 w-4" />
                    <span>
                      {experience.min_students}-{experience.max_students} students
                    </span>
                  </div>
                  {pricingTiers.length > 0 && (
                    <div className="flex items-center gap-2 text-gray-700">
                      <DollarSign className="h-4 w-4" />
                      <span>
                        Starting at {formatCurrency(pricingTiers[0].price_cents)}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
