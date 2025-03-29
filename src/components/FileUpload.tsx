
import React, { useState } from "react";
import { FileUp, Check, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  onChange: (file: File | null) => void;
  accept?: string;
  label?: string;
  error?: string;
}

export default function FileUpload({ onChange, accept = ".pdf", label = "选择文件", error }: FileUploadProps) {
  const [fileName, setFileName] = useState<string>("");
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      setFileName(file.name);
      onChange(file);
    } else {
      setFileName("");
      onChange(null);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (accept.includes(file.type) || accept.includes(file.name.split('.').pop() || '')) {
        setFileName(file.name);
        onChange(file);
      } else {
        // Handle invalid file type
        setFileName("");
        onChange(null);
      }
    }
  };

  return (
    <div className="w-full">
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition",
          isDragging ? "border-paper-secondary bg-paper-light" : "border-gray-300 hover:border-paper-secondary",
          error ? "border-red-500" : ""
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => document.getElementById('file-upload')?.click()}
      >
        <input
          id="file-upload"
          type="file"
          accept={accept}
          onChange={handleFileChange}
          className="hidden"
        />
        
        <div className="flex flex-col items-center py-4">
          {fileName ? (
            <>
              <Check className="h-8 w-8 text-green-500 mb-2" />
              <p className="text-sm font-medium text-gray-700">{fileName}</p>
              <p className="text-xs text-gray-500 mt-1">点击更换文件</p>
            </>
          ) : (
            <>
              <FileUp className="h-8 w-8 text-gray-400 mb-2" />
              <p className="text-sm font-medium text-gray-700">{label}</p>
              <p className="text-xs text-gray-500 mt-1">拖放文件或点击选择</p>
              <p className="text-xs text-gray-500 mt-1">支持格式: {accept}</p>
            </>
          )}
        </div>
      </div>
      
      {error && (
        <div className="mt-1 flex items-center text-red-500 text-xs">
          <AlertCircle className="h-3 w-3 mr-1" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
