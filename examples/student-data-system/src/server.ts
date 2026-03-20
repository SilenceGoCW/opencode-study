import { Elysia, t } from "elysia"
import { cors } from "@elysiajs/cors"
import { staticPlugin } from "@elysiajs/static"
import { db } from "./database"
import { students } from "./seed"
import type { ChartResult } from "./types"

// 初始化数据库
db.seed(students)

const app = new Elysia()
  .use(cors({
    origin: "*",
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }))
  // 静态文件服务 - 前端页面
  .use(staticPlugin({
    assets: "./public",
    prefix: "/",
  }))

  // 健康检查
  .get("/api/health", () => ({
    status: "ok",
    timestamp: new Date().toISOString(),
  }))

  // 获取所有表列表
  .get("/api/viz/tables", () => {
    const tables = db.getTables()
    return tables
  })

  // 获取表字段信息
  .get("/api/viz/tables/:tableName/columns", ({ params }) => {
    const info = db.getTableInfo(params.tableName)
    if (!info) {
      return { error: "表不存在" }, 404
    }
    return info.columns
  })

  // 获取表数据预览
  .get("/api/viz/tables/:tableName/preview", ({ params, query }) => {
    const limit = parseInt(query.limit || "10")
    const data = db.query(params.tableName).slice(0, limit)
    return data
  })

  // 生成图表数据
  .post("/api/viz/chart", ({ body }) => {
    const { tableName, chartType, dimension, metric, filter, title } = body
    const aggData = db.aggregate(tableName, dimension, metric || "count", filter)
    const result: ChartResult = {
      title: title || `${dimension}分布`,
      chartType,
      data: aggData,
      total: aggData.reduce((sum, item) => sum + item.value, 0),
    }
    return result
  }, {
    body: t.Object({
      tableName: t.String(),
      chartType: t.Union([t.Literal("pie"), t.Literal("bar"), t.Literal("line"), t.Literal("scatter")]),
      dimension: t.String(),
      metric: t.Optional(t.String()),
      filter: t.Optional(t.String()),
      title: t.Optional(t.String()),
    })
  })

  // 获取统计数据
  .get("/api/viz/stats", () => db.getStats())

  // 查询数据（带筛选）
  .post("/api/viz/query", ({ body }) => {
    const data = db.query(body.tableName, body.filter).slice(0, body.limit ?? 100)
    return data
  }, {
    body: t.Object({
      tableName: t.String(),
      filter: t.Optional(t.String()),
      limit: t.Optional(t.Number()),
    })
  })

  .listen(8080)

console.log(`
╔════════════════════════════════════════════════════════╗
║     学生数据管理系统已启动                              ║
╠════════════════════════════════════════════════════════╣
║  服务地址: http://localhost:8080                        ║
║  API文档: http://localhost:8080/api/health             ║
║  可视化页面: http://localhost:8080                     ║
╚════════════════════════════════════════════════════════╝
`)

console.log("可用API端点:")
console.log("  GET  /api/viz/tables              - 获取所有表")
console.log("  GET  /api/viz/tables/:name/columns - 获取表字段")
console.log("  GET  /api/viz/tables/:name/preview - 预览数据")
console.log("  POST /api/viz/chart               - 生成图表数据")
console.log("  GET  /api/viz/stats               - 获取统计信息")
console.log("  POST /api/viz/query               - 查询数据")
