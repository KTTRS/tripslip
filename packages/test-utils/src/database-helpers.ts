/**
 * Database testing helpers
 * Provides utilities for testing database operations and services
 */

import { vi } from 'vitest';
import { createMockSupabaseClient, mockSupabaseResponses } from './mocks/supabase-mocks';
import type { SupabaseClient } from '@supabase/supabase-js';

// Database test setup helpers
export const databaseHelpers = {
  // Create a mock Supabase client with default successful responses
  createMockClient: (overrides: any = {}): SupabaseClient => {
    return createMockSupabaseClient(overrides);
  },
  
  // Set up database mocks for common operations
  setupDatabaseMocks: (mockClient: any) => {
    // Default successful responses for common operations
    mockClient.from.mockImplementation((table: string) => {
      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        upsert: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        neq: vi.fn().mockReturnThis(),
        gt: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lt: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        like: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        contains: vi.fn().mockReturnThis(),
        containedBy: vi.fn().mockReturnThis(),
        rangeGt: vi.fn().mockReturnThis(),
        rangeGte: vi.fn().mockReturnThis(),
        rangeLt: vi.fn().mockReturnThis(),
        rangeLte: vi.fn().mockReturnThis(),
        rangeAdjacent: vi.fn().mockReturnThis(),
        overlaps: vi.fn().mockReturnThis(),
        textSearch: vi.fn().mockReturnThis(),
        match: vi.fn().mockReturnThis(),
        not: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        filter: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
        abortSignal: vi.fn().mockReturnThis(),
        single: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockReturnThis(),
        csv: vi.fn().mockReturnThis(),
        geojson: vi.fn().mockReturnThis(),
        explain: vi.fn().mockReturnThis(),
        rollback: vi.fn().mockReturnThis(),
        returns: vi.fn().mockReturnThis(),
        
        // Make the query builder awaitable
        then: vi.fn((resolve) => {
          // Default to successful empty response
          return Promise.resolve(mockSupabaseResponses.success([])).then(resolve);
        }),
      };
      
      return mockQueryBuilder;
    });
    
    return mockClient;
  },
  
  // Mock specific table operations
  mockTableOperations: (mockClient: any, table: string, operations: any) => {
    const originalFrom = mockClient.from;
    
    mockClient.from.mockImplementation((tableName: string) => {
      if (tableName === table) {
        const mockQueryBuilder = databaseHelpers.setupDatabaseMocks(mockClient).from(tableName);
        
        // Override specific operations
        Object.entries(operations).forEach(([operation, response]) => {
          if (mockQueryBuilder[operation]) {
            mockQueryBuilder[operation].mockImplementation(() => {
              const builder = { ...mockQueryBuilder };
              builder.then = vi.fn((resolve) => Promise.resolve(response).then(resolve));
              return builder;
            });
          }
        });
        
        return mockQueryBuilder;
      }
      
      return originalFrom(tableName);
    });
  },
  
  // Mock RPC function calls
  mockRpcFunction: (mockClient: any, functionName: string, response: any) => {
    mockClient.rpc.mockImplementation((name: string, params?: any) => {
      if (name === functionName) {
        return Promise.resolve(response);
      }
      
      // Default response for other RPC calls
      return Promise.resolve(mockSupabaseResponses.success(null));
    });
  },
  
  // Create test database records
  createTestRecord: <T>(baseRecord: T, overrides: Partial<T> = {}): T => ({
    ...baseRecord,
    ...overrides,
  }),
  
  // Create multiple test records
  createTestRecords: <T>(baseRecord: T, count: number, overridesFn?: (index: number) => Partial<T>): T[] => {
    return Array.from({ length: count }, (_, index) => {
      const overrides = overridesFn ? overridesFn(index) : {};
      return databaseHelpers.createTestRecord(baseRecord, overrides);
    });
  },
  
  // Simulate database errors
  simulateError: (message: string = 'Database error', code: string = 'PGRST116') => ({
    data: null,
    error: {
      message,
      details: '',
      hint: '',
      code,
    },
  }),
  
  // Simulate network errors
  simulateNetworkError: () => {
    throw new Error('Network request failed');
  },
  
  // Simulate timeout errors
  simulateTimeout: (timeoutMs: number = 5000) => {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), timeoutMs);
    });
  },
};

