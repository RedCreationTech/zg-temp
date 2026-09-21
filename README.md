# ZG AI GPS Prototype

基于《ZG AI_GPS_客户拜访版》实现的可交互产品原型。

## 产品定位

ZG AI GPS 是面向医药销售团队的 **System of Action**。它不是 CRM、BI、知识库或通用 Chatbot，而是把医院洞察、医生洞察、真实拜访、组织经验和企业规则，持续转成可执行的“下一步行动”。

核心闭环：

```text
Context → Decision → NBA → Action → Outcome → Rule Update
```

产品结构：

- 1 个母系统：ZG Pharma Sales AI GPS
- 3 个核心 Agent：
  - Hospital Agent：医院作战计划
  - Doctor Agent：医生行动导航
  - Visit Coaching Agent：拜访辅导
- 1 个管理驾驶舱：Director Decision Cockpit
- 1 个 Learning Engine：Decision Rules / Outcome Learning
- 1 个 Pilot Operations：8 周验证与扩展运营

## 当前 MVP 功能

### 1. 登录与角色工作台

支持以以下角色进入系统：

- 地区经理
- 医药代表
- 销售总监

系统根据角色自动进入对应工作视角。

### 2. 今日行动

- 汇总各 Agent 输出的 Next Best Action
- P1 / P2 / P3 优先级
- 待执行 / 进行中 / 已完成状态
- 点击查看为什么现在做、Owner、截止时间、成功信号
- 标记行动完成
- Action → Outcome 回流提示
- localStorage 保存演示状态

### 3. Hospital Agent

- 医院机会指数
- 可改变程度
- 医院作战进度
- 机会价值矩阵
- Top 1–3 业务杠杆点
- WHO / WHEN / WHAT / WHY / SUCCESS
- 医院作战闭环
- 医院生态关系图
- 决策链、关键影响者和资源协同节点
- AI 流式生成医院下一步行动

### 4. Doctor Agent

- 重点医生优先级
- 医生画像
- 关键触发场景
- 当前 GAP
- 目标行为
- 下一次拜访脚本
- 核心证据包
- 医生决策旅程
- 历史触点
- AI 流式生成医生 NBA

### 5. Visit Coaching Agent

- 拜访质量评分
- 目标清晰度
- 探询质量
- 价值呈现
- 异议处理
- 下一步推进
- 关键拜访片段
- 问题类型诊断
- 下一次拜访脚本
- 经理检查证据
- 拜访录音上传入口
- Mock 语音转写
- AI 关键片段识别
- AI 辅导诊断
- AI 流式生成辅导 NBA

### 6. Director Decision Cockpit

围绕管理层 5 个问题组织：

1. 哪 3 家医院本周最值得关注？
2. 哪 5 个医生下一步最值得推进？
3. 哪些代表行动正在偏离策略？
4. 哪些拜访需要经理立即辅导？
5. 下一步应该加资源、纠偏、升级还是停止什么？

并展示：

- 策略偏离
- 重点医院动作
- 关键医生推进
- 管理层介入事项
- 资源调整建议
- Action → Outcome 指标

### 7. Learning Engine

- Decision Rules 列表
- Context
- Decision
- Action
- Outcome
- 置信度
- 验证中 / 已验证
- Rule 调用次数
- Human Review
- 新建 Rule 编辑器
- 自定义 Rule 保存到 localStorage

### 8. Pilot Operations

独立的 8 周 Pilot 运营页：

- W1–W8 阶段进度
- Market Proof
- Product Proof
- 用户活跃率
- NBA 采纳率
- 行动完成率
- Review 覆盖率
- Rule 有效复用
- NBA → Action → Outcome 价值漏斗
- Pilot Gate
- Scale Readiness
- AI Pilot 决策简报

### 9. Enterprise Guardrails

- 内容防火墙
- 行为防火墙
- 医学证据来源
- FACT / INFERENCE / UNKNOWN
- Human Review
- 数据权限
- 敏感信息脱敏
- 审计
- SaaS / 私有化 / 混合部署

## Mock API

当前原型增加了统一的 `mock-api.js`：

```text
generateNBA()
transcribeVisit()
saveRule()
syncCRM()
```

页面已经按照真实异步接口方式调用。

后续接入：

- 大模型
- RAG / 医学知识库
- CRM / SFE
- 语音识别
- Decision Engine
- Rule Engine

时无需重写页面交互。

## 运行

当前仍然是零依赖静态原型。

直接打开：

```text
index.html
```

推荐通过静态服务器：

```bash
python3 -m http.server 8080
```

然后访问：

```text
http://localhost:8080
```

## 推荐演示路径

### 地区经理

```text
登录
→ 今日行动
→ 华东附一 Hospital Agent
→ 查看 Top 1 杠杆点
→ 医院生态关系
→ AI 生成本周行动
→ 进入医生导航
→ 周敏医生决策旅程
→ AI 生成拜访 NBA
→ 拜访辅导
→ 上传演示录音
→ 自动诊断探询不足
→ 生成下一次辅导 NBA
```

### 销售总监

```text
登录
→ Director Decision Cockpit
→ 查看需要介入的 4 个事项
→ 决定加资源 / 纠偏 / 停止
→ Pilot 运营
→ 查看 NBA → Action → Outcome 转化
→ 组织学习
→ 查看和新增 Decision Rules
```

## 技术结构

```text
index.html      页面骨架
styles.css      Design System + 响应式样式
data.js         脱敏演示数据
mock-api.js     Mock 后端 / AI / ASR / Rule API
app.js          页面路由、状态和业务交互
```

## 下一阶段

建议后续进入真正可接客户数据的 MVP：

1. Vue 3 / React 工程化
2. Spring Boot / Node API
3. PostgreSQL
4. CRM / SFE Connector
5. 医学知识库与 RAG
6. OpenAI / 国产模型可切换模型网关
7. 真实流式 NBA 生成
8. ASR + 拜访转写
9. Decision Rule Engine
10. 用户、组织、辖区和权限模型
11. 审计与合规工作流
12. Pilot 指标真实采集

当前仓库版本重点验证产品方向、信息架构、角色工作流和客户演示体验。
