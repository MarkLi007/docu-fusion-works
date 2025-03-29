
import React from "react";
import { Link } from "react-router-dom";
import Layout from "../components/Layout";
import { Button } from "../components/ui/button";
import { FileQuestion, Home } from "lucide-react";

export default function NotFound() {
  return (
    <Layout>
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <FileQuestion className="h-24 w-24 text-paper-primary mx-auto mb-6 opacity-60" />
          <h1 className="text-4xl font-bold text-paper-primary mb-4">404</h1>
          <p className="text-xl text-gray-600 mb-8">抱歉，您访问的页面不存在</p>
          <Link to="/">
            <Button className="paper-btn-primary">
              <Home className="h-4 w-4 mr-2" />
              返回首页
            </Button>
          </Link>
        </div>
      </div>
    </Layout>
  );
}
