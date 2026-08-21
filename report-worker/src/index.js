const allowedOrigins = new Set(["https://goodburrow.com", "https://www.goodburrow.com"]);

function response(body, status, origin) {
  const headers = { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" };
  if (allowedOrigins.has(origin)) headers["access-control-allow-origin"] = origin;
  return new Response(JSON.stringify(body), { status, headers });
}

function clean(value, maximum) {
  return typeof value === "string" ? value.trim().slice(0, maximum) : "";
}

export function validate(raw, now = Date.now()) {
  const report = {
    app: clean(raw?.app, 80), appName: clean(raw?.appName, 120), version: clean(raw?.version, 80), os: clean(raw?.os, 160),
    happened: clean(raw?.happened, 4000), expected: clean(raw?.expected, 2000), replyEmail: clean(raw?.replyEmail, 254), website: clean(raw?.website, 200)
  };
  const openedAt = Number(raw?.openedAt);
  if (report.website) return { ignored: true };
  if (!report.app || !report.happened || !report.expected) return { error: "Complete the required fields." };
  if (!Number.isFinite(openedAt) || now - openedAt < 1500 || now - openedAt > 86_400_000) return { error: "Refresh the form and try again." };
  if (report.replyEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(report.replyEmail)) return { error: "Enter a valid reply email." };
  return { report };
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("origin") || "";
    if (request.method === "OPTIONS" && allowedOrigins.has(origin)) {
      return new Response(null, { status: 204, headers: { "access-control-allow-origin": origin, "access-control-allow-methods": "POST", "access-control-allow-headers": "content-type", "access-control-max-age": "86400" } });
    }
    if (request.method !== "POST" || !allowedOrigins.has(origin)) return response({ error: "Not found." }, 404, origin);
    if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) return response({ error: "Unsupported request." }, 415, origin);
    let raw;
    try { raw = await request.json(); } catch { return response({ error: "Invalid report." }, 400, origin); }
    const result = validate(raw);
    if (result.ignored) return response({ ok: true }, 200, origin);
    if (result.error) return response({ error: result.error }, 400, origin);
    const item = result.report;
    const reply = item.replyEmail ? `\nReply email: ${item.replyEmail}` : "\nReply email: Not provided";
    await env.REPORT_EMAIL.send({
      to: env.REPORT_RECIPIENT,
      from: env.REPORT_FROM,
      subject: `[Good Burrow] Problem report: ${item.appName || item.app}`,
      text: `App: ${item.appName || item.app}\nVersion: ${item.version || "Unknown"}\nOS: ${item.os || "Unknown"}${reply}\n\nWhat happened\n${item.happened}\n\nWhat was expected\n${item.expected}`,
      ...(item.replyEmail ? { replyTo: item.replyEmail } : {})
    });
    return response({ ok: true }, 200, origin);
  }
};
