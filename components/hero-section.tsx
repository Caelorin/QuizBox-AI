"use client";

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react'
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Brain, BookOpen, Download, Sparkles, Mail } from "lucide-react";

interface HeroSectionProps {
  onStartGenerate?: () => void;
}

export default function HeroSection({ onStartGenerate }: HeroSectionProps) {
    const [menuState, setMenuState] = useState(false)
    
    const scrollToForm = () => {
      const formElement = document.querySelector('[data-form-section]');
      if (formElement) {
        formElement.scrollIntoView({ behavior: 'smooth' });
      }
      onStartGenerate?.();
    };

    return (
        <>
            <header>
                <nav data-state={menuState && 'active'} className="group fixed z-20 w-full border-b border-dashed border-border/50 bg-background/80 backdrop-blur md:relative lg:bg-transparent">
                    <div className="m-auto max-w-5xl px-6">
                        <div className="flex flex-wrap items-center justify-between gap-6 py-3 lg:gap-0 lg:py-4">
                            <div className="flex w-full justify-between lg:w-auto">
                                <Link href="/" aria-label="home" className="flex items-center space-x-2">
                                    <div className="size-7 rounded-full bg-gradient-to-br from-primary to-cyan-500" />
                                    <span className="text-xl font-bold text-foreground">QuizBox AI</span>
                                </Link>
                                <button onClick={() => setMenuState(!menuState)} aria-label={menuState == true ? 'Close Menu' : 'Open Menu'} className="relative z-20 -mr-2.5 block cursor-pointer lg:hidden">
                                    <svg className="text-foreground m-auto size-6 transition-[transform,opacity] duration-300 group-data-[state=active]:rotate-180 group-data-[state=active]:scale-0 group-data-[state=active]:opacity-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9h16.5m-16.5 6.75h16.5" />
                                    </svg>
                                    <svg className="text-foreground absolute inset-0 m-auto size-6 -rotate-180 scale-0 opacity-0 transition-[transform,opacity] duration-300 group-data-[state=active]:rotate-0 group-data-[state=active]:scale-100 group-data-[state=active]:opacity-100" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <div className="bg-ui mb-6 hidden w-full flex-wrap items-center justify-end space-y-8 rounded-3xl border border-border p-6 shadow-2xl shadow-gray-300/20 group-data-[state=active]:block md:flex-nowrap lg:m-0 lg:flex lg:w-fit lg:gap-6 lg:space-y-0 lg:border-transparent lg:bg-transparent lg:p-0 lg:shadow-none lg:group-data-[state=active]:flex dark:shadow-none dark:lg:bg-transparent">
                                <div className="lg:pr-4">
                                    <ul className="space-y-6 text-base lg:flex lg:gap-6 lg:space-y-0 lg:text-sm">
                                        <li>
                                            <a href="#" className="text-body block transition hover:text-primary">
                                                <span>功能特色</span>
                                            </a>
                                        </li>
                                        <li>
                                            <a href="#" className="text-body block transition hover:text-primary">
                                                <span>解决方案</span>
                                            </a>
                                        </li>
                                        <li>
                                            <a href="#" className="text-body block transition hover:text-primary">
                                                <span>价格</span>
                                            </a>
                                        </li>
                                        <li>
                                            <a href="#" className="text-body block transition hover:text-primary">
                                                <span>关于我们</span>
                                            </a>
                                        </li>
                                    </ul>
                                </div>

                                <div className="flex w-full flex-col space-y-3 sm:flex-row sm:gap-3 sm:space-y-0 md:w-fit lg:border-l lg:border-border lg:pl-6">
                                    <Button variant="outline" size="sm">
                                        登录
                                    </Button>
                                    <Button size="sm">
                                        注册
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </nav>
            </header>
            <main>
                <section className="overflow-hidden">
                    <svg className="absolute inset-0 z-[2] mx-auto w-full text-cyan-100 opacity-25 blur-3xl dark:text-white/5 dark:opacity-100" viewBox="0 0 807 355" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M496.5 210C632.9 186.8 760.33 60.333 807 0C764.17 84 654.8 263.1 560 307.5C465.2 351.9 147.167 356.667 0 353.5C108.667 315.333 360.1 233.2 496.5 210Z" fill="currentColor"></path>
                    </svg>
                    <svg className="absolute inset-0 z-[2] m-auto w-full text-primary-200 opacity-25 blur-3xl dark:text-primary-500/5 dark:opacity-100" viewBox="0 0 807 355" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M496.5 210C632.9 186.8 760.33 60.333 807 0C764.17 84 654.8 263.1 560 307.5C465.2 351.9 147.167 356.667 0 353.5C108.667 315.333 360.1 233.2 496.5 210Z" fill="currentColor"></path>
                    </svg>
                    <div className="relative mx-auto max-w-5xl px-6 py-28 lg:py-20">
                        <div className="lg:flex lg:items-center lg:gap-12">
                            <div className="relative z-10 mx-auto max-w-xl text-center lg:ml-0 lg:w-1/2 lg:text-left">
                                <div className="annonce variant-mixed sz-sm mx-auto w-fit gap-2 lg:ml-0">
                                    <span className="annonce-concern sz-xs variant-neutral">新功能</span>
                                    <span className="text-title text-sm">AI智能工作表生成器</span>
                                    <span className="block h-4 w-px bg-border"></span>
                                    <a href="#" className="text-sm text-primary transition hover:text-primary/90">了解更多</a>
                                </div>
                                <h1 className="text-title mt-10 text-balance text-4xl font-bold md:text-5xl xl:text-5xl">AI驱动的个性化学习工作表生成平台</h1>
                                <p className="text-body mt-8">利用先进的人工智能技术，为任何年级和学科生成定制化的工作表。几分钟内创建专业级的学习材料，让教学更高效，学习更有趣。</p>
                                <div>
                                    <div className="mx-auto my-10 max-w-sm lg:my-12 lg:ml-0 lg:mr-auto">
                                        <div className="flex flex-col gap-4 sm:flex-row">
                                            <Button 
                                                onClick={scrollToForm}
                                                size="lg"
                                                className="bg-primary text-primary-foreground hover:bg-primary/90"
                                            >
                                                <Sparkles className="mr-2 h-4 w-4" />
                                                开始生成
                                            </Button>
                                            <Button 
                                                variant="outline"
                                                size="lg"
                                            >
                                                <BookOpen className="mr-2 h-4 w-4" />
                                                查看示例
                                            </Button>
                                        </div>
                                    </div>
                                    <ul className="flex list-inside list-disc items-center justify-center gap-x-6 text-body lg:justify-start">
                                        <li>AI智能生成</li>
                                        <li>多学科支持</li>
                                        <li>一键下载PDF</li>
                                    </ul>
                                </div>
                            </div>
                            <div className="relative inset-x-0 right-6 mx-auto ml-auto mt-12 h-fit max-w-md lg:absolute lg:inset-y-16 lg:mr-0 lg:mt-0">
                                {/* 主要展示图片 */}
                                <div className="bg-ui tls-shadow rounded-card relative z-10 p-4 shadow-gray-950/[0.05] border border-border">
                                    <div className="flex items-center justify-center h-32 bg-primary/10 rounded-lg mb-4">
                                        <Brain className="h-16 w-16 text-primary" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-center mb-2 text-title">AI智能生成</h3>
                                    <p className="text-sm text-body text-center">基于先进AI算法，自动生成符合教学大纲的题目</p>
                                </div>
                                
                                <div className="absolute -inset-20 z-[1] bg-gradient-to-b from-background via-transparent to-background sm:-inset-40"></div>
                                <div className="absolute -inset-20 z-[1] bg-gradient-to-r from-background via-transparent to-background sm:-inset-40"></div>
                                
                                {/* 底部卡片 */}
                                <div className="before:bg-ui before:tls-shadow-lg relative z-10 mt-4 before:rounded-card before:absolute before:inset-x-2 before:-bottom-1.5 before:top-0 before:shadow-gray-950/[0.03]">
                                    <div className="tls-shadow bg-ui rounded-card relative overflow-hidden shadow-gray-950/[0.05] border border-border">
                                        <div className="p-6">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="text-center p-3 bg-green-500/10 rounded-lg">
                                                    <BookOpen className="h-8 w-8 mx-auto mb-2 text-green-500" />
                                                    <p className="text-xs font-medium text-title">多学科支持</p>
                                                </div>
                                                <div className="text-center p-3 bg-purple-500/10 rounded-lg">
                                                    <Download className="h-8 w-8 mx-auto mb-2 text-purple-500" />
                                                    <p className="text-xs font-medium text-title">一键下载</p>
                                                </div>
                                            </div>
                                            <div className="mt-4 text-center">
                                                <h4 className="text-sm font-semibold mb-1 text-title">QuizBox AI 工作台</h4>
                                                <p className="text-xs text-body">智能生成个性化学习材料</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </>
    )
} 