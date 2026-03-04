/**
 * Filter Sidebar Component
 * 
 * Provides filtering controls for venue search:
 * - Distance/radius filter
 * - Price range filter
 * - Accessibility features filter
 * - Subject areas filter
 * - Grade levels filter
 * 
 * Requirements: 3.2, 3.3, 3.4, 3.5, 29.2
 */

import { useState } from 'react';
import type { SearchQuery } from '@tripslip/database';

interface FilterSidebarProps {
  currentFilters: SearchQuery;
  onFilterChange: (filters: Partial<SearchQuery>) => void;
  availableCategories?: { name: string; count: number }[];
}

const SUBJECT_AREAS = [
  'Science',
  'History',
  'Art',
  'Mathematics',
  'Literature',
  'Social Studies',
  'Physical Education',
  'Music',
  'Technology'
];

const GRADE_LEVELS = [
  'Pre-K',
  'Kindergarten',
  'Grade 1',
  'Grade 2',
  'Grade 3',
  'Grade 4',
  'Grade 5',
  'Grade 6',
  'Grade 7',
  'Grade 8',
  'Grade 9',
  'Grade 10',
  'Grade 11',
  'Grade 12'
];

const ACCESSIBILITY_FEATURES = [
  { value: 'wheelchair', label: 'Wheelchair Accessible' },
  { value: 'parking', label: 'Accessible Parking' },
  { value: 'entrance', label: 'Accessible Entrance' },
  { value: 'restroom', label: 'Accessible Restroom' },
  { value: 'hearing', label: 'Hearing Assistance' },
  { value: 'visual', label: 'Visual Assistance' },
  { value: 'sensory', label: 'Sensory-Friendly' },
  { value: 'service_animal', label: 'Service Animals Welcome' }
];

export function FilterSidebar({ currentFilters, onFilterChange, availableCategories = [] }: FilterSidebarProps) {
  const [radiusMiles, setRadiusMiles] = useState(currentFilters.radiusMiles || 25);
  const [maxPrice, setMaxPrice] = useState(currentFilters.maxPricePerStudent || 50);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    currentFilters.categories || []
  );
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(
    currentFilters.subjectAreas || []
  );
  const [selectedGrades, setSelectedGrades] = useState<string[]>(
    currentFilters.gradeLevels || []
  );
  const [selectedAccessibility, setSelectedAccessibility] = useState<string[]>(
    currentFilters.accessibilityFeatures || []
  );

  const handleRadiusChange = (value: number) => {
    setRadiusMiles(value);
    onFilterChange({ radiusMiles: value });
  };

  const handlePriceChange = (value: number) => {
    setMaxPrice(value);
    onFilterChange({ maxPricePerStudent: value });
  };

  const handleCategoryToggle = (category: string) => {
    const updated = selectedCategories.includes(category)
      ? selectedCategories.filter(c => c !== category)
      : [...selectedCategories, category];
    setSelectedCategories(updated);
    onFilterChange({ categories: updated.length > 0 ? updated : undefined });
  };

  const handleSubjectToggle = (subject: string) => {
    const updated = selectedSubjects.includes(subject)
      ? selectedSubjects.filter(s => s !== subject)
      : [...selectedSubjects, subject];
    setSelectedSubjects(updated);
    onFilterChange({ subjectAreas: updated.length > 0 ? updated : undefined });
  };

  const handleGradeToggle = (grade: string) => {
    const updated = selectedGrades.includes(grade)
      ? selectedGrades.filter(g => g !== grade)
      : [...selectedGrades, grade];
    setSelectedGrades(updated);
    onFilterChange({ gradeLevels: updated.length > 0 ? updated : undefined });
  };

  const handleAccessibilityToggle = (feature: string) => {
    const updated = selectedAccessibility.includes(feature)
      ? selectedAccessibility.filter(f => f !== feature)
      : [...selectedAccessibility, feature];
    setSelectedAccessibility(updated);
    onFilterChange({ accessibilityFeatures: updated.length > 0 ? updated : undefined });
  };

  const handleClearAll = () => {
    setRadiusMiles(25);
    setMaxPrice(50);
    setSelectedCategories([]);
    setSelectedSubjects([]);
    setSelectedGrades([]);
    setSelectedAccessibility([]);
    onFilterChange({
      radiusMiles: undefined,
      maxPricePerStudent: undefined,
      categories: undefined,
      subjectAreas: undefined,
      gradeLevels: undefined,
      accessibilityFeatures: undefined
    });
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
        <button
          onClick={handleClearAll}
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          Clear All
        </button>
      </div>

      {/* Distance Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Distance: {radiusMiles} miles
        </label>
        <input
          type="range"
          min="5"
          max="100"
          step="5"
          value={radiusMiles}
          onChange={(e) => handleRadiusChange(Number(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>5 mi</span>
          <span>100 mi</span>
        </div>
      </div>

      {/* Price Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Max Price: ${maxPrice}/student
        </label>
        <input
          type="range"
          min="0"
          max="100"
          step="5"
          value={maxPrice}
          onChange={(e) => handlePriceChange(Number(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>$0</span>
          <span>$100+</span>
        </div>
      </div>

      {/* Categories */}
      {availableCategories.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">Categories</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {availableCategories.map(category => (
              <label key={category.name} className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(category.name)}
                    onChange={() => handleCategoryToggle(category.name)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">{category.name}</span>
                </div>
                <span className="text-xs text-gray-500">({category.count})</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Subject Areas */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-2">Subject Areas</h3>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {SUBJECT_AREAS.map(subject => (
            <label key={subject} className="flex items-center">
              <input
                type="checkbox"
                checked={selectedSubjects.includes(subject)}
                onChange={() => handleSubjectToggle(subject)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">{subject}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Grade Levels */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-2">Grade Levels</h3>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {GRADE_LEVELS.map(grade => (
            <label key={grade} className="flex items-center">
              <input
                type="checkbox"
                checked={selectedGrades.includes(grade)}
                onChange={() => handleGradeToggle(grade)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">{grade}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Accessibility Features */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-2">Accessibility</h3>
        <div className="space-y-2">
          {ACCESSIBILITY_FEATURES.map(feature => (
            <label key={feature.value} className="flex items-center">
              <input
                type="checkbox"
                checked={selectedAccessibility.includes(feature.value)}
                onChange={() => handleAccessibilityToggle(feature.value)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">{feature.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Verified Only */}
      <div>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={currentFilters.verifiedOnly || false}
            onChange={(e) => onFilterChange({ verifiedOnly: e.target.checked || undefined })}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="ml-2 text-sm text-gray-700">Verified venues only</span>
        </label>
      </div>
    </div>
  );
}
