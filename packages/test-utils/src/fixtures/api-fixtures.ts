/**
 * API fixtures for testing API responses and Edge Functions
 * Provides realistic API response data for all TripSlip endpoints
 */

// Edge Function response fixtures
export const edgeFunctionFixtures = {
  createPaymentIntent: {
    success: {
      clientSecret: 'pi_test_123_secret_456',
      status: 'requires_payment_method',
      amount: 1500,
      currency: 'usd',
    },
    error: {
      error: {
        message: 'Payment intent creation failed',
        type: 'api_error',
        code: 'payment_intent_creation_failed',
      },
    },
    invalidAmount: {
      error: {
        message: 'Amount must be at least $0.50',
        type: 'invalid_request_error',
        code: 'amount_too_small',
      },
    },
  },
  
  sendEmail: {
    success: {
      success: true,
      messageId: 'msg_test_123',
      status: 'sent',
    },
    error: {
      success: false,
      error: {
        message: 'Failed to send email',
        code: 'EMAIL_SEND_FAILED',
      },
    },
    rateLimited: {
      success: false,
      error: {
        message: 'Rate limit exceeded',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: 60,
      },
    },
  },
  
  sendSms: {
    success: {
      success: true,
      messageId: 'SM_test_123',
      status: 'sent',
      to: '+15550123456',
    },
    error: {
      success: false,
      error: {
        message: 'Failed to send SMS',
        code: 'SMS_SEND_FAILED',
      },
    },
    invalidNumber: {
      success: false,
      error: {
        message: 'Invalid phone number: +1234567890',
        code: 'INVALID_PHONE_NUMBER',
      },
    },
  },
  
  stripeWebhook: {
    paymentSucceeded: {
      id: 'evt_test_webhook',
      object: 'event',
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: 'pi_test_123',
          object: 'payment_intent',
          status: 'succeeded',
          amount: 1500,
          currency: 'usd',
          metadata: {
            permission_slip_id: 'slip-123',
            parent_id: 'parent-123',
          },
        },
      },
    },
    paymentFailed: {
      id: 'evt_test_webhook',
      object: 'event',
      type: 'payment_intent.payment_failed',
      data: {
        object: {
          id: 'pi_test_123',
          object: 'payment_intent',
          status: 'payment_failed',
          amount: 1500,
          currency: 'usd',
          last_payment_error: {
            message: 'Your card was declined.',
            type: 'card_error',
            code: 'card_declined',
          },
        },
      },
    },
  },
};

// Database RPC function fixtures
export const rpcFixtures = {
  searchVenues: {
    success: [
      {
        id: 'venue-123',
        name: 'California Science Museum',
        category: 'museum',
        subcategory: 'science',
        address: '700 Exposition Park Dr, Los Angeles, CA 90037',
        distance_miles: 2.5,
        rating: 4.8,
        experience_count: 12,
        price_range_min: 1000,
        price_range_max: 2500,
      },
      {
        id: 'venue-456',
        name: 'Riverside Zoo & Botanical Gardens',
        category: 'zoo',
        subcategory: 'wildlife',
        address: '3400 Block Dr, Riverside, CA 92506',
        distance_miles: 15.2,
        rating: 4.6,
        experience_count: 8,
        price_range_min: 800,
        price_range_max: 2000,
      },
    ],
    empty: [],
    error: null,
  },
  
  getVenueAnalytics: {
    success: {
      total_bookings: 45,
      total_revenue_cents: 67500,
      avg_rating: 4.7,
      booking_trend: [
        { month: '2024-01', bookings: 8, revenue_cents: 12000 },
        { month: '2024-02', bookings: 12, revenue_cents: 18000 },
        { month: '2024-03', bookings: 15, revenue_cents: 22500 },
        { month: '2024-04', bookings: 10, revenue_cents: 15000 },
      ],
      popular_experiences: [
        { experience_id: 'exp-123', title: 'Dinosaur Discovery Tour', booking_count: 25 },
        { experience_id: 'exp-456', title: 'Space Exploration Workshop', booking_count: 20 },
      ],
    },
    error: null,
  },
  
  getTripStatistics: {
    success: {
      total_trips: 12,
      active_trips: 3,
      completed_trips: 8,
      cancelled_trips: 1,
      total_students: 285,
      permission_slips_signed: 245,
      permission_slips_pending: 40,
      payments_completed: 220,
      payments_pending: 25,
      total_revenue_cents: 33000,
    },
    error: null,
  },
  
  getSchoolDashboard: {
    success: {
      total_teachers: 25,
      active_trips: 8,
      total_students_participating: 180,
      budget_allocated_cents: 50000,
      budget_spent_cents: 28500,
      upcoming_trips: [
        {
          id: 'trip-123',
          title: 'Science Museum Field Trip',
          teacher_name: 'Jane Teacher',
          trip_date: '2024-06-15',
          student_count: 25,
          status: 'published',
        },
        {
          id: 'trip-456',
          title: 'Zoo Animal Study Trip',
          teacher_name: 'Bob Science',
          trip_date: '2024-07-20',
          student_count: 30,
          status: 'published',
        },
      ],
    },
    error: null,
  },
};

// HTTP response fixtures
export const httpResponseFixtures = {
  success: <T>(data: T, status: number = 200) => ({
    ok: true,
    status,
    statusText: 'OK',
    headers: new Headers({
      'Content-Type': 'application/json',
    }),
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
  }),
  
  error: (status: number = 400, message: string = 'Bad Request') => ({
    ok: false,
    status,
    statusText: message,
    headers: new Headers({
      'Content-Type': 'application/json',
    }),
    json: () => Promise.resolve({ error: { message } }),
    text: () => Promise.resolve(JSON.stringify({ error: { message } })),
  }),
  
  networkError: () => {
    throw new Error('Network request failed');
  },
  
  timeout: () => {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), 100);
    });
  },
};

