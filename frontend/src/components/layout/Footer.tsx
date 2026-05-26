import { Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useMe } from '@/hooks/useMe';

export function Footer() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const { data: me } = useMe();

  return (
    <footer className="border-t border-slate-200 bg-white py-10 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-display text-base font-bold text-slate-900 dark:text-white">Império do Açaí</p>
          <p className="mt-1 max-w-md">
            Açaí cremoso, combos especiais e milkshakes — entregamos fresquinho até você.
          </p>
        </div>
        <div className="flex flex-wrap gap-4">
          <Link to="/cardapio" className="hover:text-fuchsia-600">
            Cardápio
          </Link>
          {accessToken ? (
            <>
              {me?.role === 'ADMIN' && (
                <Link to="/admin" className="hover:text-fuchsia-600">
                  Painel admin
                </Link>
              )}
              <Link to="/pedidos" className="hover:text-fuchsia-600">
                Meus pedidos
              </Link>
              <Link to="/perfil" className="hover:text-fuchsia-600">
                Perfil
              </Link>
            </>
          ) : (
            <>
              <Link to="/login" className="hover:text-fuchsia-600">
                Entrar
              </Link>
              <Link to="/cadastro" className="hover:text-fuchsia-600">
                Criar conta
              </Link>
            </>
          )}
        </div>
      </div>
      <p className="mt-8 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} Império do Açaí — Projeto demonstrativo.
      </p>
    </footer>
  );
}
