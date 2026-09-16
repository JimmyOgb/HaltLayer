"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  ContractState,
  Incident,
  ProtectedProtocol,
  DemoVaultState,
  TransactionStatus,
  SubmitIncidentInput,
} from "../contracts/types";
import { GenLayerRpcClient } from "../contracts/rpcClient";
import { HaltLayerClient } from "../contracts/haltLayerClient";
import { DemoVaultClient } from "../contracts/demoVaultClient";

interface ProtocolContextValue {
  state: ContractState;
  transactions: TransactionStatus[];
  haltLayerAddress: string;
  demoVaultAddress: string;
  rpcUrl: string;
  networkName: string;
  walletAddress: string | null;
  chainId: string | null;
  isCorrectChain: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  switchToGenLayerNetwork: () => Promise<void>;
  setContractAddresses: (haltLayer: string, demoVault: string) => void;
  setNetwork: (networkName: string, rpcUrl: string) => void;
  refreshState: () => Promise<void>;
  submitIncident: (input: SubmitIncidentInput) => Promise<string>;
  adjudicateIncident: (incidentId: string) => Promise<string>;
  appealIncident: (incidentId: string, reason: string) => Promise<string>;
  resolveAppeal: (incidentId: string, overturn: boolean, notes: string) => Promise<string>;
  depositToVault: (amount: number) => Promise<string>;
  withdrawFromVault: (amount: number) => Promise<string>;
  toggleVaultPause: (pause: boolean) => Promise<string>;
}

const ProtocolContext = createContext<ProtocolContextValue | undefined>(undefined);

const PROD_HALT_LAYER = "0x178D62fB059467545b0b3059C8A1A83C98E0b45E";
const PROD_DEMO_VAULT = "0xE096057d2bB63B13Cb4200aE45A4114A283cE3E0";

const HISTORICAL_CONTRACT_ADDRESSES = new Set([
  "0x6ec1051FD327B1D06Efc0F752CF9565C2806BB45".toLowerCase(),
  "0x30B4aa8F89692B4128a3501Cb057cE15b0b9d0F9".toLowerCase(),
  "0xB363DC3E1d34b4D8AbAb0B9452C4a93352C91A23".toLowerCase(),
  "0x76a379E6e11dd6E10F13De2b7356F62a4a693d1B".toLowerCase(),
]);

function filterActiveContract(addr: string | undefined, defaultAddr: string): string {
  if (!addr) return defaultAddr;
  const lower = addr.trim().toLowerCase();
  if (HISTORICAL_CONTRACT_ADDRESSES.has(lower)) {
    return defaultAddr;
  }
  return addr.trim();
}

