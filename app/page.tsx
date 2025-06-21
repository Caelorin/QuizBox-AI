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
import { Loader2, Download, FileText } from "lucide-react"
import { generateWorksheet } from "./actions"
import { EnhancedTopicInput } from "@/components/enhanced-topic-input"

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

export default function WorksheetGenerator() {
  const [formData, setFormData] = useState({
    grade: "",
    topic: "",
    qcount: 10,
    types: [] as string[],
    withKey: true,
  })
  const [isLoading, setIsLoading] = useState(false)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.grade || !formData.topic || formData.types.length === 0) {
      alert("请填写所有必填字段")
      return
    }

    setIsLoading(true)
    try {
      const result = await generateWorksheet(formData)
      setResult(result)
    } catch (error) {
      console.error("生成工作表时出错:", error)
      alert("生成工作表失败，请重试。")
    } finally {
      setIsLoading(false)
    }
  }

  const downloadFile = (dataUrl: string, filename: string) => {
    const link = document.createElement("a")
    link.href = dataUrl
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
            <h2 className="text-xl font-semibold mb-2">正在生成工作表...</h2>
            <p className="text-gray-600 text-center">AI正在工作中，请等待5-10秒...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
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
                setFormData({
                  grade: "",
                  topic: "",
                  qcount: 10,
                  types: [],
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">AI工作表生成器</h1>
          <p className="text-lg text-gray-600">为任何年级和主题创建定制工作表</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>工作表配置</CardTitle>
            <CardDescription>填写以下详细信息以生成定制工作表</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
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
                  placeholder="例如：分数的加减法运算"
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

              <Button type="submit" className="w-full" size="lg">
                生成工作表
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
