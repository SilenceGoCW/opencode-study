// 学生数据类型定义

export interface Student {
  id: string
  name: string
  gender: "男" | "女"
  age: number
  grade: string
  class: string
  score: number
  subject: string
  enrollmentDate: string
}

export interface ChartRequest {
  tableName: string
  chartType: "pie" | "bar" | "line" | "scatter"
  dimension: string
  metric?: string
  filter?: string
  title?: string
}

export interface ChartResult {
  title: string
  chartType: string
  data: Array<{
    name: string
    value: number
  }>
  total: number
}

export interface TableInfo {
  name: string
  columns: ColumnInfo[]
  recordCount: number
}

export interface ColumnInfo {
  name: string
  type: string
  comment?: string
}
