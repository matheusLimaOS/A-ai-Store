import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useMe } from '@/hooks/useMe';

export function HomePage() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const { data: me } = useMe();

  return (
    <>
      <Helmet>
        <title>Império do Açaí — Delivery de açaí</title>
      </Helmet>
      <section className="relative overflow-hidden bg-gradient-to-br from-fuchsia-600 via-violet-700 to-indigo-900 text-white">
        <div className="pointer-events-none absolute inset-0 opacity-40">
          <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-pink-400 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-violet-300 blur-3xl" />
        </div>
        <div className="relative mx-auto flex max-w-6xl flex-col gap-10 px-4 py-16 md:flex-row md:items-center md:py-24">
          <div className="flex-1 space-y-6">
            <p className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
              Sabor de verdade
            </p>
            <h1 className="font-display text-4xl font-black leading-tight md:text-5xl">
              O açaí mais cremoso da cidade, do jeitinho que você gosta.
            </h1>
            <p className="max-w-xl text-lg text-fuchsia-100">
              Monte tamanhos, complementos grátis e extras. Acompanhe seu pedido em tempo real e receba onde estiver.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/cardapio"
                className="inline-flex items-center justify-center rounded-2xl bg-white px-6 py-3 text-sm font-bold text-fuchsia-700 shadow-xl"
              >
                Ver cardápio
              </Link>
              {!accessToken ? (
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center rounded-2xl border border-white/30 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10"
                >
                  Entrar
                </Link>
              ) : me?.role === 'ADMIN' ? (
                <Link
                  to="/admin"
                  className="inline-flex items-center justify-center rounded-2xl border border-white/30 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10"
                >
                  Painel admin
                </Link>
              ) : (
                <Link
                  to="/pedidos"
                  className="inline-flex items-center justify-center rounded-2xl border border-white/30 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10"
                >
                  Meus pedidos
                </Link>
              )}
            </div>
          </div>
          <div className="flex-1">
            <div className="relative mx-auto max-w-md rounded-[2rem] bg-white/10 p-4 shadow-2xl ring-1 ring-white/20 backdrop-blur">
              <img
                src="https://images.unsplash.com/photo-1590301157890-4810ed352733?w=900"
                alt="Açaí"
                className="h-72 w-full rounded-3xl object-cover md:h-96"
              />
            </div>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-4 py-14">
        <h2 className="font-display text-2xl font-bold">Por que Império?</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {[
            { t: 'Montagem livre', d: 'Escolha tamanho, complementos e veja o preço atualizar na hora.' },
            { t: 'Entrega rápida', d: 'Frete grátis em pedidos acima de R$ 80 (regra promocional).' },
            { t: 'Acompanhamento', d: 'Status do pedido atualizado para você ficar tranquilo.' },
          ].map((c) => (
            <div key={c.t} className="rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950">
              <h3 className="font-semibold">{c.t}</h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{c.d}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
