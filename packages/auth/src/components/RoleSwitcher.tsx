/**
 * RoleSwitcher Component
 * Dropdown showing all user's role assignments with ability to switch between roles
 * Only displays if user has multiple roles
 */

import React, { useState } from 'react';
import { useAuth } from '../context';
import type { RoleAssignment } from '../types';

/**
 * Props for RoleSwitcher component
 */
export interface RoleSwitcherProps {
  className?: string;
}

/**
 * Format role name for display
 */
function formatRoleName(roleName: string): string {
  return roleName
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Format organization display text
 */
function formatOrganization(assignment: RoleAssignment): string {
  if (assignment.organization_name) {
    return assignment.organization_name;
  }
  
  // Fallback to organization type if name not available
  return formatRoleName(assignment.organization_type);
}

/**
 * RoleSwitcher component
 * Displays a dropdown of all user's role assignments and allows switching between them
 */
export function RoleSwitcher({ className = '' }: RoleSwitcherProps): JSX.Element | null {
  const { activeRole, roleAssignments, switchRole, loading } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [switching, setSwitching] = useState(false);

  // Don't show if user has only one role
  if (roleAssignments.length <= 1) {
    return null;
  }

  // Don't show if still loading
  if (loading || !activeRole) {
    return null;
  }

  const handleRoleSwitch = async (roleAssignmentId: string) => {
    if (roleAssignmentId === activeRole.active_role_assignment_id) {
      setIsOpen(false);
      return;
    }

    setSwitching(true);
    try {
      await switchRole(roleAssignmentId);
      setIsOpen(false);
      
      // Refresh the page to reload data with new role context
      window.location.reload();
    } catch (error) {
      console.error('Failed to switch role:', error);
      alert('Failed to switch role. Please try again.');
    } finally {
      setSwitching(false);
    }
  };

  const currentAssignment = roleAssignments.find(
    a => a.id === activeRole.active_role_assignment_id
  );

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={switching}
        className="flex items-center gap-2 px-3 py-2 text-sm border-2 border-black rounded-md bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Switch role"
        aria-expanded={isOpen}
      >
        <div className="flex flex-col items-start">
          <span className="font-semibold">
            {currentAssignment ? formatRoleName(currentAssignment.role_name) : 'Select Role'}
          </span>
          {currentAssignment && (
            <span className="text-xs text-gray-600">
              {formatOrganization(currentAssignment)}
            </span>
          )}
        </div>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          {/* Backdrop to close dropdown when clicking outside */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          
          {/* Dropdown menu */}
          <div className="absolute right-0 mt-2 w-64 bg-white border-2 border-black rounded-md shadow-lg z-20">
            <div className="py-1">
              <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase border-b-2 border-black">
                Switch Role
              </div>
              {roleAssignments.map((assignment) => {
                const isActive = assignment.id === activeRole.active_role_assignment_id;
                
                return (
                  <button
                    key={assignment.id}
                    onClick={() => handleRoleSwitch(assignment.id)}
                    disabled={switching || isActive}
                    className={`w-full text-left px-4 py-3 hover:bg-gray-50 disabled:cursor-not-allowed transition-colors ${
                      isActive ? 'bg-gray-100' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className={`font-semibold ${isActive ? 'text-black' : 'text-gray-900'}`}>
                          {formatRoleName(assignment.role_name)}
                        </span>
                        <span className="text-sm text-gray-600">
                          {formatOrganization(assignment)}
                        </span>
                      </div>
                      {isActive && (
                        <svg
                          className="w-5 h-5 text-green-600"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
