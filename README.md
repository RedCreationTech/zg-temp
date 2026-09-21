# ZG AI GPS Frontend Prototype

基于《ZG AI_GPS_客户拜访版》实现的纯前端高保真交互原型。

当前阶段的目标不是建设真实后端，而是用于：

- 客户拜访演示
- 产品需求确认
- 用户流程验证
- UI / UX 评审
- Agent 产品形态验证
- Pilot 方案沟通

## 当前原则

### 纯前端

当前原型：

- 不连接真实数据库
- 不连接真实 CRM / SFE
- 不调用真实大模型
- 不上传真实拜访录音
- 不需要 Node / Java / Python 后端
- 不需要安装依赖

所有状态和“AI 行为”均在浏览器中模拟。

### 浏览器内模拟完整业务闭环

虽然没有后端，但原型仍完整展示：

```text
Context
  ↓
Decision
  ↓
NBA
  ↓
Action
  ↓
Outcome
  ↓
Rule Validation
  ↓
Learning
```

这些对象只用于演示产品逻辑，不代表当前已经实现真实业务服务。

## 产品结构

```text
ZG Pharma Sales AI GPS
├── 今日行动
├── Hospital Agent
├── Doctor Agent
├── Visit Coaching Agent
├── Director Decision Cockpit
├── Pilot Operations
├── Learning Engine
├── Enterprise Guardrails
└── Organization & Access
```

## 本轮高保真增强

Hospital Agent 现在进一步接近地区经理真实作战工作台：

```text
患者流 / 患者旅程
→ 找到关键流失点
→ 映射医院关键关系人
→ 确定 Top 1–3 杠杆点
→ 把医学 / 市场 / 代表 / 经理资源映射到具体杠杆
→ 形成医院 NBA
```

Doctor Agent 增加拜访前准备工作台：

```text
这次唯一目标
→ 开场策略
→ 2 个优先探询
→ 预判异议
→ 证据准备
→ 结束阶段承诺
→ 拜访前检查清单
```

以上全部是前端模拟交互，不连接任何真实业务系统。

## 当前页面

### 1. 今日行动

展示不同 Agent 生成的下一步行动：

- P1 / P2 / P3 优先级
- 待执行
- 进行中
- 已完成
- Owner
- 截止时间
- Success Signal
- 为什么现在做

支持点击行动并模拟完成状态。

### 2. 医药代表工作台

代表工作台把 Doctor Agent 的判断能力放进代表每天真正使用的工作流程。

首页展示：

- 今日 4 次客户互动
- 拜访时间
- 医生 / 医院 / 科室
- 本次唯一目的
- 优先级
- 行程提示
- 当前状态
- 3 个 Agent 提醒的小任务

选择下一场拜访后，右侧自动生成：

```text
本次唯一目标
WHY NOW
当前 GAP
开场策略
结束承诺
TOP EVIDENCE
拜访准备完成度
```

可以继续进入：

```text
代表工作台
→ Doctor Agent
→ 拜访前准备
→ 拜访中模式
```

#### 拜访中模式

现场模式刻意减少普通看板信息，只留下当前拜访真正需要的内容：

```text
当前目标
成功信号
先问什么
证据
异议
下一步承诺
合规提醒
```

代表可以在 3 个现场 Tab 之间切换：

1. 证据
2. 异议
3. 承诺

证据页用于模拟“3 秒找证据”。

异议页用于选择医生当前异议，并展示建议应对方向。

承诺页要求代表在结束拜访前明确一个可验证的下一步，例如：

```text
周三 MDT 讨论 1 例匹配患者
确认病例共识会日期
确认下一次病例讨论时间
升级经理 / 医学支持
```

没有明确承诺时，“形成承诺并结束”按钮不可完成。

拜访结束后：

```text
现场承诺
→ 客户原话 / 现场信号
→ 进入拜访复盘
→ Coaching Agent
```

经理辅导页会显示代表刚刚从现场回传的承诺和记录，实现角色之间的前端联动。

### 3. Hospital Agent

围绕“这家医院下一步最值得打哪里”展示：

