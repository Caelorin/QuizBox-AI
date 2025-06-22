"use server"

import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

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

async function generateQuestions(data: WorksheetData): Promise<Question[]> {
  const questionTypesStr = data.types.join("和")
  const typeMapping: { [key: string]: string } = {
    选择题: "multiple-choice",
    填空题: "fill-in-blank",
  }

  const prompt = `为${data.grade}学生生成${data.qcount}道关于"${data.topic}"的教育题目

题目类型包括：${questionTypesStr}

要求：
- 题目应适合${data.grade}水平
- 对于选择题，提供4个选项（A、B、C、D），只有一个正确答案
- 对于填空题，用下划线表示空白：例如"答案是____"
- 为答案提供简要解释
- 题目难度逐渐递增
- 确保数学题目的准确性

请以以下JSON数组格式返回：
[
  {
    "id": 1,
    "type": "multiple-choice" 或 "fill-in-blank",
    "question": "题目内容",
    "options": ["A) 选项1", "B) 选项2", "C) 选项3", "D) 选项4"] (仅选择题需要),
    "answer": "正确答案",
    "explanation": "简要解释"
  }
]`

  const { text } = await generateText({
    model: openai("gpt-4o"),
    prompt,
    temperature: 0.7,
  })

  try {
    // Extract JSON from the response
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      throw new Error("No JSON found in AI response")
    }

    const questions = JSON.parse(jsonMatch[0])
    return questions.map((q: any, index: number) => ({
      ...q,
      id: index + 1,
      type:
        typeMapping[
          data.types.find((t) => q.type.includes(t.includes("选择") ? "multiple" : "fill")) || data.types[0]
        ] || q.type,
    }))
  } catch (error) {
    console.error("Error parsing AI response:", error)
    // Fallback: create sample questions
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
        question: `关于${data.topic}的第${i}题：以下哪个选项是正确的？`,
        options: ["A) 选项1", "B) 选项2", "C) 选项3", "D) 选项4"],
        answer: "A) 选项1",
        explanation: "这是正确答案的解释。",
      })
    } else {
      questions.push({
        id: i,
        type: "fill-in-blank",
        question: `关于${data.topic}的第${i}题：请填空 ____。`,
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
  return `data:text/html;base64,${base64}`
}

async function generateAnswerKeyPdf(questions: Question[], data: WorksheetData): Promise<string> {
  const html = generateAnswerKeyHtml(questions, data)
  // For now, return HTML as base64 (in real implementation, use puppeteer)
  const base64 = Buffer.from(html).toString("base64")
  return `data:text/html;base64,${base64}`
}

function generateStudentHtml(questions: Question[], data: WorksheetData): string {
  const questionsHtml = questions
    .map((q) => {
      if (q.type === "multiple-choice") {
        const optionsHtml = q.options?.map((option) => `<div class="option">○ ${option}</div>`).join("") || ""

        return `
        <div class="question">
          <div class="question-number">${q.id}.</div>
          <div class="question-content">
            <div class="question-text">${q.question}</div>
            <div class="options">${optionsHtml}</div>
          </div>
        </div>
      `
      } else {
        return `
        <div class="question">
          <div class="question-number">${q.id}.</div>
          <div class="question-content">
            <div class="question-text">${q.question}</div>
          </div>
        </div>
      `
      }
    })
    .join("")

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>学生工作表</title>
      <style>
        body {
          font-family: 'SimSun', serif;
          font-size: 12pt;
          line-height: 1.6;
          margin: 1in;
          color: #000;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 2px solid #000;
          padding-bottom: 15px;
        }
        .title {
          font-size: 18pt;
          font-weight: bold;
          margin-bottom: 5px;
        }
        .subtitle {
          font-size: 12pt;
          margin-bottom: 10px;
        }
        .info-line {
          margin: 5px 0;
          font-size: 11pt;
        }
        .question {
          margin-bottom: 25px;
          display: flex;
          align-items: flex-start;
        }
        .question-number {
          font-weight: bold;
          margin-right: 10px;
          min-width: 25px;
        }
        .question-content {
          flex: 1;
        }
        .question-text {
          margin-bottom: 10px;
        }
        .options {
          margin-left: 15px;
        }
        .option {
          margin: 8px 0;
          font-size: 11pt;
        }
        .footer {
          position: fixed;
          bottom: 0.5in;
          left: 1in;
          right: 1in;
          text-align: center;
          font-size: 10pt;
          border-top: 1px solid #ccc;
          padding-top: 10px;
        }
        @media print {
          body { margin: 0.75in; }
          .footer { position: fixed; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="title">工作表：${data.topic}</div>
        <div class="subtitle">年级：${data.grade}</div>
        <div class="info-line">姓名：_________________________ 日期：_____________</div>
        <div class="info-line">说明：回答所有问题。需要时请显示解题过程。</div>
      </div>
      
      <div class="questions">
        ${questionsHtml}
      </div>
      
      <div class="footer">
        由AI工作表生成器生成
      </div>
    </body>
    </html>
  `
}

function generateAnswerKeyHtml(questions: Question[], data: WorksheetData): string {
  const answersHtml = questions
    .map(
      (q) => `
    <div class="answer-item">
      <div class="answer-number">${q.id}.</div>
      <div class="answer-content">
        <div class="answer-text"><strong>答案：</strong> ${q.answer}</div>
        ${q.explanation ? `<div class="explanation"><strong>解释：</strong> ${q.explanation}</div>` : ""}
      </div>
    </div>
  `,
    )
    .join("")

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>答案版</title>
      <style>
        body {
          font-family: 'SimSun', serif;
          font-size: 12pt;
          line-height: 1.6;
          margin: 1in;
          color: #000;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 2px solid #000;
          padding-bottom: 15px;
        }
        .title {
          font-size: 18pt;
          font-weight: bold;
          margin-bottom: 5px;
          color: #d32f2f;
        }
        .subtitle {
          font-size: 12pt;
          margin-bottom: 10px;
        }
        .answer-item {
          margin-bottom: 20px;
          display: flex;
          align-items: flex-start;
        }
        .answer-number {
          font-weight: bold;
          margin-right: 10px;
          min-width: 25px;
          color: #d32f2f;
        }
        .answer-content {
          flex: 1;
        }
        .answer-text {
          margin-bottom: 5px;
          color: #d32f2f;
        }
        .explanation {
          font-size: 11pt;
          color: #555;
          font-style: italic;
        }
        .footer {
          position: fixed;
          bottom: 0.5in;
          left: 1in;
          right: 1in;
          text-align: center;
          font-size: 10pt;
          border-top: 1px solid #ccc;
          padding-top: 10px;
        }
        @media print {
          body { margin: 0.75in; }
          .footer { position: fixed; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="title">答案版</div>
        <div class="subtitle">${data.topic} - ${data.grade}</div>
      </div>
      
      <div class="answers">
        ${answersHtml}
      </div>
      
      <div class="footer">
        由AI工作表生成器生成 - 教师版
      </div>
    </body>
    </html>
  `
}
