import { decodeJwt, JWTPayload, SignJWT } from 'jose';
import { makeRequest } from './makeRequest';

interface TokenCheck {
  access: string;
  refresh: string;
  state: boolean;
}

type GetUser = {
  iss: string;
  jti: string;
  access_token: string;
  type: string;
  exp: number;
  refresh_Token: string;
  refreshExp: number;
  scope: string;
  img: string;
  name: string;
  iat: number;
  uid: string;
  email: string;
};

type $TSFixMe = any;
type AuthLiteClientOption = (A: AuthLiteClient) => void;

export class AuthLiteClient {
  private secretKey: string;
  private apiKey: string;
  private orgId?: string;
  private signedKey: string;

  constructor(...options: AuthLiteClientOption[]) {
    this.secretKey = '';
    this.apiKey = '';
    this.orgId = '';
    this.signedKey = '';
    for (const option of options) {
      option(this);
    }
  }

  public static withSecretKey(secretKey: string): AuthLiteClientOption {
    return (A: AuthLiteClient) => {
      A.secretKey = secretKey;
    };
  }

  public static withApiKey(apiKey: string): AuthLiteClientOption {
    return (A: AuthLiteClient) => {
      A.apiKey = apiKey;
    };
  }

  public static withOrgId(orgId: string): AuthLiteClientOption {
    return (A: AuthLiteClient) => {
      A.orgId = orgId;
    };
  }

  public static async withSignedKey(
    secretKey: string,
    data: JWTPayload
  ): Promise<AuthLiteClientOption> {
    const signedKey = await AuthLiteClient.jwtEncode(secretKey, data);
    return (A: AuthLiteClient) => {
      A.signedKey = signedKey;
    };
  }

  private static async jwtEncode(
    key: string,
    data: JWTPayload
  ): Promise<string> {
    //REF: https://advancedweb.hu/how-to-sign-verify-and-encrypt-jwts-in-node/#sign
    const secret = Buffer.from(key, 'hex');

    return await new SignJWT(data)
      .setProtectedHeader({ alg: 'HS256' })
      .sign(secret);
  }

  private jwtDecode(token: string): $TSFixMe {
    return decodeJwt(token);
  }

  generateUrl(subDomain?: string): string {
    if (this.orgId)
      return `https://${
        subDomain ? `${subDomain}.` : ''
      }app.trustauthx.com/widget/login/?org_id=${this.orgId}`;
    else throw new Error('Must provide org_id');
  }

  generateEditUserUrl(accessToken: string, url: string): string {
    const params = new URLSearchParams({
      AccessToken: accessToken,
      api_key: this.apiKey,
      signed_key: this.signedKey,
      url: url,
    });

    return `https://api.trustauthx.com/api/user/me/settings/?${params.toString()}`;
  }

  async reAuth(code: string): Promise<{ email: string; uid: string }> {
    const url = 'https://api.trustauthx.com/api/user/me/widget/re-auth/token';
    const params = new URLSearchParams({
      code: code,
      api_key: this.apiKey,
      signed_key: this.signedKey,
    });
    const headers = { accept: 'application/json' };

    try {
      const response = await makeRequest(url + '?' + params.toString(), {
        headers,
      });

      if (response.status === 200) {
        const data = await response.json();

        const decoded = this.jwtDecode(JSON.stringify(data));

        return { email: decoded.email, uid: decoded.uid };
      } else {
        throw new Error(
          `Request failed with status code: ${
            response.status
          }\n${await response.text()}`
        );
      }
    } catch (error) {
      throw new Error(`Request failed: ${error}`);
    }
  }

  async getUser(token: string): Promise<GetUser> {
    const url = 'https://api.trustauthx.com/api/user/me/auth/data';
    const params = new URLSearchParams({
      UserToken: token,
      api_key: this.apiKey,
      signed_key: this.signedKey,
    });
    const headers = { accept: 'application/json' };

    try {
      /**
       * Below code checks isSignedkey recieved, if not then throws the error
       */
      console.log({ signedKey: this.signedKey }, this);
      if (!this.signedKey) {
        throw Error('Promise SignJWT not resolved!!');
      }

      const response = await fetch(url + '?' + params.toString(), {
        method: 'GET',
        headers: headers,
      });

      if (response.status === 200) {
        const data = await response.json();

        const decoded = this.jwtDecode(data);
        const decodedSub = JSON.parse(decoded['sub']);
        delete decoded['sub'];

        return { ...decoded, ...decodedSub };
      } else {
        throw new Error(
          `Request failed with status code: ${
            response.status
          }\n${await response.text()}`
        );
      }
    } catch (error) {
      throw new Error(`Request failed: ${error}`);
    }
  }

