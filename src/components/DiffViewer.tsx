
import React from "react";
import { DiffChunk } from "../utils/diff";

interface DiffViewerProps {
  diff: DiffChunk[];
  isLoading?: boolean;
}

export default function DiffViewer({ diff, isLoading = false }: DiffViewerProps) {
  if (isLoading) {
    return (
      <div className="border rounded-md p-4 bg-gray-50">
        <div className="text-center text-gray-500">加载对比中...</div>
      </div>
    );
  }

  if (!diff || diff.length === 0) {
    return (
      <div className="border rounded-md p-4 bg-gray-50">
        <div className="text-center text-gray-500">无对比数据</div>
      </div>
    );
  }

  return (
    <div className="border rounded-md p-4 bg-gray-50 overflow-auto">
      <pre className="whitespace-pre-wrap font-mono text-sm">
        {diff.map((chunk, index) => {
          if (chunk.added) {
            return (
              <span key={index} className="bg-green-100 text-green-800">
                {chunk.value}
              </span>
            );
          } else if (chunk.removed) {
            return (
              <span key={index} className="bg-red-100 text-red-800 line-through">
                {chunk.value}
              </span>
            );
          } else {
            return <span key={index}>{chunk.value}</span>;
          }
        })}
      </pre>
    </div>
  );
}
