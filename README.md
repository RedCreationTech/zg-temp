# ZG AI GPS 原型

这是基于《ZG AI_GPS_客户拜访版》整理并实现的可交互产品原型。

## 产品定位

ZG AI GPS 是面向医药销售团队的 **System of Action**。它不是 CRM、BI、知识库或通用聊天机器人，而是把医院洞察、医生洞察、真实拜访、组织经验与规则转成可执行的“下一步行动”。

原型围绕以下结构展开：

- 1 个母系统：ZG Pharma Sales AI GPS
- 3 个核心 Agent：
  - Hospital Agent：医院作战计划
  - Doctor Agent：医生行动导航
  - Visit Coaching Agent：拜访辅导
- 1 个管理驾驶舱：Director Decision Cockpit
- 1 套学习闭环：Context → Decision → NBA → Action → Outcome → Rule Update

## 原型包含

- 今日行动驾驶舱
- 医院作战计划
- 医生行动导航
- 拜访辅导
- 销售总监决策看板
- Decision Rules / Learning Engine
- 企业合规与数据安全 Guardrails
- 可点击的行动卡片、状态流转、下一步行动抽屉
- 浏览器 localStorage 保存演示状态

## 运行

这是纯静态前端原型，不需要安装依赖。

直接打开：

```text
index.html
```

也可以用任意静态服务器启动，例如：

```bash
python3 -m http.server 8080
```

然后访问：

```text
http://localhost:8080
```

## 演示建议

推荐按下面路径演示：

1. 从“今日行动”进入本周最优先的医院 NBA。
2. 进入“医院作战”，查看机会、Top 1–3 杠杆点和资源配置。
3. 进入“医生导航”，从医院策略落到具体医生下一次拜访。
4. 进入“拜访辅导”，对真实拜访做复盘、诊断和下一次脚本优化。
5. 进入“总监驾驶舱”，查看需要推进、纠偏、升级、停止的动作。
6. 进入“组织学习”，查看有效动作如何沉淀为 Decision Rules。
7. 最后进入“合规与安全”，说明证据可追溯、Human Review、数据分级与审计。

## 说明

当前版本使用脱敏演示数据，重点验证产品信息架构、工作流、角色协同和“下一步行动”体验。后续可继续接入真实 CRM、SFE、医学知识库、拜访记录、语音转写、组织规则库与大模型服务。
