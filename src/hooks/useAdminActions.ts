
import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import { getContract } from "@/utils/contract";

export function useAdminActions(checkRole: () => Promise<void>) {
  const [newAuditorAddr, setNewAuditorAddr] = useState("");
  const [isAddingAuditor, setIsAddingAuditor] = useState(false);
  const [isRemovingAuditor, setIsRemovingAuditor] = useState(false);
  const [currentActionPaperId, setCurrentActionPaperId] = useState<number | null>(null);

  async function handleAddAuditor() {
    if (!newAuditorAddr.trim()) {
      toast({
        title: "地址错误",
        description: "请输入有效的审稿人地址",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsAddingAuditor(true);
      
      const contract = await getContract();
      const tx = await contract.addAuditor(newAuditorAddr);
      
      toast({
        title: "处理中",
        description: "正在添加审稿人，请等待交易确认"
      });
      
      await tx.wait();
      
      toast({
        title: "添加成功",
        description: `已成功添加审稿人 ${newAuditorAddr}`
      });
      
      setNewAuditorAddr("");
      checkRole();
    } catch (error) {
      console.error("Error adding auditor:", error);
      toast({
        title: "添加失败",
        description: (error as Error).message,
        variant: "destructive"
      });
    } finally {
      setIsAddingAuditor(false);
    }
  }

  async function handleRemoveAuditor() {
    if (!newAuditorAddr.trim()) {
      toast({
        title: "地址错误",
        description: "请输入有效的审稿人地址",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsRemovingAuditor(true);
      
      const contract = await getContract();
      const tx = await contract.removeAuditor(newAuditorAddr);
      
      toast({
        title: "处理中",
        description: "正在移除审稿人，请等待交易确认"
      });
      
      await tx.wait();
      
      toast({
        title: "移除成功",
        description: `已成功移除审稿人 ${newAuditorAddr}`
      });
      
      setNewAuditorAddr("");
      checkRole();
    } catch (error) {
      console.error("Error removing auditor:", error);
      toast({
        title: "移除失败",
        description: (error as Error).message,
        variant: "destructive"
      });
    } finally {
      setIsRemovingAuditor(false);
    }
  }

  async function handleApprovePaper(paperId: number) {
    try {
      setCurrentActionPaperId(paperId);
      
      const contract = await getContract();
      const tx = await contract.approvePaper(paperId);
      
      toast({
        title: "处理中",
        description: `正在审核通过论文 #${paperId}，请等待交易确认`
      });
      
      await tx.wait();
      
      toast({
        title: "审核成功",
        description: `已审核通过论文 #${paperId}`
      });
      
      return true;
    } catch (error) {
      console.error("Error approving paper:", error);
      toast({
        title: "审核失败",
        description: (error as Error).message,
        variant: "destructive"
      });
      return false;
    } finally {
      setCurrentActionPaperId(null);
    }
  }

  async function handleRejectPaper(paperId: number) {
    try {
      setCurrentActionPaperId(paperId);
      
      const contract = await getContract();
      const tx = await contract.rejectPaper(paperId);
      
      toast({
        title: "处理中",
        description: `正在驳回论文 #${paperId}，请等待交易确认`
      });
      
      await tx.wait();
      
      toast({
        title: "驳回成功",
        description: `已驳回论文 #${paperId}`
      });
      
      return true;
    } catch (error) {
      console.error("Error rejecting paper:", error);
      toast({
        title: "驳回失败",
        description: (error as Error).message,
        variant: "destructive"
      });
      return false;
    } finally {
      setCurrentActionPaperId(null);
    }
  }

  return {
    newAuditorAddr,
    setNewAuditorAddr,
    isAddingAuditor,
    isRemovingAuditor,
    currentActionPaperId,
    handleAddAuditor,
    handleRemoveAuditor,
    handleApprovePaper,
    handleRejectPaper
  };
}
