import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';
import type { LinkedIdentity } from './AnonymousAuth';

WebBrowser.maybeCompleteAuthSession();

export interface GoogleSignInResult {
  ok: boolean;
  identity?: LinkedIdentity;
  reason?: 'cancelled' | 'failed' | 'no_clients';
}

interface GoogleClientIds {
  android?: string;
  ios?: string;
  web?: string;
}

function readClientIds(): GoogleClientIds {
  const extra = (Constants.expoConfig?.extra ?? {}) as {
    googleClientIds?: GoogleClientIds;
  };
  return extra.googleClientIds ?? {};
}

function isPlaceholder(id?: string): boolean {
  return !id || id.startsWith('YOUR_GOOGLE_');
}

export function useGoogleSignIn() {
  const ids = readClientIds();
  const [request, , promptAsync] = Google.useAuthRequest({
    androidClientId: isPlaceholder(ids.android) ? undefined : ids.android,
    iosClientId: isPlaceholder(ids.ios) ? undefined : ids.ios,
    webClientId: isPlaceholder(ids.web) ? undefined : ids.web,
  });

  const promptSignIn = async (): Promise<GoogleSignInResult> => {
    if (!request) return { ok: false, reason: 'no_clients' };
    if (
      isPlaceholder(ids.android) &&
      isPlaceholder(ids.ios) &&
      isPlaceholder(ids.web)
    ) {
      return { ok: false, reason: 'no_clients' };
    }
    const result = await promptAsync();
    if (result?.type !== 'success') {
      return {
        ok: false,
        reason: result?.type === 'cancel' ? 'cancelled' : 'failed',
      };
    }
    const accessToken =
      result.authentication?.accessToken ??
      (result.params as Record<string, string>)?.access_token;
    if (!accessToken) return { ok: false, reason: 'failed' };
    try {
      const userInfoRes = await fetch('https://www.googleapis.com/userinfo/v2/me', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const profile = (await userInfoRes.json()) as {
        id?: string;
        email?: string;
        name?: string;
      };
      if (!profile.id) return { ok: false, reason: 'failed' };
      return {
        ok: true,
        identity: {
          userId: `google:${profile.id}`,
          displayName: profile.name ?? profile.email ?? 'Google User',
        },
      };
    } catch {
      return { ok: false, reason: 'failed' };
    }
  };

  return { promptSignIn, ready: !!request };
}
