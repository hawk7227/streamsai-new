/**
 * StreamsAI — Generation Engine E2E Tests
 *
 * Tests the full generation lifecycle via API routes.
 * Requires: running Next.js dev server + Supabase instance
 *
 * Run: npx playwright test
 * Run single: npx playwright test -g "creates a single image generation"
 */

import { test, expect, type APIRequestContext } from '@playwright/test';

// ---------------------------------------------------------------------------
// Test config — override with env vars for CI
// ---------------------------------------------------------------------------
const BASE_URL = process.env.TEST_BASE_URL ?? 'http://localhost:3000';
const TEST_AUTH_TOKEN = process.env.TEST_AUTH_TOKEN ?? '';

// Helper: create authenticated request context
function authHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (TEST_AUTH_TOKEN) {
    headers['Authorization'] = `Bearer ${TEST_AUTH_TOKEN}`;
  }
  return headers;
}

// ---------------------------------------------------------------------------
// API Health Tests
// ---------------------------------------------------------------------------

test.describe('API Health', () => {
  test('GET /api/generations returns 401 without auth', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/generations`);
    expect(response.status()).toBe(401);
  });

  test('GET /api/admin/workers returns worker status', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/admin/workers`);
    // Admin endpoint may require auth, but should not 500
    expect([200, 401, 403]).toContain(response.status());

    if (response.status() === 200) {
      const data = await response.json();
      expect(data).toHaveProperty('workers');
      expect(data).toHaveProperty('queue_depth');
      expect(data).toHaveProperty('stale_jobs');
      expect(data).toHaveProperty('recent_failures');
      expect(data).toHaveProperty('timestamp');
    }
  });
});

// ---------------------------------------------------------------------------
// Generation CRUD Tests
// ---------------------------------------------------------------------------

test.describe('Generation API', () => {
  test('POST /api/generations validates required fields', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/generations`, {
      headers: authHeaders(),
      data: {
        // Missing required fields: type, prompt, quality_tiers
      },
    });

    // Should fail validation (400) or auth (401)
    expect([400, 401]).toContain(response.status());
  });

  test('POST /api/generations validates tool type', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/generations`, {
      headers: authHeaders(),
      data: {
        type: 'invalid_type',
        prompt: 'Test prompt',
        quality_tiers: ['standard'],
      },
    });

    expect([400, 401]).toContain(response.status());
  });

  test('POST /api/generations validates quality tiers', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/generations`, {
      headers: authHeaders(),
      data: {
        type: 'image',
        prompt: 'Test prompt',
        quality_tiers: ['nonexistent_tier'],
      },
    });

    expect([400, 401]).toContain(response.status());
  });

  test('POST /api/generations accepts valid image request', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/generations`, {
      headers: authHeaders(),
      data: {
        type: 'image',
        prompt: 'A beautiful sunset over mountains',
        quality_tiers: ['standard'],
      },
    });

    // 201 (created), 401 (no auth), or 402 (no credits)
    expect([201, 401, 402]).toContain(response.status());

    if (response.status() === 201) {
      const data = await response.json();
      expect(data).toHaveProperty('generations');
      expect(data.generations).toBeInstanceOf(Array);
      expect(data.generations.length).toBe(1);
      expect(data.generations[0]).toHaveProperty('id');
      expect(data.generations[0]).toHaveProperty('status', 'queued');
      expect(data).toHaveProperty('total_preview_cost');
    }
  });

  test('POST /api/generations handles multi-quality batch', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/generations`, {
      headers: authHeaders(),
      data: {
        type: 'image',
        prompt: 'A cyberpunk cityscape at night',
        quality_tiers: ['standard', 'premium', 'ultra'],
      },
    });

    expect([201, 401, 402]).toContain(response.status());

    if (response.status() === 201) {
      const data = await response.json();
      expect(data.generations.length).toBe(3);
      expect(data).toHaveProperty('batch_id');

      // Verify each generation has a different quality tier
      const tiers = data.generations.map((g: { quality_tier: string }) => g.quality_tier);
      expect(tiers).toContain('standard');
      expect(tiers).toContain('premium');
      expect(tiers).toContain('ultra');
    }
  });

  test('POST /api/generations handles bulk batch', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/generations`, {
      headers: authHeaders(),
      data: {
        type: 'script',
        prompts: [
          'Write a product description for a smart watch',
          'Write a product description for wireless earbuds',
          'Write a product description for a fitness tracker',
        ],
        quality_tiers: ['standard'],
      },
    });

    expect([201, 401, 402]).toContain(response.status());

    if (response.status() === 201) {
      const data = await response.json();
      expect(data.generations.length).toBe(3);
      expect(data).toHaveProperty('batch_id');
    }
  });

  test('POST /api/generations includes video-specific params', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/generations`, {
      headers: authHeaders(),
      data: {
        type: 'video',
        prompt: 'A drone flying over a coral reef',
        quality_tiers: ['standard'],
        aspect_ratio: '16:9',
        duration: 10,
      },
    });

    expect([201, 401, 402]).toContain(response.status());
  });

  test('POST /api/generations includes voice-specific params', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/generations`, {
      headers: authHeaders(),
      data: {
        type: 'voice',
        prompt: 'Welcome to our podcast. Today we discuss the future of AI.',
        quality_tiers: ['premium'],
        voice_id: 'rachel',
        language: 'en',
      },
    });

    expect([201, 401, 402]).toContain(response.status());
  });
});

