import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Layout from "../components/Layout";
import { useAuth } from "../contexts/AuthContext";
import { getContract } from "../utils/contract";
import { getPendingPapers } from "../utils/graph";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { toast } from "../hooks/use-toast";
import { getIPFSGatewayUrl } from "../utils/ipfs";
import { AlertCircle, UserPlus, UserMinus, Check, X, FileText, ExternalLink, User } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { useQuery } from '@tanstack/react-query';

interface PendingPaper {
  paperId: number;
  owner: string;
  title: string;
  author: string;
  ipfsHash: string;
  timestamp: number;
}

export default function AdminPanel() {
  const { currentAccount, isConnected, connectWallet, isOwner, isAuditor, checkRole } = useAuth();
  
  // Auditor management
  const [newAuditorAddr, setNewAuditorAddr] = useState("");
  const [isAddingAuditor, setIsAddingAuditor] = useState(false);
  const [isRemovingAuditor, setIsRemovingAuditor] = useState(false);
  
  // Current action paper
  const [currentActionPaperId, setCurrentActionPaperId] = useState<number | null>(null);

  // Use React Query to fetch pending papers
  const { 
    data: pendingPapers = [], 
    isLoading: isLoadingPapers, 
    refetch: loadPendingPapers 
  } = useQuery({
    queryKey: ['pendingPapers'],
    queryFn: getPendingPapers,
    enabled: isConnected && (isOwner || isAuditor),
  });

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
      
      // Refresh the pending papers list
      loadPendingPapers();
    } catch (error) {
      console.error("Error approving paper:", error);
      toast({
        title: "审核失败",
        description: (error as Error).message,
        variant: "destructive"
      });
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
      
      // Refresh the pending papers list
      loadPendingPapers();
    } catch (error) {
      console.error("Error rejecting paper:", error);
      toast({
        title: "驳回失败",
        description: (error as Error).message,
        variant: "destructive"
      });
    } finally {
      setCurrentActionPaperId(null);
    }
  }

  function formatAddress(address: string) {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  if (!isConnected) {
    return (
      <Layout>
        <div className="paper-card text-center py-8">
          <AlertCircle className="h-12 w-12 text-paper-primary mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-paper-primary mb-4">请先连接钱包</h2>
          <p className="text-gray-600 mb-6">您需要连接MetaMask钱包才能访问管理面板</p>
          <Button className="paper-btn-primary" onClick={connectWallet}>
            连接钱包
          </Button>
        </div>
      </Layout>
    );
  }

  if (!isOwner && !isAuditor) {
    return (
      <Layout>
        <div className="paper-card text-center py-8">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-paper-primary mb-4">权限不足</h2>
          <p className="text-gray-600 mb-6">只有合约所有者和审稿人可以访问管理面板</p>
          <Link to="/">
            <Button className="paper-btn-primary">返回首页</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-paper-primary mb-6">管理面板</h1>
        
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
        
        <Tabs defaultValue="pending">
          <TabsList className="w-full">
            <TabsTrigger value="pending">待审核论文</TabsTrigger>
            {isOwner && <TabsTrigger value="auditors">审稿人管理</TabsTrigger>}
          </TabsList>
          
          <TabsContent value="pending" className="mt-6">
            <div className="paper-card">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-paper-primary">待审核论文列表</h2>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => loadPendingPapers()}
                  disabled={isLoadingPapers}
                >
                  {isLoadingPapers ? "加载中..." : "刷新列表"}
                </Button>
              </div>
              
              {isLoadingPapers ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="border rounded-md p-4 animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-2/3 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/3 mb-4"></div>
                      <div className="flex justify-end">
                        <div className="h-8 bg-gray-200 rounded w-20 mr-2"></div>
                        <div className="h-8 bg-gray-200 rounded w-20"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : pendingPapers.length === 0 ? (
                <div className="text-center py-6">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">暂无待审核论文</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingPapers.map((paper: PendingPaper) => (
                    <div key={paper.paperId} className="border rounded-md p-4 hover:bg-gray-50 transition">
                      <div className="sm:flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-lg mb-1">{paper.title}</h3>
                          <div className="space-y-1 text-sm text-gray-600">
                            <p>论文ID: {paper.paperId}</p>
                            <p>作者: {paper.author}</p>
                            <p>提交者: {formatAddress(paper.owner)}</p>
                            <p>提交时间: {new Date(paper.timestamp * 1000).toLocaleString()}</p>
                          </div>
                        </div>
                        
                        <div className="flex flex-col sm:items-end mt-4 sm:mt-0 space-y-2">
                          <a 
                            href={getIPFSGatewayUrl(paper.ipfsHash)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center text-paper-primary hover:text-paper-secondary mb-2"
                          >
                            <ExternalLink className="h-4 w-4 mr-1" />
                            <span>查看PDF</span>
                          </a>
                          
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white"
                              onClick={() => handleApprovePaper(paper.paperId)}
                              disabled={currentActionPaperId === paper.paperId}
                            >
                              <Check className="h-4 w-4 mr-1" />
                              通过
                            </Button>
                            
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleRejectPaper(paper.paperId)}
                              disabled={currentActionPaperId === paper.paperId}
                            >
                              <X className="h-4 w-4 mr-1" />
                              驳回
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
          
          {isOwner && (
            <TabsContent value="auditors" className="mt-6">
              <div className="paper-card">
                <h2 className="text-xl font-semibold text-paper-primary mb-4">审稿人管理</h2>
                
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <div className="flex-1">
                    <Input
                      placeholder="输入审稿人钱包地址"
                      value={newAuditorAddr}
                      onChange={(e) => setNewAuditorAddr(e.target.value)}
                      disabled={isAddingAuditor || isRemovingAuditor}
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      className="paper-btn-primary"
                      onClick={handleAddAuditor}
                      disabled={isAddingAuditor || isRemovingAuditor}
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      {isAddingAuditor ? "添加中..." : "添加审稿人"}
                    </Button>
                    
                    <Button
                      variant="destructive"
                      onClick={handleRemoveAuditor}
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
            </TabsContent>
          )}
        </Tabs>
      </div>
    </Layout>
  );
}
