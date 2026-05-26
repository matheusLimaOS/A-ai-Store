import { create } from 'zustand';

type UiState = {
  cartOpen: boolean;
  builderProductSlug: string | null;
  globalLoading: boolean;
  setCartOpen: (v: boolean) => void;
  setBuilderSlug: (slug: string | null) => void;
  setGlobalLoading: (v: boolean) => void;
};

export const useUiStore = create<UiState>((set) => ({
  cartOpen: false,
  builderProductSlug: null,
  globalLoading: false,
  setCartOpen: (cartOpen) => set({ cartOpen }),
  setBuilderSlug: (builderProductSlug) => set({ builderProductSlug }),
  setGlobalLoading: (globalLoading) => set({ globalLoading }),
}));
