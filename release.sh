#!/bin/bash

echo "开始发布博客..."

echo "1. 清理缓存..."
npx hexo clean

echo "2. 生成静态文件..."
npx hexo generate

echo "3. 部署到服务器..."
npx hexo deploy

echo "发布完成！"
read -p "按任意键继续..."
