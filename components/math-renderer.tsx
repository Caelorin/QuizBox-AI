"use client"

import React, { useEffect, useRef, useState } from "react"
import katex from "katex"
import "katex/dist/katex.min.css"

interface MathRendererProps {
  math: string
  displayMode?: boolean
  className?: string
  onError?: (error: Error) => void
  onSuccess?: () => void
}

export function MathRenderer({ 
  math, 
  displayMode = false, 
  className = "",
  onError,
  onSuccess 
}: MathRendererProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!ref.current || !math.trim()) return

    try {
      // 清除之前的内容
      ref.current.innerHTML = ""
      
      // 渲染数学公式
      katex.render(math, ref.current, {
        displayMode,
        throwOnError: true,
        strict: false,
        trust: false,
        macros: {
          "\\RR": "\\mathbb{R}",
          "\\NN": "\\mathbb{N}",
          "\\ZZ": "\\mathbb{Z}",
          "\\QQ": "\\mathbb{Q}",
          "\\CC": "\\mathbb{C}",
        },
      })
      
      setError(null)
      onSuccess?.()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "渲染错误"
      setError(errorMessage)
      onError?.(err instanceof Error ? err : new Error(errorMessage))
      
      // 显示原始LaTeX代码作为备选
      if (ref.current) {
        ref.current.innerHTML = `<code class="text-red-500 bg-red-50 px-2 py-1 rounded">${math}</code>`
      }
    }
  }, [math, displayMode, onError, onSuccess])

  if (!math.trim()) {
    return null
  }

  return (
    <div 
      ref={ref}
      className={`math-renderer ${displayMode ? "block" : "inline-block"} ${className}`}
      title={error ? `渲染错误: ${error}` : math}
    />
  )
}

// 工具函数：解析混合文本中的数学公式
export function parseMathText(text: string): Array<{type: 'text' | 'math', content: string, displayMode?: boolean}> {
  const parts: Array<{type: 'text' | 'math', content: string, displayMode?: boolean}> = []
  
  // 匹配 $$...$$（块级公式）和 $...$（行内公式）
  const mathRegex = /(\$\$[\s\S]*?\$\$|\$[^$\n]*?\$)/g
  
  let lastIndex = 0
  let match
  
  while ((match = mathRegex.exec(text)) !== null) {
    // 添加公式前的文本
    if (match.index > lastIndex) {
      const textContent = text.substring(lastIndex, match.index)
      if (textContent) {
        parts.push({ type: 'text', content: textContent })
      }
    }
    
    // 添加数学公式
    const mathContent = match[0]
    const isDisplayMode = mathContent.startsWith('$$')
    const cleanMath = isDisplayMode 
      ? mathContent.slice(2, -2).trim()
      : mathContent.slice(1, -1).trim()
    
    parts.push({ 
      type: 'math', 
      content: cleanMath, 
      displayMode: isDisplayMode 
    })
    
    lastIndex = match.index + match[0].length
  }
  
  // 添加剩余的文本
  if (lastIndex < text.length) {
    const textContent = text.substring(lastIndex)
    if (textContent) {
      parts.push({ type: 'text', content: textContent })
    }
  }
  
  return parts
}

// 混合文本渲染组件
interface MathTextProps {
  children: string
  className?: string
}

export function MathText({ children, className = "" }: MathTextProps) {
  const parts = parseMathText(children)
  
  return (
    <div className={className}>
      {parts.map((part, index) => (
        <React.Fragment key={index}>
          {part.type === 'text' ? (
            <span>{part.content}</span>
          ) : (
            <MathRenderer 
              math={part.content} 
              displayMode={part.displayMode} 
            />
          )}
        </React.Fragment>
      ))}
    </div>
  )
} 