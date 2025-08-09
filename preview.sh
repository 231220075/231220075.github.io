#!/bin/bash

echo "开始预览博客..."

echo "1. 清理缓存..."
npx hexo clean

echo "2. 生成静态文件..."
npx hexo generate

echo "3. 启动本地服务器..."
echo "请在浏览器中访问: http://localhost:4000"
npx hexo server
