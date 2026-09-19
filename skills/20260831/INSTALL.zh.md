# Cast Builder 通用角色资产安装

## Codex 用户级安装

把完整目录 cast-builder-universal-zh 放到：

    ~/.codex/skills/cast-builder-universal-zh/

目录中必须直接包含 SKILL.md、agents、references 和 portable。安装完成后在下一轮对话中使用：

    使用 $cast-builder-universal-zh，根据我的文字设定和参考图建立角色资产。

## 从 GitHub 安装

发布者把本目录放入 GitHub 仓库并建立固定版本标签后，用户可以让 Codex 使用 skill-installer 从该仓库路径安装。不要把示例 OWNER、REPO 或版本号当成真实地址；发布时替换为实际固定 tag。

安装器遇到同名目标目录时会停止，不应自动覆盖用户已有版本。更新前先让用户核对旧版和新版内容。

## ZIP 手动安装

ZIP 顶层必须保留 cast-builder-universal-zh 文件夹。用户解压后把整个文件夹放进其 Agent 支持的 Skills 根目录。不同 Agent 的安装根目录可能不同，发布前必须核对目标产品当前文档，不要猜路径。

## 没有原生 Skill 机制

打开 portable/AGENT_PROMPT.zh.md，把全文放入：

- Agent 的自定义指令；
- System Prompt；
- 或新对话的第一条消息。

这种方式可以保持工作流和提示词编译规则，但没有自动发现、文件路由、工具依赖声明或长期状态持久化。

## 生图能力边界

安装 Skill 不等于安装图像模型。直接生图还需要当前 Agent 已经拥有并获准使用兼容的图像工具、API 或网页执行入口。

- 有兼容工具：Skill 可以在用户确认后调用并交付候选图。
- 无兼容工具：Skill 只交付 Nano Banana Pro、GPT Image 2 或 Midjourney V8.2 的复制即用 Prompt。
- 不要把 API 密钥、账号凭据、私人人像、模型缓存或本机绝对路径放进公开安装包。

## 文件完整性

发布 ZIP 或 GitHub tag 时应另外提供 SHA-256。安装者可以据此核对文件没有在传输中被替换。SHA-256 只验证文件一致，不代表 Prompt 效果、模型可用性或账号权限。
