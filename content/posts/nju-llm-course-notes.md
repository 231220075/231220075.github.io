---
title: "南京大学 LLM 课程笔记与实验导读"
date: 2026-11-21 10:48:39
categories:
  - "技术"
description: "南京大学 2026 秋季大语言模型课程笔记，涵盖 L1–L10、A0–A5 实验思路和论文导读，附 188 页 PDF。"
---

这套笔记对应南京大学 2026 秋季《大语言模型基础：从零到一实现之路》。我把 L1–L10 的 9 条录播、A0–A5 的实验思路和相关论文放在一起，追踪一段文本如何成为模型输入、如何在前向中交换信息，以及损失如何更新参数。

[下载课程笔记合订本（PDF，188 页）](/downloads/nju-llm-course-notes.pdf)

## 按实现顺序读

1. **L1–L3 · 张量与梯度**。从线性层的形状与广播入手，手算共享权重收到的梯度，再用 A0、A1 对照自动求导。
2. **L4–L5 · 词元表示与模型组件**。看清分词结果怎样进入 Embedding，RoPE 怎样改变查询与键的比较，再把归一化、残差和门控 FFN 接起来。对应 A2、A3。
3. **L6–L8 · 注意力与计算开销**。从单头注意力推到 GQA，手算两个键块怎样合并 Softmax 分母和加权输出，再拆解 MoE 的专家派发与 LoRA 的低秩更新。用 A3、A4 检查各条路径，最后在 A5 组装带 KV cache 的 Decoder。
4. **L9–L10 · 数据、训练与重载**。先在一条样本上画出哪一位 logits 预测哪个标签，再对拍手写损失和框架结果，完成一次更新和模型重载。

复习时可以先跑一个小例子。用 A4 把一行注意力分成两块，分别手算局部输出，再用各块分母占全局分母的比例给局部输出加权。对照完整注意力的结果后读 FlashAttention，更容易看出分块省掉的是哪些中间读写。合订本也按这个方式给 RoFormer、GQA、LoRA 等论文配了阅读问题。

## 原课程与实验

- [Par4g0N 的 B 站录播合集](https://space.bilibili.com/390606417/lists/9018864?type=season)
- [南京大学官方课件](https://njudeepengine.github.io/llm-course-lecture/) · [课件源仓库](https://github.com/NJUDeepEngine/llm-course-lecture)
- [A0–A5 官方实验手册](https://njudeepengine.github.io/LLM-Blog/)

讲义是根据录播与课件整理的学习笔记。课堂截图附时间区间，可按各讲封面的链接回看。L9 与 L10 使用同一条合讲录播，官方课件各有一份。
