"use server"

import { generateText, streamText } from "ai"
import { createOpenAI } from "@ai-sdk/openai"
import { createStreamableValue } from "ai/rsc"

// 配置 OpenRouter
const openrouter = createOpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
})

interface WorksheetData {
  grade: string
  topic: string
  qcount: number
  types: string[]
  withKey: boolean
}

interface Question {
  id: number
  type: "multiple-choice" | "fill-in-blank"
  question: string
  options?: string[]
  answer: string
  explanation?: string
}

export async function generateWorksheet(data: WorksheetData) {
  try {
    // Generate questions using AI
    const questions = await generateQuestions(data)

    // Generate PDFs (simplified version without puppeteer for now)
    const studentPdf = await generateStudentPdf(questions, data)
    const answerKeyPdf = data.withKey ? await generateAnswerKeyPdf(questions, data) : ""

    return {
      studentPdf,
      answerKeyPdf,
    }
  } catch (error) {
    console.error("Error in generateWorksheet:", error)
    throw new Error("Failed to generate worksheet")
  }
}

// 新增：流式生成题目函数
export async function generateQuestionsStream(data: WorksheetData) {
  console.log("🔧 服务端: 开始处理题目生成请求", data);
  
  const stream = createStreamableValue('');
  
  const questionTypesStr = data.types.join("和");
  
  // 简化提示词，避免复杂的LaTeX示例
  const prompt = "你是一位专业的教育工作者，请为" + data.grade + "的学生生成" + data.qcount + "道关于\"" + data.topic + "\"的优质教育题目。\n\n" +
    "## 题目要求：\n" +
    "- 题目类型：" + questionTypesStr + "\n" +
    "- 难度级别：适合" + data.grade + "学生的认知水平\n" +
    "- 知识点覆盖：围绕\"" + data.topic + "\"主题\n" +
    "- 题目质量：语言简洁明了，逻辑清晰\n\n" +
    "## 数学公式格式：\n" +
    "如果需要数学公式，请使用简单的LaTeX语法：\n" +
    "- 分数：$\\frac{1}{2}$\n" +
    "- 上标：$x^2$\n" +
    "- 下标：$x_1$\n" +
    "- 根号：$\\sqrt{x}$\n\n" +
    "## 格式规范：\n" +
    "**选择题**：提供4个选项（A、B、C、D），确保只有一个正确答案\n" +
    "**填空题**：用\"______\"表示空白处\n\n" +
    "## 输出要求：\n" +
    "请严格按照以下JSON数组格式返回，不要使用markdown代码块：\n\n" +
    "[\n" +
    "  {\n" +
    "    \"id\": 1,\n" +
    "    \"type\": \"multiple-choice\",\n" +
    "    \"question\": \"计算 $2 + 3$ 等于多少？\",\n" +
    "    \"options\": [\"A) 4\", \"B) 5\", \"C) 6\", \"D) 7\"],\n" +
    "    \"answer\": \"B) 5\",\n" +
    "    \"explanation\": \"简单的加法运算：2 + 3 = 5\"\n" +
    "  }\n" +
    "]\n\n" +
    "重要提醒：请直接输出JSON数组，避免复杂的数学符号和转义字符。";

  console.log("📋 构建的提示词长度:", prompt.length);

  // 启动流式生成
  (async () => {
    try {
      console.log("🌐 开始调用OpenRouter API...");
      
      const { textStream } = await streamText({
        model: openrouter("google/gemini-2.5-flash-lite-preview-06-17"),
        prompt,
        temperature: 0.7,
        maxTokens: 4000,
      });

      console.log("✅ 成功获取文本流");
      
      let accumulatedText = '';
      let chunkCount = 0;
      
      for await (const delta of textStream) {
        chunkCount++;
        accumulatedText += delta;
        console.log(`📦 接收第${chunkCount}块数据，当前总长度:`, accumulatedText.length);
        stream.update(accumulatedText);
      }
      
      console.log("🏁 流式生成完毕，总chunks:", chunkCount, "总长度:", accumulatedText.length);
      stream.done();
    } catch (error) {
      console.error("💥 服务端流式生成错误:", error);
      
      // 如果API调用失败，提供备用题目
      console.log("🔄 生成备用题目...");
      const fallbackQuestions = generateSampleQuestions(data);
      const fallbackJson = JSON.stringify(fallbackQuestions, null, 2);
      stream.update(fallbackJson);
      stream.done();
    }
  })();

  return { stream: stream.value };
}

