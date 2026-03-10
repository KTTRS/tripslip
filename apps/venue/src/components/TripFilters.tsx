import { useState, useEffect } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Label,
  Input,
  Button
} from '@tripslip/ui'
import { supabase } from '../lib/supabase'
import { useVenue } from '../contexts/AuthContext'

interface TripFiltersProps {
  onFilterChange: (filters: {
    status?: string
    experienceId?: string
    startDate?: string
    endDate?: string
  }) => void
}

export function TripFilters({ onFilterChange }: TripFiltersProps) {
  const [status, setStatus] = useState<string>('')
  const [experienceId, setExperienceId] = useState<string>('')
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const [experiences, setExperiences] = useState<Array<{ id: string; title: string }>>([])
  const { venueId } = useVenue()

  useEffect(() => {
    if (venueId) {
      fetchExperiences()
    }
  }, [venueId])

  useEffect(() => {
    onFilterChange({
      status: status || undefined,
      experienceId: experienceId || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined
    })
  }, [status, experienceId, startDate, endDate])

  const fetchExperiences = async () => {
    try {
      const { data } = await supabase
        .from('experiences')
        .select('id, title')
        .eq('venue_id', venueId!)
        .eq('published', true)
        .order('title')

      if (data) {
        setExperiences(data)
      }
    } catch (err) {
      console.error('Error fetching experiences:', err)
    }
  }

  const handleReset = () => {
    setStatus('')
    setExperienceId('')
    setStartDate('')
    setEndDate('')
  }

  return (
    <div className="space-y-4 p-4 border-2 border-black rounded-lg bg-white">
      <h3 className="font-semibold text-lg">Filters</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Status Filter */}
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger id="status">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Experience Filter */}
        <div className="space-y-2">
          <Label htmlFor="experience">Experience</Label>
          <Select value={experienceId} onValueChange={setExperienceId}>
            <SelectTrigger id="experience">
              <SelectValue placeholder="All experiences" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All experiences</SelectItem>
              {experiences.map(exp => (
                <SelectItem key={exp.id} value={exp.id}>
                  {exp.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Start Date Filter */}
        <div className="space-y-2">
          <Label htmlFor="startDate">Start Date</Label>
          <Input
            id="startDate"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>

        {/* End Date Filter */}
        <div className="space-y-2">
          <Label htmlFor="endDate">End Date</Label>
          <Input
            id="endDate"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button variant="outline" onClick={handleReset}>
          Reset Filters
        </Button>
      </div>
    </div>
  )
}
