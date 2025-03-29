
import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { UserPlus, UserMinus } from "lucide-react";

interface AuditorsManagementTabProps {
  newAuditorAddr: string;
  isAddingAuditor: boolean;
  isRemovingAuditor: boolean;
  onAddressChange: (address: string) => void;
  onAddAuditor: () => void;
  onRemoveAuditor: () => void;
}

export default function AuditorsManagementTab({
  newAuditorAddr,
  isAddingAuditor,
  isRemovingAuditor,
  onAddressChange,
  onAddAuditor,
  onRemoveAuditor
}: AuditorsManagementTabProps) {
  return (
    <div className="paper-card">
      <h2 className="text-xl font-semibold text-paper-primary mb-4">审稿人管理</h2>
      
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <Input
            placeholder="输入审稿人钱包地址"
            value={newAuditorAddr}
            onChange={(e) => onAddressChange(e.target.value)}
            disabled={isAddingAuditor || isRemovingAuditor}
          />
        </div>
        
        <div className="flex gap-2">
          <Button
            className="paper-btn-primary"
            onClick={onAddAuditor}
            disabled={isAddingAuditor || isRemovingAuditor}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            {isAddingAuditor ? "添加中..." : "添加审稿人"}
          </Button>
          
          <Button
            variant="destructive"
            onClick={onRemoveAuditor}
            disabled={isAddingAuditor || isRemovingAuditor}
          >
            <UserMinus className="h-4 w-4 mr-2" />
            {isRemovingAuditor ? "移除中..." : "移除审稿人"}
          </Button>
        </div>
      </div>
      
      <div className="text-sm text-gray-600">
        <p>1. 输入要添加或移除的审稿人的钱包地址</p>
        <p>2. 点击相应的按钮执行操作</p>
        <p>3. 审稿人具有审核待审论文的权限</p>
      </div>
    </div>
  );
}
