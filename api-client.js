window.ZG_API = (function (fallback) {
  "use strict";

  var online = null;

  function delay(ms) {
    return new Promise(function (resolve) { setTimeout(resolve, ms); });
  }

  async function request(path, options, timeoutMs) {
    var controller = typeof AbortController !== "undefined" ? new AbortController() : null;
    var timer = controller ? setTimeout(function () { controller.abort(); }, timeoutMs || 1800) : null;
    try {
      var response = await fetch(path, Object.assign({
        headers: { "Content-Type": "application/json" },
        signal: controller ? controller.signal : undefined
      }, options || {}));
      if (!response.ok) throw new Error("HTTP " + response.status);
      online = true;
      return await response.json();
    } catch (error) {
      online = false;
      throw error;
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  async function streamText(text, onToken) {
    var chunks = String(text || "").match(/.{1,8}/g) || [];
    for (var i = 0; i < chunks.length; i += 1) {
      await delay(36 + (i % 3) * 15);
      if (onToken) onToken(chunks[i], i === chunks.length - 1);
    }
  }

  async function generateNBA(type, context, onToken) {
    try {
      var result = await request("/api/nba/generate", {
        method: "POST",
        body: JSON.stringify({
          type: type,
          context: context || {},
          actor: context && context.actor
        })
      }, 3000);
      await streamText(result.text, onToken);
      return result;
    } catch (error) {
      return fallback.generateNBA(type, context, onToken);
    }
  }

  async function transcribeVisit(file) {
    try {
      return await request("/api/visits/transcribe", {
        method: "POST",
        body: JSON.stringify({
          fileName: file && file.name ? file.name : "demo-visit.m4a"
        })
      }, 3500);
    } catch (error) {
      return fallback.transcribeVisit(file);
    }
  }

  async function saveRule(rule) {
    try {
      return await request("/api/rules", {
        method: "POST",
        body: JSON.stringify(rule || {})
      }, 2200);
    } catch (error) {
      return fallback.saveRule(rule);
    }
  }

  async function syncCRM(payload) {
    try {
      return await request("/api/crm/sync", {
        method: "POST",
        body: JSON.stringify(payload || {})
      }, 2200);
    } catch (error) {
      return fallback.syncCRM(payload);
    }
  }

  async function createSession(session) {
    try {
      return await request("/api/session", {
        method: "POST",
        body: JSON.stringify(session || {})
      }, 1800);
    } catch (error) {
      return { ok: true, session: session, offline: true };
    }
  }

  async function updateActionStatus(actionId, status, actor) {
    try {
      return await request("/api/actions/" + encodeURIComponent(actionId), {
        method: "PATCH",
        body: JSON.stringify({ status: status, actor: actor })
      }, 1800);
    } catch (error) {
      return { ok: true, actionId: actionId, status: status, offline: true };
    }
  }

  async function bootstrap() {
    try {
      return await request("/api/bootstrap", { method: "GET" }, 1200);
    } catch (error) {
      return { ok: true, offline: true, actionStatus: {}, customRules: [] };
    }
  }

  async function getOrg() {
    try {
      return await request("/api/org", { method: "GET" }, 1500);
    } catch (error) {
      return {
        ok: true,
        offline: true,
        organization: { name: "ZG AI GPS Demo", regions: [] },
        users: [],
        roles: []
      };
    }
  }

  async function getAudit() {
    try {
      return await request("/api/audit", { method: "GET" }, 1500);
    } catch (error) {
      return { ok: true, offline: true, audit: [] };
    }
  }

  async function health() {
    try {
      return await request("/api/health", { method: "GET" }, 1000);
    } catch (error) {
      return { ok: false, offline: true, service: "Browser Mock Mode" };
    }
  }

  function isOnline() {
    return online;
  }

  return {
    generateNBA: generateNBA,
    transcribeVisit: transcribeVisit,
    saveRule: saveRule,
    syncCRM: syncCRM,
    createSession: createSession,
    updateActionStatus: updateActionStatus,
    bootstrap: bootstrap,
    getOrg: getOrg,
    getAudit: getAudit,
    health: health,
    isOnline: isOnline
  };
})(window.ZG_API);
