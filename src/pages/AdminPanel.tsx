
import React from "react";
import Layout from "../components/Layout";
import { useAuth } from "../contexts/AuthContext";
import { getPendingPapers } from "../utils/graph";
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";

// Custom components
import AdminHeader from "../components/admin/AdminHeader";
import PendingPapersTab from "../components/admin/PendingPapersTab";
import AuditorsManagementTab from "../components/admin/AuditorsManagementTab";
import AuthRequiredMessage from "../components/admin/AuthRequiredMessage";
import { useAdminActions } from "../hooks/useAdminActions";

export default function AdminPanel() {
  const { currentAccount, isConnected, connectWallet, isOwner, isAuditor, checkRole } = useAuth();
  
  const {
    newAuditorAddr,
    setNewAuditorAddr,
    isAddingAuditor,
    isRemovingAuditor,
    currentActionPaperId,
    handleAddAuditor,
    handleRemoveAuditor,
    handleApprovePaper,
    handleRejectPaper
  } = useAdminActions(checkRole);

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

  // Handle paper approval with refetching
  const handleApprove = async (paperId: number) => {
    const success = await handleApprovePaper(paperId);
    if (success) loadPendingPapers();
  };

  // Handle paper rejection with refetching
  const handleReject = async (paperId: number) => {
    const success = await handleRejectPaper(paperId);
    if (success) loadPendingPapers();
  };

  if (!isConnected) {
    return (
      <Layout>
        <AuthRequiredMessage type="connect" onConnect={connectWallet} />
      </Layout>
    );
  }

  if (!isOwner && !isAuditor) {
    return (
      <Layout>
        <AuthRequiredMessage type="unauthorized" />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-paper-primary mb-6">管理面板</h1>
        
        <AdminHeader 
          currentAccount={currentAccount}
          isOwner={isOwner}
          isAuditor={isAuditor}
        />
        
        <Tabs defaultValue="pending">
          <TabsList className="w-full">
            <TabsTrigger value="pending">待审核论文</TabsTrigger>
            {isOwner && <TabsTrigger value="auditors">审稿人管理</TabsTrigger>}
          </TabsList>
          
          <TabsContent value="pending" className="mt-6">
            <PendingPapersTab
              pendingPapers={pendingPapers}
              isLoadingPapers={isLoadingPapers}
              currentActionPaperId={currentActionPaperId}
              onRefresh={loadPendingPapers}
              onApprovePaper={handleApprove}
              onRejectPaper={handleReject}
            />
          </TabsContent>
          
          {isOwner && (
            <TabsContent value="auditors" className="mt-6">
              <AuditorsManagementTab
                newAuditorAddr={newAuditorAddr}
                isAddingAuditor={isAddingAuditor}
                isRemovingAuditor={isRemovingAuditor}
                onAddressChange={setNewAuditorAddr}
                onAddAuditor={handleAddAuditor}
                onRemoveAuditor={handleRemoveAuditor}
              />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </Layout>
  );
}
