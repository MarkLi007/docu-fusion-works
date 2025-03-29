
import React from "react";
import { Link } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AuthRequiredMessageProps {
  type: "connect" | "unauthorized";
  onConnect?: () => void;
  isOwner?: boolean;
  isAuditor?: boolean;
  currentAccount?: string;
}

export default function AuthRequiredMessage({ 
  type, 
  onConnect, 
  isOwner, 
  isAuditor,
  currentAccount
}: AuthRequiredMessageProps) {
  if (type === "connect") {
    return (
      <div className="paper-card text-center py-8">
        <AlertCircle className="h-12 w-12 text-paper-primary mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-paper-primary mb-4">请先连接钱包</h2>
        <p className="text-gray-600 mb-6">您需要连接MetaMask钱包才能访问管理面板</p>
        <Button className="paper-btn-primary" onClick={onConnect}>
          连接钱包
        </Button>
      </div>
    );
  }
  
  return (
    <div className="paper-card text-center py-8">
      <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
      <h2 className="text-2xl font-bold text-paper-primary mb-4">权限不足</h2>
      <p className="text-gray-600 mb-2">只有合约所有者和审稿人可以访问管理面板</p>
      <p className="text-gray-600 mb-6">您的钱包地址: {currentAccount}</p>
      <div className="mb-4 text-sm">
        <p>当前权限状态:</p>
        <p>合约所有者: {isOwner ? "是" : "否"}</p>
        <p>审稿人: {isAuditor ? "是" : "否"}</p>
      </div>
      <Link to="/">
        <Button className="paper-btn-primary">返回首页</Button>
      </Link>
    </div>
  );
}
