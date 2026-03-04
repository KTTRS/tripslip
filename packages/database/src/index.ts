// Supabase client utilities
export { createSupabaseClient } from './client';
export type { SupabaseClient } from './client';

// Default supabase client instance (for backward compatibility)
import { createSupabaseClient } from './client';
export const supabase = createSupabaseClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.VITE_SUPABASE_ANON_KEY || ''
);

// Database types
export type { Database, Json, Tables, TablesInsert, TablesUpdate } from './types';

// Venue media service
export { VenueMediaService, createVenueMediaService } from './venue-media-service';
export type {
  VenuePhoto,
  VenueVideo,
  VenueForm,
  UploadPhotoParams,
  UploadVideoParams,
  AddVideoEmbedParams,
  UploadFormParams,
  FileValidationError,
} from './venue-media-service';

// Venue profile service
export { VenueProfileService, createVenueProfileService } from './venue-profile-service';
export type {
  VenueProfile,
  Address,
  AccessibilityFeature,
  OperatingHours,
  SeasonalAvailability,
  AgeGroup,
  CreateVenueProfileParams,
  UpdateVenueProfileParams,
} from './venue-profile-service';

// Venue claim service
export { VenueClaimService } from './venue-claim-service';
export type {
  VenueClaimRequest,
  CreateClaimRequestInput,
  ReviewClaimInput,
  VenueClaimServiceConfig,
} from './venue-claim-service';

// Venue employee service
export { VenueEmployeeService, createVenueEmployeeService, ROLE_PERMISSIONS } from './venue-employee-service';
export type {
  VenueEmployee,
  VenueRole,
  InviteEmployeeParams,
  UpdateEmployeeRoleParams,
} from './venue-employee-service';

// Experience service
export { ExperienceService, createExperienceService } from './experience-service';
export type {
  Experience,
  CurriculumStandard,
  PricingTier,
  AdditionalFee,
  CancellationPolicy,
  CreateExperienceInput,
  UpdateExperienceInput,
} from './experience-service';

// Search service
export { SearchService, createSearchService } from './search-service';
export type {
  SearchQuery,
  SearchResult,
  VenueSearchHit,
  SearchFacets,
} from './search-service';

// Venue analytics service
export { VenueAnalyticsService, createVenueAnalyticsService } from './venue-analytics-service';
export type {
  VenueAnalytics,
  AnalyticsFilters,
} from './venue-analytics-service';

// Venue category service
export { VenueCategoryService, createVenueCategoryService } from './venue-category-service';
export type {
  VenueCategory,
  VenueCategoryWithChildren,
  VenueCategoryPath,
  VenueTag,
  VenueCategoryAssignment,
  VenueTagAssignment,
  CreateCategoryInput,
  UpdateCategoryInput,
  CreateTagInput,
  UpdateTagInput,
} from './venue-category-service';

// Venue review service
export { VenueReviewService, createVenueReviewService } from './venue-review-service';
export type {
  VenueReview,
  CreateReviewInput,
  UpdateReviewInput,
  AddVenueResponseInput,
  FlagReviewInput,
  ModerateReviewInput,
  ReviewWithVenueInfo,
  ReviewWithUserInfo,
  VenueRatingStats,
} from './venue-review-service';

// Venue booking service
export { VenueBookingService } from './venue-booking-service';
export type {
  VenueBooking,
  BookingStatus,
  CreateBookingInput,
  UpdateBookingInput,
  ConfirmBookingInput,
  CancelBookingInput,
  DataSharingConsent,
  CreateConsentInput,
  UpdateConsentInput,
  BookingWithDetails,
  SharedStudent,
  SharedRosterData,
} from './venue-booking-service';

// Venue permission utilities
export {
  VENUE_PERMISSIONS,
  roleHasPermission,
  getRolePermissions,
  canPerformAction,
  isAdministratorRole,
  canManageEmployees,
  canAccessFinancials,
  canDeleteVenue,
  canModifyVenue,
  canViewVenue,
  getMinimumRoleForPermission,
  compareRoles,
  hasAtLeastRole,
  generatePermissionCheckSQL,
  generateAdminCheckSQL,
  generateActiveEmployeeCheckSQL,
} from './venue-permissions';
export type { VenuePermission } from './venue-permissions';

// Re-export Supabase types for convenience
export type {
  User,
  Session,
  AuthError,
  AuthResponse,
  AuthTokenResponse,
} from '@supabase/supabase-js';

// Approval workflow service
export { ApprovalWorkflowService } from './approval-workflow-service';
export type {
  ApprovalType,
  ApprovalStatus,
  RoutingStatus,
  MessageType,
  ApprovalChain,
  ApprovalChainStep,
  TripApproval,
  TripApprovalRouting,
  ApprovalConversation,
  ApprovalDelegation,
  CreateApprovalChainInput,
  CreateApprovalChainStepInput,
  TripCharacteristics,
  ApproveInput,
  RejectInput,
  RequestChangesInput,
  RespondToChangesInput,
  CreateConversationInput,
  CreateDelegationInput,
} from './approval-workflow-service';

// Booking message service
export { BookingMessageService } from './booking-message-service';
export type {
  SenderRole,
  DeliveryStatus,
  BookingMessage,
  MessageNotification,
  CreateMessageInput,
  MessageThread,
  MessageStats,
} from './booking-message-service';

// Refund service
export { RefundService } from './refund-service';
export type {
  Refund,
  CreateRefundInput,
  RefundResult,
} from './refund-service';

// Permission slip service
export { PermissionSlipService } from './permission-slip-service';
export type {
  PermissionSlip,
  GeneratePermissionSlipsInput,
  GeneratePermissionSlipsResult,
} from './permission-slip-service';

// Capacity utilities
export {
  calculateCapacity,
  wouldExceedCapacity,
  getCapacityWarning,
} from './utils/capacity-utils';
export type { CapacityInfo } from './utils/capacity-utils';
