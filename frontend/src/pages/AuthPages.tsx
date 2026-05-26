import { Helmet } from 'react-helmet-async';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { isAxiosError } from 'axios';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';
import { useMe } from '@/hooks/useMe';
import type { UserProfile } from '@/types';

export function LoginPage() {
  const token = useAuthStore((s) => s.accessToken);
  const setTokens = useAuthStore((s) => s.setTokens);
  const { data: me, isPending: mePending } = useMe();
  const queryClient = useQueryClient();
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  if (token) {
    if (mePending && !me) {
      return (
        <>
          <Helmet>
            <title>Entrar — Império do Açaí</title>
          </Helmet>
          <div className="mx-auto max-w-md px-4 py-16 text-center text-sm text-slate-600 dark:text-slate-400">Carregando sessão…</div>
        </>
      );
    }
    return <Navigate to={me?.role === 'ADMIN' ? '/admin' : '/'} replace />;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const { data } = await api.post('/auth/login', { email, password });
      const access = data.data.accessToken;
      const refresh = data.data.refreshToken;
      setTokens(access, refresh);
      const meRes = await api.get<{ data: UserProfile }>('/users/me');
      const user = meRes.data.data;
      queryClient.setQueryData(['me', access], user);
      toast.success('Bem-vindo de volta!');
      nav(user.role === 'ADMIN' ? '/admin' : '/');
    } catch (err) {
      const msg = isAxiosError(err)
        ? (err.response?.data as { message?: string })?.message
        : undefined;
      toast.error(msg || 'Não foi possível entrar. Verifique a conexão e tente de novo.');
    }
  }

  return (
    <>
      <Helmet>
        <title>Entrar — Império do Açaí</title>
      </Helmet>
      <div className="mx-auto flex max-w-md flex-col gap-6 px-4 py-16">
        <h1 className="font-display text-3xl font-black">Entrar</h1>
        <form onSubmit={submit} className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950">
          <div>
            <label className="text-sm font-medium">E-mail</label>
            <input
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-800 dark:bg-slate-950"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium">Senha</label>
            <input
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-800 dark:bg-slate-950"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-xl bg-gradient-to-r from-fuchsia-600 to-violet-700 py-3 text-sm font-bold text-white"
          >
            Entrar
          </button>
        </form>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Esqueceu a senha? <Link className="text-fuchsia-600" to="/recuperar-senha">Recuperar</Link>
        </p>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Novo por aqui? <Link className="text-fuchsia-600" to="/cadastro">Criar conta</Link>
        </p>
      </div>
    </>
  );
}

export function RegisterPage() {
  const token = useAuthStore((s) => s.accessToken);
  const setTokens = useAuthStore((s) => s.setTokens);
  const { data: me, isPending: mePending } = useMe();
  const queryClient = useQueryClient();
  const nav = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  if (token) {
    if (mePending && !me) {
      return (
        <>
          <Helmet>
            <title>Cadastro — Império do Açaí</title>
          </Helmet>
          <div className="mx-auto max-w-md px-4 py-16 text-center text-sm text-slate-600 dark:text-slate-400">Carregando sessão…</div>
        </>
      );
    }
    return <Navigate to="/" replace />;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const { data } = await api.post('/auth/register', { name, email, password });
      const access = data.data.accessToken;
      const refresh = data.data.refreshToken;
      setTokens(access, refresh);
      const meRes = await api.get<{ data: UserProfile }>('/users/me');
      queryClient.setQueryData(['me', access], meRes.data.data);
      toast.success('Conta criada!');
      nav('/');
    } catch {
      toast.error('Não foi possível cadastrar');
    }
  }

  return (
    <>
      <Helmet>
        <title>Cadastro — Império do Açaí</title>
      </Helmet>
      <div className="mx-auto flex max-w-md flex-col gap-6 px-4 py-16">
        <h1 className="font-display text-3xl font-black">Criar conta</h1>
        <form onSubmit={submit} className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950">
          <div>
            <label className="text-sm font-medium">Nome</label>
            <input
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-800 dark:bg-slate-950"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium">E-mail</label>
            <input
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-800 dark:bg-slate-950"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium">Senha</label>
            <input
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-800 dark:bg-slate-950"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              minLength={6}
              required
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-xl bg-gradient-to-r from-fuchsia-600 to-violet-700 py-3 text-sm font-bold text-white"
          >
            Cadastrar
          </button>
        </form>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Já tem conta? <Link className="text-fuchsia-600" to="/login">Entrar</Link>
        </p>
      </div>
    </>
  );
}

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [devLink, setDevLink] = useState<string | undefined>();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      setDevLink(data.data.devLink);
      toast.success(data.data.message);
    } catch {
      toast.error('Não foi possível enviar');
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="font-display text-3xl font-black">Recuperar senha</h1>
      <form onSubmit={submit} className="mt-6 space-y-4 rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950">
        <input
          className="w-full rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-800 dark:bg-slate-950"
          placeholder="Seu e-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          required
        />
        <button type="submit" className="w-full rounded-xl bg-fuchsia-600 py-3 text-sm font-bold text-white">
          Enviar
        </button>
      </form>
      {devLink && (
        <p className="mt-4 break-all text-xs text-slate-500">
          Link de desenvolvimento: <a className="text-fuchsia-600" href={devLink}>{devLink}</a>
        </p>
      )}
    </div>
  );
}

export function ResetPasswordPage() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token') ?? '';
  const email = params.get('email') ?? '';
  const [password, setPassword] = useState('');
  const nav = useNavigate();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api.post('/auth/reset-password', { email, token, newPassword: password });
      toast.success('Senha atualizada');
      nav('/login');
    } catch {
      toast.error('Token inválido');
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="font-display text-3xl font-black">Nova senha</h1>
      <form onSubmit={submit} className="mt-6 space-y-4 rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950">
        <p className="text-sm text-slate-600">{email}</p>
        <input
          className="w-full rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-800 dark:bg-slate-950"
          placeholder="Nova senha"
          type="password"
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit" className="w-full rounded-xl bg-fuchsia-600 py-3 text-sm font-bold text-white">
          Salvar
        </button>
      </form>
    </div>
  );
}
