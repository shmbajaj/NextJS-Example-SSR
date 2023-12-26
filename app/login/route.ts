import AuthClient from '@/util/AuthClient';

export async function GET() {
  await AuthClient.init();
  return Response.redirect(AuthClient.generateUrl());
}
