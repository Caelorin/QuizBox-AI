"use client"

import type React from "react"
import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Mic, Paperclip, Wand2, Upload, Globe, Cloud, MicOff, Loader2 } from "lucide-react"

interface EnhancedTopicInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function EnhancedTopicInput({ value, onChange, placeholder }: EnhancedTopicInputProps) {
  const [isListening, setIsListening] = useState(false)
  const [isProcessingFile, setIsProcessingFile] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const recognitionRef = useRef<any>(null)

  // 语音识别功能
  const startListening = () => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      alert("您的浏览器不支持语音识别功能")
      return
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    recognitionRef.current = new SpeechRecognition()

    recognitionRef.current.continuous = false
    recognitionRef.current.interimResults = false
    recognitionRef.current.lang = "zh-CN"

    recognitionRef.current.onstart = () => {
      setIsListening(true)
    }

    recognitionRef.current.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      onChange(value + (value ? " " : "") + transcript)
    }

    recognitionRef.current.onerror = (event: any) => {
      console.error("语音识别错误:", event.error)
      setIsListening(false)
    }

    recognitionRef.current.onend = () => {
      setIsListening(false)
    }

    recognitionRef.current.start()
  }

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
    setIsListening(false)
  }

  // 文件上传处理
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    if (files.length > 0) {
      setIsProcessingFile(true)
      setUploadedFiles((prev) => [...prev, ...files])

      // 模拟文件处理
      setTimeout(() => {
        const fileContent = `基于上传的文件：${files.map((f) => f.name).join(", ")}`
        onChange(value + (value ? "\n" : "") + fileContent)
        setIsProcessingFile(false)
      }, 2000)
    }
  }

  // AI建议功能
  const getAISuggestions = () => {
    const suggestions = [
      "分数的加减法运算",
      "古诗词鉴赏与理解",
      "几何图形的面积计算",
      "英语时态语法练习",
      "中国历史朝代更替",
      "化学元素周期表",
      "物理力学基础知识",
      "生物细胞结构",
    ]

    const randomSuggestion = suggestions[Math.floor(Math.random() * suggestions.length)]
    onChange(randomSuggestion)
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="min-h-[120px] pr-32 resize-none"
          rows={4}
        />

        {/* 右侧按钮组 */}
        <div className="absolute right-3 top-3 flex flex-col gap-2">
          {/* 语音输入按钮 */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={`h-8 w-8 p-0 ${isListening ? "bg-red-100 text-red-600" : "hover:bg-gray-100"}`}
            onClick={isListening ? stopListening : startListening}
            title={isListening ? "停止录音" : "语音输入"}
          >
            {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </Button>

          {/* 文件上传按钮 */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-gray-100"
                title="上传文件"
              >
                {isProcessingFile ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                <Upload className="mr-2 h-4 w-4" />
                上传文件 (pdf, docx, pptx, image)
              </DropdownMenuItem>
              <DropdownMenuItem disabled>
                <Cloud className="mr-2 h-4 w-4" />
                Google Drive
              </DropdownMenuItem>
              <DropdownMenuItem disabled>
                <Cloud className="mr-2 h-4 w-4" />
                Microsoft OneDrive
              </DropdownMenuItem>
              <DropdownMenuItem disabled>
                <Globe className="mr-2 h-4 w-4" />
                网站链接
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* AI建议按钮 */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-blue-100 hover:text-blue-600"
            onClick={getAISuggestions}
            title="AI智能建议"
          >
            <Wand2 className="h-4 w-4" />
          </Button>
        </div>

        {/* 隐藏的文件输入 */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png,.gif"
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>

      {/* 上传文件列表 */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-gray-600">已上传文件：</p>
          <div className="flex flex-wrap gap-2">
            {uploadedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm"
              >
                <Paperclip className="h-3 w-3" />
                {file.name}
                <button
                  onClick={() => setUploadedFiles((prev) => prev.filter((_, i) => i !== index))}
                  className="ml-1 hover:text-blue-900"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 语音识别状态 */}
      {isListening && (
        <div className="flex items-center gap-2 text-red-600 text-sm">
          <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
          正在录音中...点击麦克风停止
        </div>
      )}
    </div>
  )
}
