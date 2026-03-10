import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import { 
  AuthProvider as RBACAuthProvider, 
  useAuth as useRBACAuth,
  type AuthContextType as RBACAuthContextType 
} from '@tripslip/auth'

interface VenueData {
  id: string
  name: string
  description: string | null
  contact_email: string
  contact_phone: string | null
  website: string | null
  address: any
  capacity_min: number | null
  capacity_max: number | null
  profile_completeness: number | null
  verified: boolean
  primary_photo_url: string | null
}

interface VenueContextType {
  venue: VenueData | null
  venueId: string | null
  venueLoading: boolean
  venueError: string | null
  refetchVenue: () => Promise<void>
}

const VenueContext = createContext<VenueContextType>({
  venue: null,
  venueId: null,
  venueLoading: true,
  venueError: null,
  refetchVenue: async () => {},
})

function VenueDataProvider({ children }: { children: ReactNode }) {
  const { user } = useRBACAuth()
  const [venue, setVenue] = useState<VenueData | null>(null)
  const [venueId, setVenueId] = useState<string | null>(null)
  const [venueLoading, setVenueLoading] = useState(true)
  const [venueError, setVenueError] = useState<string | null>(null)

  const loadVenue = async () => {
    if (!user) {
      setVenue(null)
      setVenueId(null)
      setVenueLoading(false)
      return
    }

    try {
      setVenueLoading(true)
      setVenueError(null)

      const { data: venueUser, error: vuError } = await supabase
        .from('venue_users')
        .select('venue_id')
        .eq('user_id', user.id)
        .maybeSingle()

      if (vuError) throw vuError

      if (!venueUser) {
        setVenue(null)
        setVenueId(null)
        setVenueLoading(false)
        return
      }

      setVenueId(venueUser.venue_id)

      const { data: venueData, error: venueErr } = await supabase
        .from('venues')
        .select('id, name, description, contact_email, contact_phone, website, address, capacity_min, capacity_max, profile_completeness, verified, primary_photo_url')
        .eq('id', venueUser.venue_id)
        .single()

      if (venueErr) throw venueErr

      setVenue(venueData)
    } catch (err) {
      console.error('Error loading venue:', err)
      setVenueError(err instanceof Error ? err.message : 'Failed to load venue')
    } finally {
      setVenueLoading(false)
    }
  }

  useEffect(() => {
    loadVenue()
  }, [user])

  return (
    <VenueContext.Provider value={{ venue, venueId, venueLoading, venueError, refetchVenue: loadVenue }}>
      {children}
    </VenueContext.Provider>
  )
}

export function VenueAuthProvider({ children }: { children: ReactNode }) {
  return (
    <RBACAuthProvider supabase={supabase}>
      <VenueDataProvider>
        {children}
      </VenueDataProvider>
    </RBACAuthProvider>
  )
}

export function useAuth() {
  return useRBACAuth()
}

export function useVenue() {
  return useContext(VenueContext)
}

export const AuthProvider = VenueAuthProvider
