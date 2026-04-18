# Quickstart: Coze Subagent 工具集成验收

**Feature**: 006-coze-subagent  
**Date**: 2026-04-18

用于实现后联调验证本特性的核心路径（按用户要求，忽略 edge case 深挖）。

---

## 1) 前置准备

1. 安装依赖并启动开发环境：

```bash
npm install
npm run dev
```

2. 在 `.env.local` 配置本特性所需环境变量（值由运维提供）：

- `COZE_API_TOKEN`
- `COZE_BOT_ID`
- `COZE_BASE_URL`（可选，默认 `https://api.coze.cn`）
- 现有 Supabase 与 OpenRouter 环境变量

3. 使用任意有效测试账号登录，进入 `/mobile/assistant`。

---

## 2) 主路径验收（成功场景）

1. 在助手输入建筑规范类问题（如“栏杆需要多高”）。
2. 预期结果：
   - assistant 返回专业知识回答，不是 `mock success`
   - 工具卡显示正常“调用中 → 已完成”状态
   - 页面上不出现 Coze 中间事件文本（delta/状态等）

---

## 3) 失败降级验收

1. 临时将 Coze token 改为错误值，重启服务。
2. 再次提问知识类问题。
3. 预期结果：
   - 对话不崩溃、不白屏
   - 用户收到可读错误说明
   - 不出现技术栈内部报错信息泄露给用户

---

## 4) 取消请求验收

1. 发起知识问题请求后立即中断请求（刷新页面或中断会话请求）。
2. 预期结果：
   - 请求在短时间内结束
   - 不产生后续中间消息渲染

---

## 5) 收尾校验

```bash
npx tsc --noEmit
npm run lint
```

两项通过后，进入 `/speckit.tasks` 生成实现任务。