- 医院机会指数
- 可改变程度
- 当前作战阶段
- 作战进度
- 机会价值矩阵
- Top 1–3 业务杠杆点
- 患者流与关键流失点
- 医院生态关系图
- 关键关系人影响力 / 支持度 / 推荐动作
- 资源配置计划
- WHO / WHEN / WHAT / WHY / SUCCESS
- AI 生成本周行动计划

### 4. Doctor Agent

围绕“这个医生，这一次，下一步做什么”展示：

- 医生优先级
- 医生画像
- 临床关注
- 当前 GAP
- 关键触发场景
- 目标行为
- 医生决策旅程
- 历史互动时间线
- 拜访前准备工作台
- 唯一拜访目标
- 优先探询问题
- 预判异议
- 结束阶段承诺
- 可点击准备清单
- 下一次拜访脚本
- 核心证据包
- 证据来源追溯
- 医学审核状态
- FACT / INFERENCE 边界
- AI 生成医生 NBA

## 本轮多轮医生对话增强

AI 陪练已经从“单轮选择一句话”升级为完整 4 轮拜访微型模拟：

```text
Round 1
补 Context / 探询质量

Round 2
证据匹配

Round 3
异议处理

Round 4
推进承诺
```

每一轮都包含：

```text
医生发言
→ 代表选择回应
→ AI 医生继续回应
→ 本轮评分
→ 为什么有效 / 为什么失效
→ 进入下一轮
```

三种演示场景有不同对话路径：

### 探询不足

```text
医生:
“数据我看过一些,
但我更关心这类患者到底怎么选.”

代表先补 Context
→ 再做证据匹配
→ 处理“研究患者和本科患者是否接近”
→ 最后锁定周三 MDT
```

### 推进不够

```text
医生:
“这几个病例挺有意思的,
我回头再看看.”

代表确认真正愿意讨论的病例
→ 缩小证据范围
→ 处理时间异议
→ 锁定周四住院组病例讨论
```

### 可复制经验

```text
医生认可患者识别流程问题
→ 代表确认最优先流程节点
→ 设计 20 分钟小实验
→ 明确参与医生
→ 锁定病例共识会日期
```

完成四轮后自动生成：

```text
SIMULATION SCORECARD
```

评分维度：

- 探询质量
- 证据匹配
- 异议处理
- 推进承诺
- 总分

同时自动指出：

- 最强维度
- 下一轮最值得继续练的维度

总分达到 85 后，可以把本轮完整模拟锁定为：

```text
MANAGER CHECK EVIDENCE
```

如果未达到 85，可以直接：

```text
重新挑战 4 轮
```

因此 AI 陪练现在展示的是完整行为链，而不是一句“推荐话术”。

## 本轮复盘与 AI 陪练增强

Visit Coaching 现在增加一条完整的“拜访后 3 分钟”流程：

```text
00:00–00:45
自动摘要

00:45–01:30
识别 Top 1 问题

01:30–02:30
AI 角色扮演

02:30–03:00
锁定下一次打法
```

代表可以直接使用演示录音生成：

- 自动转写
- 本次目标摘要
- 客户关键信号
- 拜访评分
- Top 1 改进点
- 下一次动作

系统不会同时给一长串辅导建议，而是只要求确认一个最值得改的问题。

确认后进入 AI 角色扮演。

例如针对“探询不足”：

```text
医生:
“数据我看过一些,
但我现在更关心这类患者到底怎么选.”
```

代表可以从多个回答中选择一句。

系统会模拟医生回应并立即给分：

```text
52
继续呈现证据,
没有回应医生的决策标准

93
先确认医生最关注的两个决策指标,
再决定调用什么证据
```

支持：

- 再打一遍
- 保留每轮得分
- Best Score
- 85 分通过线
- 完成陪练
- 锁定下一次打法

陪练完成以后会形成一条：

```text
MANAGER CHECK EVIDENCE
```

包括：

- 练习轮数
- Best Score
- 本次训练问题
- 是否完成

因此经理可以检查的是“代表有没有真正练过”, 而不是只确认培训任务是否勾选完成。

这条流程目前全部在浏览器中模拟。

## 本轮周度 Coaching 管理闭环

团队辅导页进一步增加了地区经理每周真正可以执行的 30 分钟 Coaching Agenda。

