#!/bin/bash

echo "🌸 Summer Flower 博客文章创建工具"
echo "=================================="

# 获取文章标题
read -p "📝 请输入文章标题: " title

if [ -z "$title" ]; then
    echo "❌ 文章标题不能为空！"
    exit 1
fi

# 获取文章分类
echo ""
echo "📂 请选择文章分类："
echo "1) 技术学习"
echo "2) 生活随想" 
echo "3) 摄影作品"
echo "4) 学习记录"
echo "5) 项目分享"
echo "6) 自定义"
read -p "选择分类 (1-6): " category_choice

case $category_choice in
    1) category="技术学习" ;;
    2) category="生活随想" ;;
    3) category="摄影作品" ;;
    4) category="学习记录" ;;
    5) category="项目分享" ;;
    6) read -p "请输入自定义分类: " category ;;
    *) category="生活随想" ;;
esac

# 获取标签
echo ""
read -p "🏷️  请输入标签 (用逗号分隔，如: 技术,学习,笔记): " tags_input

# 处理标签
if [ -z "$tags_input" ]; then
    tags_yaml="  - 默认"
else
    tags_yaml=""
    IFS=',' read -ra TAGS <<< "$tags_input"
    for tag in "${TAGS[@]}"; do
        # 去除空格
        tag=$(echo "$tag" | xargs)
        tags_yaml="${tags_yaml}  - ${tag}\n"
    done
    # 移除最后的换行符
    tags_yaml=$(echo -e "$tags_yaml" | sed '$d')
fi

# 获取文章描述
echo ""
read -p "📄 请输入文章简介: " description

if [ -z "$description" ]; then
    description="$title"
fi

# 选择封面图
echo ""
echo "🖼️  请选择封面图："
echo "1) /photos/avatar.jpg (默认头像)"
echo "2) /photos/arknight.jpg (明日方舟)"
echo "3) 自定义路径"
echo "4) 不设置封面"
read -p "选择封面 (1-4): " cover_choice

case $cover_choice in
    1) cover="/photos/avatar.jpg" ;;
    2) cover="/photos/arknight.jpg" ;;
    3) read -p "请输入封面图路径 (如: /images/cover.jpg): " cover ;;
    4) cover="" ;;
    *) cover="/photos/avatar.jpg" ;;
esac

# 创建文章
echo ""
echo "📝 正在创建文章..."
npx hexo new "$title"

# 获取当前时间
current_date=$(date "+%Y-%m-%d %H:%M:%S")

# 生成文章文件路径
post_file="source/_posts/${title}.md"

# 创建自定义的 Front Matter
cat > "$post_file" << EOF
---
title: $title
date: $current_date
updated: $current_date
tags:
$tags_yaml
categories:
  - $category
description: $description$([ -n "$cover" ] && echo -e "\ncover: $cover")
top: false
comments: true
toc: true
mathjax: false
copyright: true
---

# 📝 $title

> $description

## 前言

在这里写下你的想法...

## 正文内容

### 小标题

内容...

## 总结

总结一下本文的要点...

---

*感谢阅读！如果这篇文章对你有帮助，欢迎点赞和分享。*
EOF

echo "✅ 文章创建完成！"
echo "📍 文件位置: $post_file"
echo "📊 文章信息:"
echo "   标题: $title"
echo "   分类: $category"
echo "   标签: $tags_input"
echo "   描述: $description"
if [ -n "$cover" ]; then
    echo "   封面: $cover"
fi

echo ""
echo "🚀 接下来你可以："
echo "1. 编辑文章内容: code '$post_file'"
echo "2. 本地预览: ./preview.sh"
echo "3. 部署发布: hexo clean && hexo g && hexo d"

# 询问是否立即编辑
echo ""
read -p "是否立即打开编辑器编辑文章? (y/n): " edit_choice
if [[ $edit_choice == "y" || $edit_choice == "Y" ]]; then
    code "$post_file"
fi

echo ""
echo "🌸 祝你写作愉快！"