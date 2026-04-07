import { NextResponse } from 'next/server';

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

    const { imageBase64 } = await request.json();
    console.log('imageBase64 received:', !!imageBase64);

    if (!imageBase64) {
      return NextResponse.json(
        { error: 'No image provided' },
        {
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
          }
        }
      );
    }

    // Convert base64 to Blob
    const buffer = Buffer.from(imageBase64, 'base64');
    const blob = new Blob([buffer]);

    // Create new FormData for Remove.bg API
    const apiFormData = new FormData();
    apiFormData.append('image_file', blob, 'image.png');
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
      let error;
      try {
        error = await apiResponse.json();
      } catch (e) {
        const text = await apiResponse.text();
        error = { error: 'API error', details: text };
      }
      return NextResponse.json(
        error,
        {
          status: apiResponse.status,
          headers: {
            'Access-Control-Allow-Origin': '*',
          }
        }
      );
    }

    // Convert to base64 and return as JSON
    const bufferRes = await apiResponse.arrayBuffer();
    const base64Res = Buffer.from(bufferRes).toString('base64');

    return NextResponse.json(
      { imageBase64: base64Res },
      {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
        }
      }
    );

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
        }
      }
    );
  }
}
