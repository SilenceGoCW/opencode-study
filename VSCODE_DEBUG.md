# VSCode 调试指南

本项目包含两个核心包：

- `packages/opencode` — 服务端（Bun + TypeScript）
- `packages/app` — 前端（Vite + SolidJS）

## 前置要求

1. 安装 VSCode 扩展：**[Bun for Visual Studio Code](https://marketplace.visualstudio.com/items?itemName=oven.bun-vscode)**（扩展 ID：`oven.bun-vscode`）
2. 已安装 Bun 1.3+（`bun --version` 验证）

> `.vscode/settings.json` 已配置扩展推荐，打开项目时 VSCode 会自动提示安装。

---

## 调试方式

项目提供三个调试入口，在 VSCode 调试面板（`Ctrl+Shift+D`）的下拉列表中选择：

### 1. Debug All（推荐）— 一键启动全部

**`Debug All (Server + Frontend)`**

自动并行启动服务端和前端，然后分别 attach 调试器。

步骤：
1. 按 `F5`，选择 `Debug All (Server + Frontend)`
2. VSCode 自动在终端启动服务端（等待输出 `opencode server listening on`）和前端 Vite 服务器（等待输出 `Local:`）
3. 服务端和前端都就绪后，Chrome 窗口打开前端页面，Bun 调试器 attach 到服务端
4. 此时可在 `packages/opencode/src/` 下设置断点调试服务端，也可在 Chrome DevTools 中调试前端

### 2. 单独调试服务端

**`Attach: opencode server`**

手动启动服务端后，attach 到 Bun 调试器。

步骤：

1. 在终端手动运行服务端（带 inspect）：

   ```powershell
   bun run --inspect=ws://localhost:6499/ --cwd packages/opencode ./src/index.ts serve --port 4096
   ```

2. 看到输出 `opencode server listening on http://127.0.0.1:4096` 后，按 `F5` 选择 `Attach: opencode server`
3. 在 `packages/opencode/src/` 中设置断点即可命中

### 3. 单独调试前端

**`Debug: packages/app (Chrome)`**

调试前端 SolidJS 代码。

步骤：

1. 确保服务端已运行（否则前端无法加载模型列表等数据）：

   ```powershell
   bun run --cwd packages/opencode ./src/index.ts serve --port 4096
   ```

2. 启动前端开发服务器：

   ```powershell
   bun run --cwd packages/app dev
   ```

3. 按 `F5` 选择 `Debug: packages/app (Chrome)`，Chrome 窗口打开 `http://localhost:5173`
4. 在 `packages/app/src/` 中设置断点即可命中

---

## 注意事项

### Bun Worker 线程断点问题

直接运行 `bun dev`（TUI 模式）时，服务端跑在 worker 线程中，**断点可能不会触发**。

如需调试服务端逻辑，务必使用 `serve` 模式单独启动服务端，而不是 `bun dev`。

### Windows PowerShell 环境变量方式

如果不想每次手动输入 `--inspect` 参数，可以在 PowerShell 中设置环境变量：

```powershell
$env:BUN_OPTIONS="--inspect=ws://localhost:6499/"
bun run --cwd packages/opencode ./src/index.ts serve --port 4096
```

### `--inspect-wait` 与 `--inspect-brk`

- `--inspect`：启动后立即运行，调试器在后台等待 attach
- `--inspect-wait`：启动后**等待**调试器 attach 再执行代码（适合调试启动阶段）
- `--inspect-brk`：启动后在第一行代码处**自动断点**（适合调试初始化逻辑）

---

## 配置文件说明

| 文件 | 说明 |
|---|---|
| `.vscode/launch.json` | 调试启动配置（attach / Chrome / compound） |
| `.vscode/tasks.json` | 后台任务配置（启动服务端和前端） |
| `.vscode/settings.json` | 扩展推荐配置 |
