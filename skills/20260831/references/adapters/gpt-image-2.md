# GPT Image 2 适配器

公开名称：GPT Image 2。

稳定 API ID：gpt-image-2。

官方依据：

- https://developers.openai.com/api/docs/models/gpt-image-2
- https://developers.openai.com/api/docs/guides/image-generation
- https://developers.openai.com/cookbook/examples/multimodal/image-gen-models-prompting-guide

本适配器最后核实日期：2026-08-31。当前模型支持图像生成、编辑、灵活尺寸和高保真图片输入；具体工具是否暴露多图、质量和尺寸控制仍须执行前核验。

## 使用范围

默认用于：

- Mode 0 非权威候选脸探索。
- Mode 1B 单一区域造型细节卡。
- Mode 3 高精度面部特写。

用户明确接受模型变化且工具能力满足时，可以替代 Nano Banana Pro 执行 Mode 0 标准身份卡、Mode 1、Mode 2 或 Mode 4。模型变化必须写入锁定卡，不能由 Agent 自动决定。

## Prompt 编译

内部先建立四栏约束账本：

- Must include：必须出现的身份、造型、构图和细节。
- Must preserve：身份、比例、服装、材质、参考图职责和已批准元素。
- Must change：编辑任务中唯一允许改变的内容。
- Must exclude：额外人物、额外配饰、文字、水印或未批准装饰。

最终 Prompt 按 background or scene → subject → key details → constraints 的稳定顺序组织。简单人像用短段落；三格、双参考或复杂编辑用简短标签。

Prompt 内只放可复制的画面指令，不放模型、quality、size、background、action、端点或中文说明。API 或界面设置单独写在参数卡。

## 候选脸

从 references/prompt-templates.md 的 T1 读取已确认可见字段，编译为一段写实 casting portrait Prompt。可以比 Midjourney 版更明确地保留五官和背景约束，但不要把候选写成权威身份。

固定包含：

- one adult，单人胸像，脸占主体。
- 黑色圆领上衣。
- 中性灰无缝背景。
- 柔和均匀正面光、低对比度。
- 已确认脸部、肤色、头发、妆面和当前裁切可见标记。

## 编辑与多图

Mode 1B 或 Mode 3 使用单参考编辑时，在 Prompt 中明确：

    Change only: [本步需要放大或调整的唯一内容].
    Preserve: [身份、肤色、骨相、构图上下文、已批准造型和其他锁定项].

Mode 1 两步合成、Mode 2 或 Mode 4 使用多参考时，必须在 Prompt 内写：

    Reference roles: Image 1: [职责]. Image 2: [职责].

每张图只承担明确职责，并说明如何组合。不要让模型自行猜测参考图映射。当前工具不能可靠地绑定两图时进入 PROMPT_ONLY。

## 参数卡

默认参数是本 Skill 的生产约定：

| Mode | Size or aspect target | Quality | Count |
| --- | --- | --- | --- |
| 0 候选或身份卡 | 支持灵活尺寸时用 1008x1344（3:4）；否则用 1024x1536（2:3 回退） | medium；正式身份卡可 high | 1 |
| 1 服装定妆 | 支持灵活尺寸时用 1008x1344（3:4）；否则用 1024x1536（2:3 回退） | medium 或 high | 1 |
| 1B 细节卡 | 1024x1024；纵向细节可用 1008x1344 | high | 1 |
| 2 三格角色表 | 支持灵活尺寸时用 1536x864（16:9）；否则用 1536x1024（3:2 回退） | high | 1 |
| 3 面部特写 | 支持灵活尺寸时用 1008x1344（3:4）；否则用 1024x1536（2:3 回退） | high | 1 |
| 4 两参考换装 | 支持灵活尺寸时用 1008x1344（3:4）；否则用 1024x1536（2:3 回退） | high | 1 |

1008x1344 和 1536x864 都满足当前官方灵活尺寸约束，但第三方工具不一定开放自定义值。执行时必须先核对实际工具；使用 1024x1536 或 1536x1024 回退时，要把实际比例分别写成 2:3 或 3:2，不能声称是 3:4 或 16:9。透明背景不是本 Skill 的角色资产默认需求。

## DIRECT 检查

- 工具实际模型可核验为 GPT Image 2 或 gpt-image-2；名称或 ID 无法核验时转 PROMPT_ONLY。
- 编辑动作、参考图数量与职责、尺寸、质量和数量可核验。
- 用户已批准 Prompt 和本次调用。
- 如果上层 Agent 会重写 Prompt，能回读实际提交文本；无法回读时说明限制，不声称逐字一致。

## 质量门

- 第一处就能读出最终资产和主体。
- 每张参考图只有一个主要职责。
- 编辑任务同时写明 Change only 与 Preserve。
- 复杂结构使用短标签，不把所有约束埋进一个长句。
- Prompt 代码块内不出现 API 设置、中文说明或未替换槽位。
- 候选状态与权威资产状态没有混淆。
