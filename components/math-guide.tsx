"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MathRenderer } from "./math-renderer"
import { BookOpen, Copy, CheckCircle } from "lucide-react"
import { useState } from "react"

interface MathGuideProps {
  onInsert?: (latex: string) => void
}

export function MathGuide({ onInsert }: MathGuideProps) {
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  const mathExamples = [
    {
      category: "基础运算",
      examples: [
        { latex: "a + b - c", description: "加减法" },
        { latex: "a \\times b", description: "乘法" },
        { latex: "a \\div b", description: "除法" },
        { latex: "a \\pm b", description: "正负号" },
        { latex: "a = b", description: "等号" },
        { latex: "a \\neq b", description: "不等号" },
        { latex: "a \\leq b", description: "小于等于" },
        { latex: "a \\geq b", description: "大于等于" },
      ]
    },
    {
      category: "分数和根式",
      examples: [
        { latex: "\\frac{a}{b}", description: "分数" },
        { latex: "\\frac{a+b}{c+d}", description: "复杂分数" },
        { latex: "\\sqrt{x}", description: "平方根" },
        { latex: "\\sqrt[3]{x}", description: "立方根" },
        { latex: "\\sqrt{a+b}", description: "根式运算" },
      ]
    },
    {
      category: "指数和对数",
      examples: [
        { latex: "x^2", description: "平方" },
        { latex: "x^{n}", description: "幂次" },
        { latex: "x^{a+b}", description: "复杂指数" },
        { latex: "x_1", description: "下标" },
        { latex: "x_{i+1}", description: "复杂下标" },
        { latex: "\\log x", description: "对数" },
        { latex: "\\ln x", description: "自然对数" },
        { latex: "\\log_2 x", description: "底数为2的对数" },
      ]
    },
    {
      category: "三角函数",
      examples: [
        { latex: "\\sin x", description: "正弦" },
        { latex: "\\cos x", description: "余弦" },
        { latex: "\\tan x", description: "正切" },
        { latex: "\\sin^2 x", description: "正弦平方" },
        { latex: "\\sin(x + y)", description: "三角函数组合" },
      ]
    },
    {
      category: "求和与积分",
      examples: [
        { latex: "\\sum_{i=1}^{n} x_i", description: "求和" },
        { latex: "\\prod_{i=1}^{n} x_i", description: "连乘" },
        { latex: "\\int f(x) dx", description: "不定积分" },
        { latex: "\\int_{a}^{b} f(x) dx", description: "定积分" },
        { latex: "\\lim_{x \\to 0} f(x)", description: "极限" },
      ]
    },
    {
      category: "希腊字母",
      examples: [
        { latex: "\\alpha", description: "阿尔法" },
        { latex: "\\beta", description: "贝塔" },
        { latex: "\\gamma", description: "伽马" },
        { latex: "\\delta", description: "德尔塔" },
        { latex: "\\pi", description: "派" },
        { latex: "\\theta", description: "西塔" },
        { latex: "\\lambda", description: "兰姆达" },
        { latex: "\\mu", description: "谬" },
      ]
    },
  ]

  const copyToClipboard = async (latex: string) => {
    try {
      await navigator.clipboard.writeText(latex)
      setCopiedCode(latex)
      setTimeout(() => setCopiedCode(null), 2000)
    } catch (err) {
      console.error('复制失败:', err)
    }
  }

  const handleInsert = (latex: string) => {
    onInsert?.(latex)
    copyToClipboard(latex)
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          LaTeX数学公式快速参考
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={mathExamples[0].category} className="w-full">
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
            {mathExamples.map((category) => (
              <TabsTrigger key={category.category} value={category.category} className="text-xs">
                {category.category}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {mathExamples.map((category) => (
            <TabsContent key={category.category} value={category.category} className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {category.examples.map((example, index) => (
                  <Card key={index} className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Badge variant="secondary" className="text-xs">
                            {example.description}
                          </Badge>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(example.latex)}
                              className="h-8 w-8 p-0"
                              title="复制代码"
                            >
                              {copiedCode === example.latex ? (
                                <CheckCircle className="h-3 w-3 text-green-500" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </Button>
                            {onInsert && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleInsert(example.latex)}
                                className="h-8 px-2 text-xs"
                                title="插入公式"
                              >
                                插入
                              </Button>
                            )}
                          </div>
                        </div>
                        
                        {/* 公式渲染 */}
                        <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg text-center">
                          <MathRenderer math={example.latex} displayMode={false} />
                        </div>
                        
                        {/* LaTeX代码 */}
                        <div className="bg-gray-100 dark:bg-gray-800 rounded p-2">
                          <code className="text-xs font-mono text-gray-700 dark:text-gray-300">
                            {example.latex}
                          </code>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>

        {/* 快速提示 */}
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
          <h4 className="font-medium text-sm mb-2">💡 快速提示：</h4>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• 使用 $...$ 包围行内公式，如：计算 $x^2 + y^2$</li>
            <li>• 使用 $$...$$ 包围块级公式，独立成行显示</li>
            <li>• 大括号 {`{}`} 用于分组：$x^{2+3}$ 而不是 $x^2+3$</li>
            <li>• 反斜杠 \ 开始命令：\frac、\sqrt、\sin 等</li>
            <li>• 空格在LaTeX中被忽略，使用 \, 或 \; 添加间距</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
} 