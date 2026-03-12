import { describe, it, expect } from 'vitest';
import {
  buildParentTripUrl,
  buildTeacherTripReviewUrl,
  buildTeacherSignupUrl,
  buildPortalUrl,
} from '../url-routing';

describe('url-routing helpers', () => {
  it('builds parent trip URL in fallback gateway mode', () => {
    const url = buildParentTripUrl('abc123', 'https://tripslip.local');
    expect(url).toBe('https://tripslip.local/parent/trip/abc123');
  });

  it('builds teacher trip review URL in fallback gateway mode', () => {
    const url = buildTeacherTripReviewUrl('tok', 'https://tripslip.local');
    expect(url).toBe('https://tripslip.local/teacher/trip/tok/review');
  });

  it('builds teacher signup URL with encoded email', () => {
    const url = buildTeacherSignupUrl('first.last+tag@example.com', 'https://tripslip.local');
    expect(url).toBe('https://tripslip.local/teacher/signup?email=first.last%2Btag%40example.com');
  });

  it('avoids prefix duplication when path already includes portal prefix', () => {
    const url = buildPortalUrl('parent', '/parent/trip/abc', 'https://tripslip.local');
    expect(url).toBe('https://tripslip.local/parent/trip/abc');
  });
});