async function generateQuestions(data: WorksheetData): Promise<Question[]> {
  const questionTypesStr = data.types.join("和")
  const typeMapping: { [key: string]: string } = {
    选择题: "multiple-choice",
    填空题: "fill-in-blank",
  }

  // 使用字符串拼接而不是模板字符串来避免解析问题
  const prompt = "你是一位专业的教育工作者，请为" + data.grade + "的学生生成" + data.qcount + "道关于\"" + data.topic + "\"的优质教育题目。\n\n" +
    "## 题目要求：\n" +
    "- 题目类型：" + questionTypesStr + "\n" +
    "- 难度级别：适合" + data.grade + "学生的认知水平\n" +
    "- 知识点覆盖：围绕\"" + data.topic + "\"主题，确保知识点准确性\n" +
    "- 题目质量：语言简洁明了，逻辑清晰，无歧义\n\n" +
    "## 数学公式格式：\n" +
    "**重要**：如果题目涉及数学公式，请使用LaTeX语法，格式如下：\n" +
    "- 行内公式：用单个$包围，如 $x^2 + y^2 = z^2$\n" +
    "- 块级公式：用双$包围，如 $$\\frac{a+b}{c} = \\frac{d}{e}$$\n" +
    "- 常用符号：分数 \\frac{a}{b}，根号 \\sqrt{x}，上标 x^{2}，下标 x_{1}\n" +
    "- 运算符：\\times, \\div, \\pm, \\leq, \\geq, \\neq\n" +
    "- 函数：\\sin, \\cos, \\tan, \\log, \\ln\n" +
    "- 希腊字母：\\alpha, \\beta, \\pi, \\theta\n\n" +
    "## 格式规范：\n" +
    "**选择题**：提供4个选项（A、B、C、D），确保只有一个正确答案，其他选项具有一定迷惑性\n" +
    "**填空题**：用\"______\"表示空白处，确保答案唯一且明确\n\n" +
    "## 输出要求：\n" +
    "请严格按照以下JSON数组格式返回，数学公式必须使用LaTeX语法：\n\n" +
    "[\n" +
    "  {\n" +
    "    \"id\": 1,\n" +
    "    \"type\": \"multiple-choice\",\n" +
    "    \"question\": \"计算 $\\frac{3}{4} + \\frac{1}{8}$ 的结果是？\",\n" +
    "    \"options\": [\"A) $\\frac{7}{8}$\", \"B) $\\frac{5}{8}$\", \"C) $\\frac{4}{12}$\", \"D) $\\frac{1}{2}$\"],\n" +
    "    \"answer\": \"A) $\\frac{7}{8}$\",\n" +
    "    \"explanation\": \"通分：$\\frac{3}{4} = \\frac{6}{8}$，所以 $\\frac{6}{8} + \\frac{1}{8} = \\frac{7}{8}$\"\n" +
    "  },\n" +
    "  {\n" +
    "    \"id\": 2,\n" +
    "    \"type\": \"fill-in-blank\",\n" +
    "    \"question\": \"已知 $x = 3$，求 $x^2 + 2x - 1$ 的值是 ______\",\n" +
    "    \"answer\": \"14\",\n" +
    "    \"explanation\": \"代入 $x = 3$：$3^2 + 2 \\times 3 - 1 = 9 + 6 - 1 = 14$\"\n" +
    "  }\n" +
    "]\n\n" +
    "现在开始生成题目：";

  const { text } = await generateText({
    model: openrouter("google/gemini-2.5-flash-lite-preview-06-17"),
    prompt,
    temperature: 0.7,
    maxTokens: 4000, // 设置最大输出令牌数
  })

  try {
    // 清理响应文本，移除可能的markdown格式
    let cleanedText = text.trim()
    
    // 移除可能的markdown代码块标记
    cleanedText = cleanedText.replace(/```json\s*/, '').replace(/```\s*$/, '')
    
    // 提取JSON数组
    const jsonMatch = cleanedText.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      console.log("AI Response:", text)
      throw new Error("未在AI响应中找到有效的JSON格式")
    }

    const questions = JSON.parse(jsonMatch[0])
    
    // 验证和标准化问题格式
    return questions.map((q: any, index: number) => {
      // 确保type字段正确映射
      let questionType = q.type
      if (questionType === "multiple-choice" || questionType.includes("选择")) {
        questionType = "multiple-choice"
      } else if (questionType === "fill-in-blank" || questionType.includes("填空")) {
        questionType = "fill-in-blank"
      }

      return {
        id: index + 1,
        type: questionType,
        question: q.question || ("题目 " + (index + 1)),
        options: questionType === "multiple-choice" ? (q.options || []) : undefined,
        answer: q.answer || "待定答案",
        explanation: q.explanation || "暂无解释"
      }
    })
  } catch (error) {
    console.error("解析AI响应时出错:", error)
    console.log("原始AI响应:", text)
    // 备用方案：创建示例题目
    return generateSampleQuestions(data)
  }
}

