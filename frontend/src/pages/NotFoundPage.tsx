import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-7xl font-black text-fuchsia-600">404</p>
      <h1 className="font-display text-2xl font-bold">Página não encontrada</h1>
      <p className="max-w-md text-slate-600 dark:text-slate-400">
        O link pode estar incorreto ou a página foi removida. Que tal voltar para o cardápio?
      </p>
      <Link to="/" className="rounded-2xl bg-gradient-to-r from-fuchsia-600 to-violet-700 px-6 py-3 text-sm font-bold text-white">
        Ir para início
      </Link>
    </div>
  );
}
