export const runtime = 'edge';

export async function GET(request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');

  if (error) {
    return new Response(null, {
      status: 302,
      headers: { Location: '/?error=oauth_error' }
    });
  }

  if (!code) {
    return new Response(null, {
      status: 302,
      headers: { Location: '/?error=no_code' }
    });
  }

  return new Response(null, {
    status: 302,
    headers: { Location: '/?success=login' }
  });
}
