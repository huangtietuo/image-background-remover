import { NextResponse } from 'next/server';

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

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export async function POST(request) {
  try {
    const { imageBase64 } = await request.json();

    if (!imageBase64) {
      return NextResponse.json(
        { error: 'No image provided' },
        {
          status: 400,
          headers: { 'Access-Control-Allow-Origin': '*' }
        }
      );
    }

    const binaryString = atob(imageBase64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: 'image/png' });

    const apiFormData = new FormData();
    apiFormData.append('image_file', blob, 'image.png');
    apiFormData.append('size', 'auto');

    const apiResponse = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: {
        'X-Api-Key': REMOVE_BG_API_KEY,
      },
      body: apiFormData,
    });

    if (!apiResponse.ok) {
      let error;
      try {
        error = await apiResponse.json();
      } catch (e) {
        const text = await apiResponse.text();
        error = { error: 'API error', details: text };
      }
      return NextResponse.json(error, {
        status: apiResponse.status,
        headers: { 'Access-Control-Allow-Origin': '*' }
      });
    }

    const arrayBuffer = await apiResponse.arrayBuffer();
    const base64Res = arrayBufferToBase64(arrayBuffer);

    return NextResponse.json(
      { imageBase64: base64Res },
      {
        status: 200,
        headers: { 'Access-Control-Allow-Origin': '*' }
      }
    );

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      {
        status: 500,
        headers: { 'Access-Control-Allow-Origin': '*' }
      }
    );
  }
}
