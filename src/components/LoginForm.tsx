
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../utils/auth";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { LogIn } from "lucide-react";
import { toast } from "../hooks/use-toast";

interface LoginFormProps {
  onSuccess?: () => void;
  onRegisterClick?: () => void;
}

export default function LoginForm({ onSuccess, onRegisterClick }: LoginFormProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!username.trim() || !password.trim()) {
      toast({
        title: "输入错误",
        description: "请输入用户名和密码",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const { token, role } = await login(username, password);
      
      toast({
        title: "登录成功",
        description: `欢迎回来, ${username}`,
      });
      
      if (onSuccess) {
        onSuccess();
      } else {
        navigate("/");
      }
    } catch (error) {
      toast({
        title: "登录失败",
        description: (error as Error).message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="paper-card max-w-md mx-auto">
      <h2 className="text-2xl font-bold text-paper-primary mb-6">用户登录</h2>
      
      <form onSubmit={handleSubmit} className="paper-form space-y-4">
        <div className="form-group">
          <label htmlFor="username">用户名</label>
          <Input
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="请输入用户名"
            disabled={isLoading}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="password">密码</label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="请输入密码"
            disabled={isLoading}
          />
        </div>
        
        <Button
          type="submit"
          className="w-full paper-btn-primary"
          disabled={isLoading}
        >
          {isLoading ? (
            "登录中..."
          ) : (
            <>
              <LogIn className="h-4 w-4 mr-2" />
              登录
            </>
          )}
        </Button>
      </form>
      
      <div className="mt-4 text-center">
        <p className="text-sm text-gray-600">
          还没有账号？
          <button
            onClick={onRegisterClick}
            className="ml-1 text-paper-primary hover:underline"
            disabled={isLoading}
          >
            立即注册
          </button>
        </p>
      </div>
    </div>
  );
}
