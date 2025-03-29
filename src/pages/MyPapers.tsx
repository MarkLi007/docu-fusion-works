
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Layout from "../components/Layout";
import { useAuth } from "../contexts/AuthContext";
import { getContract } from "../utils/contract";
import PaperCard from "../components/PaperCard";
import { Button } from "../components/ui/button";
import { AlertCircle, FileText, Plus } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";

interface Paper {
  paperId: number;
  owner: string;
  title: string;
  author: string;
  status: number;
  versionCount: number;
  timestamp: number;
}

export default function MyPapers() {
  const { currentAccount, isConnected, connectWallet } = useAuth();
  const [papers, setPapers] = useState<Paper[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    if (isConnected) {
      loadMyPapers();
    }
  }, [isConnected, currentAccount]);

  async function loadMyPapers() {
    if (!isConnected || !currentAccount) return;
    
    try {
      setIsLoading(true);
      
      const contract = await getContract();
      const paperCountBn = await contract.paperCount();
      const paperCount = Number(paperCountBn);
      
      let myPapers: Paper[] = [];
      
      for (let i = 1; i <= paperCount; i++) {
        try {
          const [owner, title, author, statusBn, verCountBn] = await contract.getPaperInfo(i);
          
          // Check if current user is the paper owner
          if (owner.toLowerCase() === currentAccount.toLowerCase()) {
            // Get the timestamp from the first version
            const [ipfsHash, fileHash, timestampBn] = await contract.getVersion(i, 0);
            
            myPapers.push({
              paperId: i,
              owner,
              title,
              author,
              status: Number(statusBn),
              versionCount: Number(verCountBn),
              timestamp: Number(timestampBn)
            });
          }
        } catch (error) {
          console.error(`Error fetching paper #${i}:`, error);
        }
      }
      
      // Sort papers by timestamp (newest first)
      myPapers.sort((a, b) => b.timestamp - a.timestamp);
      
      setPapers(myPapers);
    } catch (error) {
      console.error("Error loading papers:", error);
    } finally {
      setIsLoading(false);
    }
  }

  if (!isConnected) {
    return (
      <Layout>
        <div className="paper-card text-center py-8">
          <AlertCircle className="h-12 w-12 text-paper-primary mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-paper-primary mb-4">请先连接钱包</h2>
          <p className="text-gray-600 mb-6">您需要连接MetaMask钱包才能查看您的论文</p>
          <Button className="paper-btn-primary" onClick={connectWallet}>
            连接钱包
          </Button>
        </div>
      </Layout>
    );
  }

  // Group papers by status
  const pendingPapers = papers.filter(p => p.status === 0);
  const publishedPapers = papers.filter(p => p.status === 1);
  const rejectedPapers = papers.filter(p => p.status === 2);
  const removedPapers = papers.filter(p => p.status === 3);

  return (
    <Layout>
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-paper-primary">我的论文</h1>
          <Link to="/submit">
            <Button className="paper-btn-primary">
              <Plus className="h-4 w-4 mr-2" />
              提交新论文
            </Button>
          </Link>
        </div>
        
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="paper-card animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="flex justify-end">
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                </div>
              </div>
            ))}
          </div>
        ) : papers.length === 0 ? (
          <div className="paper-card text-center py-8">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-medium text-gray-700 mb-4">您还没有提交过论文</h2>
            <p className="text-gray-600 mb-6">点击上方的"提交新论文"按钮开始您的第一篇论文</p>
            <Link to="/submit">
              <Button className="paper-btn-primary">
                <Plus className="h-4 w-4 mr-2" />
                提交新论文
              </Button>
            </Link>
          </div>
        ) : (
          <Tabs defaultValue="all">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="all">
                全部 ({papers.length})
              </TabsTrigger>
              <TabsTrigger value="pending">
                待审核 ({pendingPapers.length})
              </TabsTrigger>
              <TabsTrigger value="published">
                已发布 ({publishedPapers.length})
              </TabsTrigger>
              <TabsTrigger value="rejected">
                已驳回 ({rejectedPapers.length})
              </TabsTrigger>
              <TabsTrigger value="removed">
                已删除 ({removedPapers.length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {papers.map(paper => (
                  <PaperCard
                    key={paper.paperId}
                    paperId={paper.paperId}
                    title={paper.title}
                    author={paper.author}
                    status={paper.status}
                    owner={paper.owner}
                    timestamp={paper.timestamp}
                    versionCount={paper.versionCount}
                  />
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="pending" className="mt-6">
              {pendingPapers.length === 0 ? (
                <div className="text-center py-8 paper-card">
                  <p className="text-gray-600">没有待审核的论文</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {pendingPapers.map(paper => (
                    <PaperCard
                      key={paper.paperId}
                      paperId={paper.paperId}
                      title={paper.title}
                      author={paper.author}
                      status={paper.status}
                      owner={paper.owner}
                      timestamp={paper.timestamp}
                      versionCount={paper.versionCount}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="published" className="mt-6">
              {publishedPapers.length === 0 ? (
                <div className="text-center py-8 paper-card">
                  <p className="text-gray-600">没有已发布的论文</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {publishedPapers.map(paper => (
                    <PaperCard
                      key={paper.paperId}
                      paperId={paper.paperId}
                      title={paper.title}
                      author={paper.author}
                      status={paper.status}
                      owner={paper.owner}
                      timestamp={paper.timestamp}
                      versionCount={paper.versionCount}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="rejected" className="mt-6">
              {rejectedPapers.length === 0 ? (
                <div className="text-center py-8 paper-card">
                  <p className="text-gray-600">没有被驳回的论文</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {rejectedPapers.map(paper => (
                    <PaperCard
                      key={paper.paperId}
                      paperId={paper.paperId}
                      title={paper.title}
                      author={paper.author}
                      status={paper.status}
                      owner={paper.owner}
                      timestamp={paper.timestamp}
                      versionCount={paper.versionCount}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="removed" className="mt-6">
              {removedPapers.length === 0 ? (
                <div className="text-center py-8 paper-card">
                  <p className="text-gray-600">没有已删除的论文</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {removedPapers.map(paper => (
                    <PaperCard
                      key={paper.paperId}
                      paperId={paper.paperId}
                      title={paper.title}
                      author={paper.author}
                      status={paper.status}
                      owner={paper.owner}
                      timestamp={paper.timestamp}
                      versionCount={paper.versionCount}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </Layout>
  );
}