系统会根据：

```text
业务影响
×
问题重复次数
×
可改进性
×
陪练完成状态
×
本周是否已经辅导
```

自动选出本周最值得辅导的 2 人。

Agenda 固定为：

```text
00–15 分钟
代表 A
只练 1 个 Top 问题

15–30 分钟
代表 B
只练 1 个 Top 问题
```

每个 Agenda 项目都包含：

- 本次只练什么
- 为什么是这个人
- 经理需要检查什么证据
- 下一次拜访成功信号
- 进入单次 Coaching
- 标记本周已辅导

本周选中的 2 人会固定保留，不会因为完成第一个就突然换人。

但完成辅导以后：

```text
团队辅导优先级
```

会重新计算。

页面同时展示：

```text
下一候选
```

并支持：

```text
重新生成下一轮 Agenda
```

### 上周 → 本周趋势

经理可以直接查看每位代表：

```text
上周重点拜访分
→
本周重点拜访分
→
净变化
```

并展示：

- 团队上周均分
- 团队本周均分
- 净变化
- 正在改善人数

完成四轮 AI 陪练后，训练结果会继续影响本周团队能力画像和趋势。

### Champion Pattern

团队辅导不只找差距，也会自动挑出当前最值得复制的高质量打法。

展示：

```text
CHAMPION PATTERN
Context
→
Action
→
Outcome
```

例如：

```text
赵倩
流程问题
→
真实探询
→
3 个病例小范围共识
→
获得病例讨论会邀请
```

地区经理可以点击：

```text
采纳为本周团队打法
```

采纳以后，该打法会回流到 Learning Engine，作为：

```text
TEAM PLAYBOOK CANDIDATE
```

继续观察 2–3 次同类场景 Outcome 后，再考虑是否沉淀为正式 Decision Rule。

### 5. 团队辅导工作台

地区经理现在先进入团队层，再决定今天要辅导谁。

团队工作台展示：

- 团队最近重点拜访质量
- 高优先辅导人数
- AI 陪练完成度
- 明确客户承诺率
- 代表辅导优先级
- 最近 4 次拜访趋势
- 重复失效问题
- 陪练状态
- NBA 完成率
- 下一步经理动作

支持 4 个快速筛选：

```text
辅导优先级
需立即辅导
陪练未完成
正在改善
```

每个代表卡片都可以直接：

```text
查看拜访
→ 单次 Coaching

立即开始陪练
→ 3 分钟复盘
→ Top 1 问题
→ 四轮 AI 模拟
```

#### 团队反复失效模式

经理不再逐个人凭经验判断，而是能看到团队本周反复出现的问题，例如：

- 没有明确下一步承诺
- 证据先于有效探询
- 呈现内容与当前 Context 不匹配
- 一次拜访同时推进多个目标

每个失效模式展示：

- 本周出现次数
- 占比
- 与上周变化
- 对应能力维度
- 推荐团队辅导动作

#### 陪练完成度

团队页面直接展示每个人四轮 AI 陪练进度：

```text
未开始
进行中 2/4
已通过
```

点击代表可以继续未完成的陪练。

#### 团队能力热力图

能力热力图包含：

- 目标清晰
- 探询质量
- 证据匹配
- 异议处理
- 推进承诺

评分会同时参考：

```text
真实拜访评分
+
AI 四轮模拟结果
```

因此完成陪练后，团队能力画像和辅导优先级会随前端状态变化。

## 本轮 Director Cockpit → Brief 管理闭环

Director Decision Cockpit 现在不再和 Weekly Brief 平行存在。

总监在 Cockpit 里选择：

```text
加资源
保持
纠偏
升级
停止
```

后，系统会同时产生两类影响：

```text
执行影响
+
资源变化
```

例如：

### 华东附一

```text
加资源
→
MDT 场景医学支持进入执行中
→
不增加泛化活动预算
→
相关医院 Action 保持执行
```

### 刘晨

```text
升级
→
普通辅导升级为经理结构化 Coaching
→
占用本周核心辅导资源
→
辅导 Action 进入执行态
```

### 海川

```text
停止
→
大型活动资源 HOLD
→
预算转向影响者地图和决策链信息
→
医院 Action 聚焦信息补全
```