function generateSampleQuestions(data: WorksheetData): Question[] {
  const questions: Question[] = []
  for (let i = 1; i <= data.qcount; i++) {
    if (data.types.includes("选择题")) {
      questions.push({
        id: i,
        type: "multiple-choice",
        question: "关于" + data.topic + "的第" + i + "题：以下哪个选项是正确的？",
        options: ["A) 选项1", "B) 选项2", "C) 选项3", "D) 选项4"],
        answer: "A) 选项1",
        explanation: "这是正确答案的解释。",
      })
    } else {
      questions.push({
        id: i,
        type: "fill-in-blank",
        question: "关于" + data.topic + "的第" + i + "题：请填空 ____。",
        answer: "正确答案",
        explanation: "这是填空题的解释。",
      })
    }
  }
  return questions
}

async function generateStudentPdf(questions: Question[], data: WorksheetData): Promise<string> {
  const html = generateStudentHtml(questions, data)
  // For now, return HTML as base64 (in real implementation, use puppeteer)
  const base64 = Buffer.from(html).toString("base64")
  return "data:text/html;base64," + base64
}

async function generateAnswerKeyPdf(questions: Question[], data: WorksheetData): Promise<string> {
  const html = generateAnswerKeyHtml(questions, data)
  // For now, return HTML as base64 (in real implementation, use puppeteer)
  const base64 = Buffer.from(html).toString("base64")
  return "data:text/html;base64," + base64
}

