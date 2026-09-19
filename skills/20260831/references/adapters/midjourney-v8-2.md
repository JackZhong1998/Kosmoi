# Midjourney V8.2 适配器

公开名称：Midjourney V8.2。

官方依据：

- https://docs.midjourney.com/hc/en-us/articles/32199405667853-Version
- https://updates.midjourney.com/version-8-2/
- https://docs.midjourney.com/hc/en-us/articles/36285124473997-Omni-Reference

本适配器最后核实日期：2026-08-31。官方 Version 文档确认 V8.2 自 2026-07-24 起为默认版本。

## 使用范围

只默认用于 Mode 0 的纯文字候选脸与审美方向探索。候选结果不是权威身份卡；用户必须选定唯一一张，再用 Nano Banana Pro 建立标准身份卡。

Midjourney V8.2 默认不执行 Mode 1、Mode 2 或 Mode 4。官方 Omni Reference 只兼容 V7；V8.X 外部图片编辑使用 Edit Model。除非当前工具明确暴露并核验 Edit Model 的参考图和编辑能力，否则本 Skill 不用 V8.2 承担身份锁定或双参考换装。

## 人像安全编译器

不得直接复制或自由润色用户原话。先把已确认规格规范为封闭可见字段，每项最多一个名词短语：

- one adult 和性别表达。
- 可选的已确认族裔或地域外观；不得据此推断其他五官。
- 自然肤色和底色。
- 脸型、下颌、适度颧骨。
- 眼形眼色、眉、鼻、唇。
- 头发颜色、长度、纹理和分缝。
- 当前胸像可见的明显身份标记。
- 妆容只写部位、普通颜色、强度和质地。

真人、团体、品牌、受保护角色、模仿关系、开放式风格比喻、身体评价、年龄暧昧和胸像不可见设定都不是 Prompt 字段。能转换为可见属性时先让用户确认，否则删除整项。

## Prompt 编译

Midjourney 需要紧凑、直接、可见的画面描述，不使用 Nano Banana Pro 的长叙事，也不使用 GPT Image 2 的编辑标签。

固定内部模板：

    Studio casting portrait of one adult [SUBJECT TERM] with [SKIN TONE, FACE, EYES, BROWS, NOSE, LIPS AND HAIR]. [OPTIONAL VISIBLE IDENTITY MARKER AND RESTRAINED MAKEUP]. Centered head-and-shoulders framing, direct gaze, calm closed-lip expression, plain black crew-neck top, seamless neutral mid-gray background, soft even frontal studio light, low contrast, natural skin and hair texture, polished contemporary portrait photography.

最终候选 Prompt：

- 最多三句、最多 100 个英文词。这是本 Skill 的人像安全与清晰度护栏，不是官方字数限制。
- 只描述一名明确成年人。
- 不含中文、平台名、模型名、参数、否定清单、冒号式长清单或未替换槽位。
- 不写微观毛孔清单、复杂多灯位或不可见体型。

## Web 设置

- Version：V8.2。
- Aspect Ratio：3:4。
- Model：SD 用于候选探索；选定方向后如需复核细节可再用 HD。
- Raw：On。
- Stylization：50–150，保持人像可控。
- Weirdness：0。
- Variety：5–15；需要更宽探索时最多提高到 25。
- Draft：Off。
- Reference slots：纯文字候选为 None。

Web 设置不写进 Prompt 代码块。若目标工具只接受 Discord 参数，则把参数放在 Prompt 外单独交付。

## 提交前失败关闭

任一项不通过都不得调用模型：

1. 一名明确成年人，全部可变描述可追溯到用户确认字段。
2. 无真人、团体、品牌、受保护角色、模仿关系、年龄暧昧或身体评价。
3. 只写胸像可见信息和固定工作室条件。
4. 最多三句、100 个英文词，无参数和未替换槽位。

失败时从封闭字段重编一次；仍不合格则停止并写“Midjourney 候选人像 Prompt 未通过提交前检查”。

## 错误分流

- 明确审核提示：记录为“审核不确定性拦截”，不能声称用户违规。只保留成年人、核心五官、头发和固定工作室条件，交付一次安全修订供用户确认。
- 通用 Failed to submit 或 Creation failed：不要先改 Prompt。先核对实际版本、提交状态和可用的官方服务状态；原因无法核实时就明确写“原因无法确认”。
- 经用户确认原样重试一次仍失败：停止，不连续自动重试，不静默切换模型。

## 质量门

- Prompt 是紧凑视觉描述，不是说明书。
- Web 设置全部在代码块外。
- 单人、正面胸像、黑色圆领上衣、中灰背景、均匀正面光和低对比度均保留。
- 候选结果明确标为 candidate_received，未自动升格为标准身份卡。
