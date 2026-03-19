# opencode 二次开发完整指南

> 基于 opencode 源码分析，面向希望在 opencode 上构建自定义 AI Agent 应用的开发者。

---

## 目录

1. [项目结构总览](#1-项目结构总览)
2. [配置文件体系](#2-配置文件体系)
3. [自定义大模型 Provider](#3-自定义大模型-provider)
4. [连接 Ollama 本地模型](#4-连接-ollama-本地模型)
5. [连接 vLLM 推理服务](#5-连接-vllm-推理服务)
6. [连接国内大模型（通义/智谱/Kimi）](#6-连接国内大模型)
7. [自定义 Agent](#7-自定义-agent)
8. [自定义 Skill（技能库）](#8-自定义-skill技能库)
9. [自定义 Tool（工具）](#9-自定义-tool工具)
10. [自定义 Command（命令）](#10-自定义-command命令)
11. [接入 MCP 服务](#11-接入-mcp-服务)
12. [权限系统](#12-权限系统)
13. [Plugin 插件开发](#13-plugin-插件开发)
14. [实战示例：军事仿真 Agent](#14-实战示例军事仿真-agent)
15. [实战示例：仿真数据可视化 Agent（对接 Java Web 工具）](#15-实战示例仿真数据可视化-agent)
16. [生态插件推荐（军事仿真场景）](#16-生态插件推荐军事仿真场景)
17. [离线环境插件安装指南](#17-离线环境插件安装指南)

---

## 1. 项目结构总览

```
opencode/
├── packages/
│   ├── opencode/src/       # 核心后端逻辑
│   │   ├── agent/          # Agent 系统（调度、生成）
│   │   ├── provider/       # 大模型 Provider 适配
│   │   ├── tool/           # 内置工具（bash/read/edit等）
│   │   ├── mcp/            # MCP 协议客户端
│   │   ├── skill/          # Skill 加载系统
│   │   ├── config/         # 配置加载（优先级合并）
│   │   ├── session/        # 会话管理
│   │   └── plugin/         # 插件系统
│   └── app/                # TUI 前端
├── .opencode/              # 项目级自定义配置目录
│   ├── opencode.jsonc      # 项目配置
│   ├── agent/              # 自定义 Agent 定义（.md）
│   ├── command/            # 自定义 Command（.md）
│   ├── tool/               # 自定义 Tool（.ts）
│   ├── skill/              # 自定义 Skill（SKILL.md）
│   └── glossary/           # 领域词汇表
└── ~/.config/opencode/     # 全局用户配置
    └── opencode.jsonc
```

### 配置优先级（低 → 高）

```
远程 .well-known/opencode
  → 全局配置 (~/.config/opencode/opencode.jsonc)
    → 项目配置 (opencode.jsonc)
      → .opencode/ 目录配置
        → 环境变量 OPENCODE_CONFIG_CONTENT（最高优先级）
```

---

## 2. 配置文件体系

### 全局配置（对所有项目生效）

位置：`~/.config/opencode/opencode.jsonc`（Windows: `%APPDATA%\opencode\opencode.jsonc`）

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  // 默认模型
  "model": "ollama/qwen2.5-coder:7b",
  // 小任务模型（标题生成等）
  "small_model": "ollama/qwen2.5:3b",
  "provider": {
    // 自定义 provider 配置
  },
  "mcp": {
    // MCP 服务配置
  }
}
```

### 项目配置（仅对当前项目生效）

位置：项目根目录 `opencode.jsonc` 或 `.opencode/opencode.jsonc`

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "model": "ollama/qwen2.5-coder:14b",
  "agent": {
    "my-agent": {
      "description": "我的自定义 Agent",
      "mode": "primary"
    }
  },
  "permission": {
    "bash": "allow",
    "edit": "allow"
  }
}
```

---

## 3. 自定义大模型 Provider

opencode 使用 [Vercel AI SDK](https://sdk.vercel.ai/) 的 Provider 体系，内置支持以下 SDK：

| SDK 包名 | 对应服务 |
|---|---|
| `@ai-sdk/openai` | OpenAI、OpenAI 兼容接口 |
| `@ai-sdk/openai-compatible` | 任意 OpenAI 兼容接口 |
| `@ai-sdk/anthropic` | Anthropic Claude |
| `@ai-sdk/google` | Google Gemini |
| `@ai-sdk/mistral` | Mistral AI |
| `@openrouter/ai-sdk-provider` | OpenRouter 聚合 |

### 通过配置添加自定义 Provider

在 `opencode.jsonc` 中，`provider` 字段支持覆盖或新增任意 Provider：

```jsonc
{
  "provider": {
    "my-openai-compatible": {
      "name": "My Custom LLM",
      "api": "@ai-sdk/openai-compatible",
      "options": {
        "baseURL": "http://localhost:8000/v1",
        "apiKey": "sk-your-key-or-none"
      },
      "models": {
        "my-model-7b": {
          "name": "My Model 7B",
          "context_window": 32768,
          "attachment": {
            "image": false
          }
        }
      }
    }
  }
}
```

使用时在 model 字段填写 `my-openai-compatible/my-model-7b`。

---

## 4. 连接 Ollama 本地模型

### 前置条件

确保 Ollama 已运行：

```bash
ollama serve
ollama pull qwen2.5-coder:7b
```

### 方式一：使用内置 ollama Provider（推荐）

opencode 内置了 ollama provider，直接在配置中指定即可：

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "model": "ollama/qwen2.5-coder:7b",
  "provider": {
    "ollama": {
      "options": {
        "baseURL": "http://127.0.0.1:11434/api"
      }
    }
  }
}
```

### 方式二：通过 OpenAI 兼容接口连接

Ollama 同时提供 OpenAI 兼容的 `/v1` 接口：

```jsonc
{
  "provider": {
    "ollama": {
      "name": "Ollama",
      "api": "@ai-sdk/openai-compatible",
      "options": {
        "baseURL": "http://127.0.0.1:11434/v1",
        "apiKey": "ollama"
      },
      "models": {
        "qwen2.5-coder:7b": {
          "name": "Qwen2.5-Coder 7B",
          "context_window": 32768
        },
        "qwen2.5-coder:14b": {
          "name": "Qwen2.5-Coder 14B",
          "context_window": 131072
        },
        "llama3.2:3b": {
          "name": "Llama 3.2 3B",
          "context_window": 131072
        }
      }
    }
  },
  "model": "ollama/qwen2.5-coder:14b"
}
```

### 设置认证

Ollama 默认无需 API Key，但如果加了认证：

```bash
# 通过环境变量设置
export OLLAMA_API_KEY=your-key
```

或在配置中：

```jsonc
{
  "provider": {
    "ollama": {
      "options": {
        "apiKey": "your-key"
      }
    }
  }
}
```

---

## 5. 连接 vLLM 推理服务

vLLM 提供 OpenAI 兼容接口，配置方式与 Ollama 类似。

### 启动 vLLM

```bash
python -m vllm.entrypoints.openai.api_server \
  --model Qwen/Qwen2.5-Coder-7B-Instruct \
  --host 0.0.0.0 \
  --port 8000 \
  --served-model-name qwen2.5-coder-7b
```

### opencode 配置

```jsonc
{
  "provider": {
    "vllm": {
      "name": "vLLM Local",
      "api": "@ai-sdk/openai-compatible",
      "options": {
        "baseURL": "http://localhost:8000/v1",
        "apiKey": "token-abc123",
        "timeout": 600000
      },
      "models": {
        "qwen2.5-coder-7b": {
          "name": "Qwen2.5-Coder-7B-Instruct",
          "context_window": 32768,
          "attachment": {
            "image": false
          }
        },
        "qwen2.5-coder-72b": {
          "name": "Qwen2.5-Coder-72B-Instruct",
          "context_window": 131072
        }
      }
    }
  },
  "model": "vllm/qwen2.5-coder-7b"
}
```

### 支持视觉模型（多模态）

```jsonc
{
  "provider": {
    "vllm": {
      "models": {
        "llava-7b": {
          "name": "LLaVA 7B",
          "context_window": 4096,
          "attachment": {
            "image": true
          }
        }
      }
    }
  }
}
```

---

## 6. 连接国内大模型

### 通义千问（阿里云）

```jsonc
{
  "provider": {
    "qwen": {
      "name": "通义千问",
      "api": "@ai-sdk/openai-compatible",
      "options": {
        "baseURL": "https://dashscope.aliyuncs.com/compatible-mode/v1",
        "apiKey": "sk-your-dashscope-key"
      },
      "models": {
        "qwen-max": {
          "name": "通义千问-Max",
          "context_window": 32768
        },
        "qwen-plus": {
          "name": "通义千问-Plus",
          "context_window": 131072
        },
        "qwen-turbo": {
          "name": "通义千问-Turbo",
          "context_window": 1000000
        }
      }
    }
  },
  "model": "qwen/qwen-max"
}
```

### 智谱 GLM

```jsonc
{
  "provider": {
    "zhipu": {
      "name": "智谱AI",
      "api": "@ai-sdk/openai-compatible",
      "options": {
        "baseURL": "https://open.bigmodel.cn/api/paas/v4",
        "apiKey": "your-zhipu-key"
      },
      "models": {
        "glm-4-plus": {
          "name": "GLM-4-Plus",
          "context_window": 128000
        },
        "glm-4-flash": {
          "name": "GLM-4-Flash（免费）",
          "context_window": 128000
        }
      }
    }
  }
}
```

### Kimi（月之暗面）

```jsonc
{
  "provider": {
    "kimi": {
      "name": "Kimi",
      "api": "@ai-sdk/openai-compatible",
      "options": {
        "baseURL": "https://api.moonshot.cn/v1",
        "apiKey": "sk-your-moonshot-key"
      },
      "models": {
        "moonshot-v1-128k": {
          "name": "Moonshot 128K",
          "context_window": 128000
        },
        "moonshot-v1-8k": {
          "name": "Moonshot 8K",
          "context_window": 8192
        }
      }
    }
  }
}
```

### DeepSeek

```jsonc
{
  "provider": {
    "deepseek": {
      "name": "DeepSeek",
      "api": "@ai-sdk/openai-compatible",
      "options": {
        "baseURL": "https://api.deepseek.com/v1",
        "apiKey": "sk-your-deepseek-key"
      },
      "models": {
        "deepseek-chat": {
          "name": "DeepSeek Chat",
          "context_window": 65536
        },
        "deepseek-reasoner": {
          "name": "DeepSeek R1",
          "context_window": 65536
        }
      }
    }
  }
}
```

---

## 7. 自定义 Agent

Agent 是 opencode 的核心执行单元，分为两种模式：

- **`primary`**：主 Agent，可由用户直接选择使用
- **`subagent`**：子 Agent，由主 Agent 调用（通过 `task` 工具并行执行）

### Agent 定义方式

#### 方式一：在 `.opencode/agent/` 目录下创建 `.md` 文件（推荐）

文件路径：`.opencode/agent/<agent-name>.md`

```markdown
---
description: 这个 Agent 做什么，何时使用它
mode: primary
# 可选字段
model: ollama/qwen2.5-coder:14b
temperature: 0.3
color: "#44BA81"
steps: 50
permission:
  bash: allow
  edit: allow
  read: allow
---

你是一个...（系统提示词）

## 你的职责

- 职责一
- 职责二

## 工作流程

1. 步骤一
2. 步骤二
```

#### 方式二：在 `opencode.jsonc` 中配置

```jsonc
{
  "agent": {
    "my-agent": {
      "description": "我的专属 Agent，用于...",
      "mode": "primary",
      "model": "ollama/qwen2.5-coder:14b",
      "temperature": 0.3,
      "color": "#FF6B35",
      "steps": 100,
      "permission": {
        "bash": "allow",
        "edit": "allow"
      }
    }
  }
}
```

### Agent frontmatter 字段说明

| 字段 | 类型 | 说明 |
|---|---|---|
| `description` | string | Agent 描述，显示在选择列表中 |
| `mode` | `primary`\|`subagent`\|`all` | 主/子 Agent 模式 |
| `model` | string | 指定使用的模型（格式：`provider/model`）|
| `temperature` | number | 温度参数（0-1）|
| `top_p` | number | Top-P 参数 |
| `color` | string | 十六进制颜色码，如 `#FF5733` |
| `steps` | number | 最大迭代步数 |
| `hidden` | boolean | 是否在 `@` 自动补全中隐藏（仅 subagent 有效）|
| `permission` | object | 权限规则（见权限系统章节）|
| `tools` | object | `@deprecated`，改用 `permission` |

### 多 Agent 协作示例

主 Agent 通过 `task` 工具调用子 Agent 并行执行：

```markdown
---
description: 总调度 Agent，负责任务分解和协调
mode: primary
steps: 200
---

你是总调度员，收到用户请求后，将任务分解并并行分发给子 Agent。

可用子 Agent：
- @scenario-designer：负责想定设计
- @sim-executor：负责仿真执行  
- @evaluator：负责结果评估

请按以下流程工作：
1. 理解用户意图
2. 使用 task 工具并行调用相关子 Agent
3. 汇总结果并输出最终报告
```

---

## 8. 自定义 Skill（技能库）

Skill 是可复用的知识片段，注入到 Agent 的上下文中，类似「参考文档」。

### 创建 Skill

Skill 文件必须命名为 `SKILL.md`，放置在对应目录下：

**目录结构：**
```
.opencode/
  skill/
    military-tactics/
      SKILL.md        ← Skill 文件
    weapon-database/
      SKILL.md
```

**Skill 文件格式（`SKILL.md`）：**

```markdown
---
name: military-tactics
description: 军事战术知识库，包含常见战术原则和作战规则
---

## 基本战术原则

### 集中兵力原则
在关键时间和地点集中优势兵力，形成局部优势...

### 运动战原则
通过机动获得有利位置，避免正面消耗...

## 常用作战代号

- 红方：己方作战单元
- 蓝方：对抗方作战单元
- LD：出发线（Line of Departure）
- PL：相位线（Phase Line）
```

### 在配置中添加额外的 Skill 路径

```jsonc
{
  "skills": {
    "paths": [
      "./my-skills",
      "~/shared-skills"
    ],
    "urls": [
      "https://example.com/.well-known/skills/"
    ]
  }
}
```

### Skill 搜索路径（按优先级）

1. `~/.claude/skills/` 或 `~/.agents/skills/`（全局）
2. 项目中的 `.claude/skills/` 或 `.agents/skills/`
3. `.opencode/skill/` 或 `.opencode/skills/`
4. `opencode.jsonc` 中 `skills.paths` 指定的路径

---

## 9. 自定义 Tool（工具）

Tool 让 Agent 能够执行具体操作，如调用 API、读写文件、执行命令等。

### 创建 Tool

在 `.opencode/tool/` 目录下创建 `.ts` 文件：

**文件结构：**
```
.opencode/
  tool/
    my-tool.ts          ← Tool 实现
    my-tool.txt         ← Tool 描述（可选，也可在 ts 中写）
```

### Tool 示例 1：HTTP API 调用

```typescript
/// <reference path="../env.d.ts" />
import { tool } from "@opencode-ai/plugin"

export default tool({
  description: "调用仿真引擎执行军事仿真，返回仿真结果",
  args: {
    scenario: tool.schema
      .string()
      .describe("想定配置 JSON 字符串"),
    duration: tool.schema
      .number()
      .describe("仿真时长（秒）")
      .default(3600),
    mode: tool.schema
      .enum(["fast", "realtime", "batch"])
      .describe("仿真模式")
      .default("fast"),
  },
  async execute(args) {
    const resp = await fetch("http://localhost:8080/api/simulate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scenario: JSON.parse(args.scenario),
        duration: args.duration,
        mode: args.mode,
      }),
    })
    if (!resp.ok) throw new Error(`仿真失败: ${resp.status} ${resp.statusText}`)
    const result = await resp.json()
    return JSON.stringify(result, null, 2)
  },
})
```

### Tool 示例 2：执行本地命令

```typescript
import { tool } from "@opencode-ai/plugin"
import { $ } from "bun"

export default tool({
  description: "查询武器装备数据库",
  args: {
    query: tool.schema.string().describe("查询关键词"),
    type: tool.schema
      .enum(["tank", "aircraft", "ship", "missile"])
      .describe("装备类型")
      .optional(),
  },
  async execute({ query, type }) {
    const filter = type ? `--type ${type}` : ""
    const result = await $`weapon-db query ${filter} "${query}"`.text()
    return result
  },
})
```

### Tool 示例 3：读取本地数据库

```typescript
import { tool } from "@opencode-ai/plugin"
import { Database } from "bun:sqlite"

export default tool({
  description: "从本地想定数据库检索历史想定模板",
  args: {
    keywords: tool.schema.string().describe("搜索关键词"),
    limit: tool.schema.number().default(5).describe("返回数量"),
  },
  async execute({ keywords, limit }) {
    const db = new Database("/data/scenarios.db")
    const rows = db
      .prepare("SELECT * FROM scenarios WHERE name LIKE ? LIMIT ?")
      .all(`%${keywords}%`, limit)
    db.close()
    if (rows.length === 0) return "未找到相关想定模板"
    return JSON.stringify(rows, null, 2)
  },
})
```

### 在 Agent 中启用/禁用 Tool

在 Agent 的 frontmatter 中控制 Tool 权限：

```markdown
---
description: 仿真执行 Agent
mode: subagent
permission:
  bash: deny
  read: allow
  sim-executor: allow
  weapon-db: allow
---
```

或在 `opencode.jsonc` 中全局控制：

```jsonc
{
  "tools": {
    "sim-executor": true,
    "weapon-db": true,
    "github-triage": false
  }
}
```

---

## 10. 自定义 Command（命令）

Command 是预设的提示词模板，用户可通过 `Ctrl+P` 快速调用。

### 创建 Command

在 `.opencode/command/` 目录下创建 `.md` 文件：

**文件：`.opencode/command/run-sim.md`**

```markdown
---
description: 运行军事仿真并生成评估报告
agent: sim-commander
model: ollama/qwen2.5-coder:14b
subtask: true
---

请根据以下需求执行军事仿真：

## 用户需求
{{user_input}}

## 当前战场态势
!`cat ./scenarios/current.json`

## 执行流程
1. 解析用户意图，设计想定方案
2. 调用仿真引擎执行仿真
3. 分析仿真结果，生成评估报告
4. 提出改进建议
```

### Command frontmatter 字段说明

| 字段 | 说明 |
|---|---|
| `description` | 在命令列表中显示的描述 |
| `agent` | 指定使用的 Agent |
| `model` | 指定使用的模型 |
| `subtask` | `true` 时在子任务中执行 |

### 在 Command 中使用动态内容

```markdown
---
description: 提交代码并写 commit message
---

## 当前变更

!`git diff --cached`

!`git status --short`

请根据以上变更生成规范的 commit message，格式：
<type>(<scope>): <description>
```

`!\`command\`` 语法会在发送给模型前执行 shell 命令并插入输出结果。

---

## 11. 接入 MCP 服务

MCP（Model Context Protocol）允许通过标准协议连接外部工具和数据源。

### 本地进程型 MCP（stdio）

```jsonc
{
  "mcp": {
    "filesystem": {
      "type": "local",
      "command": ["npx", "-y", "@modelcontextprotocol/server-filesystem", "/data"],
      "environment": {
        "NODE_ENV": "production"
      },
      "timeout": 10000
    },
    "military-db": {
      "type": "local",
      "command": ["python", "-m", "my_mcp_server", "--db", "/data/military.db"],
      "environment": {
        "DB_PASSWORD": "secret"
      }
    }
  }
}
```

### 远程 HTTP MCP

```jsonc
{
  "mcp": {
    "sim-engine": {
      "type": "remote",
      "url": "http://localhost:9000/mcp",
      "headers": {
        "Authorization": "Bearer your-token"
      },
      "timeout": 30000
    },
    "map-service": {
      "type": "remote",
      "url": "https://map-api.example.com/mcp",
      "oauth": false
    }
  }
}
```

### 实现自己的 MCP Server（Python 示例）

```python
# my_mcp_server.py
from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp import types
import asyncio
import json

app = Server("military-sim-server")

@app.list_tools()
async def list_tools() -> list[types.Tool]:
    return [
        types.Tool(
            name="run_simulation",
            description="执行军事仿真，返回仿真结果",
            inputSchema={
                "type": "object",
                "properties": {
                    "scenario": {"type": "string", "description": "想定JSON"},
                    "duration": {"type": "number", "description": "时长（秒）"}
                },
                "required": ["scenario"]
            }
        ),
        types.Tool(
            name="get_scenario_template",
            description="获取想定模板",
            inputSchema={
                "type": "object",
                "properties": {
                    "type": {"type": "string", "enum": ["ground", "air", "naval"]}
                }
            }
        )
    ]

@app.call_tool()
async def call_tool(name: str, arguments: dict) -> list[types.TextContent]:
    if name == "run_simulation":
        # 调用实际仿真引擎
        result = await run_sim_engine(arguments["scenario"], arguments.get("duration", 3600))
        return [types.TextContent(type="text", text=json.dumps(result))]
    
    if name == "get_scenario_template":
        template = load_template(arguments.get("type", "ground"))
        return [types.TextContent(type="text", text=json.dumps(template))]
    
    raise ValueError(f"Unknown tool: {name}")

async def main():
    async with stdio_server() as (read, write):
        await app.run(read, write, app.create_initialization_options())

if __name__ == "__main__":
    asyncio.run(main())
```

在配置中注册：

```jsonc
{
  "mcp": {
    "military-sim": {
      "type": "local",
      "command": ["python", "./mcp-servers/my_mcp_server.py"],
      "enabled": true
    }
  }
}
```

---

## 12. 权限系统

opencode 有精细的权限控制，防止 Agent 执行危险操作。

### 权限类型

| 权限名 | 说明 |
|---|---|
| `read` | 读取文件 |
| `edit` | 编辑/创建文件 |
| `bash` | 执行 Shell 命令 |
| `glob` | 文件路径模式匹配 |
| `grep` | 搜索文件内容 |
| `list` | 列出目录 |
| `webfetch` | 访问网页 |
| `websearch` | 网络搜索 |
| `question` | 向用户提问 |
| `external_directory` | 访问项目外部目录 |
| `doom_loop` | 防止无限循环检测 |

### 权限值

- `"allow"` — 自动允许
- `"deny"` — 拒绝
- `"ask"` — 每次询问用户

### 在全局配置中设置权限

```jsonc
{
  "permission": {
    "bash": "ask",
    "edit": "allow",
    "read": {
      "*": "allow",
      "*.env": "ask",
      "*.key": "deny"
    },
    "external_directory": {
      "*": "deny",
      "/data/scenarios/*": "allow"
    }
  }
}
```

### 在 Agent 中精细控制权限

```markdown
---
description: 只读分析 Agent，不允许修改任何文件
mode: primary
permission:
  read: allow
  glob: allow
  grep: allow
  list: allow
  edit: deny
  bash: deny
  webfetch: deny
---
```

---

## 13. Plugin 插件开发

Plugin 是更高级的扩展机制，可以 hook 到 opencode 的核心流程。

### 创建 Plugin

在 `.opencode/plugin/` 目录下创建 `.ts` 文件：

```typescript
// .opencode/plugin/my-plugin.ts
import { plugin } from "@opencode-ai/plugin"

export default plugin({
  // Hook: 在发送给模型之前修改系统提示
  async "experimental.chat.system.transform"(ctx, next) {
    ctx.system.push("## 额外指令\n你是军事领域专家，回答时请使用专业军事术语。")
    return next(ctx)
  },
})
```

### 在配置中加载 Plugin

```jsonc
{
  "plugin": [
    "./plugin/my-plugin.ts"
  ]
}
```

或者发布为 npm 包后：

```jsonc
{
  "plugin": [
    "my-opencode-plugin@1.0.0"
  ]
}
```

---

## 14. 实战示例：军事仿真 Agent

以下是一个完整的军事仿真 Agent 系统示例，实现「一句话 → 想定设计 → 仿真执行 → 评估报告」。

### 目录结构

```
.opencode/
  opencode.jsonc              # 项目配置
  agent/
    sim-commander.md          # 主指挥 Agent
    scenario-designer.md      # 想定设计子 Agent
    sim-executor.md           # 仿真执行子 Agent
    evaluator.md              # 评估分析子 Agent
  skill/
    military-doctrine/
      SKILL.md                # 军事条令知识
    weapon-data/
      SKILL.md                # 武器装备数据
  tool/
    run-simulation.ts         # 仿真引擎接口
    query-weapon-db.ts        # 武器数据库查询
    generate-map.ts           # 战场态势图生成
  command/
    quick-sim.md              # 快速仿真命令
```

### `opencode.jsonc`

> 引入第 16 节推荐的插件后，配置新增 `plugin` 字段：

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "model": "ollama/qwen2.5-coder:14b",
  "small_model": "ollama/qwen2.5:3b",
  "default_agent": "sim-commander",
  "provider": {
    "ollama": {
      "api": "@ai-sdk/openai-compatible",
      "options": {
        "baseURL": "http://127.0.0.1:11434/v1",
        "apiKey": "ollama"
      },
      "models": {
        "qwen2.5-coder:14b": {
          "name": "Qwen2.5-Coder 14B",
          "context_window": 131072
        }
      }
    }
  },
  "mcp": {
    "sim-engine": {
      "type": "local",
      "command": ["python", "./mcp-servers/sim_server.py"],
      "enabled": true
    }
  },
  "permission": {
    "bash": "allow",
    "edit": "allow",
    "read": "allow"
  },
  "plugin": [
    // 仿真进程控制：非阻塞启动仿真引擎，防止 TTY 卡死
    "opencode-pty",
    "opencode-shell-strategy",
    // 多 Agent 编排：后台异步运行仿真子 Agent
    "oh-my-opencode",
    "opencode-background-agents",
    // 长时任务通知：仿真完成/出错时推送桌面通知
    "opencode-notify",
    // 跨会话记忆：积累历次仿真参数调优经验
    "opencode-supermemory",
    // Token 优化：裁剪仿真日志冗余输出
    "opencode-dynamic-context-pruning"
  ]
}
```

### `agent/sim-commander.md`（主指挥 Agent）

```markdown
---
description: 军事仿真总指挥，接收自然语言需求，协调各子Agent完成仿真全流程
mode: primary
model: ollama/qwen2.5-coder:14b
temperature: 0.3
color: "#C0392B"
steps: 200
permission:
  bash: allow
  edit: allow
  read: allow
---

你是军事仿真系统的总指挥官 Agent。

## 职责

接收用户的自然语言需求，将其分解为仿真任务，协调子 Agent 完成完整的仿真流程。

## 标准工作流程

1. **解析意图**：理解用户描述的作战场景和目标
2. **并行执行**：使用 task 工具同时调用以下子 Agent：
   - `@scenario-designer`：根据意图设计想定方案
3. **仿真执行**：想定确认后，调用 `@sim-executor` 执行仿真
4. **结果评估**：调用 `@evaluator` 分析仿真结果
5. **汇总报告**：整合所有结果，生成最终作战评估报告

## 输出格式

最终报告应包含：
- 想定概要
- 仿真结果摘要
- 红蓝双方战损统计
- 任务完成评估
- 改进建议
```

### `agent/scenario-designer.md`（想定设计子 Agent）

```markdown
---
description: 军事想定设计专家，将自然语言转化为结构化想定配置
mode: subagent
temperature: 0.5
color: "#2980B9"
permission:
  read: allow
  edit: allow
  bash: deny
---

你是一名专业的军事想定设计师。

## 职责

将用户的作战意图转化为标准化的仿真想定（JSON格式）。

## 输出的想定 JSON 结构

​```json
{
  "scenario_id": "唯一标识符",
  "name": "想定名称",
  "description": "想定描述",
  "terrain": {
    "type": "plain|mountain|urban|coastal",
    "area_km2": 100,
    "weather": "clear|rain|fog|night"
  },
  "red_force": {
    "units": [
      {
        "id": "R001",
        "type": "infantry|armor|artillery|aviation",
        "count": 100,
        "position": {"x": 0, "y": 0},
        "mission": "attack|defend|support"
      }
    ]
  },
  "blue_force": { "units": [] },
  "duration_hours": 6,
  "objectives": ["目标一", "目标二"]
}
```

设计时需遵循军事仿真标准，确保兵力比例合理（一般进攻方需3:1优势）。
```

### `tool/run-simulation.ts`

​```typescript
/// <reference path="../env.d.ts" />
import { tool } from "@opencode-ai/plugin"

export default tool({
  description: "提交想定配置到仿真引擎执行，返回仿真结果。在调用前确保想定 JSON 格式正确。",
  args: {
    scenario_json: tool.schema
      .string()
      .describe("标准想定 JSON 字符串"),
    speed_factor: tool.schema
      .number()
      .min(1)
      .max(100)
      .default(10)
      .describe("仿真速度倍率，1=实时，100=最快"),
  },
  async execute({ scenario_json, speed_factor }) {
    const scenario = JSON.parse(scenario_json)
    
    const resp = await fetch(`${process.env.SIM_ENGINE_URL ?? "http://localhost:8080"}/api/v1/simulate`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "X-API-Key": process.env.SIM_API_KEY ?? ""
      },
      body: JSON.stringify({ scenario, speed_factor }),
      signal: AbortSignal.timeout(300_000), // 5分钟超时
    })
    
    if (!resp.ok) {
      const err = await resp.text()
      throw new Error(`仿真引擎错误 [${resp.status}]: ${err}`)
    }
    
    const result = await resp.json()
    return [
      `## 仿真完成`,
      `- 仿真时长: ${result.simulated_hours}小时`,
      `- 红方战损: ${result.red_casualties}人`,
      `- 蓝方战损: ${result.blue_casualties}人`,
      `- 目标达成率: ${(result.objective_rate * 100).toFixed(1)}%`,
      ``,
      `### 详细数据`,
      `\`\`\`json`,
      JSON.stringify(result.details, null, 2),
      `\`\`\``,
    ].join("\n")
  },
})
```

### `command/quick-sim.md`（快速仿真命令）

> 引入插件后可以补充 `@openspoon/subtask2` 的重试逻辑：若仿真失败自动调整参数重试。

```markdown
---
description: 快速启动军事仿真（Ctrl+P → quick-sim）
agent: sim-commander
subtask: false
---

请执行以下军事仿真任务：

{{input}}

请按标准流程完成：想定设计 → 仿真执行 → 评估报告。
最后输出一份简洁的战效评估报告。
```

### 插件带来的工作流升级

引入第 16 节推荐的插件后，14 节的军事仿真 Agent 工作流从**同步阻塞**升级为**异步并发**：

```
原工作流（无插件）
  用户输入 → sim-commander → scenario-designer → 等待...
                                               → sim-executor(5分钟阻塞) → 等待...
                                                                         → evaluator → 输出报告

升级后（引入插件）
  用户输入 → sim-commander
               ├── scenario-designer（oh-my-opencode 并行）
               └── 用户可继续其他对话（opencode-background-agents 异步）
  [后台]   → sim-executor 非阻塞运行（opencode-pty）
  [完成]   → 桌面推送通知（opencode-notify）
  [会话2]  → evaluator 分析结果，积累经验到记忆（opencode-supermemory）
```

---

## 附录：常用环境变量

| 变量名 | 说明 |
|---|---|
| `OPENCODE_CONFIG` | 指定自定义配置文件路径 |
| `OPENCODE_CONFIG_DIR` | 指定 `.opencode` 目录路径 |
| `OPENCODE_CONFIG_CONTENT` | 直接传入 JSON 配置内容（最高优先级）|
| `OPENCODE_PERMISSION` | 覆盖权限配置（JSON格式）|
| `OPENCODE_DISABLE_PROJECT_CONFIG` | 禁用项目级配置 |
| `OPENCODE_DISABLE_EXTERNAL_SKILLS` | 禁用外部 Skill 扫描 |

## 附录：快捷键参考

| 快捷键 | 功能 |
|---|---|
| `Ctrl+P` | 打开命令列表 |
| `Leader+A`（默认 `Ctrl+X A`）| 切换 Agent |
| `Leader+M` | 切换模型 |
| `Tab` | 切换到下一个 Agent |
| `@<名称>` | 在输入框中调用子 Agent 或 Skill |

---

## 15. 实战示例：仿真数据可视化 Agent（对接 Java Web 工具）

### 需求背景

你已有一套 **Java Web 仿真数据管理工具**，连接数据库、生成柱状图等可视化视图。  
目标：用户用自然语言描述需求，opencode 自动驱动 Java Web 工具生成图表，并**在 opencode 页面实时查看**。

### 有了 `opencode-browser` 插件后的架构升级

**原方案**：Agent 只能调用 REST API 生成图表 URL，用户手动开浏览器查看

**升级后**：Agent 直接控制浏览器内的 Java Web 工具 UI，**全程自动操作 + 截图内嵌回传**

```
原方案（无插件）
  用户输入
    ↓
  viz-agent
    ├─ query-table Tool  → 调 Java REST API 获取表列表
    ├─ generate-chart Tool → 调 Java REST API 生成图表 → 返回 URL
    └─ 返回 URL，用户自己开浏览器看

升级后（引入 opencode-browser）
  用户输入
    ↓
  viz-agent
    ├─ browser_navigate   → 打开 Java Web 工具页面
    ├─ browser_click      → 点击「选择数据表」
    ├─ browser_select     → 选择目标表
    ├─ browser_click      → 点击「生成图表」
    └─ browser_screenshot → 截图内嵌到对话，不需离开 opencode
```

### 技术可行性分析

| 能力需求 | 方案 | 支持情况 |
|---|---|---|
| 调用 Java Web REST API | 自定义 Tool | ✅ 完全支持 |
| 直接操作 Java Web UI | `opencode-browser` 插件 | ✅ **新增，推荐** |
| 图表截图内嵌对话 | `browser_screenshot` | ✅ **新增，不选下 opencode** |
| SPA 页面（Vue/React）图表读取 | `browser_query` | ✅ **新增，解决 SPA 限制** |
| 生成独立 HTML 图表 | 自定义 Tool | ✅ 适合快速验证 |

### 第一步：给 Java Web 工具添加 REST API

opencode Tool 通过 HTTP 调用你的 Java 工具，需要暴露以下接口：

```java
// Spring Boot 示例
@RestController
@RequestMapping("/api/viz")
public class VizController {

    // 1. 获取可用数据表列表
    @GetMapping("/tables")
    public List<String> getTables() {
        return tableService.getAllTableNames();
    }

    // 2. 获取表字段信息
    @GetMapping("/tables/{tableName}/columns")
    public List<ColumnInfo> getColumns(@PathVariable String tableName) {
        return tableService.getColumns(tableName);
    }

    // 3. 生成图表（核心接口）
    @PostMapping("/chart")
    public ChartResult generateChart(@RequestBody ChartRequest req) {
        // req: { tableName, chartType, xColumn, yColumn, filter, title }
        String viewUrl = chartService.generate(req);
        return new ChartResult(viewUrl, req.getTitle());
    }

    // 4. 查询表数据预览
    @GetMapping("/tables/{tableName}/preview")
    public TableData preview(
        @PathVariable String tableName,
        @RequestParam(defaultValue = "10") int limit) {
        return tableService.preview(tableName, limit);
    }
}
```

同时确保允许 CORS（opencode Tool 从本地调用）：

```java
@Configuration
public class CorsConfig implements WebMvcConfigurer {
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**").allowedOrigins("*");
    }
}
```

### 第二步：创建 opencode Tool

**`.opencode/tool/query-table.ts`** — 查询可用表和字段：

```typescript
/// <reference path="../env.d.ts" />
import { tool } from "@opencode-ai/plugin"

const BASE = process.env.VIZ_API_URL ?? "http://localhost:8080"

export default tool({
  description: "查询仿真数据管理工具中的可用数据表列表及字段信息，在生成图表前先调用此工具了解数据结构",
  args: {
    tableName: tool.schema
      .string()
      .optional()
      .describe("表名，不传则返回所有表列表，传入则返回该表的字段信息"),
  },
  async execute({ tableName }) {
    if (!tableName) {
      const tables = await fetch(`${BASE}/api/viz/tables`).then(r => r.json())
      return `可用数据表：\n${(tables as string[]).map(t => `- ${t}`).join("\n")}`
    }
    const cols = await fetch(`${BASE}/api/viz/tables/${tableName}/columns`).then(r => r.json())
    const preview = await fetch(`${BASE}/api/viz/tables/${tableName}/preview?limit=5`).then(r => r.json())
    return [
      `## 表 ${tableName} 字段信息`,
      ...(cols as any[]).map((c: any) => `- ${c.name} (${c.type}): ${c.comment ?? ""}`),
      ``,
      `## 数据预览（前5行）`,
      JSON.stringify(preview, null, 2),
    ].join("\n")
  },
})
```

**`.opencode/tool/generate-chart.ts`** — 生成图表并返回访问链接：

```typescript
/// <reference path="../env.d.ts" />
import { tool } from "@opencode-ai/plugin"

const BASE = process.env.VIZ_API_URL ?? "http://localhost:8080"

export default tool({
  description: "调用仿真数据管理工具生成可视化图表。返回图表的访问 URL 和嵌入代码，用户可直接在浏览器查看。",
  args: {
    tableName: tool.schema.string().describe("数据来源表名"),
    chartType: tool.schema
      .enum(["bar", "line", "pie", "scatter", "area", "radar"])
      .describe("图表类型：bar=柱状图, line=折线图, pie=饼图, scatter=散点图, area=面积图, radar=雷达图"),
    xColumn: tool.schema.string().describe("X轴字段名（类目轴）"),
    yColumn: tool.schema.string().describe("Y轴字段名（数值轴），多个字段用逗号分隔"),
    title: tool.schema.string().optional().describe("图表标题"),
    filter: tool.schema.string().optional().describe("SQL WHERE 条件，如 'status=\'completed\' AND score>80'"),
    limit: tool.schema.number().optional().default(1000).describe("最大数据条数"),
  },
  async execute(args) {
    const resp = await fetch(`${BASE}/api/viz/chart`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(args),
    })
    if (!resp.ok) throw new Error(`生成图表失败: ${resp.status} ${await resp.text()}`)
    const result = await resp.json() as { url: string; title: string; embedUrl: string }

    // 同时抓取页面内容让 Agent 能感知图表结构
    const page = await fetch(result.url).then(r => r.text()).catch(() => "")

    return [
      `## 图表已生成 ✓`,
      ``,
      `**标题**: ${result.title}`,
      `**访问地址**: ${result.url}`,
      ``,
      `> 在浏览器打开以上地址即可查看图表`,
      `> 或在 opencode 中用 webfetch 工具读取页面内容`,
      page ? `\n图表页面已就绪，包含 ${page.length} 字节内容` : "",
    ].join("\n")
  },
})
```

**`.opencode/tool/screenshot-chart.ts`** — 截图查看（可选，需安装 puppeteer）：

```typescript
/// <reference path="../env.d.ts" />
import { tool } from "@opencode-ai/plugin"
import { $ } from "bun"
import path from "path"
import os from "os"

export default tool({
  description: "对仿真数据图表页面截图，以图片形式展示在 opencode 对话中。需要已安装 puppeteer。",
  args: {
    url: tool.schema.string().describe("要截图的页面 URL"),
    width: tool.schema.number().default(1280).describe("截图宽度"),
    height: tool.schema.number().default(720).describe("截图高度"),
  },
  async execute({ url, width, height }) {
    const out = path.join(os.tmpdir(), `chart-${Date.now()}.png`)
    // 使用 puppeteer 命令行截图
    await $`npx puppeteer-cli screenshot --url ${url} --output ${out} --width ${width} --height ${height}`
    const data = await Bun.file(out).arrayBuffer()
    const b64 = Buffer.from(data).toString("base64")
    return {
      output: `图表截图已生成: ${out}`,
      metadata: {},
      attachments: [{
        type: "file",
        mime: "image/png",
        url: `data:image/png;base64,${b64}`,
      }],
    }
  },
})
```

### 第三步：创建可视化 Agent

**`.opencode/agent/viz-agent.md`**：

```markdown
---
description: 仿真数据可视化专家，根据用户自然语言自动连接数据表生成图表，并内嵌截图展示
mode: primary
color: "#8E44AD"
temperature: 0.2
steps: 50
permission:
  webfetch: allow
  bash: deny
  edit: deny
---

你是仿真数据可视化专家，能根据用户的自然语言描述，自动查询数据库表结构并生成相应的可视化图表。

## 工作流程（优先使用浏览器控制）

### 方案 A：直接操作 Java Web 工具 UI（推荐，需已安装 opencode-browser）

1. **打开工具页面**：`browser_navigate` 打开 Java Web 工具
2. **探索界面**：`browser_snapshot` 查看页面元素结构
3. **操作 UI**：依次点击选择表、配置图表类型、点击生成
4. **截图内嵌**：`browser_screenshot` 将图表截图直接显示在对话中

### 方案 B：调用 REST API（备用，当 Java Web 工具未开启时）

1. **理解需求**：解析用户想看什么数据、什么图表类型
2. **探索数据**：使用 query-table 工具查看可用表和字段
3. **生成图表**：使用 generate-chart 工具生成图表
4. **展示结果**：返回图表地址

## 图表类型映射规则

- 比较/对比数据 → 柱状图 (bar)
- 时间序列/趋势 → 折线图 (line)  
- 占比/构成 → 饼图 (pie)
- 两变量关系 → 散点图 (scatter)
- 多维度综合评估 → 雷达图 (radar)
- 累积/变化趋势 → 面积图 (area)

## 回复规范

- 优先使用方案 A，程序自动干一切，截图直接内嵌对话
- 如果 Java Web 工具未开启，提示用户开启后再操作，或切换方案 B
- 生成图表后，解释图表展示了什么信息
- 如果数据不满足需求，主动建议调整
```

### 第四步：配置环境变量（Plugin 注入）

**`.opencode/plugin/viz-env.ts`**：

```typescript
import { plugin } from "@opencode-ai/plugin"

export default plugin(async () => ({
  async "shell.env"(_input, output) {
    // 统一管理 Java Web 工具的连接地址
    output.env["VIZ_API_URL"] = process.env.VIZ_API_URL ?? "http://localhost:8080"
  },
}))
```

**`.opencode/opencode.jsonc`** 中注册：

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "default_agent": "viz-agent",
  "permission": {
    "webfetch": "allow"
  },
  "plugin": [
    // 自定义环境变量插件
    "./plugin/viz-env.ts",
    // 浏览器自动化：直接控制 Java Web 工具页面
    "@different-ai/opencode-browser",
    // Token 优化
    "opencode-dynamic-context-pruning"
  ]
}
```

### 第五步：实时查看页面的两种方式

#### 方式 A：webfetch 读取页面内容（opencode 内置，推荐）

opencode 的内置 `webfetch` 工具能**直接读取 HTML 页面内容**，并转为 Markdown 展示在对话中。  
图表页面如果是服务端渲染（Spring MVC + Thymeleaf 等），可直接读取到图表数据和描述。

用户在对话中说：
```
用 webfetch 读取一下刚生成的图表页面，看看内容
```

Agent 会自动调用 webfetch 抓取页面，在对话中展示页面的文字内容和结构。

#### 方式 B：截图内嵌展示（需 puppeteer，图表最直观）

安装截图依赖：

```bash
npm install -g puppeteer-cli
# 或
bun add -g puppeteer
```

使用 `screenshot-chart` 工具后，PNG 图片会**直接内嵌在 opencode 对话气泡中**显示（opencode 支持图片附件展示）。

#### 方式 C：生成独立 HTML 图表（无需 Java 后端，纯前端）

如果你的 Java 后端只负责查数据，可以让 Agent 直接生成一个内嵌 ECharts 的 HTML 文件，用浏览器打开：

```typescript
// .opencode/tool/write-chart-html.ts
import { tool } from "@opencode-ai/plugin"
import { $ } from "bun"

export default tool({
  description: "将图表数据生成为独立 HTML 文件（内嵌 ECharts），并自动在浏览器中打开查看",
  args: {
    chartConfig: tool.schema.string().describe("ECharts option 配置 JSON 字符串"),
    title: tool.schema.string().describe("图表标题"),
    filename: tool.schema.string().optional().default("chart").describe("输出文件名（不含扩展名）"),
  },
  async execute({ chartConfig, title, filename }) {
    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>${title}</title>
<script src="https://cdn.jsdelivr.net/npm/echarts@5/dist/echarts.min.js"></script>
</head><body>
<div id="chart" style="width:100%;height:600px"></div>
<script>
var chart = echarts.init(document.getElementById('chart'));
chart.setOption(${chartConfig});
</script></body></html>`
    const file = `./${filename}.html`
    await Bun.write(file, html)
    // Windows 自动打开浏览器
    await $`start ${file}`.nothrow()
    return `图表已生成: ${file}\n已尝试在浏览器中打开，如未自动打开请手动双击该文件`
  },
})
```

### 完整使用示例

安装 `@different-ai/opencode-browser` 插件并启动 Java Web 工具后，选择 `viz-agent`，输入以下对话：

```
用户：
  我想看看 sim_result 表中，各作战单元（unit_type 字段）的平均战损率（loss_rate 字段），
  用柱状图展示，只看 scenario_id='S001' 的数据

Agent（引入插件后自动执行）：
  1. browser_navigate   → 打开 http://localhost:8080/viz
  2. browser_snapshot   → 分析页面元素结构
  3. browser_click      → 点击「选择数据表」
  4. browser_select     → 选择 sim_result
  5. browser_click      → 点击「柱状图」
  6. browser_type       → 输入 X轴：unit_type，Y轴：loss_rate
  7. browser_type       → 输入筛选条件：scenario_id='S001'
  8. browser_click      → 点击「生成」
  9. browser_screenshot → 截图（图片直接内嵌到 opencode 对话中）

Agent 回复：
  [截图图片直接显示在这里]
  
  图表已生成 ✔，展示了想定S001中5类作战单元的战损对比：
  - 装甲部队：23.4%
  - 步兵部队：18.7%
  - ...
  如需进一步分析，请告知。
```

### 进阶：让 Agent 自主分析并生成报告

配置 Command 实现一键分析：

**`.opencode/command/viz-report.md`**：

```markdown
---
description: 自动分析指定想定的仿真数据，生成完整可视化报告
agent: viz-agent
subtask: false
---

请对以下仿真想定进行完整的数据可视化分析：

想定ID：{{input}}

请依次生成以下图表，每张图表生成后截图内嵌到回复中：
1. 红蓝双方兵力随时间变化的折线图
2. 各类型武器战损比较的柱状图
3. 任务目标完成率的饼图
4. 综合战效评估的雷达图

最后汇总输出分析结论。
```

使用：`Ctrl+P` → `viz-report` → 输入想定ID（如 `S001`）→ Enter，Agent 自动批量生成全套图表并内嵌展示。

### 注意事项

- **`opencode-browser` 插件需要预先安装 Chrome 扩展**：运行 `bunx @different-ai/opencode-browser@latest install` 并在 `chrome://extensions` 中加载。
- **Java Web 工具页面需先在浏览器中打开**：Agent 会透过 `browser_navigate` 自动导航到目标页面。
- **SPA 页面次全支持**：`browser_query` 和 `browser_screenshot` 对 Vue/React 渲染的动态页面完全就绪，不存在 webfetch 的 SPA 限制。
- **webfetch 作为备选**：如果 Java Web 工具是 Thymeleaf/JSP 服务端渲染， webfetch 仍可直接读取页面内容。
- **ECharts HTML 方案完全脱离 Java 后端**：Tool 直接查数据库 → 生成 HTML → 浏览器打开，适合快速验评。

---

## 16. 生态插件推荐（军事仿真场景）

> opencode 拥有活跃的社区生态，以下插件针对**智能军事仿真 + 仓真数据可视化**两条主线场景精选推荐。

### 推荐安装优先级总览

| 优先级 | 插件 | 类别 | 解决的核心问题 |
|---|---|---|---|
| P0 必装 | `@different-ai/opencode-browser` | 浏览器自动化 | 控制 Java Web 工具，图表实时显示 |
| P0 必装 | `opencode-pty` | 进程控制 | 启动并控制仿真进程（非阻塞） |
| P0 必装 | `opencode-shell-strategy` | 进程控制 | 防止 shell 调用卡死 |
| P1 重要 | `oh-my-opencode` | 多 Agent 编排 | 三阶段流程子 Agent 并行处理 |
| P1 重要 | `opencode-background-agents` | 多 Agent 编排 | 仿真后台异步执行，不阻塞主对话 |
| P1 重要 | `opencode-notify` | 任务通知 | 长时仿真完成/出错桌面通知 |
| P2 优化 | `opencode-supermemory` | 记忆与上下文 | 跨会话积累仿真参数经验 |
| P2 优化 | `opencode-dynamic-context-pruning` | 记忆与上下文 | 长对话 Token 优化 |
| P2 优化 | `opencode-skillful` | 记忆与上下文 | 大型知识库按需注入 |
| P2 优化 | `@openspoon/subtask2` | 流程编排 | 仿真失败自动重试/条件分支 |

---

### 第一类：浏览器自动化（数据显示线核心）

#### `@different-ai/opencode-browser`

**GitHub**：`different-ai/opencode-browser`

这是一个 **Chrome 扩展 + opencode 插件**的组合，让 Agent 直接控制你正在使用的真实 Chrome 浏览器（保留你的登录状态、Cookie、书签）。

**安装：**

```bash
bunx @different-ai/opencode-browser@latest install
```

安装后按提示在 `chrome://extensions` 中加载，安装脚本会自动将插件写入 `opencode.jsonc`。

**工作原理：**

```
opencode Plugin ↔ 本地 Broker（unix socket）↔ Native Host ↔ Chrome 扩展
```

**可用工具（Agent 可直接调用）：**

| 工具 | 功能 |
|---|---|
| `browser_navigate` | 打开指定 URL |
| `browser_click` | 点击页面元素 |
| `browser_type` | 向输入框填写内容 |
| `browser_select` | 操作下拉框 |
| `browser_query` | 读取页面文本/元素值 |
| `browser_scroll` | 滚动页面 |
| `browser_screenshot` | 截图（可内嵌到对话） |
| `browser_download` | 下载文件 |
| `browser_snapshot` | 获取页面结构快照 |

**仿真场景示例对话：**

```
用户：帮我看一下仿真数据库中装备损耗表的柱状图

Agent：
  1. browser_navigate  → http://localhost:8080/viz
  2. browser_click     → 「选择数据表」按鈕
  3. browser_select    → 选择「装备损耗」
  4. browser_click     → 「生成柱状图」
  5. browser_screenshot→ 截图返回（图片直接显示在 opencode 对话中）
```

**配置：**

```jsonc
// .opencode/opencode.jsonc
{
  "plugin": ["@different-ai/opencode-browser"]
}
```

**更新：**

```bash
bunx @different-ai/opencode-browser@latest update
```

---

### 第二类：后台进程控制（仿真执行线核心）

#### `opencode-pty`

你的仿真引擎（如 MATLAB、C++ 仿真程序、Java 仿真服务）通常需要长时间运行并实时输出日志。`opencode-pty` 让 Agent 能在 PTY（伪终端）中启动进程，实现双向交互：

- 启动仿真进程（非阻塞，不卡住 Agent）
- 实时向仿真进程发送控制指令（如暂停、修改参数）
- 监控进程输出，检测「仿真完成」信号

**安装：**

```bash
bun add opencode-pty
```

**配置：**

```jsonc
{
  "plugin": ["opencode-pty"]
}
```

#### `opencode-shell-strategy`

防止 Agent 调用 shell 命令时因为 TTY 交互提示（如密码确认、`[y/n]` 询问）而卡死。对调用 Java 启动脚本、mvn 构建命令、仿真引擎启动命令非常重要。

**安装：**

```bash
bun add opencode-shell-strategy
```

**配置：**

```jsonc
{
  "plugin": ["opencode-shell-strategy"]
}
```

---

### 第三类：多 Agent 协作（全流程编排核心）

#### `oh-my-opencode` ⭐ 强烈推荐

包含后台 Agent、预置 LSP/AST/MCP 工具集、兼容 Claude Code 的配置体系。对“**想定设计 → 仿真执行 → 评估分析**”三阶段拆分给子 Agent 并行处理的架构非常契合：

```
主 Agent（sim-commander）
  ├── 子 Agent 1：scenario-designer（想定设计）
  ├── 子 Agent 2：sim-runner（仿真执行）       ← oh-my-opencode 后台 Agent
  └── 子 Agent 3：result-evaluator（评估分析）
```

**安装：**

```bash
bun add oh-my-opencode
```

#### `opencode-background-agents`

Claude Code 风格的异步后台 Agent，适合仿真执行这种耗时任务：**主对话不阻塞，仿真在后台跑，完成后通知你**。

```bash
bun add opencode-background-agents
```

#### `opencode-workspace`

打包了16 个多 Agent 编排组件，一次安装，适合需要复杂并行工作流的仿真项目。

```bash
bun add opencode-workspace
```

#### `@openspoon/subtask2`

将 `/commands` 扩展为带流程控制的任务编排系统，支持：

- 条件分支（仿真失败时走不同处理路径）
- 循环重试（参数调优迭代）
- 子任务依赖管理

```bash
bun add @openspoon/subtask2
```

---

### 第四类：任务通知（长时仿真必备）

#### `opencode-notify` / `opencode-notificator`

仿真可能跑几分钟到几十分钟，这类插件在任务完成/出错时推送系统桌面通知，你不用盯着屏幕等待。

```bash
bun add opencode-notify
# 或
bun add opencode-notificator
```

**配置：**

```jsonc
{
  "plugin": ["opencode-notify"]
}
```

---

### 第五类：记忆与上下文（跨会话知识积累）

#### `opencode-supermemory`

跨会话持久记忆，适合积累“历次仿真参数经验”——比如某型武器系统的标准想定参数、历次仿真的调优结论，下次对话直接从记忆中取用。

```bash
bun add opencode-supermemory
```

#### `opencode-dynamic-context-pruning`

优化 Token 使用，自动把已完成的仿真步骤的冗长输出裁剪掉，防止长对话上下文撔爆模型窗口。对仿真执行日志特别有用。

```bash
bun add opencode-dynamic-context-pruning
```

#### `opencode-skillful`

按需懒加载 Skill 提示词。适合把“想定设计规范”、“评估指标体系”、“装备参数手册”等大型知识库做成独立 Skill，Agent 真正需要时才注入，节省上下文空间。

```bash
bun add opencode-skillful
```

---

### 完整插件配置示例

在 `.opencode/opencode.jsonc` 中按需启用：

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": [
    // P0 必装：浏览器自动化 + 仿真进程控制
    "@different-ai/opencode-browser",
    "opencode-pty",
    "opencode-shell-strategy",
    // P1 重要：多 Agent 编排 + 通知
    "oh-my-opencode",
    "opencode-background-agents",
    "opencode-notify",
    // P2 优化：记忆 + Token 管理
    "opencode-dynamic-context-pruning",
    "opencode-skillful"
  ]
}
```

### 一键安装所有推荐插件

```bash
bun add opencode-pty opencode-shell-strategy oh-my-opencode opencode-background-agents opencode-notify opencode-dynamic-context-pruning opencode-skillful
```

> **注意**：`@different-ai/opencode-browser` 需要额外执行 `bunx @different-ai/opencode-browser@latest install` 安装 Chrome 扩展，其余插件 `bun add` 后配置到 `plugin` 数组即可生效。

---

## 17. 离线环境插件安装指南

> 针对**无网络办公环境**，本节说明如何在有网机器预下载插件，再拷贝到离线机器上安装，以及无法离线使用的插件的本地替代方案。

### 离线可行性快速评估

| 插件 | 离线可行性 | 说明 |
|---|---|---|
| `opencode-pty` | ✅ 完全可行 | 纯 npm 包，无额外二进制文件 |
| `opencode-shell-strategy` | ✅ 完全可行 | 纯 npm 包 |
| `oh-my-opencode` | ✅ 基本可行 | 纯 npm 包 |
| `opencode-background-agents` | ✅ 基本可行 | 纯 npm 包 |
| `opencode-notify` | ✅ 完全可行 | 纯 npm 包 |
| `opencode-dynamic-context-pruning` | ✅ 完全可行 | 纯 npm 包 |
| `opencode-skillful` | ✅ 完全可行 | 纯 npm 包 |
| `opencode-supermemory` | ⚠️ 功能受限 | npm 包可离线安装，但核心功能依赖 Supermemory 云服务，离线失效 |
| `@different-ai/opencode-browser` | ❌ 无法离线 | Chrome 扩展需从 GitHub Releases 下载，属 URL 依赖，Verdaccio 无法代理 |

---

### 第一步：在有网机器上预打包

```powershell
# 1. 创建临时目录
mkdir sim-plugins && cd sim-plugins
bun init -y

# 2. 安装所有可离线插件
bun add opencode-pty opencode-shell-strategy oh-my-opencode opencode-background-agents opencode-notify opencode-dynamic-context-pruning opencode-skillful

# 3. 对每个包单独打 tgz
cd node_modules/opencode-pty && bun pack && cd ../..
cd node_modules/opencode-shell-strategy && bun pack && cd ../..
cd node_modules/oh-my-opencode && bun pack && cd ../..
cd node_modules/opencode-background-agents && bun pack && cd ../..
cd node_modules/opencode-notify && bun pack && cd ../..
cd node_modules/opencode-dynamic-context-pruning && bun pack && cd ../..
cd node_modules/opencode-skillful && bun pack && cd ../..

# 4. 收集所有 .tgz 到一个目录
Get-ChildItem -Path node_modules -Filter *.tgz -Recurse | Copy-Item -Destination ./offline-tgz
```

### 第二步：发布到 Verdaccio（已有私有源时推荐）

> ℹ️ 发布唤需先登录 Verdaccio，注册邮筱格式必须符合标准格式（如 `user@example.com`）。

```powershell
npm adduser --registry http://localhost:4873

Get-ChildItem ./offline-tgz -Filter *.tgz | ForEach-Object {
    npm publish $_.FullName --registry http://localhost:4873
}
```

### 第三步：在离线机器上安装

**方式 A：通过 Verdaccio 安装（已发布时）**

确保 `.npmrc` 指向内网 Verdaccio：

```ini
# .npmrc
registry=http://内网Verdaccio地址:4873/
```

```powershell
bun add opencode-pty opencode-shell-strategy oh-my-opencode opencode-background-agents opencode-notify opencode-dynamic-context-pruning opencode-skillful
```

**方式 B：直接 tgz 本地安装（无需 Verdaccio）**

把 `.tgz` 文件拷贝到离线机器，直接安装：

```powershell
bun add ./opencode-pty-x.x.x.tgz
bun add ./opencode-shell-strategy-x.x.x.tgz
bun add ./oh-my-opencode-x.x.x.tgz
bun add ./opencode-background-agents-x.x.x.tgz
bun add ./opencode-notify-x.x.x.tgz
bun add ./opencode-dynamic-context-pruning-x.x.x.tgz
bun add ./opencode-skillful-x.x.x.tgz
```

---

### `@different-ai/opencode-browser` 离线替代：Playwright 本地 Chromium 截图

Playwright 支持**完全离线模式**：在有网机器下载 Chromium 内核 → 拷贝到离线机器 → Playwright 直接调用本地 Chromium。

```powershell
# 在有网机器上下载 Playwright + Chromium 内核
bun add playwright
npx playwright install chromium
# Chromium 下载到 %LOCALAPPDATA%\ms-playwright\

# 将整个 ms-playwright 目录拷贝到离线机器的相同路径
# 同时将 playwright npm 包打 tgz 一并拷贝
```

在离线机器的 `.opencode/tool/screenshot-chart.ts` 中使用 Playwright，效果与 `browser_screenshot` 工具一致：

```typescript
/// <reference path="../env.d.ts" />
import { tool } from "@opencode-ai/plugin"
import { chromium } from "playwright"

export default tool({
  description: "截图仿真工具页面并内嵌到对话（离线 Playwright 实现）",
  args: {
    url: tool.schema.string().describe("要截图的页面 URL"),
    wait: tool.schema.number().default(2000).describe("等待页面加载的毫秒数"),
  },
  async execute({ url, wait }) {
    const browser = await chromium.launch({ headless: true })
    const page = await browser.newPage()
    await page.goto(url)
    await page.waitForTimeout(wait)
    const buf = await page.screenshot({ type: "png" })
    await browser.close()
    return {
      output: `截图完成: ${url}`,
      metadata: {},
      attachments: [{
        type: "file",
        mime: "image/png",
        url: `data:image/png;base64,${buf.toString("base64")}`,
      }],
    }
  },
})
```

---

### `opencode-supermemory` 离线替代：本地 JSON 文件记忆

```typescript
// .opencode/plugin/local-memory.ts
import { plugin } from "@opencode-ai/plugin"

export default plugin(async () => ({
  async "experimental.chat.system.transform"(_input, output) {
    const mem = await Bun.file("./.opencode/memory.json").json().catch(() => ({}))
    if (Object.keys(mem).length > 0)
      output.system.push(`## 历史仿真经验记忆\n${JSON.stringify(mem, null, 2)}`)
  },
  async "tool.execute.after"(input, output) {
    if (input.tool !== "run-simulation") return
    const mem = await Bun.file("./.opencode/memory.json").json().catch(() => ({}))
    mem[`sim_${Date.now()}`] = { summary: output.output.slice(0, 500) }
    await Bun.write("./.opencode/memory.json", JSON.stringify(mem, null, 2))
  },
}))
```

---

### 离线环境最终配置

```jsonc
// .opencode/opencode.jsonc（离线版）
{
  "plugin": [
    // ✅ 离线可用：tgz 安装
    "opencode-pty",
    "opencode-shell-strategy",
    "oh-my-opencode",
    "opencode-background-agents",
    "opencode-notify",
    "opencode-dynamic-context-pruning",
    "opencode-skillful",
    // ✅ 本地自建：替代 opencode-browser
    "./tool/screenshot-chart.ts",
    // ✅ 本地自建：替代 opencode-supermemory
    "./plugin/local-memory.ts"
  ]
}
```

### 能力对照

| 能力 | 在线方案 | 离线替代 | 等效程度 |
|---|---|---|---|
| 浏览器控制 Java Web 工具 | `opencode-browser` | Playwright 离线 Chromium 截图 Tool | 截图功能等效 |
| 跨会话记忆 | `opencode-supermemory` | 本地 JSON + Plugin 注入 | 功能等效 |
| 仿真进程控制 | `opencode-pty` | ✅ 直接 tgz 离线安装 | 完全等效 |
| 多 Agent 编排 | `oh-my-opencode` | ✅ 直接 tgz 离线安装 | 完全等效 |
| 任务完成通知 | `opencode-notify` | ✅ 直接 tgz 离线安装 | 完全等效 |