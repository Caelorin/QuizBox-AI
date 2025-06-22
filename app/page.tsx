"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { Loader2, Download, FileText, Edit, Check, X } from "lucide-react"
import { generateWorksheet, generateQuestionsStream } from "./actions"
import { readStreamableValue } from "ai/rsc"
import { EnhancedTopicInput } from "@/components/enhanced-topic-input"
import HeroSection from "@/components/hero-section"
import { MathText } from "@/components/math-renderer"
import { MathEditor } from "@/components/math-editor"

const gradeOptions = [
  "1年级",
  "2年级",
  "3年级",
  "4年级",
  "5年级",
  "6年级",
  "7年级",
  "8年级",
  "9年级",
  "10年级",
  "11年级",
  "12年级",
]

const questionTypes = ["选择题", "填空题"]

// 修复LaTeX转义字符的函数
function fixLatexEscaping(jsonStr: string): string {
  // 常见的LaTeX命令列表
  const latexCommands = [
    'frac', 'sqrt', 'sum', 'int', 'lim', 'sin', 'cos', 'tan', 'log', 'ln',
    'alpha', 'beta', 'gamma', 'delta', 'epsilon', 'theta', 'lambda', 'mu',
    'pi', 'sigma', 'phi', 'omega', 'infty', 'partial', 'nabla',
    'cdot', 'times', 'div', 'pm', 'mp', 'leq', 'geq', 'neq', 'approx',
    'left', 'right', 'big', 'Big', 'bigg', 'Bigg'
  ]
  
  let fixedStr = jsonStr
  
  // 为每个LaTeX命令添加额外的反斜杠
  latexCommands.forEach(cmd => {
    const regex = new RegExp(`\\\\${cmd}`, 'g')
    fixedStr = fixedStr.replace(regex, `\\\\${cmd}`)
  })
  
  // 修复其他常见的转义字符问题
  fixedStr = fixedStr
    .replace(/\\{/g, '\\\\{')
    .replace(/\\}/g, '\\\\}')
    .replace(/\\\\/g, '\\\\\\\\') // 修复双反斜杠
  
  return fixedStr
}

