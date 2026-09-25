# Spark · 火花创作 Studio

用 OpenRouter 上的 DeepSeek V4.1 Flash 写文字互动小说。左侧是写作 Agent 的 System Prompt，右侧按选题、故事设计、正文三阶段产出；正文是可点选的阅读器，选择会累积数值并导向不同结局。

## 运行

```bash
cp .env.example .env.local   # 填入 OPENROUTER_API_KEY
npm install
npm run dev
```

打开 http://localhost:3000

使用云端创作任务前，先在 Supabase SQL Editor 执行
`supabase/migrations/20260925_generation_jobs.sql`。部署新版本前也必须先执行这份迁移。
创作任务由服务端持续执行，切换页面或把浏览器放到后台后可以继续；返回创作页会重新读取进度。

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

## Launch library

The launch catalog contains five Chinese and five English interactive novels for
each audience channel. Generate the local artifacts, then publish them to the
configured Supabase project:

```bash
npm run seed:library
npm run seed:library -- --publish
```

## GitHub Actions deployment

Every push to `main` runs `.github/workflows/deploy.yml` and deploys the
production build to Vercel. Configure these GitHub Actions secrets:

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

Application secrets such as Clerk, Supabase, OpenRouter, and Stripe belong in
the Vercel project's Production environment; they are pulled during the Action.
