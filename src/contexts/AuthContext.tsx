
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { ethers } from "ethers";
import { getContract } from "../utils/contract";
import { toast } from "../hooks/use-toast";

interface AuthContextType {
  currentAccount: string;
  isOwner: boolean;
  isAuditor: boolean;
  isConnected: boolean;
  connectWallet: () => Promise<void>;
  checkRole: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentAccount, setCurrentAccount] = useState<string>("");
  const [isOwner, setIsOwner] = useState<boolean>(false);
  const [isAuditor, setIsAuditor] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  useEffect(() => {
    checkConnection();
    
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", handleAccountsChanged);
      window.ethereum.on("chainChanged", handleChainChanged);
    }
    
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
        window.ethereum.removeListener("chainChanged", handleChainChanged);
      }
    };
  }, []);

  async function checkConnection() {
    if (!window.ethereum) {
      console.log("MetaMask not detected");
      return;
    }
    
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.listAccounts();
      
      if (accounts.length > 0) {
        const address = accounts[0].address;
        setCurrentAccount(address);
        setIsConnected(true);
        await checkRole();
      }
    } catch (error) {
      console.error("Error checking connection:", error);
    }
  }

  async function connectWallet() {
    try {
      if (!window.ethereum) {
        toast({
          title: "错误",
          description: "请安装MetaMask后再尝试连接钱包",
          variant: "destructive"
        });
        return;
      }
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      await window.ethereum.request({ method: "eth_requestAccounts" });
      const accounts = await provider.listAccounts();
      
      if (accounts.length > 0) {
        const address = accounts[0].address;
        setCurrentAccount(address);
        setIsConnected(true);
        
        await checkRole();
        
        toast({
          title: "已连接",
          description: "钱包连接成功",
        });
      }
    } catch (error) {
      console.error("Error connecting wallet:", error);
      toast({
        title: "连接错误",
        description: (error as Error).message,
        variant: "destructive"
      });
    }
  }

  async function checkRole() {
    try {
      if (!window.ethereum || !currentAccount) {
        return;
      }
      
      const contract = await getContract();
      
      // Check if current account is the owner
      const ownerAddr = await contract.owner();
      setIsOwner(currentAccount.toLowerCase() === ownerAddr.toLowerCase());
      
      // Check if current account is an auditor
      const auditorFlag = await contract.auditors(currentAccount);
      setIsAuditor(auditorFlag);
    } catch (error) {
      console.error("Error checking role:", error);
    }
  }

  function handleAccountsChanged(accounts: string[]) {
    if (accounts.length === 0) {
      setCurrentAccount("");
      setIsConnected(false);
      setIsOwner(false);
      setIsAuditor(false);
    } else {
      setCurrentAccount(accounts[0]);
      setIsConnected(true);
      checkRole();
    }
  }

  function handleChainChanged() {
    window.location.reload();
  }

  return (
    <AuthContext.Provider
      value={{
        currentAccount,
        isOwner,
        isAuditor,
        isConnected,
        connectWallet,
        checkRole
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
