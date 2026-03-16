#!/usr/bin/env bun

/**
 * 检查 bun.lock 文件中是否存在无法通过 Verdaccio 代理的依赖
 * 
 * 主要检查：
 * 1. URL 直接依赖（如 https://pkg.pr.new/...）
 * 2. GitHub 依赖（git+https://github.com/...）
 * 3. 非本地源的 HTTP/HTTPS 依赖
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";

// 使用 Bun 的方式解析 bun.lock（它不是标准 JSON）
function parseBunLock(content: string) {
  try {
    // 尝试直接用 Bun 的 JSON.parse（支持尾随逗号）
    return JSON.parse(content);
  } catch (error) {
    // 如果失败，尝试移除尾随逗号
    const cleaned = content.replace(/,\s*([}\]])/g, "$1");
    return JSON.parse(cleaned);
  }
}

interface LockfileDependency {
  [key: string]: string | string[];
}

interface WorkspaceDependencies {
  name?: string;
  version?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
}

interface Lockfile {
  lockfileVersion: number;
  configVersion: number;
  workspaces: Record<string, WorkspaceDependencies>;
  packages?: Record<string, string[]>;
}

function checkLockfile(lockfilePath: string) {
  console.log("🔍 检查文件:", lockfilePath);
  console.log("=".repeat(60));

  const content = readFileSync(lockfilePath, "utf-8");
  const lockfile = parseBunLock(content);

  const issues: {
    location: string;
    package: string;
    version: string;
    type: "url" | "github" | "http" | "non-local";
    description: string;
  }[] = [];

  // 检查工作区依赖中的 URL 依赖
  for (const [workspacePath, workspace] of Object.entries(lockfile.workspaces || {})) {
    const ws = workspace as WorkspaceDependencies;
    const allDeps: Record<string, string | undefined> = {
      ...ws.dependencies,
      ...ws.devDependencies,
      ...ws.optionalDependencies,
      ...ws.peerDependencies,
    };

    for (const [pkgName, version] of Object.entries(allDeps || {})) {
      if (!version) continue;

      // 检查是否为 URL 依赖
      if (version.startsWith("http://") || version.startsWith("https://")) {
        issues.push({
          location: workspacePath || "root",
          package: pkgName,
          version,
          type: "url",
          description: "URL 直接依赖，不经过 npm registry",
        });
      }

      // 检查 Git 依赖
      if (
        version.startsWith("git+") ||
        version.startsWith("git://") ||
        version.includes("github.com")
      ) {
        issues.push({
          location: workspacePath || "root",
          package: pkgName,
          version,
          type: "github",
          description: "Git 依赖，需要从 GitHub 下载",
        });
      }
    }
  }

  // 检查 packages 部分的依赖
  for (const [pkgKey, pkgInfo] of Object.entries(lockfile.packages || {})) {
    if (!Array.isArray(pkgInfo) || pkgInfo.length < 2) continue;

    const resolvedUrl = pkgInfo[1];

    // 检查是否为非 localhost 的 HTTP/HTTPS 源
    if (
      typeof resolvedUrl === "string" &&
      (resolvedUrl.startsWith("http://") || resolvedUrl.startsWith("https://")) &&
      !resolvedUrl.includes("localhost") &&
      !resolvedUrl.includes("127.0.0.1")
    ) {
      // 跳过 npm registry 和其镜像
      const isNpmRegistry = 
        resolvedUrl.includes("registry.npmjs.org") ||
        resolvedUrl.includes("registry.yarnpkg.com") ||
        resolvedUrl.includes("npmmirror.com");

      if (!isNpmRegistry) {
        const [pkgName] = pkgKey.split("@").slice(0, -1);
        issues.push({
          location: "packages",
          package: pkgName || pkgKey,
          version: resolvedUrl,
          type: "non-local",
          description: "非本地源，Verdaccio 可能未缓存",
        });
      }
    }
  }

  // 输出结果
  if (issues.length === 0) {
    console.log("✅ 未发现无法通过 Verdaccio 代理的依赖");
    console.log("\n所有依赖都可以通过私有源安装，适合离线环境使用。");
  } else {
    console.log(`⚠️  发现 ${issues.length} 个潜在问题:\n`);

    issues.forEach((issue, index) => {
      console.log(`${index + 1}. ${issue.package}@${issue.version}`);
      console.log(`   📍 位置：${issue.location}`);
      console.log(`   🔴 类型：${issue.type.toUpperCase()}`);
      console.log(`   💡 说明：${issue.description}`);
      console.log();
    });

    console.log("=" .repeat(60));
    console.log("📋 建议解决方案:\n");
    
    const urlIssues = issues.filter(i => i.type === "url" || i.type === "github");
    if (urlIssues.length > 0) {
      console.log("1️⃣  URL/Git 依赖问题:");
      urlIssues.forEach(issue => {
        console.log(`   - 将 "${issue.package}": "${issue.version}"`);
        console.log(`     改为版本号，如 "${issue.package}": "x.x.x"`);
      });
      console.log();
    }

    const nonLocalIssues = issues.filter(i => i.type === "non-local");
    if (nonLocalIssues.length > 0) {
      console.log("2️⃣  非本地源问题:");
      console.log("   在有网络机器上先运行一次 `bun install`");
      console.log("   让 Verdaccio 缓存这些包后再复制到离线环境");
      console.log();
    }

    console.log("3️⃣  通用方案:");
    console.log("   - 确保 Verdaccio 配置了正确的 storage 路径");
    console.log("   - 在无网络机器上使用 `bun install --offline`");
    console.log("   - 或在 .npmrc 中添加 `ignore-scripts=true` 和 `optional=false`");
  }

  return issues;
}

// 主函数
function main() {
  const args = process.argv.slice(2);
  const lockfilePath = args[0] || join(process.cwd(), "bun.lock");

  try {
    const issues = checkLockfile(lockfilePath);
    // 如果有严重问题，返回错误码
    const criticalIssues = issues.filter(i => i.type === "url" || i.type === "github");
    if (criticalIssues.length > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ 检查失败:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();