// ---------------------------------------------------------------------------
// Generation Lifecycle Tests
// ---------------------------------------------------------------------------

test.describe('Generation Lifecycle', () => {
  let generationId: string;

  test('Full lifecycle: create → get → cancel', async ({ request }) => {
    // Step 1: Create
    const createRes = await request.post(`${BASE_URL}/api/generations`, {
      headers: authHeaders(),
      data: {
        type: 'image',
        prompt: 'Test lifecycle generation',
        quality_tiers: ['standard'],
      },
    });

    if (createRes.status() === 401) {
      test.skip();
      return;
    }

    expect(createRes.status()).toBe(201);
    const createData = await createRes.json();
    generationId = createData.generations[0].id;

    // Step 2: Get by ID
    const getRes = await request.get(
      `${BASE_URL}/api/generations/${generationId}`,
      { headers: authHeaders() },
    );
    expect(getRes.status()).toBe(200);
    const gen = await getRes.json();
    expect(gen.id).toBe(generationId);
    expect(gen.type).toBe('image');
    expect(gen.prompt).toBe('Test lifecycle generation');

    // Step 3: Cancel (should refund preview credits)
    const cancelRes = await request.post(
      `${BASE_URL}/api/generations/${generationId}/cancel`,
      { headers: authHeaders() },
    );
    expect(cancelRes.status()).toBe(200);
    const cancelData = await cancelRes.json();
    expect(cancelData.status).toBe('cancelled');
    expect(cancelData.refunded).toBeGreaterThanOrEqual(0);

    // Step 4: Verify cancelled status
    const verifyRes = await request.get(
      `${BASE_URL}/api/generations/${generationId}`,
      { headers: authHeaders() },
    );
    expect(verifyRes.status()).toBe(200);
    const verified = await verifyRes.json();
    expect(verified.status).toBe('cancelled');
  });

  test('Finalize rejects non-preview_ready generation', async ({ request }) => {
    // Create a fresh generation (status = queued)
    const createRes = await request.post(`${BASE_URL}/api/generations`, {
      headers: authHeaders(),
      data: {
        type: 'script',
        prompt: 'Test finalize rejection',
        quality_tiers: ['standard'],
      },
    });

    if (createRes.status() === 401) {
      test.skip();
      return;
    }

    const createData = await createRes.json();
    const id = createData.generations[0].id;

    // Try to finalize a queued generation — should fail
    const finalizeRes = await request.post(
      `${BASE_URL}/api/generations/${id}/finalize`,
      { headers: authHeaders() },
    );

    // 409 (conflict — not in preview_ready state) or 400
    expect([400, 409]).toContain(finalizeRes.status());
  });

  test('Cancel rejects already-cancelled generation', async ({ request }) => {
    // Create and cancel
    const createRes = await request.post(`${BASE_URL}/api/generations`, {
      headers: authHeaders(),
      data: {
        type: 'image',
        prompt: 'Double cancel test',
        quality_tiers: ['standard'],
      },
    });

    if (createRes.status() === 401) {
      test.skip();
      return;
    }

    const createData = await createRes.json();
    const id = createData.generations[0].id;

    // First cancel
    await request.post(`${BASE_URL}/api/generations/${id}/cancel`, {
      headers: authHeaders(),
    });

    // Second cancel — should fail
    const res = await request.post(`${BASE_URL}/api/generations/${id}/cancel`, {
      headers: authHeaders(),
    });
    expect([400, 409]).toContain(res.status());
  });
});

