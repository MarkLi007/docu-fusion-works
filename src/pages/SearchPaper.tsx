
import React, { useState, useEffect } from "react";
import Layout from "../components/Layout";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Search, Info, FileText } from "lucide-react";
import { getContractReadOnly, PaperStatus } from "../utils/contract";
import { searchPapers } from "../utils/graphql/paperSearch";
import PaperCard from "../components/PaperCard";
import { Label } from "../components/ui/label";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";
import { useToast } from "../hooks/use-toast";

interface Paper {
  id: string;
  owner: string;
  title: string;
  author: string;
  status: number;
  timestamp: string;
  versions: {
    versionIndex: number;
    ipfsHash: string;
    timestamp: string;
  }[];
}

export default function SearchPaper() {
  const [keyword, setKeyword] = useState("");
  const [searchField, setSearchField] = useState("title");
  const [papers, setPapers] = useState<Paper[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [totalPapers, setTotalPapers] = useState(0);
  const { toast } = useToast();

  // Load total paper count on mount
  useEffect(() => {
    async function loadTotalCount() {
      try {
        const contract = await getContractReadOnly();
        const count = Number(await contract.paperCount());
        setTotalPapers(count);
      } catch (error) {
        console.error("Error fetching paper count:", error);
      }
    }
    
    loadTotalCount();
  }, []);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    
    if (!keyword && searchField !== 'all') {
      toast({
        title: "请输入搜索关键词",
        description: "请输入标题、作者或论文ID进行搜索",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    setSearchPerformed(true);
    
    try {
      console.log("Searching with:", keyword, searchField);
      const results = await searchPapers(keyword, searchField);
      console.log("Search results:", results);
      
      if (results.length === 0) {
        toast({
          title: "未找到结果",
          description: "没有找到匹配的论文，请尝试其他关键词",
          variant: "destructive"
        });
      } else {
        toast({
          title: "搜索完成",
          description: `找到 ${results.length} 篇匹配论文`,
        });
      }
      
      setPapers(results);
    } catch (error) {
      console.error("Search error:", error);
      toast({
        title: "搜索失败",
        description: (error as Error).message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Layout>
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-paper-primary mb-6">论文检索</h1>
        
        <div className="paper-card mb-8">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Input
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="输入关键词搜索"
                  className="w-full"
                />
              </div>
              
              <Button type="submit" className="paper-btn-primary">
                <Search className="h-4 w-4 mr-2" />
                搜索
              </Button>
            </div>
            
            <div>
              <RadioGroup 
                value={searchField} 
                onValueChange={setSearchField}
                className="flex space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="title" id="title" />
                  <Label htmlFor="title">标题</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="author" id="author" />
                  <Label htmlFor="author">作者</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="id" id="id" />
                  <Label htmlFor="id">论文ID</Label>
                </div>
              </RadioGroup>
            </div>
            
            <div className="flex items-center text-xs text-gray-500">
              <Info className="h-3 w-3 mr-1" />
              <span>目前共有 {totalPapers} 篇论文</span>
            </div>
          </form>
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
        ) : searchPerformed && papers.length === 0 ? (
          <div className="text-center py-12 paper-card">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg text-gray-600">未找到匹配的论文</p>
          </div>
        ) : papers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {papers.map(paper => (
              <PaperCard
                key={paper.id}
                paperId={Number(paper.id)}
                title={paper.title}
                author={paper.author}
                status={Number(paper.status)}
                owner={paper.owner}
                timestamp={Number(paper.timestamp)}
                versionCount={paper.versions.length}
              />
            ))}
          </div>
        ) : searchPerformed ? (
          <div className="text-center py-12 paper-card">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg text-gray-600">未找到匹配的论文</p>
          </div>
        ) : null}
      </div>
    </Layout>
  );
}
