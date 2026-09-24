---
name: interactive-film-adapt
description: >-
  Splits interactive-novel-to-film work across five agents. Each agent only sees
  its fixed documents: screenplay (design, novel, structure), assets (design and
  screenplay), storyboard (that scene only), clip prompts (shots plus named
  assets), and video scheduling. Use when the user wants 互动影视、分镜、资产提取、
  生视频提示词, or a 15-second clip compiled from several shots.
---

# 互动影视：五个专职 Agent

不要把小说、资产、分镜和提示词塞进同一个模型回合。合同在 `lib/film-agents/`。解析和资产挂接在 `lib/film-format.mjs`。

| Agent | 固定上下文 | 产出 |
|---|---|---|
| 剧本 | 故事设计、小说正文、节点表、状态表、流程图 | `===FILM_STRUCTURE===` 压缩流程图 + `## 场` 剧本。允许多章并成一场 |
| 资产 | 故事设计、剧本。分章时再加薄目录 | 通用库，以及每场 reuse / added。脸、服装、道具状态分条。不写英文 Prompt |
| 分镜 | 只有这一场剧本 | `===STORYBOARD===` 一行一个镜头。`names` 用中文，不填资产 id |
| 提示词 | 同一路径的镜头，和这些镜头点名的资产 | `===CLIP_JOB===`。多镜收成不超过 15 秒。互斥路径不能并段 |
| 视频 | 已编好的片段和引用的图 | 先静帧后片段。没有调用就写尚未调用 |

资产列由 `linkShots` 用薄目录挂上，对不上的记成缺失。

页面 `/film` 三块：剧本左流程图右正文、资产库、分镜与提示词同一张表。

评测：`node scripts/film-loop.mjs score`。旧稿不会被覆盖，重跑需 `FILM_REWRITE=1`。剧本输入放在 `output/film/input/`：`故事设计文档.md`、`小说正文.md`、`结构.json`。
