
import React from "react";
import { User } from "lucide-react";

interface AdminHeaderProps {
  currentAccount: string;
  isOwner: boolean;
  isAuditor: boolean;
}

export default function AdminHeader({ currentAccount, isOwner, isAuditor }: AdminHeaderProps) {
  return (
    <div className="mb-4 paper-card">
      <div className="flex items-center mb-4">
        <div className="p-2 rounded-full bg-paper-light text-paper-primary mr-3">
          <User className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm text-gray-500">当前钱包地址</p>
          <p className="font-medium">{currentAccount}</p>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-2">
        <div className="bg-paper-light text-paper-primary px-3 py-1 rounded-full text-sm">
          {isOwner ? "合约所有者" : ""}
        </div>
        <div className="bg-paper-light text-paper-primary px-3 py-1 rounded-full text-sm">
          {isAuditor ? "审稿人" : ""}
        </div>
      </div>
    </div>
  );
}
