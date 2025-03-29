
import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Comment, getComments, postComment } from "../utils/comments";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Send, MessageSquare, AlertCircle } from "lucide-react";
import { toast } from "../hooks/use-toast";

interface CommentSectionProps {
  paperId: string;
}

export default function CommentSection({ paperId }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { currentAccount, isConnected } = useAuth();

  useEffect(() => {
    if (paperId) {
      loadComments();
    }
  }, [paperId]);

  async function loadComments() {
    try {
      setIsLoading(true);
      const data = await getComments(paperId);
      setComments(data);
    } catch (error) {
      toast({
        title: "加载评论失败",
        description: (error as Error).message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) {
      toast({
        title: "评论不能为空",
        description: "请输入评论内容",
        variant: "destructive"
      });
      return;
    }
    
    if (!isConnected) {
      toast({
        title: "未连接钱包",
        description: "请先连接钱包后再评论",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      await postComment(paperId, currentAccount, content);
      toast({
        title: "评论成功",
        description: "您的评论已发布",
      });
      setContent("");
      // Reload comments
      await loadComments();
    } catch (error) {
      toast({
        title: "评论发布失败",
        description: (error as Error).message,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  function formatAddress(address: string) {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  return (
    <div className="paper-card mt-6">
      <div className="flex items-center mb-4">
        <MessageSquare className="h-5 w-5 text-paper-primary mr-2" />
        <h3 className="text-xl font-semibold paper-heading">评论区</h3>
      </div>
      
      <form onSubmit={handleSubmit} className="mb-6">
        <Textarea
          placeholder="写下您的评论..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="min-h-[100px] mb-2"
          disabled={!isConnected || isSubmitting}
        />
        
        {!isConnected && (
          <div className="flex items-center text-amber-600 mb-2 text-sm">
            <AlertCircle className="h-4 w-4 mr-1" />
            <span>请先连接钱包后再评论</span>
          </div>
        )}
        
        <div className="flex justify-end">
          <Button 
            type="submit" 
            className="paper-btn-primary"
            disabled={!isConnected || isSubmitting}
          >
            <Send className="h-4 w-4 mr-2" />
            {isSubmitting ? "提交中..." : "提交评论"}
          </Button>
        </div>
      </form>
      
      <div className="space-y-4">
        <h4 className="font-medium text-gray-700 flex items-center">
          <span>全部评论</span>
          <span className="ml-2 bg-paper-light text-paper-primary rounded-full px-2 py-0.5 text-xs">
            {comments.length}
          </span>
        </h4>
        
        {isLoading ? (
          <div className="text-center py-4 text-gray-500">加载评论中...</div>
        ) : comments.length === 0 ? (
          <div className="text-center py-4 text-gray-500">暂无评论，来抢沙发吧</div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="border-b border-gray-100 pb-4">
              <div className="flex justify-between items-start">
                <div className="font-medium text-paper-primary">
                  {formatAddress(comment.userAddr)}
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(comment.createdAt * 1000).toLocaleString()}
                </div>
              </div>
              <p className="mt-2 text-gray-700 whitespace-pre-line">{comment.content}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
