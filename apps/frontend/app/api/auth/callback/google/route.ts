import { NextResponse } from 'next/server';

// Google OAuth callback handler
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    const state = searchParams.get('state');
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    console.log('Google OAuth callback received:', { state, code, error });

    if (error) {
      console.error('OAuth error:', error);
      return NextResponse.redirect(
        new URL(`/?error=${error}`, request.url)
      );
    }

    if (!code) {
      console.error('No authorization code received');
      return NextResponse.redirect(
        new URL('/?error=no_code', request.url)
      );
    }

    // For local testing, we'll simulate a successful login
    // In production, you would exchange the code for an access token with Google
    const mockUser = {
      id: 1,
      google_id: 'test_google_id',
      email: 'test@example.com',
      name: 'Test User',
      picture: null,
      is_subscribed: 0,
      daily_free_count: 0,
      last_reset_date: new Date().toISOString().split('T')[0]
    };

    // Create a response with a success parameter
    const response = NextResponse.redirect(
      new URL('/?success=login', request.url)
    );

    return response;

  } catch (error) {
    console.error('Callback handler error:', error);
    return NextResponse.redirect(
      new URL('/?error=internal', request.url)
    );
  }
}

// Handle POST requests as well (for OAuth 2.0 implicit flow)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('Google OAuth POST callback:', body);

    // This is typically used for token exchange or other OAuth flows
    return NextResponse.json({
      success: true,
      message: 'Callback received',
      data: body
    });

  } catch (error) {
    console.error('POST callback error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
