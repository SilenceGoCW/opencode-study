#!/usr/bin/env bun

import { $ } from "bun";
import path from "path";
import fs from "fs";

const VERDACCIO_URL = "http://localhost:4873";
const PACKAGE_NAME = "@solidjs/start";
const PKG_PR_NEW_URL = "https://pkg.pr.new/@solidjs/start@dfb2020";
const VERSION = "1.0.0-dfb2020";

async function main() {
  console.log("📦 开始从 pkg.pr.new 下载包...");
  
  // 检查是否已登录 Verdaccio
  try {
    await $`npm whoami --registry ${VERDACCIO_URL}`;
    console.log("✅ 已登录 Verdaccio");
  } catch {
    console.log("⚠️  未登录 Verdaccio，请先运行以下命令:");
    console.log(`   npm adduser --registry ${VERDACCIO_URL}`);
    throw new Error("需要先登录 Verdaccio");
  }
  
  // 下载包
  const response = await fetch(PKG_PR_NEW_URL);
  if (!response.ok) {
    throw new Error(`下载失败：${response.statusText}`);
  }
  
  const tarball = await response.arrayBuffer();
  const tempDir = path.join(process.cwd(), "temp-package");
  const tarballPath = path.join(tempDir, "package.tar.gz");
  
  // 创建临时目录 (Windows 兼容)
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  
  await Bun.write(tarballPath, tarball);
  
  console.log("📂 解压包...");
  
  // Windows 使用 tar -xzf (Windows 10+ 内置 tar)
  try {
    await $`tar -xzf "${tarballPath}" -C "${tempDir}"`;
  } catch (error) {
    console.error("❌ 解压失败，请确保 Windows 10+ 或安装 Git Bash");
    throw error;
  }
  
  // 读取并修改 package.json
  const pkgJsonPath = path.join(tempDir, "package", "package.json");
  const pkgJson = await Bun.file(pkgJsonPath).json();
  
  console.log("✏️ 修改版本号...");
  pkgJson.version = VERSION;
  
  await Bun.write(pkgJsonPath, JSON.stringify(pkgJson, null, 2));
  
  // 发布到 Verdaccio
  console.log("🚀 发布到 Verdaccio...");
  process.chdir(path.join(tempDir, "package"));
  
  try {
    // Windows 需要添加 --tag 参数用于预发布版本
    await $`npm publish --registry ${VERDACCIO_URL} --access public --tag latest`;
    console.log("✅ 发布成功!");
  } catch (error) {
    console.error("❌ 发布失败:", error);
    throw error;
  } finally {
    // 清理临时文件 (Windows 兼容 - 使用 Bun 的 fs API)
    process.chdir(process.cwd());
    try {
      await fs.promises.rm(tempDir, { recursive: true, force: true });
    } catch {
      // 如果失败，稍后手动删除即可
      console.log("⚠️  临时文件可稍后手动删除:", tempDir);
    }
  }
  
  console.log("\n📝 下一步操作:");
  console.log(`1. 在项目 .npmrc 中添加：@solidjs:registry=${VERDACCIO_URL}`);
  console.log(`2. 修改 package.json 中的版本为：${VERSION}`);
  console.log("3. 运行：bun install");
}

main().catch(console.error);