// ---------------------------------------------------------------------------
// Listing & Filtering Tests
// ---------------------------------------------------------------------------

test.describe('Generation Listing', () => {
  test('GET /api/generations returns paginated list', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/generations`, {
      headers: authHeaders(),
      params: { limit: '5', offset: '0' },
    });

    if (response.status() === 401) {
      test.skip();
      return;
    }

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('generations');
    expect(data).toHaveProperty('total');
    expect(data).toHaveProperty('has_more');
    expect(data.generations).toBeInstanceOf(Array);
  });

  test('GET /api/generations filters by type', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/generations`, {
      headers: authHeaders(),
      params: { type: 'image' },
    });

    if (response.status() === 401) {
      test.skip();
      return;
    }

    expect(response.status()).toBe(200);
    const data = await response.json();
    for (const gen of data.generations) {
      expect(gen.type).toBe('image');
    }
  });

  test('GET /api/generations filters by status', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/generations`, {
      headers: authHeaders(),
      params: { status: 'cancelled' },
    });

    if (response.status() === 401) {
      test.skip();
      return;
    }

    expect(response.status()).toBe(200);
    const data = await response.json();
    for (const gen of data.generations) {
      expect(gen.status).toBe('cancelled');
    }
  });

  test('GET /api/generations/[id] returns 404 for nonexistent', async ({ request }) => {
    const response = await request.get(
      `${BASE_URL}/api/generations/00000000-0000-0000-0000-000000000000`,
      { headers: authHeaders() },
    );

    expect([404, 401]).toContain(response.status());
  });
});

// ---------------------------------------------------------------------------
// Webhook Tests
// ---------------------------------------------------------------------------

test.describe('Webhook Processing', () => {
  test('POST /api/webhooks/openai-video rejects invalid event', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/webhooks/openai-video`, {
      headers: { 'Content-Type': 'application/json' },
      data: {
        type: 'invalid.event',
        data: {},
      },
    });

    // Should handle gracefully (200 acknowledge or 400 bad request)
    expect([200, 400]).toContain(response.status());
  });

  test('POST /api/webhooks/openai-video handles completion event', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/webhooks/openai-video`, {
      headers: { 'Content-Type': 'application/json' },
      data: {
        type: 'video.completed',
        data: {
          id: 'nonexistent-job-id',
          status: 'completed',
          url: 'https://example.com/video.mp4',
        },
      },
    });

    // 200 (acknowledged, no matching generation) or 404
    expect([200, 404]).toContain(response.status());
  });

  test('POST /api/webhooks/openai-video handles failure event', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/webhooks/openai-video`, {
      headers: { 'Content-Type': 'application/json' },
      data: {
        type: 'video.failed',
        data: {
          id: 'nonexistent-job-id',
          status: 'failed',
          error: { message: 'Content policy violation' },
        },
      },
    });

    expect([200, 404]).toContain(response.status());
  });
});

// ---------------------------------------------------------------------------
// Error Handling Tests
// ---------------------------------------------------------------------------

