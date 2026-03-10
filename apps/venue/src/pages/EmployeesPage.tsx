import { useState, useEffect, useCallback } from 'react'
import { Layout } from '../components/Layout'
import { useVenue, useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { Users, UserPlus, Shield, Eye, Pencil, Trash2, RotateCcw, ChevronDown } from 'lucide-react'

type VenueRole = 'administrator' | 'editor' | 'viewer'

interface TeamMember {
  id: string
  user_id: string
  venue_id: string
  role: VenueRole
  invited_by: string | null
  invited_at: string | null
  accepted_at: string | null
  deactivated_at: string | null
  created_at: string
}

const ROLE_LABELS: Record<VenueRole, string> = {
  administrator: 'Administrator',
  editor: 'Editor',
  viewer: 'Viewer',
}

const ROLE_ICONS: Record<VenueRole, typeof Shield> = {
  administrator: Shield,
  editor: Pencil,
  viewer: Eye,
}

const ROLE_COLORS: Record<VenueRole, string> = {
  administrator: 'bg-red-100 text-red-800 border-red-300',
  editor: 'bg-blue-100 text-blue-800 border-blue-300',
  viewer: 'bg-gray-100 text-gray-700 border-gray-300',
}

export function EmployeesPage() {
  const { venueId, venueLoading } = useVenue()
  const { user } = useAuth()
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showDeactivated, setShowDeactivated] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [roleDropdownOpen, setRoleDropdownOpen] = useState<string | null>(null)

  const currentUserId = user?.id || null

  const fetchMembers = useCallback(async () => {
    if (!venueId) return
    try {
      setLoading(true)
      setError(null)

      let query = supabase
        .from('venue_users')
        .select('*')
        .eq('venue_id', venueId)
        .order('created_at', { ascending: true })

      if (!showDeactivated) {
        query = query.is('deactivated_at', null)
      }

      const { data, error: fetchError } = await query

      if (fetchError) throw fetchError
      setMembers((data || []) as TeamMember[])
    } catch (err) {
      console.error('Error fetching team members:', err)
      setError(err instanceof Error ? err.message : 'Failed to load team members')
    } finally {
      setLoading(false)
    }
  }, [venueId, showDeactivated])

  useEffect(() => {
    if (venueLoading) return
    if (!venueId) {
      setMembers([])
      setLoading(false)
      return
    }
    fetchMembers()
  }, [venueId, venueLoading, fetchMembers])

  const currentUserMember = members.find(m => m.user_id === currentUserId)
  const isAdmin = currentUserMember?.role === 'administrator'
  const activeAdminCount = members.filter(m => m.role === 'administrator' && !m.deactivated_at).length

  const handleRoleChange = async (memberId: string, newRole: VenueRole) => {
    setActionLoading(memberId)
    setRoleDropdownOpen(null)
    try {
      const { error: updateError } = await supabase
        .from('venue_users')
        .update({ role: newRole })
        .eq('id', memberId)

      if (updateError) throw updateError
      await fetchMembers()
    } catch (err) {
      console.error('Error updating role:', err)
      setError(err instanceof Error ? err.message : 'Failed to update role')
    } finally {
      setActionLoading(null)
    }
  }

  const handleDeactivate = async (memberId: string) => {
    const member = members.find(m => m.id === memberId)
    if (!member) return

    if (member.user_id === currentUserId && activeAdminCount <= 1 && member.role === 'administrator') {
      setError("You can't remove yourself — you're the only administrator.")
      return
    }

    setActionLoading(memberId)
    try {
      const { error: updateError } = await supabase
        .from('venue_users')
        .update({ deactivated_at: new Date().toISOString() })
        .eq('id', memberId)

      if (updateError) throw updateError
      await fetchMembers()
    } catch (err) {
      console.error('Error deactivating member:', err)
      setError(err instanceof Error ? err.message : 'Failed to remove member')
    } finally {
      setActionLoading(null)
    }
  }

  const handleReactivate = async (memberId: string) => {
    setActionLoading(memberId)
    try {
      const { error: updateError } = await supabase
        .from('venue_users')
        .update({ deactivated_at: null })
        .eq('id', memberId)

      if (updateError) throw updateError
      await fetchMembers()
    } catch (err) {
      console.error('Error reactivating member:', err)
      setError(err instanceof Error ? err.message : 'Failed to reactivate member')
    } finally {
      setActionLoading(null)
    }
  }

  const getMemberStatus = (member: TeamMember): { label: string; color: string } => {
    if (member.deactivated_at) return { label: 'Deactivated', color: 'bg-red-100 text-red-700 border-red-300' }
    if (member.accepted_at) return { label: 'Active', color: 'bg-green-100 text-green-700 border-green-300' }
    return { label: 'Pending', color: 'bg-yellow-100 text-yellow-700 border-yellow-300' }
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const truncateId = (id: string) => {
    if (id === 'pending') return 'Pending invite'
    return id.substring(0, 8) + '…'
  }

  if (venueLoading || loading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#F5C518] border-t-[#0A0A0A]"></div>
          <p className="text-gray-600 font-semibold font-['Plus_Jakarta_Sans']">Loading team...</p>
        </div>
      </Layout>
    )
  }

  if (!venueId) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto py-12">
          <div className="border-2 border-[#0A0A0A] rounded-2xl shadow-[4px_4px_0px_#0A0A0A] p-8 text-center bg-white">
            <div className="text-6xl mb-6">👥</div>
            <h2 className="text-3xl font-bold font-['Fraunces'] text-[#0A0A0A] mb-3">No Venue Found</h2>
            <p className="text-gray-600 font-['Plus_Jakarta_Sans']">
              Your account isn't linked to a venue yet. Contact support to get set up.
            </p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-8">
        <div className="relative rounded-2xl border-2 border-black bg-gradient-to-r from-[#F5C518]/10 via-white to-emerald-50 p-6 shadow-[4px_4px_0px_0px_rgba(10,10,10,1)] overflow-hidden">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div className="flex items-center gap-5">
              <img
                src="/images/char-blue-square.png"
                alt="TripSlip team mascot"
                className="w-16 h-16 animate-bounce-slow hidden sm:block"
              />
              <div>
                <h2 className="text-3xl font-bold font-['Fraunces']">Team Management</h2>
                <p className="text-gray-600 mt-1 font-['Plus_Jakarta_Sans']">
                  Manage your venue team members and roles.
                </p>
              </div>
            </div>
            <div className="flex gap-3 flex-wrap">
              <label className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-[#0A0A0A] rounded-lg shadow-[2px_2px_0px_#0A0A0A] cursor-pointer font-['Plus_Jakarta_Sans'] text-sm font-semibold select-none">
                <input
                  type="checkbox"
                  checked={showDeactivated}
                  onChange={(e) => setShowDeactivated(e.target.checked)}
                  className="accent-[#F5C518]"
                />
                Show deactivated
              </label>
              {isAdmin && (
                <button
                  onClick={() => setShowInviteModal(true)}
                  className="flex items-center gap-2 px-5 py-2 bg-[#F5C518] text-[#0A0A0A] font-bold border-2 border-[#0A0A0A] rounded-lg shadow-[3px_3px_0px_#0A0A0A] hover:shadow-[1px_1px_0px_#0A0A0A] hover:translate-x-[2px] hover:translate-y-[2px] transition-all font-['Plus_Jakarta_Sans']"
                >
                  <UserPlus className="h-5 w-5" />
                  Invite Member
                </button>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="border-2 border-red-400 bg-red-50 rounded-xl p-4 text-red-700 font-['Plus_Jakarta_Sans'] font-semibold flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 font-bold text-xl leading-none">&times;</button>
          </div>
        )}

        {members.length === 0 ? (
          <div className="border-2 border-[#0A0A0A] rounded-2xl shadow-[4px_4px_0px_#0A0A0A] bg-white p-12 text-center">
            <Users className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-2xl font-bold font-['Fraunces'] text-[#0A0A0A] mb-2">No team members yet</h3>
            <p className="text-gray-600 font-['Plus_Jakarta_Sans'] mb-6">
              Invite your first team member to get started.
            </p>
            {isAdmin && (
              <button
                onClick={() => setShowInviteModal(true)}
                className="px-6 py-3 bg-[#F5C518] text-[#0A0A0A] font-bold border-2 border-[#0A0A0A] rounded-xl shadow-[4px_4px_0px_#0A0A0A] hover:shadow-[2px_2px_0px_#0A0A0A] hover:translate-x-[2px] hover:translate-y-[2px] transition-all font-['Plus_Jakarta_Sans']"
              >
                <UserPlus className="inline h-5 w-5 mr-2" />
                Invite Member
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {members.map((member) => {
              const status = getMemberStatus(member)
              const RoleIcon = ROLE_ICONS[member.role]
              const isCurrentUser = member.user_id === currentUserId
              const isSoleAdmin = isCurrentUser && member.role === 'administrator' && activeAdminCount <= 1
              const isDeactivated = !!member.deactivated_at

              return (
                <div
                  key={member.id}
                  className={`border-2 border-[#0A0A0A] rounded-xl shadow-[3px_3px_0px_#0A0A0A] bg-white p-5 transition-all ${
                    isCurrentUser ? 'ring-2 ring-[#F5C518] ring-offset-2' : ''
                  } ${isDeactivated ? 'opacity-60' : ''}`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className={`flex-shrink-0 w-12 h-12 rounded-full border-2 border-[#0A0A0A] flex items-center justify-center ${
                        isCurrentUser ? 'bg-[#F5C518]' : 'bg-gray-100'
                      }`}>
                        <RoleIcon className="h-5 w-5 text-[#0A0A0A]" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold font-['Plus_Jakarta_Sans'] text-[#0A0A0A]">
                            {isCurrentUser ? 'You' : truncateId(member.user_id)}
                          </span>
                          {isCurrentUser && (
                            <span className="text-xs px-2 py-0.5 bg-[#F5C518] text-[#0A0A0A] border border-[#0A0A0A] rounded-full font-bold font-['Plus_Jakarta_Sans']">
                              You
                            </span>
                          )}
                          <span className={`text-xs px-2 py-0.5 border rounded-full font-semibold font-['Plus_Jakarta_Sans'] ${status.color}`}>
                            {status.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 font-['Plus_Jakarta_Sans'] flex-wrap">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 border rounded-full text-xs font-semibold ${ROLE_COLORS[member.role]}`}>
                            {ROLE_LABELS[member.role]}
                          </span>
                          <span>Joined {formatDate(member.created_at)}</span>
                          {member.invited_at && <span>Invited {formatDate(member.invited_at)}</span>}
                        </div>
                      </div>
                    </div>

                    {isAdmin && !isDeactivated && (
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="relative">
                          <button
                            onClick={() => setRoleDropdownOpen(roleDropdownOpen === member.id ? null : member.id)}
                            disabled={actionLoading === member.id || (isSoleAdmin)}
                            className="flex items-center gap-1 px-3 py-2 text-sm bg-white border-2 border-[#0A0A0A] rounded-lg shadow-[2px_2px_0px_#0A0A0A] hover:shadow-[1px_1px_0px_#0A0A0A] hover:translate-x-[1px] hover:translate-y-[1px] transition-all font-['Plus_Jakarta_Sans'] font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {ROLE_LABELS[member.role]}
                            <ChevronDown className="h-4 w-4" />
                          </button>
                          {roleDropdownOpen === member.id && (
                            <div className="absolute right-0 top-full mt-1 z-10 bg-white border-2 border-[#0A0A0A] rounded-lg shadow-[3px_3px_0px_#0A0A0A] overflow-hidden min-w-[160px]">
                              {(['administrator', 'editor', 'viewer'] as VenueRole[]).map((role) => (
                                <button
                                  key={role}
                                  onClick={() => handleRoleChange(member.id, role)}
                                  disabled={role === member.role}
                                  className={`w-full text-left px-4 py-2 text-sm font-['Plus_Jakarta_Sans'] font-semibold hover:bg-[#F5C518]/20 transition-colors ${
                                    role === member.role ? 'bg-gray-100 text-gray-400' : 'text-[#0A0A0A]'
                                  }`}
                                >
                                  {ROLE_LABELS[role]}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        <button
                          onClick={() => handleDeactivate(member.id)}
                          disabled={actionLoading === member.id || isSoleAdmin}
                          title={isSoleAdmin ? "Can't remove the only administrator" : 'Remove member'}
                          className="p-2 text-red-600 bg-white border-2 border-red-300 rounded-lg shadow-[2px_2px_0px_rgba(239,68,68,0.3)] hover:shadow-[1px_1px_0px_rgba(239,68,68,0.3)] hover:translate-x-[1px] hover:translate-y-[1px] hover:bg-red-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}

                    {isAdmin && isDeactivated && (
                      <button
                        onClick={() => handleReactivate(member.id)}
                        disabled={actionLoading === member.id}
                        className="flex items-center gap-2 px-4 py-2 text-sm bg-white border-2 border-[#0A0A0A] rounded-lg shadow-[2px_2px_0px_#0A0A0A] hover:shadow-[1px_1px_0px_#0A0A0A] hover:translate-x-[1px] hover:translate-y-[1px] transition-all font-['Plus_Jakarta_Sans'] font-semibold disabled:opacity-50"
                      >
                        <RotateCcw className="h-4 w-4" />
                        Reactivate
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {showInviteModal && (
        <InviteModal
          venueId={venueId}
          currentUserId={currentUserId}
          onClose={() => setShowInviteModal(false)}
          onInvited={() => {
            setShowInviteModal(false)
            fetchMembers()
          }}
        />
      )}
    </Layout>
  )
}

function InviteModal({
  venueId,
  currentUserId,
  onClose,
  onInvited,
}: {
  venueId: string
  currentUserId: string | null
  onClose: () => void
  onInvited: () => void
}) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<VenueRole>('viewer')
  const [submitting, setSubmitting] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setSubmitting(true)
    setInviteError(null)
    setSuccess(false)

    try {
      const { data: existingMembers } = await supabase
        .from('venue_users')
        .select('id, user_id, deactivated_at')
        .eq('venue_id', venueId)

      const { data: { session } } = await supabase.auth.getSession()
      const response = await fetch('/api/venue/lookup-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || ''}`
        },
        body: JSON.stringify({ email: email.trim().toLowerCase() })
      })

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        if (response.status === 404) {
          setInviteError(`No account found for "${email}". They need to create a TripSlip account first, then you can add them here.`)
          return
        }
        throw new Error(errData.error || 'Failed to look up user')
      }

      const { userId: targetUserId } = await response.json()

      const alreadyMember = existingMembers?.find(m => m.user_id === targetUserId)
      if (alreadyMember) {
        if (alreadyMember.deactivated_at) {
          const { error: reactivateErr } = await supabase
            .from('venue_users')
            .update({ deactivated_at: null, role })
            .eq('id', alreadyMember.id)
          if (reactivateErr) throw reactivateErr
          setSuccess(true)
          setTimeout(() => onInvited(), 1000)
          return
        }
        setInviteError('This user is already a team member.')
        return
      }

      const { error: insertErr } = await supabase
        .from('venue_users')
        .insert({
          venue_id: venueId,
          user_id: targetUserId,
          role,
          invited_by: currentUserId,
          invited_at: new Date().toISOString(),
        })

      if (insertErr) throw insertErr
      setSuccess(true)
      setTimeout(() => onInvited(), 1000)
    } catch (err) {
      console.error('Error creating invitation:', err)
      setInviteError(err instanceof Error ? err.message : 'Failed to add team member')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white border-2 border-[#0A0A0A] rounded-2xl shadow-[6px_6px_0px_#0A0A0A] w-full max-w-md mx-4 p-6">
        <h3 className="text-2xl font-bold font-['Fraunces'] text-[#0A0A0A] mb-4">Add Team Member</h3>
        <p className="text-sm text-gray-600 font-['Plus_Jakarta_Sans'] mb-6">
          Enter the email address of the person you'd like to add to your venue team.
        </p>

        {inviteError && (
          <div className="border-2 border-red-400 bg-red-50 rounded-lg p-3 text-red-700 text-sm font-['Plus_Jakarta_Sans'] font-semibold mb-4">
            {inviteError}
          </div>
        )}

        {success && (
          <div className="border-2 border-green-400 bg-green-50 rounded-lg p-3 text-green-700 text-sm font-['Plus_Jakarta_Sans'] font-semibold mb-4">
            Team member added successfully!
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold font-['Plus_Jakarta_Sans'] text-[#0A0A0A] mb-2">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="team.member@example.com"
              className="w-full px-4 py-3 border-2 border-[#0A0A0A] rounded-lg font-['Plus_Jakarta_Sans'] focus:outline-none focus:ring-2 focus:ring-[#F5C518]"
            />
          </div>

          <div>
            <label className="block text-sm font-bold font-['Plus_Jakarta_Sans'] text-[#0A0A0A] mb-2">
              Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as VenueRole)}
              className="w-full px-4 py-3 border-2 border-[#0A0A0A] rounded-lg font-['Plus_Jakarta_Sans'] focus:outline-none focus:ring-2 focus:ring-[#F5C518]"
            >
              <option value="viewer">Viewer — Read-only access</option>
              <option value="editor">Editor — Can manage bookings</option>
              <option value="administrator">Administrator — Full access</option>
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-white text-[#0A0A0A] font-bold border-2 border-[#0A0A0A] rounded-lg shadow-[3px_3px_0px_#0A0A0A] hover:shadow-[1px_1px_0px_#0A0A0A] hover:translate-x-[2px] hover:translate-y-[2px] transition-all font-['Plus_Jakarta_Sans']"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || success}
              className="flex-1 px-4 py-3 bg-[#F5C518] text-[#0A0A0A] font-bold border-2 border-[#0A0A0A] rounded-lg shadow-[3px_3px_0px_#0A0A0A] hover:shadow-[1px_1px_0px_#0A0A0A] hover:translate-x-[2px] hover:translate-y-[2px] transition-all font-['Plus_Jakarta_Sans'] disabled:opacity-50"
            >
              {submitting ? 'Adding…' : 'Add Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