  async getAccessTokenFromRefreshToken(refreshToken: string): Promise<any> {
    const url = 'https://api.trustauthx.com/api/user/me/access/token/';
    const params = new URLSearchParams({
      RefreshToken: refreshToken,
      api_key: this.apiKey,
      signed_key: this.signedKey,
    });
    const headers = { accept: 'application/json' };

    try {
      const response = await fetch(url + '?' + params.toString(), {
        method: 'GET',
        headers: headers,
      });

      if (response.status === 200) {
        return await response.json();
      } else {
        throw new Error(
          `Request failed with status code: ${
            response.status
          }\n${await response.text()}`
        );
      }
    } catch (error: any) {
      throw new Error(`Request failed: ${error.message}`);
    }
  }

  async validateAccessToken(access_token: string): Promise<boolean> {
    const url = 'https://api.trustauthx.com/api/user/me/auth/validate/token';
    const params = new URLSearchParams({
      AccessToken: access_token,
      api_key: this.apiKey,
      signed_key: this.signedKey,
    });
    const headers = { accept: 'application/json' };

    try {
      const response = await fetch(url + '?' + params.toString(), {
        method: 'GET',
        headers: headers,
      });

      return response.status === 200;
    } catch (error) {
      throw new Error(`Request failed: ${error}`);
    }
  }

  async revokeToken(
    accessToken: string,
    refreshToken: string | null = null,
    revokeAllTokens: boolean = false
  ): Promise<boolean> {
    const url = 'https://api.trustauthx.com/api/user/me/token/';
    const headers = { accept: 'application/json' };

    if (!accessToken)
      throw new Error('Must provide either AccessToken or RefreshToken');

    const isAccessToken = !!accessToken;
    const t = accessToken ?? refreshToken;
    const params = new URLSearchParams({
      Token: t!,
      api_key: this.apiKey,
      signed_key: this.signedKey,
      AccessToken: isAccessToken.toString(),
      SpecificTokenOnly: (!revokeAllTokens).toString(),
    });

    try {
      const response = await fetch(url + '?' + params.toString(), {
        method: 'DELETE',
        headers: headers,
      });

      return response.status === 200;
    } catch (error) {
      throw new Error(`Request failed: ${error}`);
    }
  }

  async getUserFromToken(accessToken: string): Promise<{
    uid: string;
    email: string;
    img: string;
  }> {
    const url = 'https://api.trustauthx.com/api/user/me/data';
    const params = new URLSearchParams({
      api_key: this.apiKey,
      signed_key: this.signedKey,
      AccessToken: accessToken,
    });
    const headers = { accept: 'application/json' };

    try {
      const response = await fetch(url + '?' + params.toString(), {
        method: 'GET',
        headers: headers,
      });

      if (response.status === 200) {
        const data = await response.text();
        const processedData = data.slice(1, -1);

        const decoded = this.jwtDecode(processedData);

        return {
          uid: decoded?.uid,
          email: decoded?.email,
          img: decoded?.img,
        };
      } else {
        throw new Error(
          `Request failed with status code: ${
            response.status
          }\n${await response.text()}`
        );
      }
    } catch (error) {
      throw new Error(`Request failed: ${error}`);
    }
  }

  async validateTokenSet(
    access_token: string,
    refresh_token: string
  ): Promise<TokenCheck> {
    try {
      const d: TokenCheck = {
        access: '',
        refresh: '',
        state: false,
      };
      const is_valid = await this.validateAccessToken(access_token);
      if (!is_valid) {
        if (refresh_token) {
          const new_tokens = await this.getAccessTokenFromRefreshToken(
            refresh_token
          );
          d.state = false;
          d.access = new_tokens['access_token'];
          d.refresh = new_tokens['refresh_token'];
        }
        return d;
      } else {
        d.state = true;
        d.access = access_token;
        d.refresh = refresh_token;
        return d;
      }
    } catch (error) {
      throw new Error('Both tokens are invalid, please log in again');
    }
  }
}
