import { AuthLiteClient } from './auth-client-with-builder';

const API_KEY: string = process.env.API_KEY ? process.env.API_KEY : '';
const API_SECRET: string = process.env.API_SECRET ? process.env.API_SECRET : '';
const ORG_ID: string = process.env.ORG_ID ? process.env.ORG_ID : '';

const authClient = await AuthLiteClient.build(API_KEY, API_SECRET, ORG_ID);

export default authClient;
