# **opencode开发规范**

中文文档地址：[https://opencode.ai/docs](https://opencode.ai/docs)

## **opencode技术栈**

- TypeScript
- Bun： 快速、一体化的 JavaScript/TypeScript 运行时与工具链，可直接替代 Node.js。
- SolidJS：无虚拟 DOM的前端框架
- Tauri ：包构建工具

## **开发环境**

- Bun
- 大模型:Ollama或者Vllm

## 基于opencode开发智能体

### 1. 基于用户问题的仿真简易流程实现与测试

- 主 Agent（Primary Agent）：负责整体协调，接收用户输入，分解任务，调用子 agents/tools。
- 子 Agents（Subagents）：每个对应一个流程步骤
  - 构建想定场景（基于用户输入生成场景描述、参数）
  - 仿真执行（调用仿真引擎，执行仿真）

#### 实现步骤

用 opencode agent create 命令交互式创建 agents，全局保存（~/.config/opencode/agents/）

1. 创建主 Agent

opencode agent create

- 保存位置：全局。
- 描述："作为一个仿真协调专家，基于用户问题自主处理仿真流程：解析输入、构建场景、执行仿真。"
- 系统提示词（自动生成后可编辑）：强调多步思考、调用子 agents（如 @scenario-builder、@sim-developer、@analyzer）。
- 工具权限：启用 bash（运行仿真引擎命令）、自定义tool。
- 生成文件：~/.config/opencode/agents/ly-coordinator.md（可手动编辑 YAML 部分添加 tools: { ly-tool: true }）。

2. 创建子 Agents

- @scenario-builder（构建想定场景）： 描述："从用户输入提取关键元素，生成场景参数（如平台、环境、任务）。" 工具：只读工具如 read。
- @sim-runner（开发仿真）： 描述："通过工具执行仿真。" 工具：simulation-runner。

3. 创建自定义 Tools/Skills

- 在项目目录创建 .opencode/skills/afsim-tool/ 文件夹。
- 想定格式校验工具、仿真引擎执行工具等

4. 配置工作流 在主 agent 的提示词中添加规则：用 @subagent 调用子 agents，用工具链处理仿真。示例 prompt 片段：

步骤1: 解析用户输入，调用 @scenario-builder 生成场景JSON。  
步骤2: 用场景调用 @scenario-valid 校验格式。  
步骤3: 用 simulation-runner 运行仿真。

#### 数据交互

智能体间和工具间的数据交互以文件为主。

## 项目结构

```text
ly-agent/                      ← 项目根目录（git init 这里）
├── .opencode/                          ← 所有 OpenCode 相关配置和代码都在这里（OpenWork 风格）
│   ├── agent/                         ← 所有 Agent 定义（.md 或 .json）
│   │   ├── primary.md                  ← 主 Agent（面向客户的业务助手）
│   │   ├── memory-manager.md           ← 记忆专用子 Agent
│   │   ├── db-operator.md              ← 数据库操作专用子 Agent
│   │   └── reviewer.md                 ← 代码/输出审查 Agent（可选）
│   ├── tools/                          ← 所有自定义工具（.ts / .js）
│   │   ├── core/                       ← 基础工具（权限、日志等）
│   │   │   ├── permission-check.ts
│   │   │   └── log-action.ts
│   │   ├── db/                         ← 数据库相关工具
│   │   │   ├── query.ts
│   │   │   ├── insert.ts
│   │   │   └── update.ts
│   │   ├── memory/                     ← 长期/短期记忆工具
│   │   │   ├── save-long-term.ts
│   │   │   ├── recall-long-term.ts
│   │   │   └── save-session-note.ts    ← 短期会话笔记
│   │   └── business/                   ← 你的具体业务工具
│   │       ├── check-order.ts
│   │       └── generate-report.ts
│   ├── plugins/                        ← 如果需要复杂插件（可选，先空着）
│   └── opencode.json                   ← 项目全局配置（模型、默认 Agent、权限白名单）
├── data/                               ← 持久化数据（不放 .opencode/ 里，避免污染配置）
│   ├── sqlite/                         ← 本地数据库文件
│   │   └── business.db
│   ├── vectors/                        ← 向量数据库文件（hnswlib/chroma 等）
│   └── memories/                       ← 纯文件式记忆备份（json/md）
├── src/                                ← 工具中 import 的辅助代码（非 OpenCode 加载）
│   ├── db/                             ← 数据库连接、schema
│   │   └── index.ts
│   ├── embeddings/                     ← 如果用本地 embedding 模型
│   └── utils/                          ← 通用工具函数（日期、格式化等）
├── .env                                ← 敏感配置（DB 连接字符串、API key 等）
├── .gitignore
├── package.json                        ← 依赖（drizzle-orm、@opencode-ai/plugin 等）
├── bun.lockb                           ← 或 pnpm-lock.yaml / yarn.lock
├── README.md                           ← 项目说明、启动方式、Agent 列表
└── docker-compose.yml                  ← 可选，用于生产测试
```

## 基于opencode的开源项目

- web项目
  - openchamber
  - opencode-web
  - 等

# **Windows编译**

**后续的安装步骤涉及到shell的最好都以管理员身份启动**

## 1.构建本地开发环境

### 安装Rust的Windows编译环境

- 点击rust-1.94.0-x86_64-pc-windows-msvc.msi进行安装并将bin目录添加至环境变量

```bash
1. 检查 Rust 编译器版本（核心验证）
rustc --version
2. 检查 Cargo 版本（Rust 的包管理工具，必装）
cargo --version

3. 将cargo的缓存目录放置到C:\Users\<用户名>\.cargo下
```

- 安装MSVC

1. 管理员身份启动powershell，cd到离线包根目录，_建议安装vs-offline-w11.7z包，不行在使用vs-offline-win10.7z_
2. 双击安装certificates中的所有证书，确保 **Microsoft Windows Code Signing PCA 2024.crt**证书一定要安装。
3. 安装之后执行命令，进行安装

```bash
.\vs_BuildTools.exe --noweb --installPath "C:\cw\vs-install" --add Microsoft.VisualStudio.Workload.VCTools --includeRecommended --passive --wait
```

### 安装NSIS

双击exe安装后将bin目录添加到环境变量

### 安装Node

常用安装方法，安装node-v22.17.1-x64.msi

### 安装Bun环境

解压bun-windows-x64.zip压缩包并添加到环境变量

```bash
bun --version
```

### 安装git，编译必须依赖git

### 设置环境变量

在系统变量或者用户变量设置添加环境变量

```bash
RUST_TARGET
x86_64-pc-windows-msvc
```

# **搭建Node私有仓库,使用Verdaccio**

#### 基于工程目录启动服务


```bash
node start.js
```

#### 设置npm源为

```bash
npm set registry http://127.0.0.1:4873

# 仅查看 registry 配置（简洁）
npm get registry
```

#### 安装插件Verdaccio，如果失败了也无所谓，不要在意

```bash
npm install @jayxuz/verdaccio-offline-storage

npm install verdaccio-metadata-healer
```

#### 安装 Verdaccio与pm2

打开**管理员权限的 CMD/PowerShell**（避免权限问题），执行：

```


# 全局安装 pm2

npm install -g pm2@6.0.14 --registry=http://127.0.0.1:4873

# 安装之后关闭node，关闭Verdaccio服务后通过pm2启动。
```

#### 启动 Verdaccio

##### pm2启动等管理Verdaccio服务

在Verdaccio工程中，通过pm2启动start.js

```bash
# 启动start.js脚本
pm2 start start.js --name verdaccio-start

# 常用命令
pm2 list    # 查看进程和状态
pm2 show verdaccio-start # 详细查看
# 查看日志
pm2 logs
pm2 logs verdaccio-start
pm2 flush   # 清空所有日志

# 停止/重启（stop/restart/reload）
pm2 restart verdaccio-start  # 重启
pm2 stop verdaccio-start    # 停止
## 停止并从 pm2 列表移除：
ppm2 delete verdaccio-start
# 或 pm2 delete all
```

**开机自启动设置**

```bash

# 1. 生成并启用开机自启：
pm2 startup
# 2.按照示pm2的输出，直接复制指令执行
--- 示例输出
[PM2] Init System found: systemd
[PM2] To setup the Startup Script, copy/paste the following command:
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u your_username --hp /home/your_username
---

# 3. 保存当前进程
pm2 save

# 重启后恢复：
pm2 resurrect

```

**取消自动设置**

```bash
pm2 unstartup  # 移除自启配置
pm2 delete erdaccio-start # 删除目标进程
pm2 save  # 更新进程列表
```


# 2.opencode源码编译

_注意：编译源码时，一定要存在git，否则不通过_


1. 安装依赖

   ```sheel
   bun install
   ```

2. 依据CONTRIBUTING.md 文档进行dev的各版本环境测试

3. opencode.dev.json 配置文件
   - baseline为false时，编译desktop应用，不编译base版本，true时编译base版

# **常用技巧**

## 检查node包缓存目录是否存在不完整包

通过powershell运行下述脚本

```shell
# 定义要检查的目标目录
$targetDir = "D:\cw\node-offilne-repository\verdaccio-6.3.1\storage"

# 初始化一个数组存储结果
$missingPackages = @()

# 遍历目标目录下的所有子目录（对应不同的包）
Get-ChildItem -Path $targetDir -Directory -Recurse | ForEach-Object {
    $packageDir = $_.FullName

    # 检查当前目录是否包含 package.json 文件
    $packageJsonPath = Join-Path -Path $packageDir -ChildPath "package.json"
    if (Test-Path -Path $packageJsonPath -PathType Leaf) {

        # 检查是否存在实际的包文件（.tgz 或解压后的包目录）
        # 排除 package.json 本身，查找其他文件/目录（verdaccio 存储的包通常是 .tgz 或版本目录）
        $hasPackageFiles = $false

        # 查找 .tgz 压缩包（最常见的包文件格式）
        $tgzFiles = Get-ChildItem -Path $packageDir -Filter "*.tgz" -File
        if ($tgzFiles.Count -gt 0) {
            $hasPackageFiles = $true
        }

        # 若没有 .tgz，检查是否有版本号命名的目录（如 1.0.0）
        if (-not $hasPackageFiles) {
            $versionDirs = Get-ChildItem -Path $packageDir -Directory | Where-Object {
                # 简单判断是否为版本号格式（数字.数字.数字）
                $_.Name -match '^\d+\.\d+\.\d+(\.\d+)?$'
            }
            if ($versionDirs.Count -gt 0) {
                $hasPackageFiles = $true
            }
        }

        # 若既没有 .tgz 也没有版本目录，说明只有 package.json
        if (-not $hasPackageFiles) {
            $missingPackages += $packageDir
        }
    }
}

# 输出结果
if ($missingPackages.Count -gt 0) {
    Write-Host "`n以下目录只有 package.json，未下载实际包文件：`n" -ForegroundColor Red
    $missingPackages | ForEach-Object {
        Write-Host $_ -ForegroundColor Yellow
    }
} else {
    Write-Host "`n所有包含 package.json 的目录都有对应的包文件，无缺失！`n" -ForegroundColor Green
}
```

## vscode 刷新终端获取环境变量

```bash
# 刷新环境变量（立即生效）
$env:Path =[System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" +[System.Environment]::GetEnvironmentVariable("Path","User") # 验证
bun --version
```

# windows 编译问题

## 在windows开发环境中，点击切换终端按钮，终端会一闪而过

原因：opencode默认使用gitbash的终端，windows的终端有数量限制

解决：现在通过代码的方式，windwos使用shell，linux使用 bash 或 zsh

## 在执行指令的时候会报错忘记哪个了

**原因**是因为bun占用了编译debug下的exe文件，导致无法进行更新编译

**解决**

关闭所有的bun进程，之后重新运行，如果还不行就重启windwos电脑吧

```bash
# 强制关闭所有 Bun 进程
taskkill /F /IM bun.exe 2>NUL
```

## 错误 bun install

�🔍 @azure/msal-browser... ENOENT: No such file or directory: failed to link package: @azure/msal-browser@4.29.0 (copyfile)

### 解决

Windows 默认的路径长度限制很容易导致包安装失败，需要开启「长路径支持」：

- 按下 Win + R，输入 regedit 打开注册表编辑器；
- 定位到路径：HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Control\FileSystem；
- 找到右侧的 LongPathsEnabled，双击修改值为 1（如果没有这个项，右键新建「DWORD (32 位) 值」，命名为 LongPathsEnabled，值设为 1）；
- 重启电脑后，再重新执行 bun install。
