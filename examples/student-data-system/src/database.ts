import type { Student, TableInfo, ColumnInfo } from "./types"

// 内存数据库 - 学生表
let students: Student[] = []

// 表结构定义
const tableSchema: Record<string, ColumnInfo[]> = {
  students: [
    { name: "id", type: "string", comment: "学号" },
    { name: "name", type: "string", comment: "姓名" },
    { name: "gender", type: "enum", comment: "性别（男/女）" },
    { name: "age", type: "number", comment: "年龄" },
    { name: "grade", type: "string", comment: "年级（一年级/二年级/三年级）" },
    { name: "class", type: "string", comment: "班级" },
    { name: "score", type: "number", comment: "成绩（0-100）" },
    { name: "subject", type: "string", comment: "学科（数学/语文/英语）" },
    { name: "enrollmentDate", type: "date", comment: "入学日期" },
  ],
}

export const db = {
  // 初始化数据
  seed(data: Student[]) {
    students = data
    console.log(`[数据库] 已加载 ${data.length} 条学生记录`)
  },

  // 获取所有表名
  getTables(): string[] {
    return Object.keys(tableSchema)
  },

  // 获取表信息
  getTableInfo(tableName: string): TableInfo | null {
    const columns = tableSchema[tableName]
    if (!columns) return null

    return {
      name: tableName,
      columns,
      recordCount: tableName === "students" ? students.length : 0,
    }
  },

  // 查询数据
  query(tableName: string, filter?: string): any[] {
    if (tableName !== "students") return []

    let result = [...students]

    // 简单筛选支持
    if (filter) {
      const conditions = filter.split("AND").map((c) => c.trim())
      result = result.filter((row) => {
        return conditions.every((cond) => {
          const match = cond.match(/(\w+)\s*=\s*['"]?([^'"]+)['"]?/)
          if (match) {
            const [, field, value] = match
            return String(row[field as keyof Student]) === value
          }
          return true
        })
      })
    }

    return result
  },

  // 聚合查询
  aggregate(
    tableName: string,
    dimension: string,
    metric: string = "count",
    filter?: string
  ): Array<{ name: string; value: number }> {
    const data = this.query(tableName, filter)
    const result = new Map<string, number>()

    data.forEach((row) => {
      const key = String(row[dimension as keyof Student])

      if (metric === "count") {
        result.set(key, (result.get(key) || 0) + 1)
      } else if (metric === "sum") {
        const val = Number(row[metric as keyof Student]) || 0
        result.set(key, (result.get(key) || 0) + val)
      } else if (metric === "avg") {
        const val = Number(row[dimension as keyof Student]) || 0
        const current = result.get(key) || 0
        const count = data.filter((r) => String(r[dimension as keyof Student]) === key).length
        result.set(key, current + val / count)
      } else {
        // 默认计数
        result.set(key, (result.get(key) || 0) + 1)
      }
    })

    return Array.from(result.entries()).map(([name, value]) => ({
      name,
      value: Math.round(value * 100) / 100,
    }))
  },

  // 获取统计信息
  getStats(): Record<string, any> {
    return {
      totalStudents: students.length,
      genderDistribution: this.aggregate("students", "gender"),
      gradeDistribution: this.aggregate("students", "grade"),
      subjectDistribution: this.aggregate("students", "subject"),
      avgScore: students.length > 0 
        ? students.reduce((sum, s) => sum + s.score, 0) / students.length 
        : 0,
    }
  },
}
