import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

interface AnalyticsFiltersProps {
  onDateRangeChange: (range: { start: Date; end: Date } | undefined) => void
  onExperienceChange: (experienceId: string | undefined) => void
}

interface Experience {
  id: string
  title: string
}

export function AnalyticsFilters({ onDateRangeChange, onExperienceChange }: AnalyticsFiltersProps) {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [selectedExperience, setSelectedExperience] = useState('')
  const [experiences, setExperiences] = useState<Experience[]>([])
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      fetchExperiences()
    }
  }, [user])

  async function fetchExperiences() {
    try {
      // Get venue_id for current user
      const { data: venueUser } = await supabase
        .from('venue_users')
        .select('venue_id')
        .eq('user_id', user!.id)
        .single()

      if (!venueUser) return

      // Fetch experiences for this venue
      const { data: exps } = await supabase
        .from('experiences')
        .select('id, title')
        .eq('venue_id', venueUser.venue_id)
        .order('title')

      setExperiences(exps || [])
    } catch (err) {
      console.error('Error fetching experiences:', err)
    }
  }

  const handleApplyFilters = () => {
    // Apply date range filter
    if (startDate && endDate) {
      onDateRangeChange({
        start: new Date(startDate),
        end: new Date(endDate)
      })
    } else {
      onDateRangeChange(undefined)
    }

    // Apply experience filter
    if (selectedExperience) {
      onExperienceChange(selectedExperience)
    } else {
      onExperienceChange(undefined)
    }
  }

  const handleClearFilters = () => {
    setStartDate('')
    setEndDate('')
    setSelectedExperience('')
    onDateRangeChange(undefined)
    onExperienceChange(undefined)
  }

  return (
    <div className="bg-white border-2 border-black shadow-offset p-6 rounded-lg">
      <h3 className="text-lg font-bold mb-4">Filters</h3>
      
      <div className="grid gap-4 md:grid-cols-3">
        {/* Date Range */}
        <div>
          <label className="block text-sm font-semibold mb-2">Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-3 py-2 border-2 border-black rounded"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2">End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-3 py-2 border-2 border-black rounded"
          />
        </div>

        {/* Experience Filter */}
        <div>
          <label className="block text-sm font-semibold mb-2">Experience</label>
          <select
            value={selectedExperience}
            onChange={(e) => setSelectedExperience(e.target.value)}
            className="w-full px-3 py-2 border-2 border-black rounded"
          >
            <option value="">All Experiences</option>
            {experiences.map((exp) => (
              <option key={exp.id} value={exp.id}>
                {exp.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 mt-4">
        <button
          onClick={handleApplyFilters}
          className="px-4 py-2 bg-primary text-white font-bold border-2 border-black rounded hover:bg-primary/90 transition-colors"
        >
          Apply Filters
        </button>
        <button
          onClick={handleClearFilters}
          className="px-4 py-2 bg-white font-bold border-2 border-black rounded hover:bg-gray-50 transition-colors"
        >
          Clear Filters
        </button>
      </div>
    </div>
  )
}