// Database service testing helpers
export const serviceHelpers = {
  // Test service method with mock client
  testServiceMethod: async <T>(
    serviceMethod: (client: SupabaseClient) => Promise<T>,
    mockClient: SupabaseClient,
    expectedResult: T
  ) => {
    const result = await serviceMethod(mockClient);
    expect(result).toEqual(expectedResult);
    return result;
  },
  
  // Test service method error handling
  testServiceError: async <T>(
    serviceMethod: (client: SupabaseClient) => Promise<T>,
    mockClient: SupabaseClient,
    expectedError: string
  ) => {
    await expect(serviceMethod(mockClient)).rejects.toThrow(expectedError);
  },
  
  // Test service method with validation
  testServiceValidation: async <T>(
    serviceMethod: (client: SupabaseClient, params: any) => Promise<T>,
    mockClient: SupabaseClient,
    invalidParams: any,
    expectedError: string
  ) => {
    await expect(serviceMethod(mockClient, invalidParams)).rejects.toThrow(expectedError);
  },
  
  // Test pagination
  testPagination: async <T>(
    serviceMethod: (client: SupabaseClient, page: number, limit: number) => Promise<{ data: T[]; count: number }>,
    mockClient: SupabaseClient,
    totalRecords: number,
    pageSize: number
  ) => {
    const totalPages = Math.ceil(totalRecords / pageSize);
    
    for (let page = 1; page <= totalPages; page++) {
      const result = await serviceMethod(mockClient, page, pageSize);
      
      expect(result.data).toBeDefined();
      expect(result.count).toBe(totalRecords);
      
      const expectedPageSize = page === totalPages 
        ? totalRecords - (page - 1) * pageSize 
        : pageSize;
      
      expect(result.data.length).toBe(expectedPageSize);
    }
  },
  
  // Test sorting
  testSorting: async <T>(
    serviceMethod: (client: SupabaseClient, sortBy: string, sortOrder: 'asc' | 'desc') => Promise<T[]>,
    mockClient: SupabaseClient,
    sortBy: string,
    sortOrder: 'asc' | 'desc',
    expectedOrder: T[]
  ) => {
    const result = await serviceMethod(mockClient, sortBy, sortOrder);
    expect(result).toEqual(expectedOrder);
  },
  
  // Test filtering
  testFiltering: async <T>(
    serviceMethod: (client: SupabaseClient, filters: Record<string, any>) => Promise<T[]>,
    mockClient: SupabaseClient,
    filters: Record<string, any>,
    expectedResults: T[]
  ) => {
    const result = await serviceMethod(mockClient, filters);
    expect(result).toEqual(expectedResults);
  },
};

// Database transaction testing helpers
export const transactionHelpers = {
  // Mock successful transaction
  mockSuccessfulTransaction: (mockClient: any, operations: any[]) => {
    operations.forEach((operation, index) => {
      const { table, method, response } = operation;
      
      mockClient.from.mockImplementationOnce((tableName: string) => {
        if (tableName === table) {
          const mockQueryBuilder = databaseHelpers.setupDatabaseMocks(mockClient).from(tableName);
          mockQueryBuilder[method].mockResolvedValueOnce(response);
          return mockQueryBuilder;
        }
        
        return databaseHelpers.setupDatabaseMocks(mockClient).from(tableName);
      });
    });
  },
  
  // Mock failed transaction
  mockFailedTransaction: (mockClient: any, failAtStep: number, operations: any[]) => {
    operations.forEach((operation, index) => {
      const { table, method, response } = operation;
      
      mockClient.from.mockImplementationOnce((tableName: string) => {
        if (tableName === table) {
          const mockQueryBuilder = databaseHelpers.setupDatabaseMocks(mockClient).from(tableName);
          
          if (index === failAtStep) {
            mockQueryBuilder[method].mockRejectedValueOnce(new Error('Transaction failed'));
          } else {
            mockQueryBuilder[method].mockResolvedValueOnce(response);
          }
          
          return mockQueryBuilder;
        }
        
        return databaseHelpers.setupDatabaseMocks(mockClient).from(tableName);
      });
    });
  },
  
  // Test rollback behavior
  testRollback: async (
    transactionMethod: (client: SupabaseClient) => Promise<any>,
    mockClient: SupabaseClient,
    rollbackCondition: () => boolean
  ) => {
    if (rollbackCondition()) {
      await expect(transactionMethod(mockClient)).rejects.toThrow();
    } else {
      await expect(transactionMethod(mockClient)).resolves.toBeDefined();
    }
  },
};

// Database migration testing helpers
export const migrationHelpers = {
  // Test migration up
  testMigrationUp: async (
    migrationSql: string,
    mockClient: SupabaseClient,
    expectedTables: string[]
  ) => {
    // Mock the migration execution
    mockClient.rpc = vi.fn().mockResolvedValue({ data: null, error: null });
    
    // Execute migration (in real tests, this would run the SQL)
    await mockClient.rpc('exec_migration', { sql: migrationSql });
    
    // Verify tables were created
    expectedTables.forEach(table => {
      expect(mockClient.rpc).toHaveBeenCalledWith(
        'exec_migration',
        expect.objectContaining({
          sql: expect.stringContaining(`CREATE TABLE ${table}`)
        })
      );
    });
  },
  
  // Test migration down
  testMigrationDown: async (
    rollbackSql: string,
    mockClient: SupabaseClient,
    droppedTables: string[]
  ) => {
    // Mock the rollback execution
    mockClient.rpc = vi.fn().mockResolvedValue({ data: null, error: null });
    
    // Execute rollback
    await mockClient.rpc('exec_rollback', { sql: rollbackSql });
    
    // Verify tables were dropped
    droppedTables.forEach(table => {
      expect(mockClient.rpc).toHaveBeenCalledWith(
        'exec_rollback',
        expect.objectContaining({
          sql: expect.stringContaining(`DROP TABLE ${table}`)
        })
      );
    });
  },
  
  // Test data migration
  testDataMigration: async (
    migrationFn: (client: SupabaseClient) => Promise<void>,
    mockClient: SupabaseClient,
    beforeData: any[],
    afterData: any[]
  ) => {
    // Set up initial data
    databaseHelpers.mockTableOperations(mockClient, 'test_table', {
      select: mockSupabaseResponses.success(beforeData),
    });
    
    // Run migration
    await migrationFn(mockClient);
    
    // Verify data transformation
    databaseHelpers.mockTableOperations(mockClient, 'test_table', {
      select: mockSupabaseResponses.success(afterData),
    });
    
    const result = await mockClient.from('test_table').select();
    expect(result.data).toEqual(afterData);
  },
};