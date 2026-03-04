import { describe, it, expect } from 'vitest';

describe('Smoke Tests - Critical Endpoints', () => {
  const baseUrl = process.env.TEST_URL || 'http://localhost:3000';

  it('landing app is accessible', async () => {
    const response = await fetch(`${baseUrl}`);
    expect(response.status).toBe(200);
  });

  it('venue app is accessible', async () => {
    const response = await fetch(`${baseUrl.replace('tripslip', 'venue.tripslip')}`);
    expect(response.status).toBe(200);
  });

  it('teacher app is accessible', async () => {
    const response = await fetch(`${baseUrl.replace('tripslip', 'teacher.tripslip')}`);
    expect(response.status).toBe(200);
  });

  it('school app is accessible', async () => {
    const response = await fetch(`${baseUrl.replace('tripslip', 'school.tripslip')}`);
    expect(response.status).toBe(200);
  });

  it('parent app is accessible', async () => {
    const response = await fetch(`${baseUrl.replace('tripslip', 'parent.tripslip')}`);
    expect(response.status).toBe(200);
  });
});
