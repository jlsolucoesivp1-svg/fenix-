'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const response = await fetch('/api/auth/password/update', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) });
    if (!response.ok) return setMessage((await response.json()).error || 'Falha ao redefinir senha.');
    router.replace('/');
  };
  return <main className="mx-auto max-w-sm p-8"><h1>Redefinir senha</h1><form onSubmit={submit} className="space-y-4"><input className="w-full" type="password" minLength={8} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Nova senha" /><button type="submit">Salvar nova senha</button>{message ? <p>{message}</p> : null}</form></main>;
}
