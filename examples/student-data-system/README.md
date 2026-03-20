# 测试用例

> 以下测试用例均使用 `viz-agent_test` 智能体，系统需提前启动：`cd examples/student-data-system && bun run dev`

---

## 基础图表类型测试

### TC-01 饼图：学生性别比例
```
帮我查看一下学生的男女比例，用饼图展示
```
**预期**：生成饼图，显示男/女各自人数及百分比

### TC-02 柱状图：各年级人数对比
```
用柱状图展示各年级的学生人数分布
```
**预期**：生成柱状图，X轴为一/二/三年级，Y轴为人数

### TC-03 柱状图：各班级人数对比
```
各班级分别有多少学生？用柱状图显示
```
**预期**：生成柱状图，展示1班/2班/3班/4班的人数

### TC-04 饼图：各学科分布
```
学生学科分布情况怎么样？帮我用饼图展示
```
**预期**：生成饼图，展示数学/语文/英语三科学生占比

### TC-05 柱状图：年龄分布
```
用柱状图展示学生的年龄分布
```
**预期**：生成柱状图，X轴为各年龄（15-20岁），Y轴为人数

---

## 带筛选条件测试

### TC-06 筛选年级后看性别比例
```
帮我看看一年级学生的男女比例，用饼图
```
**预期**：筛选 grade=一年级，生成该年级男女饼图

### TC-07 筛选性别后看年级分布
```
女生在各年级是怎么分布的？用柱状图展示
```
**预期**：筛选 gender=女，生成女生的年级分布柱状图

### TC-08 筛选学科后看班级分布
```
学数学的学生主要集中在哪个班？用柱状图展示
```
**预期**：筛选 subject=数学，生成该学科的班级分布

### TC-09 筛选年级后看学科分布
```
三年级学生都在学什么学科？用饼图展示
```
**预期**：筛选 grade=三年级，生成该年级学科占比饼图

---

## 数据预览测试

### TC-10 查看数据表结构
```
帮我预览一下学生表的数据，看看都有哪些字段
```
**预期**：点击「预览数据」，展示学生表前10条记录

### TC-11 查看统计概览
```
给我看一下学生数据的整体统计概况
```
**预期**：页面顶部统计卡片正确显示总人数、男女人数、平均成绩

---

## 连续多图测试（测试上下文理解）

### TC-12 连续切换图表类型
```
第一步：用饼图展示各年级人数比例
第二步：把刚才的图换成柱状图
```
**预期**：Agent 能连续操作，先生成饼图截图，再切换为柱状图截图

### TC-13 对比两个维度
```
先帮我看男女比例饼图，然后再看各年级人数柱状图
```
**预期**：Agent 顺序执行两次操作，各返回一张截图

---

## 边界与容错测试

### TC-14 模糊需求理解
```
我想看看学生的成绩怎么样
```
**预期**：Agent 自动推断用 `score` 或 `age` 维度，选择合适图表类型展示

### TC-15 中文别名映射
```
按性别统计人数，用圆形图展示
```
**预期**：Agent 将「圆形图」理解为饼图（pie），正确操作

### TC-16 系统未启动时的引导
```
帮我查看学生男女比例
```
（在服务未启动时执行）  
**预期**：Agent 提示用户先启动服务，给出启动命令

# 学生数据管理系统


基于 Bun + Elysia 的数据管理系统，用于测试 opencode 数据可视化 Agent。

## 功能特性

- **模拟数据**：自动生成 100 条学生记录（含性别、年级、班级、成绩等字段）
- **REST API**：提供完整的图表生成和数据查询接口
- **可视化页面**：内置 ECharts 图表展示页面
- **CORS 支持**：允许 opencode 跨域调用

## 快速开始

### 1. 安装依赖

```bash
cd examples/student-data-system
bun install
```

### 2. 启动服务

```bash
# 开发模式（热重载）
bun run dev

# 生产模式
bun run start
```

服务启动后访问：
- 可视化页面：http://localhost:8080
- API 文档：http://localhost:8080/api/health

### 3. 查看模拟数据

```bash
bun run seed
```

## API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/health` | 健康检查 |
| GET | `/api/viz/tables` | 获取所有表 |
| GET | `/api/viz/tables/:name/columns` | 获取表字段 |
| GET | `/api/viz/tables/:name/preview` | 预览数据 |
| POST | `/api/viz/chart` | 生成图表数据 |
| GET | `/api/viz/stats` | 获取统计信息 |
| POST | `/api/viz/query` | 查询数据 |

### 生成图表示例

```bash
curl -X POST http://localhost:8080/api/viz/chart \
  -H "Content-Type: application/json" \
  -d '{
    "tableName": "students",
    "chartType": "pie",
    "dimension": "gender",
    "title": "学生性别分布"
  }'
```

## 与 opencode 集成

### 1. 确保 opencode-browser 插件已安装

```bash
bunx @different-ai/opencode-browser@latest install
```

### 2. 启动本系统

```bash
bun run dev
```

### 3. 在 opencode 中使用

选择 `viz-agent`，输入：

```
帮我查看一下学生的男女比例，用饼图展示
```

Agent 会自动：
1. 打开 http://localhost:8080
2. 选择「学生表」
3. 选择「饼图」类型
4. 选择「性别」维度
5. 点击生成
6. 截图展示结果

## 项目结构

```
student-data-system/
├── src/
│   ├── server.ts      # Elysia 服务端
│   ├── database.ts    # 内存数据库
│   ├── seed.ts        # 模拟数据生成
│   └── types.ts       # 类型定义
├── public/
│   └── index.html     # 可视化页面
├── package.json
└── README.md
```

## 技术栈

- **Runtime**: Bun
- **Framework**: Elysia
- **Charts**: ECharts
- **CORS**: @elysiajs/cors
