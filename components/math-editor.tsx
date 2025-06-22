"use client"

import React, { useState } from "react"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { MathRenderer } from "./math-renderer"
import { Eye, Edit, BookOpen, Calculator } from "lucide-react"

interface MathEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  label?: string
  showToolbar?: boolean
}

export function MathEditor({ 
  value, 
  onChange, 
  placeholder = "输入LaTeX格式的数学公式...", 
  label,
  showToolbar = true 
}: MathEditorProps) {
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit")
  const [hasError, setHasError] = useState(false)

  // 常用数学符号和公式模板
  const mathSymbols = [
    { symbol: "\\frac{a}{b}", label: "分数", category: "基础" },
    { symbol: "\\sqrt{x}", label: "平方根", category: "基础" },
    { symbol: "x^{2}", label: "上标", category: "基础" },
    { symbol: "x_{1}", label: "下标", category: "基础" },
    { symbol: "\\sum_{i=1}^{n}", label: "求和", category: "运算" },
    { symbol: "\\int_{a}^{b}", label: "积分", category: "运算" },
    { symbol: "\\lim_{x \\to 0}", label: "极限", category: "运算" },
    { symbol: "\\sin", label: "正弦", category: "函数" },
    { symbol: "\\cos", label: "余弦", category: "函数" },
    { symbol: "\\log", label: "对数", category: "函数" },
    { symbol: "\\alpha", label: "α", category: "希腊字母" },
    { symbol: "\\beta", label: "β", category: "希腊字母" },
    { symbol: "\\pi", label: "π", category: "希腊字母" },
    { symbol: "\\theta", label: "θ", category: "希腊字母" },
    { symbol: "\\leq", label: "≤", category: "符号" },
    { symbol: "\\geq", label: "≥", category: "符号" },
    { symbol: "\\neq", label: "≠", category: "符号" },
    { symbol: "\\pm", label: "±", category: "符号" },
  ]

  const insertSymbol = (symbol: string) => {
    const cursorPos = (document.activeElement as HTMLTextAreaElement)?.selectionStart || value.length
    const newValue = value.slice(0, cursorPos) + symbol + value.slice(cursorPos)
    onChange(newValue)
  }

  const categories = [...new Set(mathSymbols.map(s => s.category))]

  return (
    <div className="space-y-4">
      {label && <Label className="text-sm font-medium">{label}</Label>}
      
      {/* 工具栏 */}
      {showToolbar && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              数学符号工具栏
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue={categories[0]} className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                {categories.map((category) => (
                  <TabsTrigger key={category} value={category} className="text-xs">
                    {category}
                  </TabsTrigger>
                ))}
              </TabsList>
              
              {categories.map((category) => (
                <TabsContent key={category} value={category} className="mt-3">
                  <div className="grid grid-cols-4 gap-2">
                    {mathSymbols
                      .filter(s => s.category === category)
                      .map((item, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          onClick={() => insertSymbol(item.symbol)}
                          className="h-auto p-2 flex flex-col items-center gap-1"
                          title={`插入：${item.symbol}`}
                        >
                          <MathRenderer math={item.symbol} displayMode={false} />
                          <span className="text-xs text-muted-foreground">{item.label}</span>
                        </Button>
                      ))}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* 编辑器主体 */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "edit" | "preview")}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="edit" className="flex items-center gap-2">
              <Edit className="h-4 w-4" />
              编辑
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              预览
            </TabsTrigger>
          </TabsList>
          
          <div className="flex items-center gap-2">
            <Badge variant={hasError ? "destructive" : "secondary"}>
              {hasError ? "语法错误" : "语法正确"}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open("https://katex.org/docs/supported.html", "_blank")}
            >
              <BookOpen className="h-4 w-4 mr-1" />
              LaTeX参考
            </Button>
          </div>
        </div>

        <TabsContent value="edit" className="mt-4">
          <div className="space-y-2">
            <Textarea
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              className={`font-mono text-sm min-h-[120px] ${hasError ? "border-red-500" : ""}`}
              rows={6}
            />
            <div className="text-xs text-muted-foreground">
              💡 提示：使用LaTeX语法输入数学公式，如 \frac{"{1}"}{"{2}"}、\sqrt{"{x}"}、x^{"{2}"} 等
            </div>
          </div>
        </TabsContent>

        <TabsContent value="preview" className="mt-4">
          <Card className="min-h-[120px] p-4">
            <div className="flex items-center justify-center min-h-[100px]">
              {value.trim() ? (
                <MathRenderer 
                  math={value} 
                  displayMode={true}
                  onError={() => setHasError(true)}
                  onSuccess={() => setHasError(false)}
                />
              ) : (
                <div className="text-muted-foreground text-center">
                  <Calculator className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>在编辑框中输入数学公式以查看预览</p>
                </div>
              )}
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 常用公式示例 */}
      {showToolbar && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">常用公式示例</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="space-y-2">
                <div className="font-medium">基础数学：</div>
                <div className="pl-2 space-y-1 text-muted-foreground">
                  <div>分数：\frac{"{a}"}{"{b}"}</div>
                  <div>根号：\sqrt{"{x}"}</div>
                  <div>幂次：x^{"{2}"}, x^{"{n}"}</div>
                  <div>下标：x_{"{1}"}, a_{"{n}"}</div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="font-medium">高级数学：</div>
                <div className="pl-2 space-y-1 text-muted-foreground">
                  <div>求和：\sum_{"{i=1}"}^{"{n}"} x_i</div>
                  <div>积分：\int_{"{0}"}^{"{1}"} f(x)dx</div>
                  <div>极限：\lim_{"{x \\to \\infty}"} f(x)</div>
                  <div>矩阵：\begin{"{pmatrix}"} a & b \\ c & d \end{"{pmatrix}"}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 