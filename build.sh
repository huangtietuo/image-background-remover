#!/bin/bash

# 构建脚本 - 用于 Cloudflare Pages

echo "=== 开始构建前端 ==="

# 进入前端目录
cd apps/frontend || {
  echo "错误：无法进入 apps/frontend 目录"
  exit 1
}

# 安装依赖
echo "安装依赖..."
npm install || {
  echo "错误：依赖安装失败"
  exit 1
}

# 构建前端
echo "构建前端..."
npm run build || {
  echo "错误：前端构建失败"
  exit 1
}

# 运行 next-on-pages 生成 Cloudflare 兼容的构建
echo "生成 Cloudflare 兼容构建..."
npx @cloudflare/next-on-pages@1 || {
  echo "错误：next-on-pages 构建失败"
  exit 1
}

echo "=== 构建完成 ==="
echo "构建产物位于：apps/frontend/.vercel/output/static/"