function generateStudentHtml(questions: Question[], data: WorksheetData): string {
  const questionsHtml = questions
    .map((q) => {
      if (q.type === "multiple-choice") {
        const optionsHtml = q.options?.map((option) => "<div class=\"option\">○ " + option + "</div>").join("") || ""

        return "\n        <div class=\"question\">\n          <div class=\"question-number\">" + q.id + ".</div>\n          <div class=\"question-content\">\n            <div class=\"question-text\">" + q.question + "</div>\n            <div class=\"options\">" + optionsHtml + "</div>\n          </div>\n        </div>\n      "
      } else {
        return "\n        <div class=\"question\">\n          <div class=\"question-number\">" + q.id + ".</div>\n          <div class=\"question-content\">\n            <div class=\"question-text\">" + q.question + "</div>\n            <div class=\"answer-line\">答案：__________________</div>\n          </div>\n        </div>\n      "
      }
    })
    .join("")

  return "<!DOCTYPE html>\n<html>\n<head>\n  <meta charset=\"utf-8\">\n  <title>工作表</title>\n  <style>\n    body {\n      font-family: Arial, sans-serif;\n      max-width: 800px;\n      margin: 0 auto;\n      padding: 20px;\n      line-height: 1.6;\n    }\n    .header {\n      text-align: center;\n      margin-bottom: 30px;\n      border-bottom: 2px solid #333;\n      padding-bottom: 20px;\n    }\n    .title {\n      font-size: 24px;\n      font-weight: bold;\n      margin-bottom: 10px;\n    }\n    .subtitle {\n      font-size: 16px;\n      color: #666;\n    }\n    .question {\n      margin-bottom: 25px;\n      display: flex;\n      align-items: flex-start;\n    }\n    .question-number {\n      font-weight: bold;\n      margin-right: 10px;\n      min-width: 30px;\n    }\n    .question-content {\n      flex: 1;\n    }\n    .question-text {\n      margin-bottom: 10px;\n    }\n    .options {\n      margin-left: 20px;\n    }\n    .option {\n      margin-bottom: 5px;\n    }\n    .answer-line {\n      margin-top: 10px;\n      border-bottom: 1px solid #000;\n      min-height: 20px;\n    }\n  </style>\n</head>\n<body>\n  <div class=\"header\">\n    <div class=\"title\">工作表：" + data.topic + "</div>\n    <div class=\"subtitle\">年级：" + data.grade + "</div>\n    <div style=\"margin-top: 15px;\">\n      <span>姓名：___________</span>\n      <span style=\"margin-left: 50px;\">日期：___________</span>\n    </div>\n  </div>\n  <div class=\"questions\">\n    " + questionsHtml + "\n  </div>\n</body>\n</html>"
}

function generateAnswerKeyHtml(questions: Question[], data: WorksheetData): string {
  const answersHtml = questions
    .map((q) => {
      const explanationHtml = q.explanation ? "\n            <div class=\"explanation\"><strong>解释：</strong> " + q.explanation + "</div>" : ""
      return "\n        <div class=\"answer\">\n          <div class=\"answer-number\">" + q.id + ".</div>\n          <div class=\"answer-content\">\n            <div class=\"answer-text\"><strong>答案：</strong> " + q.answer + "</div>" + explanationHtml + "\n          </div>\n        </div>\n      "
    })
    .join("")

  return "<!DOCTYPE html>\n<html>\n<head>\n  <meta charset=\"utf-8\">\n  <title>答案解析</title>\n  <style>\n    body {\n      font-family: Arial, sans-serif;\n      max-width: 800px;\n      margin: 0 auto;\n      padding: 20px;\n      line-height: 1.6;\n    }\n    .header {\n      text-align: center;\n      margin-bottom: 30px;\n      border-bottom: 2px solid #333;\n      padding-bottom: 20px;\n    }\n    .title {\n      font-size: 24px;\n      font-weight: bold;\n      margin-bottom: 10px;\n    }\n    .subtitle {\n      font-size: 16px;\n      color: #666;\n    }\n    .answer {\n      margin-bottom: 20px;\n      display: flex;\n      align-items: flex-start;\n      padding: 15px;\n      background-color: #f9f9f9;\n      border-radius: 5px;\n    }\n    .answer-number {\n      font-weight: bold;\n      margin-right: 15px;\n      min-width: 30px;\n      color: #2563eb;\n    }\n    .answer-content {\n      flex: 1;\n    }\n    .answer-text {\n      margin-bottom: 8px;\n    }\n    .explanation {\n      color: #666;\n      font-size: 14px;\n      font-style: italic;\n    }\n  </style>\n</head>\n<body>\n  <div class=\"header\">\n    <div class=\"title\">答案解析</div>\n    <div class=\"subtitle\">" + data.topic + " - " + data.grade + "</div>\n  </div>\n  <div class=\"answers\">\n    " + answersHtml + "\n  </div>\n</body>\n</html>"
}
