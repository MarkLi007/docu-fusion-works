
import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import Layout from "../components/Layout";
import { useAuth } from "../contexts/AuthContext";
import { getContract, getContractReadOnly, PaperStatus, mapStatusToString } from "../utils/contract";
import { getIPFSGatewayUrl } from "../utils/ipfs";
import { getDiff } from "../utils/diff";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { 
  FileText, 
  Calendar, 
  User, 
  Hash, 
  Clock, 
  Check, 
  X, 
  Trash2, 
  Plus, 
  Download, 
  AlertCircle,
  BarChart,
  ArrowRight,
  Link as LinkIcon
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { ScrollArea } from "../components/ui/scroll-area";
import { Separator } from "../components/ui/separator";
import CommentSection from "../components/CommentSection";
import DiffViewer from "../components/DiffViewer";
import { cn } from "@/lib/utils";
import { toast } from "../hooks/use-toast";
import { DiffChunk } from "../utils/diff";

interface Version {
  ipfsHash: string;
  fileHash: string;
  timestamp: number;
  signature: string;
  references: number[];
}

interface Paper {
  paperId: string;
  owner: string;
  title: string;
  author: string;
  status: number;
  versionCount: number;
  versions: Version[];
}

export default function PaperDetail() {
  const { id } = useParams<{ id: string }>();
  const { currentAccount, isConnected, isOwner, isAuditor } = useAuth();
  
  const [paper, setPaper] = useState<Paper | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeVersion, setActiveVersion] = useState<number>(0);
  
  // For version diff
  const [diffVerA, setDiffVerA] = useState<string>("0");
  const [diffVerB, setDiffVerB] = useState<string>("1");
  const [diffResult, setDiffResult] = useState<DiffChunk[] | null>(null);
  const [isDiffLoading, setIsDiffLoading] = useState(false);
  
  // For admin actions
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  
  const canViewPDF = paper?.status === PaperStatus.PUBLISHED || 
    isOwner || isAuditor || (paper?.owner.toLowerCase() === currentAccount.toLowerCase());
  
  const canPerformAdminActions = (isOwner || isAuditor) && paper?.status === PaperStatus.PENDING;
  
  const canRemovePaper = paper?.owner.toLowerCase() === currentAccount.toLowerCase() && 
    paper?.status !== PaperStatus.REMOVED;
  
  const canAddVersion = paper?.owner.toLowerCase() === currentAccount.toLowerCase() && 
    paper?.status === PaperStatus.PUBLISHED;

  useEffect(() => {
    if (id) {
      loadPaper();
    }
  }, [id]);

  async function loadPaper() {
    if (!id) return;
    
    try {
      setIsLoading(true);
      
      const contract = await getContractReadOnly();
      
      // Get basic paper info
      const [owner, title, author, statusBn, verCountBn] = await contract.getPaperInfo(id);
      
      const status = Number(statusBn);
      const versionCount = Number(verCountBn);
      
      // Get all versions
      const versions: Version[] = [];
      for (let i = 0; i < versionCount; i++) {
        const [ipfsHash, fileHash, timestampBn, signature, referencesBn] = await contract.getVersion(id, i);
        
        // Convert BigInt arrays to number arrays
        const references = referencesBn.map((ref: BigInt) => Number(ref));
        
        versions.push({
          ipfsHash,
          fileHash,
          timestamp: Number(timestampBn),
          signature,
          references
        });
      }
      
      setPaper({
        paperId: id,
        owner,
        title,
        author,
        status,
        versionCount,
        versions
      });
      
      // If there's more than one version, set up for diff view
      if (versionCount > 1) {
        setDiffVerA("0");
        setDiffVerB((versionCount - 1).toString());
      }
    } catch (error) {
      console.error("Error loading paper:", error);
      toast({
        title: "加载失败",
        description: "无法加载论文信息",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleViewDiff() {
    if (!id || !diffVerA || !diffVerB) return;
    
    try {
      setIsDiffLoading(true);
      const diff = await getDiff(id, diffVerA, diffVerB);
      setDiffResult(diff);
    } catch (error) {
      console.error("Error fetching diff:", error);
      toast({
        title: "差异对比失败",
        description: (error as Error).message,
        variant: "destructive"
      });
      setDiffResult(null);
    } finally {
      setIsDiffLoading(false);
    }
  }

  async function handleApprovePaper() {
    if (!id || !isConnected) return;
    
    try {
      setIsApproving(true);
      
      const contract = await getContract();
      const tx = await contract.approvePaper(id);
      
      toast({
        title: "审核中",
        description: "交易已提交，等待确认..."
      });
      
      await tx.wait();
      
      toast({
        title: "审核成功",
        description: "论文已审核通过并发布"
      });
      
      // Reload paper data
      await loadPaper();
    } catch (error) {
      console.error("Error approving paper:", error);
      toast({
        title: "审核失败",
        description: (error as Error).message,
        variant: "destructive"
      });
    } finally {
      setIsApproving(false);
    }
  }

  async function handleRejectPaper() {
    if (!id || !isConnected) return;
    
    try {
      setIsRejecting(true);
      
      const contract = await getContract();
      const tx = await contract.rejectPaper(id);
      
      toast({
        title: "驳回中",
        description: "交易已提交，等待确认..."
      });
      
      await tx.wait();
      
      toast({
        title: "驳回成功",
        description: "论文已被驳回"
      });
      
      // Reload paper data
      await loadPaper();
    } catch (error) {
      console.error("Error rejecting paper:", error);
      toast({
        title: "驳回失败",
        description: (error as Error).message,
        variant: "destructive"
      });
    } finally {
      setIsRejecting(false);
    }
  }

  async function handleRemovePaper() {
    if (!id || !isConnected) return;
    
    try {
      setIsRemoving(true);
      
      const contract = await getContract();
      const tx = await contract.removePaper(id);
      
      toast({
        title: "删除中",
        description: "交易已提交，等待确认..."
      });
      
      await tx.wait();
      
      toast({
        title: "删除成功",
        description: "论文已成功删除"
      });
      
      // Reload paper data
      await loadPaper();
    } catch (error) {
      console.error("Error removing paper:", error);
      toast({
        title: "删除失败",
        description: (error as Error).message,
        variant: "destructive"
      });
    } finally {
      setIsRemoving(false);
    }
  }

  function formatAddress(address: string) {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  function getStatusBadgeClass(status: number) {
    switch (status) {
      case PaperStatus.PENDING:
        return "bg-yellow-100 text-yellow-800";
      case PaperStatus.PUBLISHED:
        return "bg-green-100 text-green-800";
      case PaperStatus.REJECTED:
        return "bg-red-100 text-red-800";
      case PaperStatus.REMOVED:
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="max-w-5xl mx-auto">
          <div className="paper-card animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-40 bg-gray-200 rounded mb-4"></div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!paper) {
    return (
      <Layout>
        <div className="max-w-5xl mx-auto">
          <div className="paper-card text-center py-8">
            <AlertCircle className="h-12 w-12 text-paper-primary mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-paper-primary mb-4">未找到论文</h2>
            <p className="text-gray-600 mb-6">该论文ID不存在或已被移除</p>
            <Link to="/search">
              <Button className="paper-btn-primary">返回搜索</Button>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-5xl mx-auto">
        {/* Paper Header */}
        <div className="mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-paper-primary mb-2">{paper.title}</h1>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-600">
                <div className="flex items-center">
                  <User className="h-4 w-4 mr-1 text-gray-500" />
                  <span>{paper.author}</span>
                </div>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1 text-gray-500" />
                  <span>
                    {new Date(paper.versions[0]?.timestamp * 1000).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center">
                  <Hash className="h-4 w-4 mr-1 text-gray-500" />
                  <span>ID: {paper.paperId}</span>
                </div>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1 text-gray-500" />
                  <span>版本数: {paper.versionCount}</span>
                </div>
              </div>
            </div>
            
            <div className={cn("px-3 py-1.5 rounded-full text-sm font-medium", getStatusBadgeClass(paper.status))}>
              {mapStatusToString(paper.status)}
            </div>
          </div>
        </div>
        
        {/* Owner Actions */}
        {(canRemovePaper || canAddVersion) && (
          <div className="flex gap-2 mb-6">
            {canRemovePaper && (
              <Button 
                variant="destructive" 
                onClick={handleRemovePaper}
                disabled={isRemoving}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {isRemoving ? "删除中..." : "删除论文"}
              </Button>
            )}
            
            {canAddVersion && (
              <Link to={`/paper/${paper.paperId}/add-version`}>
                <Button className="paper-btn-primary">
                  <Plus className="h-4 w-4 mr-2" />
                  添加新版本
                </Button>
              </Link>
            )}
          </div>
        )}
        
        {/* Admin Actions */}
        {canPerformAdminActions && (
          <div className="paper-card mb-6 bg-paper-light">
            <h3 className="text-lg font-semibold text-paper-primary mb-4">审核操作</h3>
            <div className="flex gap-4">
              <Button 
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={handleApprovePaper}
                disabled={isApproving}
              >
                <Check className="h-4 w-4 mr-2" />
                {isApproving ? "审核中..." : "通过"}
              </Button>
              
              <Button 
                variant="destructive"
                onClick={handleRejectPaper}
                disabled={isRejecting}
              >
                <X className="h-4 w-4 mr-2" />
                {isRejecting ? "驳回中..." : "驳回"}
              </Button>
            </div>
          </div>
        )}
        
        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Paper Content */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="content">
              <TabsList className="w-full">
                <TabsTrigger value="content">论文内容</TabsTrigger>
                <TabsTrigger value="versions">版本历史</TabsTrigger>
                <TabsTrigger value="diff">版本对比</TabsTrigger>
                <TabsTrigger value="references">引用关系</TabsTrigger>
              </TabsList>
              
              {/* Content Tab */}
              <TabsContent value="content" className="mt-4">
                <div className="paper-card">
                  {canViewPDF ? (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold text-paper-primary">论文PDF文件</h3>
                        <a 
                          href={getIPFSGatewayUrl(paper.versions[activeVersion]?.ipfsHash || "")}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center text-paper-primary hover:text-paper-secondary"
                        >
                          <Download className="h-4 w-4 mr-1" />
                          <span>下载PDF</span>
                        </a>
                      </div>
                      
                      <div className="border rounded-md overflow-hidden bg-gray-50 h-[600px]">
                        <iframe 
                          src={getIPFSGatewayUrl(paper.versions[activeVersion]?.ipfsHash || "")} 
                          width="100%" 
                          height="100%" 
                          title={paper.title}
                          className="border-0"
                        />
                      </div>
                      
                      {paper.versionCount > 1 && (
                        <div className="flex items-center">
                          <span className="text-sm text-gray-500 mr-2">当前查看版本:</span>
                          <select 
                            value={activeVersion}
                            onChange={(e) => setActiveVersion(Number(e.target.value))}
                            className="border border-gray-300 rounded py-1 px-2 text-sm"
                          >
                            {Array.from({ length: paper.versionCount }).map((_, i) => (
                              <option key={i} value={i}>
                                版本 {i + 1} ({new Date(paper.versions[i].timestamp * 1000).toLocaleDateString()})
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-700 mb-2">无法查看论文内容</h3>
                      <p className="text-gray-600">
                        该论文当前状态为 {mapStatusToString(paper.status)}，只有论文作者、审稿人和管理员可以查看内容
                      </p>
                    </div>
                  )}
                </div>
                
                {/* Comments */}
                <CommentSection paperId={paper.paperId} />
              </TabsContent>
              
              {/* Versions Tab */}
              <TabsContent value="versions" className="mt-4">
                <div className="paper-card">
                  <h3 className="text-lg font-semibold text-paper-primary mb-4">版本历史</h3>
                  
                  {paper.versions.length === 0 ? (
                    <p className="text-gray-600">暂无版本记录</p>
                  ) : (
                    <div className="space-y-4">
                      {paper.versions.map((version, index) => (
                        <div 
                          key={index}
                          className="border rounded-md p-4 hover:bg-gray-50 transition"
                        >
                          <div className="flex justify-between">
                            <div className="font-medium">版本 {index + 1}</div>
                            <div className="text-sm text-gray-500">
                              {new Date(version.timestamp * 1000).toLocaleString()}
                            </div>
                          </div>
                          
                          <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-gray-500">IPFS哈希：</span>
                              <code className="text-xs break-all bg-gray-100 px-1 py-0.5 rounded">
                                {version.ipfsHash}
                              </code>
                            </div>
                            
                            <div>
                              <span className="text-gray-500">文件哈希：</span>
                              <code className="text-xs break-all bg-gray-100 px-1 py-0.5 rounded">
                                {version.fileHash.substring(0, 10)}...
                              </code>
                            </div>
                          </div>
                          
                          {canViewPDF && (
                            <div className="mt-2">
                              <a 
                                href={getIPFSGatewayUrl(version.ipfsHash)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center text-paper-primary hover:text-paper-secondary text-sm"
                              >
                                <FileText className="h-4 w-4 mr-1" />
                                <span>查看此版本</span>
                              </a>
                            </div>
                          )}
                          
                          {version.references.length > 0 && (
                            <div className="mt-2">
                              <span className="text-sm text-gray-500">引用论文：</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {version.references.map((ref, i) => (
                                  <Link
                                    key={i}
                                    to={`/paper/${ref}`}
                                    className="bg-paper-light text-paper-primary hover:bg-paper-hover px-2 py-0.5 rounded-full text-xs transition"
                                  >
                                    #{ref}
                                  </Link>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>
              
              {/* Diff Tab */}
              <TabsContent value="diff" className="mt-4">
                <div className="paper-card">
                  <h3 className="text-lg font-semibold text-paper-primary mb-4">版本差异对比</h3>
                  
                  {paper.versionCount < 2 ? (
                    <p className="text-gray-600">需要至少两个版本才能进行对比</p>
                  ) : (
                    <>
                      <div className="flex flex-col sm:flex-row gap-4 mb-4">
                        <div className="flex-1">
                          <label className="block text-sm text-gray-500 mb-1">对比版本A:</label>
                          <select
                            value={diffVerA}
                            onChange={(e) => setDiffVerA(e.target.value)}
                            className="w-full border border-gray-300 rounded py-2 px-3"
                          >
                            {Array.from({ length: paper.versionCount }).map((_, i) => (
                              <option key={i} value={i}>
                                版本 {i + 1} ({new Date(paper.versions[i].timestamp * 1000).toLocaleDateString()})
                              </option>
                            ))}
                          </select>
                        </div>
                        
                        <div className="flex items-end justify-center">
                          <ArrowRight className="h-6 w-6 text-gray-400" />
                        </div>
                        
                        <div className="flex-1">
                          <label className="block text-sm text-gray-500 mb-1">对比版本B:</label>
                          <select
                            value={diffVerB}
                            onChange={(e) => setDiffVerB(e.target.value)}
                            className="w-full border border-gray-300 rounded py-2 px-3"
                          >
                            {Array.from({ length: paper.versionCount }).map((_, i) => (
                              <option key={i} value={i}>
                                版本 {i + 1} ({new Date(paper.versions[i].timestamp * 1000).toLocaleDateString()})
                              </option>
                            ))}
                          </select>
                        </div>
                        
                        <div className="flex items-end">
                          <Button 
                            className="paper-btn-primary"
                            onClick={handleViewDiff}
                            disabled={isDiffLoading}
                          >
                            <BarChart className="h-4 w-4 mr-2" />
                            查看差异
                          </Button>
                        </div>
                      </div>
                      
                      <DiffViewer diff={diffResult || []} isLoading={isDiffLoading} />
                    </>
                  )}
                </div>
              </TabsContent>
              
              {/* References Tab */}
              <TabsContent value="references" className="mt-4">
                <div className="paper-card">
                  <h3 className="text-lg font-semibold text-paper-primary mb-4">引用关系</h3>
                  
                  {paper.versions.some(v => v.references.length > 0) ? (
                    <div className="space-y-6">
                      {paper.versions.map((version, index) => (
                        version.references.length > 0 && (
                          <div key={index} className="border-b pb-4 last:border-0 last:pb-0">
                            <h4 className="font-medium mb-2">版本 {index + 1} 引用</h4>
                            <div className="flex flex-wrap gap-2">
                              {version.references.map((ref, i) => (
                                <Link
                                  key={i}
                                  to={`/paper/${ref}`}
                                  className="flex items-center bg-paper-light hover:bg-paper-hover text-paper-primary px-3 py-1.5 rounded-md text-sm transition"
                                >
                                  <LinkIcon className="h-3 w-3 mr-1" />
                                  论文 #{ref}
                                </Link>
                              ))}
                            </div>
                          </div>
                        )
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-600">此论文未引用其他论文</p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
          
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="paper-card mb-6">
              <h3 className="text-lg font-semibold text-paper-primary mb-4">论文信息</h3>
              
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-gray-500">提交者</div>
                  <div className="flex items-center mt-1">
                    <User className="h-4 w-4 text-paper-primary mr-2" />
                    <span>{formatAddress(paper.owner)}</span>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <div className="text-sm text-gray-500">提交时间</div>
                  <div className="flex items-center mt-1">
                    <Calendar className="h-4 w-4 text-paper-primary mr-2" />
                    <span>{new Date(paper.versions[0]?.timestamp * 1000).toLocaleString()}</span>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <div className="text-sm text-gray-500">最新更新</div>
                  <div className="flex items-center mt-1">
                    <Clock className="h-4 w-4 text-paper-primary mr-2" />
                    <span>
                      {new Date(paper.versions[paper.versionCount - 1]?.timestamp * 1000).toLocaleString()}
                    </span>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <div className="text-sm text-gray-500">版本数量</div>
                  <div className="flex items-center mt-1">
                    <FileText className="h-4 w-4 text-paper-primary mr-2" />
                    <span>{paper.versionCount}</span>
                  </div>
                </div>
                
                {paper.versions[activeVersion]?.signature && (
                  <>
                    <Separator />
                    
                    <div>
                      <div className="text-sm text-gray-500">作者签名</div>
                      <div className="mt-1">
                        <div className="flex items-center">
                          <Check className="h-4 w-4 text-green-500 mr-1 flex-shrink-0" />
                          <span className="text-xs">已签名验证</span>
                        </div>
                        <div className="mt-1 bg-gray-50 p-2 rounded-md">
                          <ScrollArea className="h-20">
                            <code className="text-xs break-all">
                              {paper.versions[activeVersion]?.signature}
                            </code>
                          </ScrollArea>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
            
            {canViewPDF && paper.versions[activeVersion]?.references.length > 0 && (
              <div className="paper-card">
                <h3 className="text-lg font-semibold text-paper-primary mb-4">当前版本引用</h3>
                
                <div className="space-y-2">
                  {paper.versions[activeVersion]?.references.map((ref, i) => (
                    <Link
                      key={i}
                      to={`/paper/${ref}`}
                      className="flex items-center p-2 rounded-md hover:bg-paper-light transition"
                    >
                      <LinkIcon className="h-4 w-4 text-paper-primary mr-2" />
                      <span>论文 #{ref}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