### 滨江

```text
保持
→
保持病例会投入
→
48 小时内锁定日期 / 名单 / 病例
```

Cockpit 页面新增：

```text
Weekly Brief Impact Preview
```

展示：

- 当前 Cockpit 有多少项决策
- 当前 Brief Snapshot 有多少项决策
- 是否存在待同步变化
- 每个决策对资源的影响

为了保持周会快照不可被后台操作偷偷改写，Cockpit 决策不会自动覆盖已经关闭的 Brief。

总监需要明确点击：

```text
同步当前决策到 Brief
```

系统才会：

```text
重新生成 Weekly Snapshot
→
切换到 Director Brief
→
展示新的管理决策与资源变化
```

### Director Brief 新增

总监版现在增加：

```text
本周总监决策与资源变化
```

每项显示：

- 管理动作
- 决策对象
- WHY
- Resource Impact
- Execution Impact

Territory Comparison 也新增：

```text
管理动作 / 资源变化
```

列。

### Executive Brief 新增

Executive 版新增：

```text
DIRECTOR DECISIONS
```

只保留最关键的管理动作，例如：

```text
加资源 · 华东附一
MDT 医学支持进入执行中

停止 · 海川
大型活动资源 HOLD

升级 · 刘晨
升级为结构化 Coaching
```

Executive Summary 也会自动加入：

```text
销售总监本周完成 N 项明确管理决策
```

以及最重要的决策对象和动作。

## 本轮 Brief 三视图增强

Weekly Decision Brief 现在支持同一份 Snapshot 的三种阅读方式：

```text
经理版
总监版
Executive
```

三种视图不会生成三套数据，而是读取同一个周会快照。

### 经理版

保留执行细节：

- 本周变化
- 三家医院目标与 Action
- 管理判断
- Outcome
- 高优先行为风险
- Champion Pattern
- 下周 Owner / Success Signal

适合地区经理执行周会和跟进。

### 总监版

总监版聚焦：

```text
哪里正在推进
哪里需要管理介入
资源是否需要调整
哪个打法值得扩大验证
```

新增“区域健康度”：

- Business Momentum
- Execution Quality
- Organization Learning

每个维度输出：

```text
红 / 黄 / 绿
+
百分比
+
判断依据
```

例如：

```text
Business Momentum
78%
绿
医院关键杠杆推进 + 客户 Outcome
```

同时新增：

```text
Territory Comparison
```

横向比较三家重点医院的：

- Action
- Outcome
- 风险

并新增：

```text
Management Attention
```

它不是普通风险清单，而是需要管理判断的问题：

```text
是否需要介入?
当前是什么情况?
建议怎么做?
```

### Executive View

Executive 版进一步压缩为一屏摘要。

结构：

```text
一句话结论
↓
区域健康度
↓
Executive Summary
↓
Management Attention
↓
Champion Pattern
↓
下周只做这些
```

Executive Summary 最多保留 5 条结论，只展示真正会改变管理动作的信息。

### 三视图切换

Brief 顶部提供：

```text
[经理版] [总监版] [Executive]
```

切换只改变阅读方式，不改变 Snapshot。

打印 / 保存 PDF 会打印当前选择的视图。

## 本轮 Weekly Decision Brief 增强

周度 Review 关闭以后，系统会自动生成一张只读的：

```text
Weekly Decision Brief
```

这张 Brief 不再展示完整操作过程，而是把周会压缩成一页，只回答 5 个问题：

```text
本周什么变了
做了什么判断
为什么这样做
结果如何
下周只做什么
```

### 快照机制

点击：

```text
完成本周 Review
```

后，系统会在浏览器中保存当前周会状态快照，并自动跳转到 Brief 页面。

快照会固定记录当时的：

- 医院推进进度
- Action 执行状态
- Coaching 完成度
- Outcome 信号
- 团队趋势
- Champion Pattern
- 管理决策
- 高优先风险
- 已确认的下周 Action

这样后续继续演示时，不会自动改写已经关闭的本周 Brief。

如果确实希望按当前状态覆盖，可以点击：

```text
按当前状态重新生成
```

### Brief 页面结构

