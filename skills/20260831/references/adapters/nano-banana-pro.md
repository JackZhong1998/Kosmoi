# Nano Banana Pro 适配器

公开名称：Nano Banana Pro，亦称 Gemini 3 Pro Image。

稳定 API ID：gemini-3-pro-image。

官方依据：

- https://ai.google.dev/gemini-api/docs/models/gemini-3-pro-image
- https://ai.google.dev/gemini-api/docs/image-generation

本适配器最后核实日期：2026-08-31。模型名称、价格、配额和 provider 参数可能变化；执行时以当前官方文档和实际工具回读为准。

## 使用范围

默认用于：

- Mode 0 标准身份卡。
- Mode 1 服装定妆。
- Mode 2 三格角色表。
- Mode 4 双参考换装。

用户明确选择时，也可以用于 Mode 1B 或 Mode 3。它可以接收文字和图片并返回图片；Gemini 3 图像模型支持多参考输入，但当前 Agent 的具体工具仍须逐项核验。

## Prompt 编译

Nano Banana Pro 使用完整叙事句，不使用关键词堆叠。按以下顺序编译：

1. 主体与身份来源。
2. 构图、身体范围和参考图职责。
3. 服装、动作或本 Mode 的可变项。
4. 背景与灯光。
5. 材质和写实质感。
6. 必须保持的约束。

从 references/prompt-templates.md 读取当前模板，合并为一个连贯英文叙事 Prompt。不要在 Prompt 里加入客套语、模型名、API 字段或 provider 名称。

Google 原生 API 没有独立 negative_prompt、seed、cfg_scale、sampler 或 steps 字段。优先把排除项改写为期望画面，例如：

- 用 full-body framing with both hands and all footwear visible 代替不要裁手脚。
- 用 clean image without typography 代替不要文字。
- 用 one adult character centered alone 代替不要其他人。

必要的强约束可在 Prompt 末尾用一个简短 Constraints 段表达，但不得堆成长否定清单。

## 参考图映射

有多张参考图时必须在 Prompt 开头写 Reference roles，并与上传顺序一致。

Mode 0 候选标准化：

- Image 1：唯一获选候选脸，是唯一身份来源。

Mode 1 两步合成和 Mode 4：

- Image 1：完整 Look、鞋、配饰、美甲和姿势。
- Image 2：唯一人物身份、脸、骨相、体型、比例、肤色、基础头发和永久标记。

Mode 2：

- 优先用批准的服装基准图作为 Image 1。
- 只有服装基准不足以提供清晰身份时，再把权威身份卡作为 Image 2，并明确 Image 2 只补充身份，不重写 Look。

参考图无法访问、数量不足、职责不能绑定或顺序不能核对时，不执行，进入 PROMPT_ONLY。

## 参数卡

默认参数是本 Skill 的生产约定，不是所有第三方 UI 的保证：

| Mode | Aspect ratio | Resolution | Count |
| --- | --- | --- | --- |
| 0 标准身份卡 | 3:4 | 2K | 1 |
| 1 服装定妆 | 3:4 | 2K | 1 |
| 1B 细节卡 | 1:1 或 3:4 | 2K | 1 |
| 2 三格角色表 | 16:9 | 2K；需要印刷或细节时 4K | 1 |
| 3 面部特写 | 3:4 | 2K 或 4K | 1 |
| 4 两参考换装 | 3:4 | 2K | 1 |

分辨率值使用大写 K。工具未提供对应比例或分辨率时，说明能力缺口，不猜第三方参数。

## DIRECT 检查

执行前确认：

- 工具实际选择 Nano Banana Pro 或 gemini-3-pro-image；名称或 ID 无法核验时转 PROMPT_ONLY。
- 参考图已按职责绑定。
- Prompt 与用户批准版一致。
- 画幅、分辨率和数量可见且正确。
- 用户已经授权本次可能产生费用的调用。

执行后回读实际参数和结果。只有返回图片时写 candidate_received。

## 质量门

- Prompt 是连贯叙事，不是标签列表。
- 身份描述块在同一角色的后续资产中用词稳定。
- 多图职责逐张明确，没有盲目融合。
- 三格只保留右格一个清晰正脸。
- 最终 Prompt 无未替换槽位、模型名或 API 字段。
- 没有编造第三方 provider 独有参数。
