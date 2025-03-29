
import React from "react";
import { FileText, Github, Mail } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-paper-primary text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center">
              <FileText className="h-6 w-6" />
              <h3 className="ml-2 text-lg font-semibold">论文注册系统</h3>
            </div>
            <p className="mt-2 text-sm">
              基于区块链技术的去中心化论文注册与版权保护系统
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold">快速链接</h3>
            <ul className="mt-2 space-y-2">
              <li>
                <a href="/" className="text-sm hover:text-gray-300 transition">首页</a>
              </li>
              <li>
                <a href="/submit" className="text-sm hover:text-gray-300 transition">论文提交</a>
              </li>
              <li>
                <a href="/search" className="text-sm hover:text-gray-300 transition">论文检索</a>
              </li>
              <li>
                <a href="/my-papers" className="text-sm hover:text-gray-300 transition">我的论文</a>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold">联系我们</h3>
            <ul className="mt-2 space-y-2">
              <li className="flex items-center">
                <Mail className="h-4 w-4 mr-2" />
                <a href="mailto:contact@paperregistry.org" className="text-sm hover:text-gray-300 transition">
                  contact@paperregistry.org
                </a>
              </li>
              <li className="flex items-center">
                <Github className="h-4 w-4 mr-2" />
                <a href="https://github.com/paperregistry" className="text-sm hover:text-gray-300 transition">
                  github.com/paperregistry
                </a>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8 border-t border-paper-secondary pt-4 flex flex-col sm:flex-row justify-between items-center">
          <p className="text-xs text-gray-300">&copy; {new Date().getFullYear()} 论文注册系统. 保留所有权利.</p>
          <div className="mt-2 sm:mt-0 flex space-x-4">
            <a href="#" className="text-xs text-gray-300 hover:text-white transition">隐私政策</a>
            <a href="#" className="text-xs text-gray-300 hover:text-white transition">条款与条件</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
