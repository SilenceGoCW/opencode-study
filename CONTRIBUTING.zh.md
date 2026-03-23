# 查看opencode中文文档

在根目录（packages\web）执行指令
```bash
bun dev:docs
```

之后输入网址进行访问

```bash
http://localhost:4321/docs/zh-cn/

```

# 在web开发模式下，如何让配置文件生效 建议使用第二种方法

*运行web开发的指令*

```bash
bun run --cwd packages/app dev
```


1. 自定义路径
使用 OPENCODE_CONFIG 环境变量指定自定义配置文件路径。

```bash
$env:OPENCODE_CONFIG = "D:\cw\opencode\opencode\.opencode\opencode.jsonc";bun dev serve

```

自定义配置在优先级顺序中位于全局配置和项目配置之间加载。

2. 自定义目录
使用 OPENCODE_CONFIG_DIR 环境变量指定自定义配置目录。该目录会像标准 .opencode 目录一样被搜索代理、命令、模式和插件，并且应遵循相同的结构。

```bash
$env:OPENCODE_CONFIG_DIR = "D:\cw\opencode\opencode\.opencode";bun dev serve

```

自定义目录在全局配置和 .opencode 目录之后加载，因此可以覆盖它们的设置。

# opencode插件安装的方式
```bash
# 在一下目录进行安装，执行指令后会在下述目录的node_modules中
cd d:\cw\opencode\opencode\.opencode

```

# 为 OpenCode 贡献代码

我们希望你能轻松地为 OpenCode 做出贡献。以下是最常被合并的改动类型：

- Bug 修复
- 增加新的 LSP / 格式化器（Formatter）
- 改进 LLM 的表现
- 支持新的 Provider
- 修复特定环境下的怪癖问题
- 补齐缺失的标准行为
- 文档改进

不过，任何 UI 改动或核心产品功能在实现前都必须先与核心团队进行设计评审。

如果你不确定某个 PR 是否会被接受，可以随时询问维护者，或查找带有以下任意标签的 issue：

