'use client';

import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

type SetupResponse = {
  base32: string;
  qrCode: string;
};

type AuthResult = {
  user: {
    id: string;
    email: string;
    name?: string | null;
  };
  accessToken: string;
  accessExpiresAt: number | null;
};

export default function TwoFactorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const userId = searchParams.get('userId');
  const email = searchParams.get('email') ?? '';
  const mode = searchParams.get('mode') ?? 'verify';

  const isSetupMode = mode === 'setup';

  const [code, setCode] = useState('');
  const [secret, setSecret] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [loadingSetup, setLoadingSetup] = useState(isSetupMode);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSetup() {
      if (!isSetupMode || !userId) return;

      try {
        setLoadingSetup(true);
        setError(null);

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/2fa/setup`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId }),
          },
        );

        if (!res.ok) {
          setError('Failed to load 2FA setup');
          return;
        }

        const data: SetupResponse = await res.json();
        setSecret(data.base32);
        setQrCode(data.qrCode);
      } catch {
        setError('Failed to load 2FA setup');
      } finally {
        setLoadingSetup(false);
      }
    }

    loadSetup();
  }, [isSetupMode, userId]);

  async function createSession(data: AuthResult) {
    const loginRes = await signIn('credentials', {
      redirect: false,
      userId: data.user.id,
      email: data.user.email,
      accessToken: data.accessToken,
    });

    if (loginRes?.error) {
      throw new Error('Session creation failed');
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!userId) {
      setError('Missing login session');
      return;
    }

    if (isSetupMode && !secret) {
      setError('2FA secret was not loaded');
      return;
    }

    setSubmitting(true);

    try {
      const endpoint = isSetupMode
        ? `${process.env.NEXT_PUBLIC_API_URL}/auth/2fa/enable`
        : `${process.env.NEXT_PUBLIC_API_URL}/auth/2fa/verify-login`;

      const body = isSetupMode
        ? { userId, secret, code }
        : { userId, code };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        setError(
          isSetupMode
            ? 'Invalid code. Please confirm the code from your authenticator app.'
            : 'Invalid authentication code',
        );
        return;
      }

      const data: AuthResult = await res.json();
      await createSession(data);

      router.push('/projects');
      router.refresh();
    } catch {
      setError(isSetupMode ? '2FA setup failed' : 'Verification failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm space-y-4 border rounded-xl p-6"
      >
        <h1 className="text-xl font-semibold">
          {isSetupMode ? 'Set up two-factor authentication' : 'Two-factor authentication'}
        </h1>

        {isSetupMode ? (
          <>
            <p className="text-sm text-gray-600">
              Scan this QR code in your authenticator app, then enter the 6-digit code to finish setup.
            </p>

            {loadingSetup ? (
              <p className="text-sm text-gray-600">Loading QR code...</p>
            ) : qrCode ? (
              <div className="space-y-3">
                <img
                  src={qrCode}
                  alt="2FA QR code"
                  className="mx-auto h-48 w-48 border rounded-md"
                />
                <div className="rounded-md bg-gray-800 p-3 text-xs break-all">
                  <p className="font-medium mb-1">Manual setup key</p>
                  <p>{secret}</p>
                </div>
              </div>
            ) : null}
          </>
        ) : (
          <p className="text-sm text-gray-600">
            Enter the 6-digit code from your authenticator app for {email || 'your account'}.
          </p>
        )}

        <div className="space-y-2">
          <label className="text-sm">
            {isSetupMode ? 'Authentication code to confirm setup' : 'Authentication code'}
          </label>
          <input
            className="w-full border rounded-md p-2 text-center tracking-widest"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\s+/g, ''))}
            placeholder="123456"
            maxLength={6}
            inputMode="numeric"
            autoComplete="one-time-code"
            required
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          className="w-full border rounded-md p-2 disabled:opacity-50"
          disabled={submitting || loadingSetup}
        >
          {submitting
            ? isSetupMode
              ? 'Finishing setup...'
              : 'Verifying...'
            : isSetupMode
              ? 'Finish setup'
              : 'Verify'}
        </button>

        <button
          type="button"
          className="w-full border rounded-md p-2"
          onClick={() => router.push('/login')}
        >
          Back to login
        </button>
      </form>
    </main>
  );
}