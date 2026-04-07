/**
 * Cloudflare Worker for Remove.bg API proxy
 * 
 * Features:
 * - Hides API key from client
 * - CORS handling
 * - IP-based rate limiting (using KV)
 * - Google OAuth login with D1 user storage
 * - Logged-in users get higher rate limits
 * - Streams response directly without storing
 */

const GOOGLE_CLIENT_ID = '642236827987-18qj94l0rgeet2jfjo8clatnnrr61fiv.apps.googleusercontent.com';

export default {
  async fetch(request, env, ctx) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return handleCors(env, new Response(null, { status: 204 }));
    }

    const url = new URL(request.url);

    // Google OAuth verify endpoint
    if (url.pathname === '/api/auth/google') {
      if (request.method === 'POST') {
        return handleCors(env, await handleGoogleAuth(request, env));
      }
    }

    // Get current user info endpoint
    if (url.pathname === '/api/user') {
      if (request.method === 'GET') {
        return handleCors(env, await handleGetUser(request, env));
      }
    }

    // Only allow POST to /remove-background
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
      // Get authorization token from header
      const authHeader = request.headers.get('Authorization');
      let tokenUser = null;
      
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        // Verify token with Google
        const googleResponse = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${token}`);
        if (googleResponse.ok) {
          const payload = await googleResponse.json();
          if (payload.azp === GOOGLE_CLIENT_ID && env.DB) {
            // Find user in D1
            const userResult = await env.DB.prepare(`
              SELECT * FROM users WHERE google_id = ?
            `).bind(payload.sub).first();
            if (userResult) {
              tokenUser = userResult;
            }
          }
        }
      }

      // Rate limiting: 
      // - Anonymous: not allowed (must login)
      // - Logged-in free users: 3 images/day
      // - Subscribed users: unlimited
      let isLimited = false;
      let message = '';

      if (!tokenUser) {
        // Anonymous users not allowed now - must login
        isLimited = true;
        message = 'Please login with Google to use this tool. Login is free and only takes one click.';
      } else if (tokenUser.is_subscribed === 1) {
        // Subscribed users - unlimited
        isLimited = false;
      } else {
        // Free logged-in user: 3 images/day
        const today = new Date().toISOString().split('T')[0];
        let currentCount = tokenUser.daily_free_count || 0;
        
        // Reset count if date changed
        if (tokenUser.last_reset_date !== today && env.DB) {
          await env.DB.prepare(`
            UPDATE users SET daily_free_count = 0, last_reset_date = ? WHERE id = ?
          `).bind(today, tokenUser.id).run();
          currentCount = 0;
        }

        const dailyLimit = 3;
        if (currentCount >= dailyLimit) {
          isLimited = true;
          message = `You've used your ${dailyLimit} free images for today. Subscribe to get unlimited access.`;
        }
      }

      if (isLimited) {
        return handleCors(env, new Response(JSON.stringify({ 
          error: 'Rate limit exceeded',
          details: message,
          require_subscription: true
        }), { 
          status: 429,
          headers: { 'Content-Type': 'application/json' }
        }));
      }

      // Increment counter for free users
      if (tokenUser && env.DB && !tokenUser.is_subscribed) {
        const today = new Date().toISOString().split('T')[0];
        let currentCount = tokenUser.daily_free_count || 0;
        
        if (tokenUser.last_reset_date !== today) {
          currentCount = 0;
        }

        await env.DB.prepare(`
          UPDATE users SET daily_free_count = ?, last_login_at = CURRENT_TIMESTAMP WHERE id = ?
        `).bind(currentCount + 1, tokenUser.id).run();
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

// Google OAuth verification handler
async function handleGoogleAuth(request, env) {
  try {
    const body = await request.json();
    const { credential } = body;

    if (!credential) {
      return new Response(JSON.stringify({ error: 'No credential provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verify token with Google
    const googleResponse = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
    if (!googleResponse.ok) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const payload = await googleResponse.json();

    // Verify client ID
    if (payload.azp !== GOOGLE_CLIENT_ID) {
      return new Response(JSON.stringify({ error: 'Client ID mismatch' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const google_id = payload.sub;
    const email = payload.email;
    const name = payload.name || null;
    const picture = payload.picture || null;
    const today = new Date().toISOString().split('T')[0];

    // Upsert user into D1
    if (env.DB) {
      const result = await env.DB.prepare(`
        INSERT INTO users (google_id, email, name, picture, last_reset_date, daily_free_count, is_subscribed)
        VALUES (?, ?, ?, ?, ?, 0, 0)
        ON CONFLICT(google_id) DO UPDATE SET 
          name = COALESCE(excluded.name, users.name),
          picture = COALESCE(excluded.picture, users.picture),
          last_login_at = CURRENT_TIMESTAMP
        RETURNING id, google_id, email, name, picture, is_subscribed, daily_free_count, last_reset_date
      `).bind(google_id, email, name, picture, today).first();

      return new Response(JSON.stringify({
        success: true,
        user: {
          id: result.id,
          google_id: result.google_id,
          email: result.email,
          name: result.name,
          picture: result.picture,
          is_subscribed: result.is_subscribed,
          daily_free_count: result.daily_free_count,
          last_reset_date: result.last_reset_date
        },
        credential
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // No D1 configured
    return new Response(JSON.stringify({
      success: true,
      user: { google_id, email, name, picture },
      credential
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Google auth error:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error',
      details: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Get current user info
async function handleGetUser(request, env) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ user: null }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const token = authHeader.split(' ')[1];
  
  try {
    const googleResponse = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${token}`);
    if (!googleResponse.ok) {
      return new Response(JSON.stringify({ user: null }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const payload = await googleResponse.json();
    if (payload.azp !== GOOGLE_CLIENT_ID || !env.DB) {
      return new Response(JSON.stringify({ user: null }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const user = await env.DB.prepare(`
      SELECT id, google_id, email, name, picture, is_subscribed, daily_free_count, last_reset_date
      FROM users WHERE google_id = ?
    `).bind(payload.sub).first();

    return new Response(JSON.stringify({ user }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Get user error:', error);
    return new Response(JSON.stringify({ user: null, error: error.message }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

function handleCors(env, response) {
  // Allow all origins
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}
