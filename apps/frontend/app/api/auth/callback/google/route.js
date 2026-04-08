export const runtime = 'edge';

export async function GET(request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');

  let redirectUrl = '/?success=login';

  if (error) {
    redirectUrl = '/?error=' + encodeURIComponent(error);
  } else if (!code) {
    redirectUrl = '/?error=no_code';
  }

  return new Response(null, {
    status: 302,
    headers: { Location: redirectUrl }
  });
}
