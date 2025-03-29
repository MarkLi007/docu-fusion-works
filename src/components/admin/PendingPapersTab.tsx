
import React from "react";
import { Button } from "@/components/ui/button";
import { FileText, ExternalLink, Check, X } from "lucide-react";
import { getIPFSGatewayUrl } from "@/utils/ipfs";

interface PendingPaper {
  paperId: number;
  owner: string;
  title: string;
  author: string;
  ipfsHash: string;
  timestamp: number;
}

interface PendingPapersTabProps {
  pendingPapers: PendingPaper[];
  isLoadingPapers: boolean;
  currentActionPaperId: number | null;
  onRefresh: () => void;
  onApprovePaper: (paperId: number) => void;
  onRejectPaper: (paperId: number) => void;
}

export default function PendingPapersTab({
  pendingPapers,
  isLoadingPapers,
  currentActionPaperId,
  onRefresh,
  onApprovePaper,
  onRejectPaper
}: PendingPapersTabProps) {
  // Helper function to format wallet address
  function formatAddress(address: string) {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  return (
    <div className="paper-card">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-paper-primary">待审核论文列表</h2>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onRefresh}
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
                      onClick={() => onApprovePaper(paper.paperId)}
                      disabled={currentActionPaperId === paper.paperId}
                    >
                      <Check className="h-4 w-4 mr-1" />
                      通过
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => onRejectPaper(paper.paperId)}
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
  );
}
