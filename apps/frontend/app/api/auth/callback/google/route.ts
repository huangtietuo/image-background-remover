import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const error = url.searchParams.get('error');

    if (error) {
      return NextResponse.redirect(new URL(`/?error=${error}`, request.url));
    }

    if (!code) {
      return NextResponse.redirect(new URL('/?error=no_code', request.url));
    }

    return NextResponse.redirect(new URL('/?success=login', request.url));

  } catch (err) {
    return NextResponse.redirect(new URL('/?error=callback_failed', request.url));
  }
}
