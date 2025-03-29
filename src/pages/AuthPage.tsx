
import React, { useState } from "react";
import { Navigate } from "react-router-dom";
import Layout from "../components/Layout";
import LoginForm from "../components/LoginForm";
import RegisterForm from "../components/RegisterForm";
import { isAuthenticated } from "../utils/auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<string>("login");
  
  // Redirect if already authenticated
  if (isAuthenticated()) {
    return <Navigate to="/" replace />;
  }

  return (
    <Layout>
      <div className="max-w-md mx-auto">
        <Tabs defaultValue="login" onValueChange={setActiveTab} value={activeTab}>
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="login">登录</TabsTrigger>
            <TabsTrigger value="register">注册</TabsTrigger>
          </TabsList>
          
          <TabsContent value="login">
            <LoginForm onRegisterClick={() => setActiveTab("register")} />
          </TabsContent>
          
          <TabsContent value="register">
            <RegisterForm onLoginClick={() => setActiveTab("login")} />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