一页包含：

```text
01 本周什么变了
02 重点医院发生了什么
03 本周做了什么判断
04 结果到底如何
05 仍需警惕什么
06 值得复制什么
07 下周只做这些
```

顶部同时显示：

- 医院推进
- Action 执行
- Coaching 完成度
- Outcome 回流
- 团队拜访分变化

### 打印与保存 PDF

Brief 页面支持：

```text
打印 / 保存 PDF
```

使用浏览器原生打印能力，不依赖任何后端。

打印样式会自动隐藏：

- 左侧导航
- 顶部工具栏
- 抽屉
- Toast
- 演示导览
- 操作按钮

保留一页管理摘要内容。

当前打印版采用 A4 横向布局。

### 回看

周会关闭以后，即使重新回到“周度 Review”页面，也可以点击：

```text
查看 Weekly Decision Brief
```

回看本周已经锁定的决策摘要。

### 6. 周度经理 Review

地区经理新增独立的周度 Review 工作台。

目标不是再做一张周报，而是把前面所有 Agent 的状态收敛到一条经营链：

```text
医院目标
→
代表 Action
→
Coaching
→
Outcome
→
Champion Pattern
→
下周计划
```

页面顶部直接显示本周经营链完成度，并且每个节点可以钻回对应页面。

#### 医院目标与 Action Review

三家医院在一张表中查看：

- 本季度目标
- 当前 Action 进度
- 已完成 / 执行中数量
- 当前状态
- 本周真实 Outcome / 风险
- 一键返回 Hospital Agent

因此周会检查口径从：

```text
拜访了多少次
```

转成：

```text
关键业务杠杆有没有推进
```

#### 本周核心 Coaching

直接读取团队辅导的 30 分钟 Agenda：

```text
2 人 × 15 分钟
```

展示：

- 本周辅导对象
- Top 1 行为问题
- 当前拜访分
- 辅导优先级
- 是否完成本周辅导
- 一键进入单次 Coaching

#### Outcome Review

周会会自动汇总前端已经产生的真实信号：

- 拜访中形成的客户承诺
- 客户现场原话
- Action Outcome
- 医院业务里程碑
- 仍未解决的行为风险

重点不是“任务是否勾选完成”，而是：

```text
客户行为有没有变化
业务里程碑有没有变化
```

#### Champion Pattern

系统自动展示当前最值得复制的团队打法。

经理可以直接：

```text
采纳为团队 Playbook
```

采纳后继续回流 Learning Engine。

#### 下周行动计划

点击：

```text
生成下周计划
```

系统根据当前前端状态生成建议，例如：

- 锁定周敏 MDT 病例讨论
- 完成高优先代表 Top 1 行为辅导
- 锁定滨江病例会日期与名单
- 海川继续只买信息，不扩大活动预算
- 验证本周 Champion Pattern

经理可以逐条：

```text
✓ 采纳
□ 不采纳
```

并从计划项直接钻回 Hospital / Doctor / Team Coaching / Learning。

至少确认 3 项后，可以点击：

```text
完成本周 Review
```

把下周重点锁定。

因此地区经理现在可以完整演示：

```text
周一
看医院与今日行动

↓

周中
团队辅导 + 单次 Coaching

↓

周五
Weekly Review
医院目标
→ Action
→ Coaching
→ Outcome
→ Champion

↓

生成并确认下周重点
```

### 7. Visit Coaching Agent

围绕一次真实拜访复盘展示：

- 拜访评分
- 目标清晰度
- 探询质量
- 价值呈现
- 异议处理
- 下一步推进
- 关键拜访片段
- 首要问题诊断
- 下一次拜访脚本
- “原话 → 建议替换”关键句对比
- 经理检查证据
- 3 分钟自动复盘
- Top 1 问题确认
- AI 医生角色扮演
- 4 轮连续医生对话
- 探询 / 证据 / 异议 / 承诺四维训练
- 完整对话回放
- Simulation Scorecard
- 总分 / 最强维度 / 最弱维度
- 85 分通过线
- 重新挑战 4 轮
- 经理可检查的陪练证据

同时提供“上传拜访录音”交互入口。

