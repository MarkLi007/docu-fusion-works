
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import { useAuth } from "../contexts/AuthContext";
import { getContractReadOnly, getContract, PaperStatus } from "../utils/contract";
import { uploadToIPFS } from "../utils/ipfs";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { ethers } from "ethers";
import FileUpload from "../components/FileUpload";
import { AlertCircle, Upload } from "lucide-react";
import { toast } from "../hooks/use-toast";

interface Paper {
  paperId: string;
  owner: string;
  title: string;
  author: string;
  status: number;
}

export default function AddVersion() {
  const { id } = useParams<{ id: string }>();
  const { currentAccount, isConnected, connectWallet } = useAuth();
  const navigate = useNavigate();
  
  const [paper, setPaper] = useState<Paper | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [references, setReferences] = useState("");
  const [signature, setSignature] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Field validation
  const [errors, setErrors] = useState({
    pdfFile: "",
    references: ""
  });

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
      const [owner, title, author, statusBn] = await contract.getPaperInfo(id);
      
      const status = Number(statusBn);
      
      setPaper({
        paperId: id,
        owner,
        title,
        author,
        status
      });
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

  async function validateForm() {
    const newErrors = {
      pdfFile: pdfFile ? "" : "请上传PDF文件",
      references: ""
    };
    
    // Validate references format if not empty
    if (references.trim()) {
      const refsArray = references.split(",").map(r => r.trim());
      const validRefs = refsArray.every(r => /^\d+$/.test(r));
      if (!validRefs) {
        newErrors.references = "引用格式错误，请使用逗号分隔的数字";
      }
    }
    
    setErrors(newErrors);
    
    return !Object.values(newErrors).some(error => error);
  }

  async function handleAutoSign(cid: string) {
    try {
      if (!window.ethereum) {
        throw new Error("MetaMask未安装");
      }
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      // Create data string and hash
      const data = `${id}|${cid}`;
      const hash = ethers.keccak256(new TextEncoder().encode(data));
      
      // Sign the hash
      const sig = await signer.signMessage(ethers.getBytes(hash));
      setSignature(sig);
      
      toast({
        title: "签名成功",
        description: "已完成新版本内容签名",
      });
      
      return sig;
    } catch (error) {
      console.error("Signing error:", error);
      toast({
        title: "签名失败",
        description: (error as Error).message,
        variant: "destructive"
      });
      return "";
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!isConnected) {
      toast({
        title: "未连接钱包",
        description: "请先连接钱包后再提交新版本",
        variant: "destructive"
      });
      return;
    }
    
    if (!paper) {
      toast({
        title: "论文信息错误",
        description: "无法加载论文信息",
        variant: "destructive"
      });
      return;
    }
    
    // Check if current user is paper owner
    if (paper.owner.toLowerCase() !== currentAccount.toLowerCase()) {
      toast({
        title: "权限错误",
        description: "只有论文作者可以添加新版本",
        variant: "destructive"
      });
      return;
    }
    
    // Check if paper is in PUBLISHED state
    if (paper.status !== PaperStatus.PUBLISHED) {
      toast({
        title: "状态错误",
        description: "只有已发布的论文可以添加新版本",
        variant: "destructive"
      });
      return;
    }
    
    const isValid = await validateForm();
    if (!isValid) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Upload to IPFS
      toast({ title: "上传中", description: "正在上传文件到IPFS..." });
      const cid = await uploadToIPFS(pdfFile as File);
      
      // Calculate fileHash
      const fileBuffer = await (pdfFile as File).arrayBuffer();
      const fileHashBytes = new Uint8Array(fileBuffer);
      const fileHash = ethers.keccak256(fileHashBytes);
      
      // Auto-sign the paper
      let finalSignature = signature;
      if (!signature) {
        finalSignature = await handleAutoSign(cid);
      }
      
      // Parse references
      let refs: number[] = [];
      if (references.trim()) {
        refs = references
          .split(",")
          .map(str => parseInt(str.trim(), 10))
          .filter(num => !isNaN(num));
      }
      
      // Submit to contract
      toast({ title: "提交中", description: "正在将新版本信息提交到区块链..." });
      const contract = await getContract();
      const tx = await contract.addVersion(
        id,
        cid,
        fileHash,
        finalSignature || "0x",
        refs
      );
      
      toast({ title: "等待确认", description: "等待交易确认..." });
      await tx.wait();
      
      toast({
        title: "提交成功",
        description: "新版本已成功添加"
      });
      
      // Navigate to paper details page
      navigate(`/paper/${id}`);
    } catch (error) {
      console.error("Submit error:", error);
      toast({
        title: "提交失败",
        description: (error as Error).message,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isConnected) {
    return (
      <Layout>
        <div className="paper-card text-center py-8">
          <AlertCircle className="h-12 w-12 text-paper-primary mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-paper-primary mb-4">请先连接钱包</h2>
          <p className="text-gray-600 mb-6">您需要连接MetaMask钱包才能添加新版本</p>
          <Button className="paper-btn-primary" onClick={connectWallet}>
            连接钱包
          </Button>
        </div>
      </Layout>
    );
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto">
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
        <div className="max-w-3xl mx-auto">
          <div className="paper-card text-center py-8">
            <AlertCircle className="h-12 w-12 text-paper-primary mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-paper-primary mb-4">未找到论文</h2>
            <p className="text-gray-600 mb-6">该论文ID不存在或已被移除</p>
            <Button className="paper-btn-primary" onClick={() => navigate("/my-papers")}>
              返回我的论文
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  // Check if current user is paper owner
  if (paper.owner.toLowerCase() !== currentAccount.toLowerCase()) {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto">
          <div className="paper-card text-center py-8">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-paper-primary mb-4">权限错误</h2>
            <p className="text-gray-600 mb-6">只有论文作者可以添加新版本</p>
            <Button className="paper-btn-primary" onClick={() => navigate(`/paper/${id}`)}>
              返回论文详情
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  // Check if paper is in PUBLISHED state
  if (paper.status !== PaperStatus.PUBLISHED) {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto">
          <div className="paper-card text-center py-8">
            <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-paper-primary mb-4">状态错误</h2>
            <p className="text-gray-600 mb-6">只有已发布的论文可以添加新版本</p>
            <Button className="paper-btn-primary" onClick={() => navigate(`/paper/${id}`)}>
              返回论文详情
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-paper-primary mb-2">添加新版本</h1>
        <p className="text-gray-600 mb-6">
          为论文 "{paper.title}" (ID: {paper.paperId}) 添加新版本
        </p>
        
        <form onSubmit={handleSubmit} className="paper-form paper-card">
          <div className="form-group">
            <label htmlFor="pdfFile">新版本PDF文件 <span className="text-red-500">*</span></label>
            <FileUpload
              onChange={setPdfFile}
              accept=".pdf"
              error={errors.pdfFile}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="references">引用论文ID (以逗号分隔)</label>
            <Input
              id="references"
              value={references}
              onChange={(e) => setReferences(e.target.value)}
              placeholder="例如: 1,2,5"
              disabled={isSubmitting}
            />
            {errors.references && (
              <p className="text-red-500 text-sm mt-1">{errors.references}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">多个引用ID请用逗号分隔，如: 1,2,5</p>
          </div>
          
          <div className="mt-6">
            <Button 
              type="submit" 
              className="paper-btn-primary w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                "提交中..."
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  提交新版本
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
