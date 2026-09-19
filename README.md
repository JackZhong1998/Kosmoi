# 火花创作 Studio

用 OpenRouter 上的 DeepSeek V4.1 Flash 写文字互动小说。左侧是写作 Agent 的 System Prompt，右侧按选题、故事设计、正文三阶段产出；正文是可点选的阅读器，选择会累积数值并导向不同结局。

## 运行

```bash
cp .env.example .env.local   # 填入 OPENROUTER_API_KEY
npm install
npm run dev
```

打开 http://localhost:3000

环境变量：

```
OPENROUTER_API_KEY=
OPENROUTER_TEXT_MODEL=deepseek/deepseek-v4.1-flash
```

## 工作流

1. 生成选题，或用「短篇闭环选题」做可玩完的短篇。
2. 填入选题名，确认后进入故事设计。
3. 确认设计后先写序章，再连续写后续章。
4. 对话区可以改人物、情节、结局和文风；Agent 按补丁更新，不默认推倒重来。

## 评测脚本

```bash
node scripts/short-loop.mjs        # 完蛋了结构参考的短篇闭环
node scripts/run-eval.mjs pipeline 磁带修复师
```