当前不会真实上传文件，只在浏览器内模拟：

```text
录音
→ 转写
→ 关键片段识别
→ 问题诊断
→ 下一次辅导 NBA
```

## 本轮管理驾驶舱增强

销售总监页面现在不再只是看风险列表，而是可以直接做 5 类管理动作：

```text
加资源
保持
纠偏
升级
停止
```

每个需要介入的事项会展示：

- 业务对象
- 风险等级
- 为什么需要管理层介入
- AI 推荐管理动作
- Owner
- 五种可选管理动作
- 当前已决策状态
- 撤销 / 重新选择

管理动作会继续影响其他页面：

```text
Director Decision
    ↓
Hospital / Doctor / Coaching
    ↓
Action 状态
    ↓
Pilot Metrics
```

例如：

```text
华东附一
→ 总监选择“加资源”
→ Hospital Agent 显示销售总监决策
→ 医学支持资源进入执行
→ 关键 NBA 状态改变
→ Pilot 的 NBA 采纳率 / Action 完成率 / Review 覆盖率改变
```

海川人民医院可以演示：

```text
总监选择“停止”
→ 大型活动保持暂缓
→ 地区经理优先补齐关键影响者地图
→ 决策进入 Pilot 经营复盘
```

## 动态 Pilot Operations

Pilot Operations 的核心指标已经改为随当前前端状态动态计算，包括：

- 管理事项已决策数量
- NBA 采纳率
- Action 完成率
- Review 覆盖率
- Outcome 转化率
- Rule 有效复用
- Market Proof
- Product Proof
- Scale Readiness
- W1-W8 周次模拟
- 本周经营决策回流

同时支持 W1-W8 周次模拟。

可以点击：

- 任意周次
- 上一周
- 推进到下一周

总监驾驶舱产生的经营决策会自动进入 Pilot 页的“本周经营决策回流”，形成：

```text
总监做决定
→ 一线动作改变
→ Pilot 指标改变
→ 周度 Review
→ 是否扩展
```

### 8. Director Decision Cockpit

围绕管理层的五个问题：

1. 哪 3 家医院本周最值得关注？
2. 哪 5 个医生下一步最值得推进？
3. 哪些代表行动正在偏离策略？
4. 哪些拜访需要经理立即辅导？
5. 下一步应该加资源、纠偏、升级还是停止什么？

展示：

- 重点医院
- 关键医生
- 策略偏离
- 经理辅导
- 管理层介入事项
- 加资源 / 保持 / 纠偏 / 升级 / 停止
- 资源配置建议
- 管理决策历史
- 决策反向联动 Hospital / Doctor / Coaching
- Action → Outcome

### 9. Pilot Operations

模拟 8 周付费 Pilot：

```text
W1 启动
W2 诊断
W3-W6 GPS 运行
W7 复盘
W8 价值评估
```

展示：

- 周活跃率
- NBA 采纳率
- 行动完成率
- Review 覆盖率
- Rule 复用
- NBA → Action → Outcome 漏斗
- Market Proof
- Product Proof
- Scale Readiness

### 10. Learning Engine

用于演示：

```text
Context
→ Decision
→ NBA
→ Action
→ Outcome
→ Decision Rule
```

支持：

- Decision Trace
- Decision Rules
- Outcome 回流
- Rule Validation Queue
- Human Review
- 新建 Rule
- 批准 / 驳回 RuleValidation

全部为前端模拟。

### 11. Enterprise Guardrails

展示企业级要求：

- 内容防火墙
- 行为防火墙
- 医学证据来源
- FACT / INFERENCE / UNKNOWN
- Human Review
- 数据权限
- 敏感信息脱敏
- 审计
- SaaS / 私有化 / 混合部署概念

### 12. Organization & Access

展示：

- Organization
- Region
- User
- 医药代表
- 地区经理
- 销售总监
- RBAC 权限
- 数据范围
- 原型审计记录

## AI 行为如何模拟

`mock-api.js` 是浏览器内的“原型状态引擎”。

它模拟：

```text
generateNBA()
acceptNBA()
recordOutcome()
reviewRuleValidation()
transcribeVisit()
saveRule()
syncCRM()
createSession()
updateActionStatus()
```

