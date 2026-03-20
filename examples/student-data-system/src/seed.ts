import { db } from "./database"
import type { Student } from "./types"

// 姓氏库
const surnames = ["张", "王", "李", "刘", "陈", "杨", "黄", "赵", "吴", "周", "徐", "孙", "马", "朱", "胡", "郭", "何", "林", "罗", "高"]

// 名字库
const names = ["伟", "芳", "娜", "敏", "静", "丽", "强", "磊", "军", "洋", "勇", "艳", "杰", "娟", "涛", "明", "超", "秀", "霞", "平", "刚", "桂英", "华", "建国", "建军"]

// 生成随机学生数据
function generateStudents(count: number): Student[] {
  const students: Student[] = []
  const grades = ["一年级", "二年级", "三年级"]
  const subjects = ["数学", "语文", "英语"]
  const classes = ["1班", "2班", "3班", "4班"]

  for (let i = 0; i < count; i++) {
    const surname = surnames[Math.floor(Math.random() * surnames.length)]
    const name = names[Math.floor(Math.random() * names.length)]
    const gender = Math.random() > 0.5 ? "男" : "女"
    const age = Math.floor(Math.random() * 6) + 15 // 15-20岁
    const grade = grades[Math.floor(Math.random() * grades.length)]
    const cls = classes[Math.floor(Math.random() * classes.length)]
    const score = Math.floor(Math.random() * 40) + 60 // 60-100分
    const subject = subjects[Math.floor(Math.random() * subjects.length)]
    
    // 生成入学日期（最近3年）
    const year = 2022 + Math.floor(Math.random() * 3)
    const month = Math.floor(Math.random() * 12) + 1
    const day = Math.floor(Math.random() * 28) + 1
    const enrollmentDate = `${year}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`

    students.push({
      id: `STU${(i + 1).toString().padStart(4, "0")}`,
      name: surname + name,
      gender,
      age,
      grade,
      class: cls,
      score,
      subject,
      enrollmentDate,
    })
  }

  return students
}

// 生成并保存数据
const students = generateStudents(100)
db.seed(students)

// 输出统计信息
console.log("\n=== 学生数据生成完成 ===")
console.log(`总记录数: ${students.length}`)
console.log("\n性别分布:")
const genderStats = db.aggregate("students", "gender")
genderStats.forEach(g => console.log(`  ${g.name}: ${g.value}人`))

console.log("\n年级分布:")
const gradeStats = db.aggregate("students", "grade")
gradeStats.forEach(g => console.log(`  ${g.name}: ${g.value}人`))

console.log("\n学科分布:")
const subjectStats = db.aggregate("students", "subject")
subjectStats.forEach(s => console.log(`  ${s.name}: ${s.value}人`))

// 导出数据供其他模块使用
export { students }
