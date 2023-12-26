import { AuthLiteClient } from './auth-client-with-options-pattern';

const API_KEY: string = process.env.API_KEY ? process.env.API_KEY : '';
const API_SECRET: string = process.env.API_SECRET ? process.env.API_SECRET : '';
const ORG_ID: string = process.env.ORG_ID ? process.env.ORG_ID : '';

const authClient = new AuthLiteClient(
  AuthLiteClient.withApiKey(API_KEY),
  AuthLiteClient.withSecretKey(API_SECRET),
  AuthLiteClient.withOrgId(ORG_ID),
  await AuthLiteClient.withSignedKey(API_SECRET, { api_key: API_KEY })
);

export default authClient;