test.describe('Error Handling', () => {
  test('POST /api/generations with empty prompt', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/generations`, {
      headers: authHeaders(),
      data: {
        type: 'image',
        prompt: '',
        quality_tiers: ['standard'],
      },
    });

    expect([400, 401]).toContain(response.status());
  });

  test('POST /api/generations/[id]/finalize with invalid ID', async ({ request }) => {
    const response = await request.post(
      `${BASE_URL}/api/generations/not-a-uuid/finalize`,
      { headers: authHeaders() },
    );

    expect([400, 401, 404]).toContain(response.status());
  });

  test('POST /api/generations/[id]/cancel with invalid ID', async ({ request }) => {
    const response = await request.post(
      `${BASE_URL}/api/generations/not-a-uuid/cancel`,
      { headers: authHeaders() },
    );

    expect([400, 401, 404]).toContain(response.status());
  });

  test('POST /api/generations rejects oversized prompt', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/generations`, {
      headers: authHeaders(),
      data: {
        type: 'image',
        prompt: 'x'.repeat(50_001), // > 50k chars
        quality_tiers: ['standard'],
      },
    });

    expect([400, 401]).toContain(response.status());
  });
});

// ---------------------------------------------------------------------------
// Worker Status Tests
// ---------------------------------------------------------------------------

test.describe('Admin Worker Status', () => {
  test('GET /api/admin/workers returns structured status', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/admin/workers`);

    if (response.status() === 401 || response.status() === 403) {
      test.skip();
      return;
    }

    expect(response.status()).toBe(200);
    const data = await response.json();

    // Verify structure
    expect(data.workers).toBeInstanceOf(Array);
    expect(typeof data.recent_failures).toBe('number');
    expect(typeof data.total_active_workers).toBe('number');
    expect(typeof data.total_queued).toBe('number');
    expect(typeof data.total_running).toBe('number');
    expect(data.stale_jobs).toBeInstanceOf(Array);
    expect(typeof data.timestamp).toBe('string');
  });
});

// ---------------------------------------------------------------------------
// Contract Tests: API shape verification
// ---------------------------------------------------------------------------

test.describe('API Response Contracts', () => {
  test('POST /api/generations response matches contract', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/generations`, {
      headers: authHeaders(),
      data: {
        type: 'image',
        prompt: 'Contract test image',
        quality_tiers: ['standard'],
      },
    });

    if (response.status() !== 201) {
      test.skip();
      return;
    }

    const data = await response.json();

    // Verify CreateGenerationsResponse shape
    expect(data).toHaveProperty('generations');
    expect(data).toHaveProperty('total_preview_cost');
    expect(typeof data.total_preview_cost).toBe('number');

    const gen = data.generations[0];
    expect(gen).toHaveProperty('id');
    expect(gen).toHaveProperty('type');
    expect(gen).toHaveProperty('quality_tier');
    expect(gen).toHaveProperty('provider');
    expect(gen).toHaveProperty('status');
    expect(gen).toHaveProperty('preview_cost_credits');
    expect(gen).toHaveProperty('estimated_seconds');

    // Type correctness
    expect(typeof gen.id).toBe('string');
    expect(['image', 'video', 'voice', 'script']).toContain(gen.type);
    expect(['standard', 'premium', 'ultra']).toContain(gen.quality_tier);
    expect(typeof gen.preview_cost_credits).toBe('number');
    expect(typeof gen.estimated_seconds).toBe('number');
  });

  test('GET /api/generations response matches contract', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/generations`, {
      headers: authHeaders(),
    });

    if (response.status() !== 200) {
      test.skip();
      return;
    }

    const data = await response.json();

    expect(data).toHaveProperty('generations');
    expect(data).toHaveProperty('total');
    expect(data).toHaveProperty('has_more');
    expect(typeof data.total).toBe('number');
    expect(typeof data.has_more).toBe('boolean');
    expect(data.generations).toBeInstanceOf(Array);
  });
});