export const ProtocolProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [rpcUrl, setRpcUrl] = useState<string>(
    process.env.NEXT_PUBLIC_GENLAYER_RPC_URL || "https://studio-next.genlayer.com/api"
  );
  const [networkName, setNetworkName] = useState<string>(
    process.env.NEXT_PUBLIC_NETWORK_NAME || "studio_next"
  );
  const [haltLayerAddress, setHaltLayerAddress] = useState<string>(
    filterActiveContract(process.env.NEXT_PUBLIC_HALT_LAYER_ADDRESS, PROD_HALT_LAYER)
  );
  const [demoVaultAddress, setDemoVaultAddress] = useState<string>(
    filterActiveContract(process.env.NEXT_PUBLIC_DEMO_VAULT_ADDRESS, PROD_DEMO_VAULT)
  );
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<TransactionStatus[]>([]);

  const [state, setState] = useState<ContractState>({
    network: {
      name: networkName,
      rpcUrl: rpcUrl,
      connected: false,
      error: null,
    },
    haltLayer: {
      address: haltLayerAddress,
      admin: "",
      protocolCount: 0,
      incidentCount: 0,
      protocols: {},
      incidents: [],
    },
    demoVault: null,
    lastUpdated: null,
    isRefreshing: false,
  });

  const rpcClient = React.useMemo(() => new GenLayerRpcClient(rpcUrl), [rpcUrl]);
  const haltClient = React.useMemo(
    () => new HaltLayerClient(rpcClient, haltLayerAddress),
    [rpcClient, haltLayerAddress]
  );
  const vaultClient = React.useMemo(
    () => new DemoVaultClient(rpcClient, demoVaultAddress),
    [rpcClient, demoVaultAddress]
  );

  const [chainId, setChainId] = useState<string | null>(null);

  // Studio Next Chain Specifications (61997 / 0xf22d)
  const GENLAYER_STUDIO_NEXT_CHAIN_ID_HEX = "0xf22d"; // 61997
  const GENLAYER_STUDIO_NEXT_CHAIN_ID_DEC = 61997;

  const isChainMatch = (cId: string | null): boolean => {
    if (!cId) return false;
    const clean = cId.toLowerCase().trim();
    if (clean === GENLAYER_STUDIO_NEXT_CHAIN_ID_HEX) return true;
    try {
      if (clean.startsWith("0x")) {
        const parsed = parseInt(clean, 16);
        return parsed === GENLAYER_STUDIO_NEXT_CHAIN_ID_DEC;
      }
      const num = Number(clean);
      return num === GENLAYER_STUDIO_NEXT_CHAIN_ID_DEC;
    } catch {
      return false;
    }
  };

  const isCorrectChain = isChainMatch(chainId);

  // Listen to provider chain & account changes
  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).ethereum) {
      const ethereum = (window as any).ethereum;

      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts && accounts.length > 0) {
          setWalletAddress(accounts[0]);
        } else {
          setWalletAddress(null);
        }
      };

      const handleChainChanged = (newChainId: string) => {
        setChainId(newChainId);
      };

      try {
        ethereum.on?.("accountsChanged", handleAccountsChanged);
        ethereum.on?.("chainChanged", handleChainChanged);

        // Fetch current chain silently if provider exists
        ethereum
          .request?.({ method: "eth_chainId" })
          .then((cId: string) => {
            if (cId) setChainId(cId);
          })
          .catch(() => {});
      } catch (e) {
        console.warn("Ethereum event listener initialization error:", e);
      }

      return () => {
        try {
          ethereum.removeListener?.("accountsChanged", handleAccountsChanged);
          ethereum.removeListener?.("chainChanged", handleChainChanged);
        } catch {
          // ignore cleanup error
        }
      };
    }
  }, []);

  // --- Wallet Management ---
  const connectWallet = async () => {
    if (typeof window !== "undefined" && (window as any).ethereum) {
      const ethereum = (window as any).ethereum;
      try {
        // Step 1: Request account access
        const accounts = await ethereum.request({ method: "eth_requestAccounts" });
        if (!accounts || accounts.length === 0) {
          throw new Error("No accounts found in wallet");
        }
        setWalletAddress(accounts[0]);

        // Step 2: Verify connected chain
        const currentChain = await ethereum.request({ method: "eth_chainId" });
        setChainId(currentChain);
      } catch (err: any) {
        throw new Error(err?.message || "Wallet connection rejected by user");
      }
    } else {
      throw new Error(
        "No Web3 wallet extension found (e.g. MetaMask). Read-only mode remains fully functional."
      );
    }
  };

  const disconnectWallet = () => {
    setWalletAddress(null);
  };

  const switchToGenLayerNetwork = async () => {
    if (typeof window !== "undefined" && (window as any).ethereum) {
      const ethereum = (window as any).ethereum;
      try {
        await ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: GENLAYER_STUDIO_NEXT_CHAIN_ID_HEX }],
        });
        setChainId(GENLAYER_STUDIO_NEXT_CHAIN_ID_HEX);
      } catch (switchError: any) {
        // Error code 4902 means the chain has not been added yet
        if (switchError.code === 4902 || switchError?.data?.originalError?.code === 4902) {
          try {
            await ethereum.request({
              method: "wallet_addEthereumChain",
              params: [
                {
                  chainId: GENLAYER_STUDIO_NEXT_CHAIN_ID_HEX,
                  chainName: "GenLayer Studio Next",
                  nativeCurrency: {
                    name: "GEN Token",
                    symbol: "GEN",
                    decimals: 18,
                  },
                  rpcUrls: ["https://studio-next.genlayer.com/api"],
                  blockExplorerUrls: ["https://explorer-studio-dev.genlayer.com/"],
                },
              ],
            });
            setChainId(GENLAYER_STUDIO_NEXT_CHAIN_ID_HEX);
          } catch (addError: any) {
            throw new Error(addError?.message || "Failed to add GenLayer Studio Next network");
          }
        } else {
          throw new Error(switchError?.message || "Failed to switch to GenLayer Studio Next");
        }
      }
    } else {
      throw new Error("No Web3 wallet provider available");
    }
  };

  const setContractAddresses = (haltAddr: string, vaultAddr: string) => {
    const validHalt = filterActiveContract(haltAddr, PROD_HALT_LAYER);
    const validVault = filterActiveContract(vaultAddr, PROD_DEMO_VAULT);
    setHaltLayerAddress(validHalt);
    setDemoVaultAddress(validVault);
    if (typeof window !== "undefined") {
      localStorage.setItem("hl_halt_layer_addr", validHalt);
      localStorage.setItem("hl_demo_vault_addr", validVault);
    }
  };

  const setNetwork = (name: string, url: string) => {
    setNetworkName(name);
    setRpcUrl(url);
    rpcClient.setEndpoint(url);
    if (typeof window !== "undefined") {
      localStorage.setItem("hl_network_name", name);
      localStorage.setItem("hl_rpc_url", url);
    }
  };

  // --- Real Contract State Reader ---
  const refreshState = useCallback(async () => {
    setState((prev) => ({ ...prev, isRefreshing: true }));

    try {
      // 1. Ping network
      const pingRes = await rpcClient.ping();

      let admin = "";
      let protocolCount = 0;
      let incidentCount = 0;
      const protocols: Record<string, ProtectedProtocol> = {};
      let incidents: Incident[] = [];
      let vaultState: DemoVaultState | null = null;

      const isHaltConfigured =
        haltLayerAddress &&
        haltLayerAddress !== "0x0000000000000000000000000000000000000000";

      const isVaultConfigured =
        demoVaultAddress &&
        demoVaultAddress !== "0x0000000000000000000000000000000000000000";

      if (isHaltConfigured && pingRes.connected) {
        try {
          admin = await haltClient.getAdmin();
          protocolCount = await haltClient.getProtocolCount();
          incidentCount = await haltClient.getIncidentCount();
          incidents = await haltClient.getAllIncidents();

          // If demoVault is configured, fetch its registration
          if (isVaultConfigured) {
            try {
              const prot = await haltClient.getProtocol(demoVaultAddress);
              protocols[demoVaultAddress] = prot;
            } catch (err) {
              // Not registered yet
            }
          }
        } catch (err: any) {
          console.warn("HaltLayer contract read error:", err);
        }
      }

      if (isVaultConfigured && pingRes.connected) {
        try {
          vaultState = await vaultClient.getState(walletAddress || undefined);
        } catch (err: any) {
          console.warn("DemoVault contract read error:", err);
        }
      }

      setState({
        network: {
          name: networkName,
          rpcUrl: rpcUrl,
          connected: pingRes.connected,
          error: pingRes.error,
        },
        haltLayer: {
          address: haltLayerAddress,
          admin,
          protocolCount,
          incidentCount,
          protocols,
          incidents,
        },
        demoVault: vaultState,
        lastUpdated: Date.now(),
        isRefreshing: false,
      });
    } catch (err: any) {
      setState((prev) => ({
        ...prev,
        network: {
          ...prev.network,
          connected: false,
          error: err?.message || "Failed to query contracts",
        },
        isRefreshing: false,
      }));
    }
  }, [rpcUrl, networkName, haltLayerAddress, demoVaultAddress, walletAddress, haltClient, rpcClient, vaultClient]);

  // Load stored addresses from localStorage on mount (rejecting stale historical addresses)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const HISTORICAL_ADDRESSES = new Set([
        "0x6ec1051FD327B1D06Efc0F752CF9565C2806BB45".toLowerCase(),
        "0x30B4aa8F89692B4128a3501Cb057cE15b0b9d0F9".toLowerCase(),
        "0xB363DC3E1d34b4D8AbAb0B9452C4a93352C91A23".toLowerCase(),
        "0x76a379E6e11dd6E10F13De2b7356F62a4a693d1B".toLowerCase(),
      ]);

      const storedHalt = localStorage.getItem("hl_halt_layer_addr");
      const storedVault = localStorage.getItem("hl_demo_vault_addr");
      const storedNetwork = localStorage.getItem("hl_network_name");
      const storedRpc = localStorage.getItem("hl_rpc_url");

      if (storedHalt && !HISTORICAL_CONTRACT_ADDRESSES.has(storedHalt.toLowerCase())) {
        setHaltLayerAddress(storedHalt);
      } else {
        localStorage.removeItem("hl_halt_layer_addr");
        setHaltLayerAddress(PROD_HALT_LAYER);
      }

      if (storedVault && !HISTORICAL_CONTRACT_ADDRESSES.has(storedVault.toLowerCase())) {
        setDemoVaultAddress(storedVault);
      } else {
        localStorage.removeItem("hl_demo_vault_addr");
        setDemoVaultAddress(PROD_DEMO_VAULT);
      }

      if (storedNetwork) setNetworkName(storedNetwork);
      if (storedRpc) setRpcUrl(storedRpc);
    }
  }, []);

  // Poll state every 4 seconds
  useEffect(() => {
    refreshState();
    const interval = setInterval(refreshState, 4000);
    return () => clearInterval(interval);
  }, [refreshState]);

  // --- Transactions with Real State Confirmation ---

  const addTx = (hash: string, type: TransactionStatus["type"], message: string) => {
    const tx: TransactionStatus = {
      hash,
      type,
      status: "pending",
      message,
      timestamp: Date.now(),
    };
    setTransactions((prev) => [tx, ...prev.slice(0, 9)]);
    return tx;
  };

  const updateTx = (hash: string, status: "confirmed" | "failed", message?: string) => {
    setTransactions((prev) =>
      prev.map((t) => (t.hash === hash ? { ...t, status, message: message || t.message } : t))
    );
  };

  const submitIncident = async (input: SubmitIncidentInput): Promise<string> => {
    const res = await haltClient.submitIncident(
      input.target,
      input.description,
      input.txHashes,
      input.evidenceUrls
    );
    addTx(res.txHash, "submit_incident", `Incident submitted for ${input.target.slice(0, 8)}...`);

    // Poll for confirmation
    rpcClient
      .waitForReceipt(res.txHash)
      .then(() => {
        updateTx(res.txHash, "confirmed", "Incident confirmed on-chain");
        refreshState();
      })
      .catch((err) => {
        updateTx(res.txHash, "failed", err.message);
      });

    return res.txHash;
  };

  const adjudicateIncident = async (incidentId: string): Promise<string> => {
    const res = await haltClient.adjudicateIncident(incidentId);
    addTx(res.txHash, "adjudicate", `GenLayer consensus evaluating ${incidentId}`);

    rpcClient
      .waitForReceipt(res.txHash)
      .then(() => {
        updateTx(res.txHash, "confirmed", `Consensus finalized for ${incidentId}`);
        refreshState();
      })
      .catch((err) => {
        updateTx(res.txHash, "failed", err.message);
      });

    return res.txHash;
  };

  const appealIncident = async (incidentId: string, reason: string): Promise<string> => {
    const res = await haltClient.appealIncident(incidentId, reason);
    addTx(res.txHash, "appeal", `Appeal submitted for ${incidentId}`);

    rpcClient
      .waitForReceipt(res.txHash)
      .then(() => {
        updateTx(res.txHash, "confirmed", `Appeal filed for ${incidentId}`);
        refreshState();
      })
      .catch((err) => {
        updateTx(res.txHash, "failed", err.message);
      });

    return res.txHash;
  };

  const resolveAppeal = async (
    incidentId: string,
    overturn: boolean,
    notes: string
  ): Promise<string> => {
    const res = await haltClient.resolveAppeal(incidentId, overturn, notes);
    addTx(
      res.txHash,
      "resolve_appeal",
      `Appeal resolved: ${overturn ? "Overturn -> Resume" : "Upheld -> Final Halt"}`
    );

    rpcClient
      .waitForReceipt(res.txHash)
      .then(() => {
        updateTx(res.txHash, "confirmed", "Appeal determination finalized on-chain");
        refreshState();
      })
      .catch((err) => {
        updateTx(res.txHash, "failed", err.message);
      });

    return res.txHash;
  };

  const depositToVault = async (amount: number): Promise<string> => {
    const res = await vaultClient.deposit(amount);
    addTx(res.txHash, "deposit", `Depositing $${amount.toLocaleString()} into DemoVault`);

    rpcClient
      .waitForReceipt(res.txHash)
      .then(() => {
        updateTx(res.txHash, "confirmed", `Deposited $${amount.toLocaleString()}`);
        refreshState();
      })
      .catch((err) => {
        updateTx(res.txHash, "failed", err.message);
      });

    return res.txHash;
  };

  const withdrawFromVault = async (amount: number): Promise<string> => {
    const res = await vaultClient.withdraw(amount);
    addTx(res.txHash, "withdraw", `Attempting withdrawal of $${amount.toLocaleString()}`);

    rpcClient
      .waitForReceipt(res.txHash)
      .then(() => {
        updateTx(res.txHash, "confirmed", `Withdrawal completed`);
        refreshState();
      })
      .catch((err) => {
        updateTx(res.txHash, "failed", err.message);
      });

    return res.txHash;
  };

  const toggleVaultPause = async (pause: boolean): Promise<string> => {
    const res = pause ? await vaultClient.pause() : await vaultClient.resume();
    addTx(res.txHash, pause ? "pause" : "resume", pause ? "Emergency Pausing Vault" : "Resuming Vault");

    rpcClient
      .waitForReceipt(res.txHash)
      .then(() => {
        updateTx(res.txHash, "confirmed", pause ? "Vault paused" : "Vault resumed");
        refreshState();
      })
      .catch((err) => {
        updateTx(res.txHash, "failed", err.message);
      });

    return res.txHash;
  };

  return (
    <ProtocolContext.Provider
      value={{
        state,
        transactions,
        haltLayerAddress,
        demoVaultAddress,
        rpcUrl,
        networkName,
        walletAddress,
        chainId,
        isCorrectChain,
        connectWallet,
        disconnectWallet,
        switchToGenLayerNetwork,
        setContractAddresses,
        setNetwork,
        refreshState,
        submitIncident,
        adjudicateIncident,
        appealIncident,
        resolveAppeal,
        depositToVault,
        withdrawFromVault,
        toggleVaultPause,
      }}
    >
      {children}
    </ProtocolContext.Provider>
  );
};

export const useProtocol = (): ProtocolContextValue => {
  const ctx = useContext(ProtocolContext);
  if (!ctx) {
    throw new Error("useProtocol must be used within a ProtocolProvider");
  }
  return ctx;
};
