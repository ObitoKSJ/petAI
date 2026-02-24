'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PawPrint } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function LoginPage() {
  const [isSignup, setIsSignup] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = isSignup ? '/api/auth/signup' : '/api/auth/login';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }

      router.push('/');
      router.refresh();
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-2">
          <PawPrint className="size-10 text-primary" strokeWidth={1.5} />
          <h1 className="font-[family-name:var(--font-playwrite)] text-2xl italic text-foreground/80">
            PetCare
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full rounded-xl bg-foreground/5 px-4 py-3 text-base outline-none placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-primary/30"
            autoComplete="username"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl bg-foreground/5 px-4 py-3 text-base outline-none placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-primary/30"
            autoComplete={isSignup ? 'new-password' : 'current-password'}
          />

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !username || !password}
            className={cn(
              'w-full rounded-xl py-3 text-base font-medium transition-colors',
              'bg-primary text-primary-foreground hover:bg-primary/90',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            {loading ? '...' : isSignup ? 'Sign Up' : 'Log In'}
          </button>
        </form>

        <button
          onClick={() => { setIsSignup(!isSignup); setError(''); }}
          className="mt-4 w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {isSignup ? 'Already have an account? Log in' : "Don't have an account? Sign up"}
        </button>
      </div>
    </div>
  );
}
