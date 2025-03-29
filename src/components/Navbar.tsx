
import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "./ui/button";
import { Menu, X, LogOut, FileText, Upload, Search, User, Settings, Home } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Navbar() {
  const { currentAccount, isConnected, connectWallet, disconnectWallet } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  
  const navItems = [
    { 
      name: "首页", 
      path: "/", 
      icon: <Home className="h-5 w-5 mr-2" /> 
    },
    { 
      name: "论文提交", 
      path: "/submit", 
      icon: <Upload className="h-5 w-5 mr-2" /> 
    },
    { 
      name: "论文检索", 
      path: "/search", 
      icon: <Search className="h-5 w-5 mr-2" /> 
    },
    { 
      name: "我的论文", 
      path: "/my-papers", 
      icon: <FileText className="h-5 w-5 mr-2" /> 
    },
    { 
      name: "管理面板", 
      path: "/admin", 
      icon: <Settings className="h-5 w-5 mr-2" /> 
    }
  ];

  return (
    <nav className="bg-paper-primary text-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <FileText className="h-8 w-8" />
              <span className="ml-2 text-xl font-bold">论文注册系统</span>
            </Link>
          </div>

          {/* Desktop menu */}
          <div className="hidden md:flex items-center space-x-4">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center px-3 py-2 rounded-md text-sm font-medium hover:bg-paper-secondary transition",
                  location.pathname === item.path ? "bg-paper-secondary" : "bg-transparent"
                )}
              >
                {item.icon}
                {item.name}
              </Link>
            ))}
            
            {isConnected ? (
              <div className="flex items-center ml-4">
                <span className="text-sm mr-2 truncate max-w-[120px]" title={currentAccount}>
                  {currentAccount.substring(0, 6)}...{currentAccount.substring(currentAccount.length - 4)}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-white text-white hover:bg-white hover:text-paper-primary"
                  onClick={() => disconnectWallet()}
                >
                  <LogOut className="h-4 w-4 mr-1" />
                  登出
                </Button>
              </div>
            ) : (
              <Button 
                variant="outline" 
                size="sm" 
                className="border-white text-white hover:bg-white hover:text-paper-primary"
                onClick={connectWallet}
              >
                <User className="h-4 w-4 mr-1" />
                连接钱包
              </Button>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center">
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-white hover:bg-paper-secondary focus:outline-none"
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center px-3 py-2 rounded-md text-sm font-medium",
                  location.pathname === item.path
                    ? "bg-paper-secondary text-white"
                    : "text-white hover:bg-paper-secondary"
                )}
                onClick={() => setIsMenuOpen(false)}
              >
                {item.icon}
                {item.name}
              </Link>
            ))}
            
            {isConnected ? (
              <div className="flex flex-col space-y-2 pt-2 border-t border-paper-secondary">
                <span className="text-sm px-3 py-2 text-white truncate">
                  {currentAccount.substring(0, 6)}...{currentAccount.substring(currentAccount.length - 4)}
                </span>
                <button
                  className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-white hover:bg-paper-secondary"
                  onClick={() => {
                    disconnectWallet();
                    setIsMenuOpen(false);
                  }}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  登出
                </button>
              </div>
            ) : (
              <button
                className="w-full flex items-center px-3 py-2 mt-2 rounded-md text-sm font-medium text-white hover:bg-paper-secondary"
                onClick={() => {
                  connectWallet();
                  setIsMenuOpen(false);
                }}
              >
                <User className="h-4 w-4 mr-2" />
                连接钱包
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