- [`help wanted`](https://github.com/anomalyco/opencode/issues?q=is%3Aissue%20state%3Aopen%20label%3Ahelp-wanted)
- [`good first issue`](https://github.com/anomalyco/opencode/issues?q=is%3Aissue%20state%3Aopen%20label%3A%22good%20first%20issue%22)
- [`bug`](https://github.com/anomalyco/opencode/issues?q=is%3Aissue%20state%3Aopen%20label%3Abug)
- [`perf`](https://github.com/anomalyco/opencode/issues?q=is%3Aopen%20is%3Aissue%20label%3A%22perf%22)

> [!NOTE]
> 忽视这些约束的 PR 很可能会被关闭。

想要认领一个 issue？在 issue 下留言即可；除非这是我们已经在处理的事情，否则维护者可能会将其分配给你。

## 添加新的 Provider

新的 Provider 按理说不应该需要太多代码改动（如果需要的话）。但如果你想为新的 Provider 增加支持，请先向下面这个仓库提一个 PR：
https://github.com/anomalyco/models.dev

## 开发 OpenCode

- 依赖要求：Bun 1.3+
- 在仓库根目录安装依赖并启动开发服务器：

  ```bash
  bun install
  bun dev
  ```

### 在不同目录中运行

默认情况下，`bun dev` 会在 `packages/opencode` 目录中运行 OpenCode。要在其它目录或仓库中运行：

```bash
bun dev <directory>
```

要在 opencode 仓库根目录本身运行 OpenCode：

```bash
bun dev .
```

### 构建 “localcode”

要编译一个独立可执行文件：

```bash
./packages/opencode/script/build.ts --single
```

然后这样运行：

```bash
./packages/opencode/dist/opencode-<platform>/bin/opencode
```

将 `<platform>` 替换为你的平台（例如 `darwin-arm64`、`linux-x64`）。

- 核心组成：
  - `packages/opencode`：OpenCode 核心业务逻辑与服务端。
  - `packages/opencode/src/cli/cmd/tui/`：TUI 代码，使用 SolidJS 编写，基于 [opentui](https://github.com/sst/opentui)
  - `packages/app`：共享的 Web UI 组件，使用 SolidJS 编写
  - `packages/desktop`：原生桌面应用，使用 Tauri 构建（封装 `packages/app`）
  - `packages/plugin`：`@opencode-ai/plugin` 的源码

### 理解 bun dev 与 opencode 的区别

在开发过程中，`bun dev` 相当于构建后的 `opencode` 命令在本地的对应物。两者运行的都是同一个 CLI 接口：

```bash
# 开发（从项目根目录）
bun dev --help           # 显示所有可用命令
bun dev serve            # 启动无 UI 的 API 服务端
bun dev web              # 启动服务端 + 打开 Web 界面
bun dev <directory>      # 在指定目录中启动 TUI

# 生产
opencode --help          # 显示所有可用命令
opencode serve           # 启动无 UI 的 API 服务端
opencode web             # 启动服务端 + 打开 Web 界面
opencode <directory>     # 在指定目录中启动 TUI
```

### 运行 API 服务端

启动 OpenCode 的无 UI API 服务端：

```bash
bun dev serve
```

默认会在 4096 端口启动该无 UI 服务端。你也可以指定其它端口：

```bash
bun dev serve --port 8080
```

### 运行 Web 应用

在开发过程中测试 UI 改动：

1. **先启动 OpenCode 服务端**（见上面的 [运行 API 服务端](#运行-api-服务端)）
2. **再运行 Web 应用：**

```bash
bun run --cwd packages/app dev
```

这会在 http://localhost:5173（或输出中显示的类似端口）启动本地开发服务器。大部分 UI 改动都可以在这里测试，但要获得完整功能，服务端必须保持运行。

### 运行桌面应用

桌面应用是一个原生 Tauri 应用，用来封装 Web UI。

运行原生桌面应用：

```bash
bun run --cwd packages/desktop tauri dev
```

这会在 http://localhost:1420 启动 Web 开发服务器，并打开原生窗口。

如果你只想运行 Web 开发服务器（不启动原生壳）：

```bash
bun run --cwd packages/desktop dev
```

生成生产环境的 `dist/` 并构建原生应用包：

```bash
bun run --cwd packages/desktop tauri build
```

Tauri 会通过它的 `beforeBuildCommand` 自动执行 `bun run --cwd packages/desktop build`。

> [!NOTE]
> 运行桌面应用需要额外的 Tauri 依赖（Rust 工具链、平台相关库）。设置说明见 [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/)。

> [!NOTE]
> 如果你修改了 API 或 SDK（例如 `packages/opencode/src/server/server.ts`），请运行 `./script/generate.ts` 来重新生成 SDK 及相关文件。

请尽量遵循 [风格指南](./AGENTS.md)

### 配置调试器

Bun 调试目前仍然有不少边角问题。希望这份指引能帮你完成配置并少踩坑。

调试 OpenCode 最可靠的方法，是在终端里用 `bun run --inspect=<url> dev ...` 手动运行，然后通过该 URL 连接你的调试器。其它方式可能导致断点映射不正确，至少在 VSCode 里是这样（因人而异）。

注意事项：

- 如果你想运行 OpenCode 的 TUI，并且希望断点能在服务端代码里触发，你可能需要使用 `bun dev spawn` 而不是常规的 `bun dev`。因为 `bun dev` 会在 worker 线程中运行服务端，断点可能在那里面失效。
- 如果 `spawn` 对你无效，你可以单独调试服务端：
  - 调试服务端：`bun run --inspect=ws://localhost:6499/ --cwd packages/opencode ./src/index.ts serve --port 4096`，然后用 `opencode attach http://localhost:4096` 连接 TUI
  - 调试 TUI：`bun run --inspect=ws://localhost:6499/ --cwd packages/opencode --conditions=browser ./src/index.ts`

其它小技巧：

- 你可能想用 `--inspect-wait` 或 `--inspect-brk` 替代 `--inspect`，取决于你的工作流
- 每次都写 `--inspect=ws://localhost:6499/` 会比较烦，你可能想 `export BUN_OPTIONS=--inspect=ws://localhost:6499/` 来避免重复输入

#### VSCode 配置

如果你使用 VSCode，可以参考我们的示例配置 [.vscode/settings.example.json](.vscode/settings.example.json) 和 [.vscode/launch.example.json](.vscode/launch.example.json)。

一些可能会有问题的调试方式：

- 使用 `"request": "launch"` 的调试配置，断点可能会被错误映射，从而不可用
- 在 VSCode 的 `JavaScript Debug Terminal` 里运行 OpenCode 也会出现同样问题

即便如此，你也可以尝试这些方法，它们也许对你有效。

## Pull Request 期望

### 先建 Issue 的政策

**所有 PR 都必须引用一个已有 issue。** 在开 PR 前，请先开一个 issue 描述 bug 或功能需求。这有助于维护者分诊，并避免重复工作。没有关联 issue 的 PR 可能会在未审查的情况下被关闭。

- 在 PR 描述中使用 `Fixes #123` 或 `Closes #123` 来关联 issue
- 对于小修复，一个简短的 issue 也可以，只要维护者能理解问题的上下文

### 通用要求

- 保持 PR 小而聚焦
- 解释问题是什么，以及为什么你的改动能修复它
- 在新增功能前，先确认代码库里没有其它地方已经实现了同样的功能

### UI 改动

如果你的 PR 包含 UI 改动，请附上前后对比的截图或视频。这能帮助维护者更快审查，也能让你更快得到反馈。

### 逻辑改动

对于非 UI 改动（bug 修复、新功能、重构），请说明 **你如何验证它能工作**：

- 你测试了什么？
- 评审者如何复现/确认修复？

### 不要 AI 生成大段文字

冗长的、AI 生成的 PR 描述和 issue 内容不可接受，可能会被忽略。请尊重维护者的时间：

- 写短而聚焦的描述
- 用你自己的话说明改了什么、为什么要改
- 如果你无法简要说明，说明你的 PR 可能太大了

### PR 标题

PR 标题应遵循 conventional commit 标准：

- `feat:` 新功能或新特性
- `fix:` Bug 修复
- `docs:` 文档或 README 改动
- `chore:` 维护任务、依赖更新等
- `refactor:` 不改变行为的代码重构
- `test:` 新增或更新测试

你也可以选择添加 scope，表示影响的包：

- `feat(app):` app 包中的功能
- `fix(desktop):` desktop 包中的 bug 修复
- `chore(opencode):` opencode 包中的维护工作

示例：

- `docs: update contributing guidelines`
- `fix: resolve crash on startup`
- `feat: add dark mode support`
- `feat(app): add dark mode support`
- `fix(desktop): resolve crash on startup`
- `chore: bump dependency versions`

### 风格偏好

这些并非强制执行，只是一些通用建议：

- **函数：** 尽量把逻辑放在一个函数里，除非拆分能带来明确的复用或组合收益。
- **解构：** 不要对变量做不必要的解构。
- **控制流：** 尽量避免 `else`。
- **错误处理：** 在可行情况下，优先使用 `.catch(...)` 而不是 `try`/`catch`。
- **类型：** 使用精确类型，避免 `any`。
- **变量：** 坚持不可变写法，避免 `let`。
- **命名：** 在保证含义清晰的前提下，尽量使用简洁的单词标识符。
- **运行时 API：** 合适时使用 Bun 的辅助函数，例如 `Bun.file()`。

## 功能请求

对于全新的功能，请先从设计讨论开始。开一个 issue 描述问题、你拟定的方案（可选）以及为什么它应该属于 OpenCode。核心团队会帮助判断是否应该推进；在得到批准之前，请不要直接开功能 PR。

## 信任与背书（Vouch）系统

本项目使用 [vouch](https://github.com/mitchellh/vouch) 来管理贡献者信任。vouch 列表维护在 [`.github/VOUCHED.td`](.github/VOUCHED.td)。

### 工作方式

- **已背书用户（Vouched users）**：被明确标记为可信的贡献者。
- **已谴责用户（Denounced users）**：被明确阻止。来自已谴责用户的 issue 和 PR 会自动关闭。如果你被谴责了，可以在 [Discord](https://opencode.ai/discord) 联系维护者，请求取消背书/解除状态。
- **其它所有人**：都可以正常参与——你不需要被背书也能开 issue 或 PR。

### 维护者说明

拥有写权限的协作者可以在任意 issue 下通过评论来管理 vouch 列表：

- `vouch` — 为该 issue 作者背书
- `vouch @username` — 为指定用户背书
- `denounce` — 谴责该 issue 作者
- `denounce @username` — 谴责指定用户
- `denounce @username <reason>` — 附带原因的谴责
- `unvouch` / `unvouch @username` — 将某人从列表中移除

改动会自动提交到 `.github/VOUCHED.td`。

### 谴责政策

谴责仅用于那些反复提交低质量 AI 生成贡献、刷屏，或存在其他恶意行为的用户。不用于意见分歧或诚实失误。

## Issue 要求

所有 issue **必须** 使用我们的某一个 issue 模板：

- **Bug report** — 用于报告 bug（需要描述）
- **Feature request** — 用于建议增强（需要勾选验证框并提供描述）
- **Question** — 用于提问（需要问题本身）

不允许创建空白 issue。新 issue 创建后，会有自动化检查验证其是否使用了模板并符合贡献指南。如果不满足要求，你会收到一条评论说明需要修复的内容，并有 **2 小时** 的时间编辑 issue。之后它会被自动关闭。

issue 可能会因以下原因被标记：

- 未使用模板
- 必填字段为空或填写占位文本
- AI 生成的大段文字
- 缺少有意义的内容

如果你认为自己的 issue 被错误标记，请告知维护者。
