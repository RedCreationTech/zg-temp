window.ZG_API = (function () {
  "use strict";

  function delay(ms) {
    return new Promise(function (resolve) { setTimeout(resolve, ms); });
  }

  async function streamText(text, onToken) {
    var chunks = String(text).match(/.{1,7}/g) || [];
    for (var i = 0; i < chunks.length; i += 1) {
      await delay(45 + (i % 4) * 18);
      onToken(chunks[i], i === chunks.length - 1);
    }
  }

  async function generateNBA(type, context, onToken) {
    var outputs = {
      hospital: "已结合患者流、医院生态、关键医生和资源约束重新计算。建议本周不要增加泛化覆盖，把医学资源集中到周三 MDT 的方案选择节点。Owner 为地区经理与负责代表，成功信号是关键医生愿意在一例匹配患者中讨论目标方案。",
      doctor: "当前最佳动作不是继续介绍产品，而是绑定医生即将发生的真实决策场景。先确认患者选择标准，再调用与该标准直接相关的证据，最后请求一个有时间、有对象、可验证的下一步承诺。",
      coaching: "本次拜访的首要失效点是探询不足。下一次先用两个问题确认医生的决策标准，再呈现证据。经理应在拜访前完成一次角色演练，并在拜访后检查是否形成明确行为承诺。",
      cockpit: "管理层本周建议增加华东附一的场景化医学支持，维持滨江病例会投入，暂停海川大型活动并优先补齐决策链情报，同时升级连续三次未形成下一步承诺的代表辅导。"
    };
    var text = outputs[type] || outputs.doctor;
    if (onToken) await streamText(text, onToken);
    return { ok: true, type: type, context: context || {}, text: text, model: "ZG Decision Engine Mock" };
  }

  async function transcribeVisit(file) {
    await delay(780);
    return {
      ok: true,
      fileName: file && file.name ? file.name : "拜访录音.m4a",
      duration: "08:42",
      transcript: [
        { speaker: "代表", time: "00:18", text: "周主任, 我带来了一组新的真实世界数据, 想和您快速看一下。" },
        { speaker: "医生", time: "00:42", text: "数据我看过一些, 但我现在更关心这类患者到底怎么选。" },
        { speaker: "代表", time: "01:05", text: "这组研究纳入了不少高风险患者, 长期结果也比较完整。" },
        { speaker: "医生", time: "02:14", text: "我的问题还是哪些患者值得现在就调整方案。" },
        { speaker: "代表", time: "07:52", text: "好的, 那您有时间再看看, 我下次再来。" }
      ],
      diagnosis: {
        topIssue: "探询不足",
        score: 72,
        evidence: "医生连续两次把问题拉回“患者怎么选”, 代表仍然继续呈现证据, 没有确认医生的选择标准。",
        nextAction: "下一次先确认两个患者选择标准, 再调用对应证据, 结束时请求在具体 MDT 病例中讨论。"
      }
    };
  }

  async function saveRule(rule) {
    await delay(420);
    return {
      ok: true,
      rule: Object.assign({}, rule, {
        id: rule.id || "R-" + String(Math.floor(100 + Math.random() * 800)),
        status: rule.status || "testing",
        confidence: Number(rule.confidence || 60),
        uses: Number(rule.uses || 0)
      })
    };
  }

  async function syncCRM(payload) {
    await delay(360);
    return { ok: true, syncedAt: new Date().toISOString(), payload: payload };
  }

  return {
    generateNBA: generateNBA,
    transcribeVisit: transcribeVisit,
    saveRule: saveRule,
    syncCRM: syncCRM
  };
})();