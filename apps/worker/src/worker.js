/**
 * Cloudflare Worker for Remove.bg API proxy
 * 
 * Features:
 * - Hides API key from client
 * - CORS handling
 * - IP-based rate limiting (using KV)
 * - Streams response directly without storing
 */

export default {
  async fetch(request, env, ctx) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return handleCors(env, new Response(null, { status: 204 }));
    }

    // Only allow POST to /remove-background
    const url = new URL(request.url);
    if (url.pathname !== '/remove-background') {
      return handleCors(env, new Response(JSON.stringify({ 
        error: 'Not found' 
      }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      }));
    }

    if (request.method !== 'POST') {
      return handleCors(env, new Response(JSON.stringify({ 
        error: 'Method not allowed' 
      }), { 
        status: 405,
        headers: { 'Content-Type': 'application/json' }
      }));
    }

    try {
      // Get client IP for rate limiting
      const clientIp = request.headers.get('CF-Connecting-IP') || 
                      request.headers.get('X-Forwarded-For') || 
                      'unknown';
      
      // Rate limiting: check daily limit with KV
      const today = new Date().toISOString().split('T')[0];
      const cacheKey = `rate:${clientIp}:${today}`;
      const dailyLimit = parseInt(env.DAILY_FREE_LIMIT || '3', 10);
      
      // If RATE_LIMIT_KV binding exists, check rate limit
      if (env.RATE_LIMIT_KV) {
        const currentCount = await env.RATE_LIMIT_KV.get(cacheKey);
        const count = currentCount ? parseInt(currentCount, 10) : 0;
        
        if (count >= dailyLimit) {
          return handleCors(env, new Response(JSON.stringify({ 
            error: 'Rate limit exceeded',
            details: `Daily limit of ${dailyLimit} images reached. Please try again tomorrow or upgrade to a paid plan.`
          }), { 
            status: 429,
            headers: { 'Content-Type': 'application/json' }
          }));
        }
        
        // Increment counter
        await env.RATE_LIMIT_KV.put(cacheKey, (count + 1).toString(), {
          expirationTtl: 86400 // 1 day
        });
      } else {
        // If no KV binding bound, just log (for development)
        console.log('Rate limiting: KV not configured, skipping check');
      }
      
      // Get the request body as FormData
      const formData = await request.formData();
      const imageFile = formData.get('image');
      
      if (!imageFile) {
        return handleCors(env, new Response(JSON.stringify({ 
          error: 'No image provided' 
        }), { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }));
      }

      // Create new FormData for Remove.bg API
      const apiFormData = new FormData();
      apiFormData.append('image_file', imageFile);
      apiFormData.append('size', 'auto');

      // Forward request to Remove.bg API
      const apiResponse = await fetch('https://api.remove.bg/v1.0/removebg', {
        method: 'POST',
        headers: {
          'X-Api-Key': env.REMOVE_BG_API_KEY,
        },
        body: apiFormData,
      });

      if (!apiResponse.ok) {
        const errorText = await apiResponse.text();
        console.error('Remove.bg API error:', errorText);
        return handleCors(env, new Response(JSON.stringify({ 
          error: 'API error', 
          details: errorText 
        }), { 
          status: apiResponse.status,
          headers: { 'Content-Type': 'application/json' }
        }));
      }

      // Stream the response directly back to client - no storage!
      const response = new Response(apiResponse.body, {
        status: apiResponse.status,
        headers: {
          'Content-Type': apiResponse.headers.get('Content-Type') || 'image/png',
          'Content-Disposition': 'attachment; filename="background-removed.png"',
        },
      });

      return handleCors(env, response);

    } catch (error) {
      console.error('Worker error:', error);
      return handleCors(env, new Response(JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }));
    }
  },
};

function handleCors(env, response) {
  // 开发环境允许所有来源，方便调试
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  return response;
}
