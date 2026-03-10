import { useState, useEffect } from 'react'
import { Layout } from '../components/Layout'
import { useVenue } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'
import { Save, MapPin, Phone, Mail, Globe, Users } from 'lucide-react'

export default function VenueProfilePage() {
  const { venue, venueId, venueLoading, refetchVenue } = useVenue()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '',
    description: '',
    contact_email: '',
    contact_phone: '',
    website: '',
    street: '',
    city: '',
    state: '',
    zip: '',
    capacity_min: '',
    capacity_max: '',
  })

  useEffect(() => {
    if (venue) {
      const addr = venue.address || {}
      setForm({
        name: venue.name || '',
        description: venue.description || '',
        contact_email: venue.contact_email || '',
        contact_phone: venue.contact_phone || '',
        website: venue.website || '',
        street: addr.street || addr.line1 || '',
        city: addr.city || '',
        state: addr.state || '',
        zip: addr.zip || addr.postal_code || '',
        capacity_min: venue.capacity_min?.toString() || '',
        capacity_max: venue.capacity_max?.toString() || '',
      })
    }
  }, [venue])

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    if (!venueId) return

    try {
      setSaving(true)

      const { error } = await supabase
        .from('venues')
        .update({
          name: form.name,
          description: form.description,
          contact_email: form.contact_email,
          contact_phone: form.contact_phone || null,
          website: form.website || null,
          address: {
            street: form.street,
            city: form.city,
            state: form.state,
            zip: form.zip,
          },
          capacity_min: form.capacity_min ? parseInt(form.capacity_min) : null,
          capacity_max: form.capacity_max ? parseInt(form.capacity_max) : null,
        })
        .eq('id', venueId)

      if (error) throw error

      await refetchVenue()
      toast.success('Venue profile updated!')
    } catch (err) {
      console.error('Error saving venue:', err)
      toast.error('Failed to save venue profile')
    } finally {
      setSaving(false)
    }
  }

  if (venueLoading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#F5C518] border-t-[#0A0A0A]"></div>
          <p className="text-gray-600 font-semibold font-['Plus_Jakarta_Sans']">Loading profile...</p>
        </div>
      </Layout>
    )
  }

  if (!venueId || !venue) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto py-12">
          <div className="border-2 border-[#0A0A0A] rounded-2xl shadow-[4px_4px_0px_#0A0A0A] p-8 text-center bg-white">
            <img src="/images/char-green-octagon.png" alt="" className="w-24 h-24 mx-auto mb-6 object-contain" />
            <h2 className="text-3xl font-bold font-['Fraunces'] text-[#0A0A0A] mb-3">No Venue Found</h2>
            <p className="text-gray-600 font-['Plus_Jakarta_Sans']">
              Your account isn't linked to a venue yet. Contact support to get set up.
            </p>
          </div>
        </div>
      </Layout>
    )
  }

  const completeness = venue.profile_completeness || 0

  return (
    <Layout>
      <div className="space-y-8 max-w-4xl mx-auto">
        <div className="relative rounded-2xl border-2 border-black bg-gradient-to-r from-[#F5C518]/10 via-white to-emerald-50 p-6 shadow-[4px_4px_0px_0px_rgba(10,10,10,1)] overflow-hidden">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-5">
              <img src="/images/char-green-octagon.png" alt="" className="w-16 h-16 hidden sm:block" />
              <div>
                <h2 className="text-3xl font-bold font-['Fraunces']">Venue Profile</h2>
                <p className="text-gray-600 mt-1 font-['Plus_Jakarta_Sans']">Manage your venue details and information</p>
              </div>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2.5 bg-[#F5C518] text-black font-bold border-2 border-black rounded-xl hover:bg-[#F5C518]/80 transition-all shadow-[3px_3px_0px_#0A0A0A] hover:shadow-[1px_1px_0px_#0A0A0A] hover:translate-x-[2px] hover:translate-y-[2px] font-['Plus_Jakarta_Sans'] disabled:opacity-50"
            >
              <Save className="inline h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        <div className="border-2 border-[#0A0A0A] rounded-2xl shadow-[4px_4px_0px_#0A0A0A] p-6 bg-white">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold font-['Plus_Jakarta_Sans']">Profile Completeness</h3>
            <span className="text-sm font-bold font-['Plus_Jakarta_Sans']">{completeness}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 border border-[#0A0A0A]">
            <div
              className="bg-[#F5C518] h-full rounded-full transition-all"
              style={{ width: `${completeness}%` }}
            />
          </div>
          {venue.verified && (
            <div className="mt-3 flex items-center gap-2">
              <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full border border-emerald-300">Verified</span>
            </div>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="border-2 border-[#0A0A0A] rounded-2xl shadow-[4px_4px_0px_#0A0A0A] p-6 bg-white space-y-5">
            <h3 className="text-lg font-bold font-['Plus_Jakarta_Sans'] flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Basic Information
            </h3>

            <div>
              <label className="block text-sm font-bold font-['Plus_Jakarta_Sans'] mb-1">Venue Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className="w-full px-4 py-2.5 border-2 border-[#0A0A0A] rounded-xl focus:ring-2 focus:ring-[#F5C518] focus:border-[#F5C518] outline-none font-['Plus_Jakarta_Sans']"
              />
            </div>

            <div>
              <label className="block text-sm font-bold font-['Plus_Jakarta_Sans'] mb-1">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => handleChange('description', e.target.value)}
                rows={4}
                className="w-full px-4 py-2.5 border-2 border-[#0A0A0A] rounded-xl focus:ring-2 focus:ring-[#F5C518] focus:border-[#F5C518] outline-none font-['Plus_Jakarta_Sans'] resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-bold font-['Plus_Jakarta_Sans'] mb-1">
                <Globe className="inline h-4 w-4 mr-1" />
                Website
              </label>
              <input
                type="url"
                value={form.website}
                onChange={(e) => handleChange('website', e.target.value)}
                placeholder="https://www.yoursite.com"
                className="w-full px-4 py-2.5 border-2 border-[#0A0A0A] rounded-xl focus:ring-2 focus:ring-[#F5C518] focus:border-[#F5C518] outline-none font-['Plus_Jakarta_Sans']"
              />
            </div>
          </div>

          <div className="space-y-6">
            <div className="border-2 border-[#0A0A0A] rounded-2xl shadow-[4px_4px_0px_#0A0A0A] p-6 bg-white space-y-5">
              <h3 className="text-lg font-bold font-['Plus_Jakarta_Sans'] flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Contact Information
              </h3>

              <div>
                <label className="block text-sm font-bold font-['Plus_Jakarta_Sans'] mb-1">Email</label>
                <input
                  type="email"
                  value={form.contact_email}
                  onChange={(e) => handleChange('contact_email', e.target.value)}
                  className="w-full px-4 py-2.5 border-2 border-[#0A0A0A] rounded-xl focus:ring-2 focus:ring-[#F5C518] focus:border-[#F5C518] outline-none font-['Plus_Jakarta_Sans']"
                />
              </div>

              <div>
                <label className="block text-sm font-bold font-['Plus_Jakarta_Sans'] mb-1">
                  <Phone className="inline h-4 w-4 mr-1" />
                  Phone
                </label>
                <input
                  type="tel"
                  value={form.contact_phone}
                  onChange={(e) => handleChange('contact_phone', e.target.value)}
                  className="w-full px-4 py-2.5 border-2 border-[#0A0A0A] rounded-xl focus:ring-2 focus:ring-[#F5C518] focus:border-[#F5C518] outline-none font-['Plus_Jakarta_Sans']"
                />
              </div>
            </div>

            <div className="border-2 border-[#0A0A0A] rounded-2xl shadow-[4px_4px_0px_#0A0A0A] p-6 bg-white space-y-5">
              <h3 className="text-lg font-bold font-['Plus_Jakarta_Sans'] flex items-center gap-2">
                <Users className="h-5 w-5" />
                Capacity
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold font-['Plus_Jakarta_Sans'] mb-1">Min Students</label>
                  <input
                    type="number"
                    value={form.capacity_min}
                    onChange={(e) => handleChange('capacity_min', e.target.value)}
                    placeholder="e.g., 10"
                    className="w-full px-4 py-2.5 border-2 border-[#0A0A0A] rounded-xl focus:ring-2 focus:ring-[#F5C518] focus:border-[#F5C518] outline-none font-['Plus_Jakarta_Sans']"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold font-['Plus_Jakarta_Sans'] mb-1">Max Students</label>
                  <input
                    type="number"
                    value={form.capacity_max}
                    onChange={(e) => handleChange('capacity_max', e.target.value)}
                    placeholder="e.g., 150"
                    className="w-full px-4 py-2.5 border-2 border-[#0A0A0A] rounded-xl focus:ring-2 focus:ring-[#F5C518] focus:border-[#F5C518] outline-none font-['Plus_Jakarta_Sans']"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-2 border-[#0A0A0A] rounded-2xl shadow-[4px_4px_0px_#0A0A0A] p-6 bg-white space-y-5">
          <h3 className="text-lg font-bold font-['Plus_Jakarta_Sans'] flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Address
          </h3>

          <div>
            <label className="block text-sm font-bold font-['Plus_Jakarta_Sans'] mb-1">Street Address</label>
            <input
              type="text"
              value={form.street}
              onChange={(e) => handleChange('street', e.target.value)}
              className="w-full px-4 py-2.5 border-2 border-[#0A0A0A] rounded-xl focus:ring-2 focus:ring-[#F5C518] focus:border-[#F5C518] outline-none font-['Plus_Jakarta_Sans']"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-bold font-['Plus_Jakarta_Sans'] mb-1">City</label>
              <input
                type="text"
                value={form.city}
                onChange={(e) => handleChange('city', e.target.value)}
                className="w-full px-4 py-2.5 border-2 border-[#0A0A0A] rounded-xl focus:ring-2 focus:ring-[#F5C518] focus:border-[#F5C518] outline-none font-['Plus_Jakarta_Sans']"
              />
            </div>
            <div>
              <label className="block text-sm font-bold font-['Plus_Jakarta_Sans'] mb-1">State</label>
              <input
                type="text"
                value={form.state}
                onChange={(e) => handleChange('state', e.target.value)}
                className="w-full px-4 py-2.5 border-2 border-[#0A0A0A] rounded-xl focus:ring-2 focus:ring-[#F5C518] focus:border-[#F5C518] outline-none font-['Plus_Jakarta_Sans']"
              />
            </div>
            <div>
              <label className="block text-sm font-bold font-['Plus_Jakarta_Sans'] mb-1">ZIP Code</label>
              <input
                type="text"
                value={form.zip}
                onChange={(e) => handleChange('zip', e.target.value)}
                className="w-full px-4 py-2.5 border-2 border-[#0A0A0A] rounded-xl focus:ring-2 focus:ring-[#F5C518] focus:border-[#F5C518] outline-none font-['Plus_Jakarta_Sans']"
              />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
