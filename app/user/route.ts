import AuthClient from '@/util/AuthClient';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const queryParams = new URLSearchParams(url.search);

  const token: string | null = queryParams.get('code');

  try {
    if (!token) {
      throw Error('Token is Missing');
    }
    const user = await AuthClient.getUser(token);
    if (!user.access_token) throw Error('Access Token is Missing');
    cookies().set('access_token', user.access_token, {
      maxAge: 3600 * 24,
    });
    return new Response(JSON.stringify(user), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.log('LOG:', error);
    return new Response('Internal server error', { status: 500 });
  }
}
