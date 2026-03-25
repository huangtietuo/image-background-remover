export const runtime = 'edge';

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

export async function POST(request) {
  try {
    console.log('Received request');

    const formData = await request.formData();
    console.log('Form data keys:', Array.from(formData.keys()));

    const image = formData.get('image');
    console.log('Image type:', typeof image);

    return new Response(JSON.stringify({
      success: true,
      message: 'API is working',
      imageReceived: !!image,
    }), {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    console.error('Error in POST handler:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error',
      details: error.message,
      stack: error.stack,
    }), {
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
    });
  }
}
