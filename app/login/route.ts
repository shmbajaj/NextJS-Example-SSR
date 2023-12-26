import AuthClient from '@/util/AuthClient';

export async function GET() {
  return Response.redirect(AuthClient.generateUrl());
}