不会发送网络请求。

## 原型状态保存

使用浏览器：

```text
localStorage
```

模拟保存：

- 当前角色
- Action 状态
- Decision Trace
- NBA
- Outcome
- RuleValidation
- 自定义 Rule
- 审计事件
- CRM 同步演示状态

如果希望恢复初始演示状态，可以清除浏览器站点数据或 localStorage。

## 运行

最简单的方式：

```text
直接打开 index.html
```

也可以使用任何普通静态文件服务器。

不需要：

```text
npm install
npm start
数据库
后端服务
```

## 内置客户演示场景

当前首页提供 3 套可以直接点击切换的脱敏业务故事：

### 重点医院攻坚

```text
华东附一
→ 找出方案选择节点的证据缺口
→ 落到周主任 MDT 场景
→ 生成医生 NBA
→ 复盘拜访
→ 管理层资源决策
```

### 关键医生突破

```text
滨江中心
→ 患者识别标准不一致
→ 王静主任
→ 从医生兴趣推进到病例共识会
→ 沉淀可复制打法
```

### 拜访失效修复

```text
刘晨 → 陈浩
→ 内容讲清楚但没有承诺
→ 找到“推进不够”
→ 关键句替换
→ 角色演练
→ 下一次检查证据
```

切换场景后，系统会自动联动：

- 当前角色
- 当前医院
- 当前医生
- 当前拜访
- 首页行动优先级
- AI 今日洞察

## 8 步客户演示导览

页面右下角提供“客户演示”入口。

导览顺序：

```text
01 今日行动
02 Hospital Agent
03 Doctor Agent
04 Visit Coaching
05 Director Cockpit
06 Learning Engine
07 Pilot Operations
```

导览过程中会自动切换到对应岗位：

```text
地区经理
→ 医药代表
→ 地区经理
→ 销售总监
```

因此可以直接用同一套故事向客户解释“同一个业务目标如何在不同岗位之间持续推进”。

首页同时增加：

```text
Hospital Agent
→ Doctor Agent
→ Coaching Agent
→ Decision Cockpit
```

的 Agent Team 行动交接视图。

## 演示重置

首页“客户演示场景”区域提供“一键重置演示”。

它会清除浏览器中的：

- Action 状态
- Decision Trace
- NBA
- Outcome
- RuleValidation
- 自定义 Rule
- 原型审计事件
- 当前场景

然后重新进入初始演示环境。

## 推荐客户演示路线

### 地区经理路线

```text
登录
→ 今日行动
→ Hospital Agent
→ 查看重点医院机会
→ 查看医院生态关系
→ AI 生成医院 NBA
→ 采纳 Action
→ Doctor Agent
→ 医生决策旅程
→ AI 生成拜访 NBA
→ Visit Coaching
→ 模拟录音转写
→ 下一次辅导建议
→ Outcome 回流
→ Learning Engine
```

### 销售总监路线

```text
登录
→ Director Decision Cockpit
→ 查看需要管理层介入的事项
→ 加资源 / 纠偏 / 停止
→ Pilot Operations
→ 查看 NBA → Action → Outcome
→ Learning Engine
→ Rule Validation
→ Human Review
```

## 当前代码结构

```text
index.html
styles.css
data.js
mock-api.js
app.js
README.md
```

说明：

- `index.html`: 页面骨架
- `styles.css`: UI Design System
- `data.js`: 脱敏演示数据
- `mock-api.js`: 浏览器内状态和 AI 行为模拟
- `app.js`: 页面、路由和交互逻辑

## 当前阶段不做

暂时不建设：

- PostgreSQL
- Java / Node 后端
- REST API
- CRM Connector
- 真实 ASR
- 真实大模型
- RAG
- SSO
- 正式权限服务
- 服务端审计
- 部署架构

这些内容等客户确认产品流程和原型后，再进入正式工程阶段。

## 当前目标

当前唯一目标是：

> 让客户看见系统以后，能够完整理解 AI GPS 怎么改变地区经理、医药代表和销售总监每天的工作方式。

因此优先级是：

```text
产品体验
> 页面完整度
> 交互可信度
> 演示故事完整性
> 技术实现复杂度
```
