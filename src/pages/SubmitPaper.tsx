
import React, { useState } from "react";
import Layout from "../components/Layout";
import { useAuth } from "../contexts/AuthContext";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import { uploadToIPFS } from "../utils/ipfs";
import { getContract } from "../utils/contract";
import { ethers } from "ethers";
import { toast } from "../hooks/use-toast";
import { useNavigate } from "react-router-dom";
import FileUpload from "../components/FileUpload";
import { Upload, AlertCircle } from "lucide-react";

export default function SubmitPaper() {
  const { currentAccount, isConnected, connectWallet } = useAuth();
  const navigate = useNavigate();
  
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [references, setReferences] = useState("");
  const [signature, setSignature] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Field validation
  const [errors, setErrors] = useState({
    title: "",
    author: "",
    pdfFile: "",
    references: ""
  });

  async function validateForm() {
    const newErrors = {
      title: title.trim() ? "" : "标题不能为空",
      author: author.trim() ? "" : "作者不能为空",
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
      const data = `${title}|${author}|${cid}`;
      const hash = ethers.keccak256(new TextEncoder().encode(data));
      
      // Sign the hash
      const sig = await signer.signMessage(ethers.getBytes(hash));
      setSignature(sig);
      
      toast({
        title: "签名成功",
        description: "已完成论文内容签名",
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
        description: "请先连接钱包后再提交论文",
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
      toast({ title: "提交中", description: "正在将论文信息提交到区块链..." });
      const contract = await getContract();
      const tx = await contract.submitPaper(
        title,
        author,
        cid,
        fileHash,
        finalSignature || "0x",
        refs
      );
      
      toast({ title: "等待确认", description: "等待交易确认..." });
      await tx.wait();
      
      toast({
        title: "提交成功",
        description: "论文已成功提交，正在等待审核"
      });
      
      // Reset form
      setTitle("");
      setAuthor("");
      setPdfFile(null);
      setReferences("");
      setSignature("");
      
      // Redirect to my papers
      navigate("/my-papers");
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
          <p className="text-gray-600 mb-6">您需要连接MetaMask钱包才能提交论文</p>
          <Button className="paper-btn-primary" onClick={connectWallet}>
            连接钱包
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-paper-primary mb-6">提交论文</h1>
        
        <form onSubmit={handleSubmit} className="paper-form paper-card">
          <div className="form-group">
            <label htmlFor="title">论文标题 <span className="text-red-500">*</span></label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="请输入论文标题"
              disabled={isSubmitting}
            />
            {errors.title && (
              <p className="text-red-500 text-sm mt-1">{errors.title}</p>
            )}
          </div>
          
          <div className="form-group">
            <label htmlFor="author">作者 <span className="text-red-500">*</span></label>
            <Input
              id="author"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="请输入作者姓名"
              disabled={isSubmitting}
            />
            {errors.author && (
              <p className="text-red-500 text-sm mt-1">{errors.author}</p>
            )}
          </div>
          
          <div className="form-group">
            <label htmlFor="pdfFile">论文PDF文件 <span className="text-red-500">*</span></label>
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
                  提交论文
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