export default function WorksheetGenerator() {
  const [formData, setFormData] = useState({
    grade: "5年级",
    topic: "",
    qcount: 10,
    types: ["选择题", "填空题"] as string[],
    withKey: true,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [parsedQuestions, setParsedQuestions] = useState<any[]>([])
  const [editableQuestions, setEditableQuestions] = useState<any[]>([])
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [result, setResult] = useState<{
    studentPdf: string
    answerKeyPdf: string
  } | null>(null)

  const handleTypeChange = (type: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      types: checked ? [...prev.types, type] : prev.types.filter((t) => t !== type),
    }))
  }

  // 流式生成题目
  const handleStreamGenerate = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.grade || !formData.topic || formData.types.length === 0) {
      alert("请填写所有必填字段")
      return
    }

    console.log("🚀 开始生成题目，参数:", formData)
    setIsGenerating(true)
    setParsedQuestions([])
    setEditableQuestions([])
    setEditingIndex(null)

    try {
      console.log("📡 调用generateQuestionsStream...")
      const { stream } = await generateQuestionsStream(formData)
      console.log("✅ 获到流对象:", stream)
      
      let hasReceivedContent = false
      let fullContent = ""
      
      for await (const content of readStreamableValue(stream)) {
        if (content) {
          hasReceivedContent = true
          fullContent = content
          console.log("📥 接收到流内容长度:", content.length)
          console.log("📝 内容预览:", content.substring(0, 200) + "...")
          
          // 尝试解析已生成的题目
          try {
            // 移除markdown代码块标记
            let cleanContent = content.replace(/```json\s*/g, '').replace(/```\s*$/g, '').trim()
            
            // 查找完整的JSON数组
            const jsonMatch = cleanContent.match(/\[[\s\S]*\]/)
            if (jsonMatch) {
              let jsonStr = jsonMatch[0].trim()
              
              // 简单检查JSON是否看起来完整
              const openBrackets = (jsonStr.match(/\[/g) || []).length
              const closeBrackets = (jsonStr.match(/\]/g) || []).length
              const openBraces = (jsonStr.match(/\{/g) || []).length
              const closeBraces = (jsonStr.match(/\}/g) || []).length
              
              // 检查是否有基本的JSON结构
              const hasId = jsonStr.includes('"id"')
              const hasQuestion = jsonStr.includes('"question"')
              const endsWithBracket = jsonStr.endsWith(']')
              
              console.log("🔍 JSON检查:", {
                openBrackets, closeBrackets, openBraces, closeBraces,
                hasId, hasQuestion, endsWithBracket,
                length: jsonStr.length
              })
              
              // 只有当括号匹配且看起来是完整的JSON时才尝试解析
              if (openBrackets === closeBrackets && openBraces === closeBraces && 
                  hasId && hasQuestion && endsWithBracket) {
                
                console.log("🔍 找到完整JSON内容，尝试解析...")
                console.log("📄 JSON内容预览:", jsonStr.substring(0, 300) + "...")
                
                // 修复常见的LaTeX转义字符问题
                jsonStr = fixLatexEscaping(jsonStr)
                
                console.log("🔧 修复转义字符后的预览:", jsonStr.substring(0, 300) + "...")
                
                const questions = JSON.parse(jsonStr)
                console.log("✅ 解析成功，题目数量:", questions.length)
                setParsedQuestions(questions)
                setEditableQuestions(questions.map(q => ({ ...q })))
              } else {
                console.log("⏳ JSON不完整，等待更多内容...")
              }
            }
          } catch (e) {
            console.log("⚠️ JSON解析失败:", e.message)
            // 显示出错的JSON片段以便调试
            const cleanContent = content.replace(/```json\s*/g, '').replace(/```\s*$/g, '').trim()
            const jsonMatch = cleanContent.match(/\[[\s\S]*\]/)
            if (jsonMatch) {
              console.log("❌ 出错的JSON片段:", jsonMatch[0].substring(0, 500) + "...")
            }
          }
        }
      }
      
      console.log("🏁 流式生成完成")
      console.log("📊 是否接收到内容:", hasReceivedContent)
      console.log("📄 完整内容长度:", fullContent.length)
      
      if (!hasReceivedContent) {
        console.error("❌ 未接收到任何内容")
        alert("未接收到AI响应，请检查网络连接或API配置")
      }
      
    } catch (error) {
      console.error("💥 流式生成失败:", error)
      alert("生成题目失败：" + (error instanceof Error ? error.message : "未知错误"))
    } finally {
      setIsGenerating(false)
    }
  }

  // 生成最终PDF
  const handleGeneratePDF = async () => {
    if (editableQuestions.length === 0) {
      alert("请先生成题目")
      return
    }

    setIsLoading(true)
    try {
      // 使用编辑后的题目生成PDF
      const result = await generateWorksheet(formData)
      setResult(result)
    } catch (error) {
      console.error("生成PDF时出错:", error)
      alert("生成PDF失败，请重试。")
    } finally {
      setIsLoading(false)
    }
  }

  // 编辑题目
  const handleQuestionEdit = (index: number, field: string, value: any) => {
    setEditableQuestions(prev => 
      prev.map((q, i) => 
        i === index ? { ...q, [field]: value } : q
      )
    )
  }

  // 开始编辑
  const startEditing = (index: number) => {
    setEditingIndex(index)
  }

  // 保存编辑
  const saveEditing = () => {
    setEditingIndex(null)
  }

  // 取消编辑
  const cancelEditing = () => {
    setEditingIndex(null)
    // 恢复原始数据
    setEditableQuestions(parsedQuestions.map(q => ({ ...q })))
  }

  const downloadFile = (dataUrl: string, filename: string) => {
    const link = document.createElement("a")
    link.href = dataUrl
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (isLoading && !isGenerating) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <h2 className="text-xl font-semibold mb-2">正在生成工作表...</h2>
            <p className="text-muted-foreground text-center">AI正在工作中，请等待5-10秒...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (result) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-green-700">生成完成！</CardTitle>
            <CardDescription>您的工作表已准备好下载</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={() => downloadFile(result.studentPdf, "学生版工作表.pdf")} className="w-full" size="lg">
              <Download className="mr-2 h-4 w-4" />
              下载学生版PDF
            </Button>

            {formData.withKey && (
              <Button
                onClick={() => downloadFile(result.answerKeyPdf, "答案版.pdf")}
                variant="outline"
                className="w-full"
                size="lg"
              >
                <FileText className="mr-2 h-4 w-4" />
                下载答案版PDF
              </Button>
            )}

            <Button
              onClick={() => {
                setResult(null)
                setParsedQuestions([])
                setEditableQuestions([])
                setEditingIndex(null)
                setFormData({
                  grade: "5年级",
                  topic: "",
                  qcount: 10,
                  types: ["选择题", "填空题"],
                  withKey: true,
                })
              }}
              variant="ghost"
              className="w-full"
            >
              生成另一个工作表
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <HeroSection />
      
      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 pb-20" data-form-section>
        <Card>
          <CardHeader>
            <CardTitle>工作表配置</CardTitle>
            <CardDescription>填写以下详细信息以生成定制工作表</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleStreamGenerate} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="grade">年级 *</Label>
                <Select
                  value={formData.grade}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, grade: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择年级" />
                  </SelectTrigger>
                  <SelectContent>
                    {gradeOptions.map((grade) => (
                      <SelectItem key={grade} value={grade}>
                        {grade}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="topic">主题或概念 *</Label>
                <EnhancedTopicInput
                  value={formData.topic}
                  onChange={(value) => setFormData((prev) => ({ ...prev, topic: value }))}
                  placeholder="例如：分数的加减法运算、几何图形面积计算"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="qcount">题目数量</Label>
                <Input
                  id="qcount"
                  type="number"
                  min="1"
                  max="50"
                  value={formData.qcount}
                  onChange={(e) => setFormData((prev) => ({ ...prev, qcount: Number.parseInt(e.target.value) || 10 }))}
                />
              </div>

              <div className="space-y-3">
                <Label>题目类型 *</Label>
                <div className="space-y-2">
                  {questionTypes.map((type) => (
                    <div key={type} className="flex items-center space-x-2">
                      <Checkbox
                        id={type}
                        checked={formData.types.includes(type)}
                        onCheckedChange={(checked) => handleTypeChange(type, checked as boolean)}
                      />
                      <Label htmlFor={type} className="text-sm font-normal">
                        {type}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="withKey"
                  checked={formData.withKey}
                  onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, withKey: checked }))}
                />
                <Label htmlFor="withKey">包含答案版</Label>
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={isGenerating}>
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    AI正在生成题目...
                  </>
                ) : (
                  "开始生成题目"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* 题目显示区域 */}
        {(isGenerating || editableQuestions.length > 0) && (
          <Card className="mt-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {isGenerating && <Loader2 className="h-5 w-5 animate-spin" />}
                    生成的题目
                  </CardTitle>
                  <CardDescription>
                    {isGenerating ? "AI正在生成题目，请稍候..." : "点击编辑图标可修改题目内容"}
                  </CardDescription>
                </div>
                {editableQuestions.length > 0 && !isGenerating && (
                  <Button onClick={handleGeneratePDF} disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        生成PDF中...
                      </>
                    ) : (
                      <>
                        <FileText className="mr-2 h-4 w-4" />
                        生成PDF
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {editableQuestions.length > 0 && (
                <div className="space-y-4">
                  {editableQuestions.map((question, index) => (
                    <Card key={index} className="border-l-4 border-l-primary">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="bg-primary text-primary-foreground px-2 py-1 rounded text-sm font-medium">
                              题目 {question.id}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {question.type === "multiple-choice" ? "选择题" : "填空题"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {editingIndex === index ? (
                              <>
                                <Button variant="ghost" size="sm" onClick={saveEditing}>
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={cancelEditing}>
                                  <X className="h-4 w-4" />
                                </Button>
                              </>
                            ) : (
                              <Button variant="ghost" size="sm" onClick={() => startEditing(index)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* 题目内容 */}
                        <div>
                          <Label className="text-sm font-medium mb-2 block">题目内容:</Label>
                          {editingIndex === index ? (
                            <MathEditor
                              value={question.question}
                              onChange={(value) => handleQuestionEdit(index, "question", value)}
                              placeholder="输入题目内容，支持LaTeX数学公式..."
                              showToolbar={true}
                            />
                          ) : (
                            <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border">
                              <MathText className="text-base">{question.question}</MathText>
                            </div>
                          )}
                        </div>

                        {/* 选择题选项 */}
                        {question.type === "multiple-choice" && question.options && (
                          <div>
                            <Label className="text-sm font-medium mb-2 block">选项:</Label>
                            {editingIndex === index ? (
                              <div className="space-y-2">
                                {question.options.map((option: string, optionIndex: number) => (
                                  <div key={optionIndex}>
                                    <Label className="text-xs text-muted-foreground mb-1 block">
                                      选项 {String.fromCharCode(65 + optionIndex)}:
                                    </Label>
                                    <MathEditor
                                      value={option}
                                      onChange={(value) => {
                                        const newOptions = [...question.options]
                                        newOptions[optionIndex] = value
                                        handleQuestionEdit(index, "options", newOptions)
                                      }}
                                      placeholder={`输入选项 ${String.fromCharCode(65 + optionIndex)} 内容...`}
                                      showToolbar={false}
                                    />
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="space-y-2">
                                {question.options.map((option: string, optionIndex: number) => (
                                  <div key={optionIndex} className="flex items-center gap-2">
                                    <span className="text-sm font-medium min-w-[20px]">
                                      {String.fromCharCode(65 + optionIndex)})
                                    </span>
                                    <div className="flex-1 p-2 bg-blue-50 dark:bg-blue-950 rounded border">
                                      <MathText className="text-sm">{option}</MathText>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* 答案 */}
                        <div>
                          <Label className="text-sm font-medium mb-2 block">正确答案:</Label>
                          {editingIndex === index ? (
                            <MathEditor
                              value={question.answer}
                              onChange={(value) => handleQuestionEdit(index, "answer", value)}
                              placeholder="输入正确答案，支持数学公式..."
                              showToolbar={false}
                            />
                          ) : (
                            <div className="p-2 bg-green-50 dark:bg-green-950 rounded border">
                              <MathText className="text-sm font-medium">{question.answer}</MathText>
                            </div>
                          )}
                        </div>

                        {/* 解释 */}
                        <div>
                          <Label className="text-sm font-medium mb-2 block">解题解释:</Label>
                          {editingIndex === index ? (
                            <MathEditor
                              value={question.explanation}
                              onChange={(value) => handleQuestionEdit(index, "explanation", value)}
                              placeholder="输入解题思路和知识点说明，支持数学公式..."
                              showToolbar={false}
                            />
                          ) : (
                            <div className="p-2 bg-yellow-50 dark:bg-yellow-950 rounded border">
                              <MathText className="text-sm">{question.explanation}</MathText>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

