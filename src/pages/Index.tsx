
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../components/Layout";
import { Button } from "../components/ui/button";
import { getContractReadOnly, PaperStatus } from "../utils/contract";
import { useAuth } from "../contexts/AuthContext";
import PaperCard from "../components/PaperCard";
import { FileText, Upload, Search, ChevronRight } from "lucide-react";

interface Paper {
  paperId: number;
  owner: string;
  title: string;
  author: string;
  status: number;
  versionCount: number;
  timestamp: number;
}

export default function Index() {
  const { isConnected, connectWallet } = useAuth();
  const [latestPapers, setLatestPapers] = useState<Paper[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadLatestPapers();
  }, []);

  async function loadLatestPapers() {
    try {
      setIsLoading(true);
      
      const contract = await getContractReadOnly();
      const paperCountBn = await contract.paperCount();
      const paperCount = Number(paperCountBn);
      
      let papers: Paper[] = [];
      let count = 0;
      
      // Fetch the most recent 6 papers that are published
      for (let i = paperCount; i > 0 && count < 6; i--) {
        try {
          const [owner, title, author, statusBn, verCountBn] = await contract.getPaperInfo(i);
          const status = Number(statusBn);
          
          // Only show published papers
          if (status === PaperStatus.PUBLISHED) {
            // Fetch the first version to get timestamp
            const [ipfsHash, fileHash, timestampBn] = await contract.getVersion(i, 0);
            
            papers.push({
              paperId: i,
              owner,
              title,
              author,
              status,
              versionCount: Number(verCountBn),
              timestamp: Number(timestampBn)
            });
            count++;
          }
        } catch (error) {
          console.error(`Error fetching paper #${i}:`, error);
        }
      }
      
      setLatestPapers(papers);
    } catch (error) {
      console.error("Error loading latest papers:", error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Layout>
      {/* Hero Section */}
      <section className="py-12 bg-paper-light rounded-xl mb-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 mb-8 md:mb-0">
              <h1 className="text-4xl md:text-5xl font-bold text-paper-primary mb-4">
                基于区块链的论文注册系统
              </h1>
              <p className="text-lg text-gray-700 mb-6">
                安全、透明、去中心化的学术论文版权保护平台
              </p>
              <div className="flex flex-wrap gap-4">
                {isConnected ? (
                  <>
                    <Button className="paper-btn-primary">
                      <Upload className="h-4 w-4 mr-2" />
                      <Link to="/submit">提交论文</Link>
                    </Button>
                    <Button className="paper-btn-outline">
                      <Search className="h-4 w-4 mr-2" />
                      <Link to="/search">检索论文</Link>
                    </Button>
                  </>
                ) : (
                  <Button className="paper-btn-primary" onClick={connectWallet}>
                    连接钱包
                  </Button>
                )}
              </div>
            </div>
            <div className="md:w-1/2 flex justify-center">
              <img 
                src="https://img.freepik.com/free-vector/blockchain-technology-background_23-2147698581.jpg?w=1380&t=st=1716312781~exp=1716313381~hmac=a6f1e1f2bfc7e2a7c671f13a5cbcbdadcaf6b36e702a8f1ef1cb85c86c55cc61" 
                alt="Blockchain Paper Registry" 
                className="max-w-full h-auto rounded-lg shadow-lg"
                style={{ maxHeight: "300px" }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="mb-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-paper-primary mb-8 text-center">系统特点</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="paper-card flex flex-col items-center text-center">
              <div className="bg-paper-light p-3 rounded-full mb-4">
                <svg className="h-6 w-6 text-paper-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">安全可信</h3>
              <p className="text-gray-600">利用区块链技术，确保论文记录不可篡改，提供可靠的版权证明。</p>
            </div>
            <div className="paper-card flex flex-col items-center text-center">
              <div className="bg-paper-light p-3 rounded-full mb-4">
                <svg className="h-6 w-6 text-paper-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">多方审核</h3>
              <p className="text-gray-600">支持多审稿人机制，确保论文质量，防止抄袭和学术不端行为。</p>
            </div>
            <div className="paper-card flex flex-col items-center text-center">
              <div className="bg-paper-light p-3 rounded-full mb-4">
                <svg className="h-6 w-6 text-paper-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">引用追踪</h3>
              <p className="text-gray-600">支持论文引用关系追踪，建立完整的学术成果关联网络，促进学术交流。</p>
            </div>
          </div>
        </div>
      </section>

      {/* Latest Papers Section */}
      <section className="mb-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-paper-primary">最新发布论文</h2>
            <Link to="/search" className="text-paper-primary hover:text-paper-secondary flex items-center">
              查看全部 <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </div>
          
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
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
          ) : latestPapers.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg text-gray-600">暂无已发布的论文</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {latestPapers.map(paper => (
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
        </div>
      </section>
    </Layout>
  );
}
