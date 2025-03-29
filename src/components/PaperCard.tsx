
import React from "react";
import { Link } from "react-router-dom";
import { FileText, Calendar, User, ExternalLink, Clock } from "lucide-react";
import { mapStatusToString, PaperStatus } from "../utils/contract";
import { cn } from "@/lib/utils";

interface PaperCardProps {
  paperId: number;
  title: string;
  author: string;
  status: number;
  owner: string;
  timestamp: number;
  versionCount: number;
}

export default function PaperCard({ 
  paperId, 
  title, 
  author, 
  status, 
  owner, 
  timestamp,
  versionCount
}: PaperCardProps) {
  function getStatusColor(status: number) {
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

  return (
    <div className="paper-card hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start">
        <h3 className="text-lg font-semibold text-paper-primary line-clamp-2">{title}</h3>
        <div className={cn("px-2 py-1 rounded-full text-xs font-medium", getStatusColor(status))}>
          {mapStatusToString(status)}
        </div>
      </div>
      
      <div className="mt-4 space-y-2">
        <div className="flex items-center text-sm text-gray-600">
          <User className="h-4 w-4 mr-2 text-paper-secondary" />
          <span>作者：{author}</span>
        </div>
        
        <div className="flex items-center text-sm text-gray-600">
          <Calendar className="h-4 w-4 mr-2 text-paper-secondary" />
          <span>提交时间：{new Date(timestamp * 1000).toLocaleString()}</span>
        </div>
        
        <div className="flex items-center text-sm text-gray-600">
          <Clock className="h-4 w-4 mr-2 text-paper-secondary" />
          <span>版本数：{versionCount}</span>
        </div>
      </div>
      
      <div className="mt-4 flex justify-end">
        <Link 
          to={`/paper/${paperId}`} 
          className="flex items-center text-paper-primary hover:text-paper-secondary transition"
        >
          <span className="text-sm mr-1">查看详情</span>
          <ExternalLink className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
