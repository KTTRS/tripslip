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
import { ArrowLeft, Edit, Eye, Clock, Users, Link2, Copy, Check, Plus } from 'lucide-react';
import { SendTeacherLinkModal } from '../components/SendTeacherLinkModal';

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


export default function ExperienceDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [experience, setExperience] = useState<Experience | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [hasLinkedForms, setHasLinkedForms] = useState(false);
  const [generatedTrips, setGeneratedTrips] = useState<Array<{
    id: string;
    trip_date: string;
    direct_link_token: string;
    student_count: number;
    status: string;
    teacher_email?: string;
  }>>([]);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  
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
      
      const { data: linkedForms } = await supabase
        .from('experience_forms')
        .select('form_id')
        .eq('experience_id', id);
      setHasLinkedForms(!!(linkedForms && linkedForms.length > 0));

      const { data: tripsData } = await supabase
        .from('trips')
        .select('id, trip_date, direct_link_token, student_count, status')
        .eq('experience_id', id)
        .order('created_at', { ascending: false });
      if (tripsData) {
        setGeneratedTrips(tripsData.filter((t: any) => t.direct_link_token));
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
  
  const handleCopyLink = async (link: string, id: string) => {
    const fullUrl = `${window.location.origin}${link}`;
    try {
      await navigator.clipboard.writeText(fullUrl);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = fullUrl;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    setCopiedLink(id);
    toast.success('Link copied to clipboard');
    setTimeout(() => setCopiedLink(null), 2000);
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
          <div className="flex gap-2">
            {hasLinkedForms && (
              <Button
                onClick={() => setShowSendModal(true)}
                className="bg-[#F5C518] hover:bg-[#F5C518]/90 text-black border-2 border-black shadow-[4px_4px_0px_0px_rgba(10,10,10,1)] hover:shadow-[2px_2px_0px_0px_rgba(10,10,10,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
              >
                <Plus className="h-4 w-4 mr-2" />
                Generate Consent Link
              </Button>
            )}
            <Button onClick={() => navigate(`/experiences/${id}/edit`)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </div>
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

        {generatedTrips.length > 0 && (
          <Card className="border-2 border-[#F5C518] shadow-[4px_4px_0px_0px_rgba(10,10,10,1)] bg-[#F5C518]/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Link2 className="h-5 w-5" />
                Consent Links
              </CardTitle>
              <CardDescription>
                Copy these links and send them to teachers. Teachers can forward the parent link, or you can send the parent link directly.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {generatedTrips.map((trip) => {
                  const teacherLink = `/teacher/trip/${trip.direct_link_token}/review`;
                  const parentLink = `/parent/trip/${trip.direct_link_token}`;
                  const tripDateFormatted = new Date(trip.trip_date + 'T00:00:00').toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  });
                  return (
                    <div key={trip.id} className="border-2 border-black rounded-lg p-5 bg-white space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-lg text-[#0A0A0A]">{tripDateFormatted}</span>
                          <Badge variant={trip.status === 'confirmed' ? 'success' : 'secondary'}>
                            {trip.status}
                          </Badge>
                        </div>
                        <span className="text-sm text-gray-500">{trip.student_count} students</span>
                      </div>

                      <div className="space-y-3">
                        <div className="border-2 border-black rounded-lg p-4 bg-gray-50">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-bold text-[#0A0A0A]">Teacher Link</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              readOnly
                              value={`${window.location.origin}${teacherLink}`}
                              className="flex-1 text-sm font-mono bg-white border-2 border-gray-300 rounded px-3 py-2 select-all cursor-text"
                              onClick={(e) => (e.target as HTMLInputElement).select()}
                            />
                            <button
                              onClick={() => handleCopyLink(teacherLink, `teacher-${trip.id}`)}
                              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm border-2 border-black transition-all ${
                                copiedLink === `teacher-${trip.id}`
                                  ? 'bg-green-500 text-white'
                                  : 'bg-[#F5C518] text-black hover:bg-[#F5C518]/80 shadow-[2px_2px_0px_#0A0A0A] hover:shadow-[1px_1px_0px_#0A0A0A] hover:translate-x-[1px] hover:translate-y-[1px]'
                              }`}
                            >
                              {copiedLink === `teacher-${trip.id}` ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                              {copiedLink === `teacher-${trip.id}` ? 'Copied!' : 'Copy'}
                            </button>
                          </div>
                          <p className="text-xs text-gray-500 mt-2">Send to the teacher. They review the form and forward a parent link.</p>
                        </div>

                        <div className="border-2 border-gray-300 rounded-lg p-4 bg-gray-50">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-bold text-[#0A0A0A]">Parent Link</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              readOnly
                              value={`${window.location.origin}${parentLink}`}
                              className="flex-1 text-sm font-mono bg-white border-2 border-gray-300 rounded px-3 py-2 select-all cursor-text"
                              onClick={(e) => (e.target as HTMLInputElement).select()}
                            />
                            <button
                              onClick={() => handleCopyLink(parentLink, `parent-${trip.id}`)}
                              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm border-2 border-black transition-all ${
                                copiedLink === `parent-${trip.id}`
                                  ? 'bg-green-500 text-white'
                                  : 'bg-white text-black hover:bg-gray-100 shadow-[2px_2px_0px_#0A0A0A] hover:shadow-[1px_1px_0px_#0A0A0A] hover:translate-x-[1px] hover:translate-y-[1px]'
                              }`}
                            >
                              {copiedLink === `parent-${trip.id}` ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                              {copiedLink === `parent-${trip.id}` ? 'Copied!' : 'Copy'}
                            </button>
                          </div>
                          <p className="text-xs text-gray-500 mt-2">Send directly to parents if the teacher won't be using the portal.</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
        
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
                </div>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      </div>

      {experience && (
        <SendTeacherLinkModal
          open={showSendModal}
          onLinkGenerated={loadExperience}
          onOpenChange={setShowSendModal}
          experienceId={experience.id}
          experienceTitle={experience.title}
        />
      )}
    </Layout>
  );
}
