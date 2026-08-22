"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { CHAINS, DEFAULT_CHAIN, getChain, type Chain } from "./constants";

const STORAGE_KEY = "paywright-chain";

type ChainContextValue = {
  chain: Chain;
  /** Switch the app's active chain. Persists across reloads. */
  setChainId: (id: string) => void;
};

const ChainContext = createContext<ChainContextValue | null>(null);

/**
 * Holds the user's chosen network (testnet or mainnet), shared by the chain
 * dropdown, the wallet-chain check, balance reads, and payment signing.
 * Starts on the safe default (Base Sepolia) on every load — mainnet is
 * never assumed, only picked. The choice is remembered in localStorage so a
 * returning user doesn't have to re-select it every visit.
 */
export function ChainProvider({ children }: { children: ReactNode }) {
  const [chainId, setChainIdState] = useState(DEFAULT_CHAIN.id);

  // Hydrate from localStorage after mount only (SSR has no localStorage,
  // and this keeps first paint deterministic between server and client).
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved && CHAINS.some((c) => c.id === saved && c.active)) {
        setChainIdState(saved);
      }
    } catch {
      /* localStorage unavailable (e.g. private mode) — stay on default */
    }
  }, []);

  function setChainId(id: string) {
    setChainIdState(id);
    try {
      window.localStorage.setItem(STORAGE_KEY, id);
    } catch {
      /* best-effort persistence only */
    }
  }

  const chain = useMemo(() => getChain(chainId), [chainId]);

  return (
    <ChainContext.Provider value={{ chain, setChainId }}>
      {children}
    </ChainContext.Provider>
  );
}

export function useChain(): ChainContextValue {
  const ctx = useContext(ChainContext);
  if (!ctx) throw new Error("useChain must be used within ChainProvider");
  return ctx;
}