// Supabase API response fixtures
export const supabaseApiFixtures = {
  select: {
    success: <T>(data: T[]) => ({
      data,
      error: null,
      count: data.length,
      status: 200,
      statusText: 'OK',
    }),
    empty: () => ({
      data: [],
      error: null,
      count: 0,
      status: 200,
      statusText: 'OK',
    }),
    error: (message: string = 'Database error') => ({
      data: null,
      error: {
        message,
        details: '',
        hint: '',
        code: 'PGRST116',
      },
      count: null,
      status: 400,
      statusText: 'Bad Request',
    }),
  },
  
  insert: {
    success: <T>(data: T) => ({
      data: [data],
      error: null,
      count: 1,
      status: 201,
      statusText: 'Created',
    }),
    error: (message: string = 'Insert failed') => ({
      data: null,
      error: {
        message,
        details: '',
        hint: '',
        code: 'PGRST116',
      },
      count: null,
      status: 400,
      statusText: 'Bad Request',
    }),
    conflict: (message: string = 'Duplicate key value') => ({
      data: null,
      error: {
        message,
        details: '',
        hint: '',
        code: '23505',
      },
      count: null,
      status: 409,
      statusText: 'Conflict',
    }),
  },
  
  update: {
    success: <T>(data: T) => ({
      data: [data],
      error: null,
      count: 1,
      status: 200,
      statusText: 'OK',
    }),
    notFound: () => ({
      data: [],
      error: null,
      count: 0,
      status: 200,
      statusText: 'OK',
    }),
    error: (message: string = 'Update failed') => ({
      data: null,
      error: {
        message,
        details: '',
        hint: '',
        code: 'PGRST116',
      },
      count: null,
      status: 400,
      statusText: 'Bad Request',
    }),
  },
  
  delete: {
    success: <T>(data: T) => ({
      data: [data],
      error: null,
      count: 1,
      status: 200,
      statusText: 'OK',
    }),
    notFound: () => ({
      data: [],
      error: null,
      count: 0,
      status: 200,
      statusText: 'OK',
    }),
    error: (message: string = 'Delete failed') => ({
      data: null,
      error: {
        message,
        details: '',
        hint: '',
        code: 'PGRST116',
      },
      count: null,
      status: 400,
      statusText: 'Bad Request',
    }),
  },
  
  rpc: {
    success: <T>(data: T) => ({
      data,
      error: null,
      count: null,
      status: 200,
      statusText: 'OK',
    }),
    error: (message: string = 'RPC function failed') => ({
      data: null,
      error: {
        message,
        details: '',
        hint: '',
        code: 'PGRST202',
      },
      count: null,
      status: 400,
      statusText: 'Bad Request',
    }),
  },
};

// External API fixtures (for mocking third-party services)
export const externalApiFixtures = {
  stripe: {
    paymentIntents: {
      create: {
        success: {
          id: 'pi_test_123',
          object: 'payment_intent',
          client_secret: 'pi_test_123_secret_456',
          status: 'requires_payment_method',
          amount: 1500,
          currency: 'usd',
          metadata: {
            permission_slip_id: 'slip-123',
            parent_id: 'parent-123',
          },
        },
        error: {
          error: {
            message: 'Amount must be at least $0.50',
            type: 'invalid_request_error',
            code: 'amount_too_small',
          },
        },
      },
      confirm: {
        success: {
          id: 'pi_test_123',
          object: 'payment_intent',
          status: 'succeeded',
          amount: 1500,
          currency: 'usd',
        },
        requiresAction: {
          id: 'pi_test_123',
          object: 'payment_intent',
          status: 'requires_action',
          next_action: {
            type: 'use_stripe_sdk',
          },
        },
        failed: {
          id: 'pi_test_123',
          object: 'payment_intent',
          status: 'payment_failed',
          last_payment_error: {
            message: 'Your card was declined.',
            type: 'card_error',
            code: 'card_declined',
          },
        },
      },
    },
  },
  
  sendgrid: {
    send: {
      success: {
        statusCode: 202,
        body: '',
        headers: {},
      },
      error: {
        statusCode: 400,
        body: JSON.stringify({
          errors: [
            {
              message: 'Invalid email address',
              field: 'personalizations.0.to.0.email',
            },
          ],
        }),
      },
    },
  },
  
  twilio: {
    messages: {
      create: {
        success: {
          sid: 'SM_test_123',
          status: 'sent',
          to: '+15550123456',
          from: '+15550987654',
          body: 'Test message',
          dateCreated: new Date(),
          dateSent: new Date(),
        },
        error: {
          code: 21211,
          message: 'Invalid phone number',
          moreInfo: 'https://www.twilio.com/docs/errors/21211',
        },
      },
    },
  },
};

// Helper functions for creating API fixtures
export const createApiResponse = <T>(
  data: T,
  options: {
    status?: number;
    error?: boolean;
    message?: string;
  } = {}
) => {
  const { status = 200, error = false, message = 'Success' } = options;
  
  if (error) {
    return {
      data: null,
      error: { message },
      status,
      statusText: message,
    };
  }
  
  return {
    data,
    error: null,
    status,
    statusText: message,
  };
};

export const createPaginatedResponse = <T>(
  data: T[],
  page: number = 1,
  limit: number = 10,
  total: number = data.length
) => ({
  data,
  pagination: {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
    hasNext: page * limit < total,
    hasPrev: page > 1,
  },
  error: null,
});

export const createErrorResponse = (
  message: string,
  code: string = 'GENERIC_ERROR',
  status: number = 400
) => ({
  data: null,
  error: {
    message,
    code,
    details: '',
    hint: '',
  },
  status,
  statusText: 'Error',
});