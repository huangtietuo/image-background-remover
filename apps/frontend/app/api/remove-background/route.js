export const runtime = 'edge';

const REMOVE_BG_API_KEY = 'JVtFYBFEBzByiVhbduGmiyAb';

export async function OPTIONS() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

export async function POST(request) {
  try {
    console.log('Received request to /api/remove-background');

    const formData = await request.formData();
    console.log('Form data parsed successfully');

    const imageFile = formData.get('image');

    if (!imageFile) {
      console.log('No image provided');
      return new Response(JSON.stringify({ error: 'No image provided' }), {
        status: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
      });
    }

    console.log('Image received, calling remove.bg API...');

    // Create new FormData for Remove.bg API
    const apiFormData = new FormData();
    apiFormData.append('image_file', imageFile);
    apiFormData.append('size', 'auto');

    // Directly call Remove.bg API from Next.js
    const apiResponse = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: {
        'X-Api-Key': REMOVE_BG_API_KEY,
      },
      body: apiFormData,
    });

    console.log('remove.bg API response status:', apiResponse.status);

    if (!apiResponse.ok) {
      console.log('remove.bg API error response');
      let error;
      try {
        error = await apiResponse.json();
      } catch (e) {
        const text = await apiResponse.text();
        error = { error: 'API error', details: text };
      }
      return new Response(JSON.stringify(error), {
        status: apiResponse.status,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
      });
    }

    console.log('Streaming response back to client');

    // Stream the response directly back to client
    const headers = new Headers();
    apiResponse.headers.forEach((value, key) => {
      if (!['connection', 'keep-alive', 'transfer-encoding'].includes(key.toLowerCase())) {
        headers.set(key, value);
      }
    });

    headers.set('Access-Control-Allow-Origin', '*');
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'image/png');
    }
    if (!headers.has('Content-Disposition')) {
      headers.set('Content-Disposition', 'attachment; filename="background-removed.png"');
    }

    return new Response(apiResponse.body, {
      status: apiResponse.status,
      headers: headers,
    });

  } catch (error) {
    console.error('Fatal error in /api/remove-background:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error',
      details: error.message,
    }), {
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
    });
  }
}
