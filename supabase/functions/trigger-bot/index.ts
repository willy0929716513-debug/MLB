// Supabase Edge Function: trigger-bot
// 代理 GitHub Actions workflow_dispatch，讓手機端不需直接存取 GitHub API
// 部署：在 Supabase Dashboard → Edge Functions → New Function → 貼上此程式碼
// 環境變數（在 Function settings 設定）：
//   GH_TOKEN        : GitHub Personal Access Token（需有 actions:write 權限）
//   TRIGGER_SECRET  : 自訂密語（選填，不設則任何人都能觸發）

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const GH_TOKEN      = Deno.env.get("GH_TOKEN") ?? "";
const TRIGGER_SECRET = Deno.env.get("TRIGGER_SECRET") ?? "";
const REPO          = "willy0931926721-hub/MLB";
const WORKFLOW      = "mlb_bot.yml";

const CORS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

serve(async (req: Request) => {
  // preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS });
  }
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405, headers: CORS });
  }

  // optional secret check
  if (TRIGGER_SECRET) {
    let body: Record<string, unknown> = {};
    try { body = await req.json(); } catch { /* no body */ }
    if ((body.secret ?? "") !== TRIGGER_SECRET) {
      return new Response(
        JSON.stringify({ ok: false, error: "Unauthorized" }),
        { status: 401, headers: { ...CORS, "Content-Type": "application/json" } }
      );
    }
  }

  if (!GH_TOKEN) {
    return new Response(
      JSON.stringify({ ok: false, error: "GH_TOKEN not configured" }),
      { status: 500, headers: { ...CORS, "Content-Type": "application/json" } }
    );
  }

  // dispatch to GitHub Actions
  const ghRes = await fetch(
    `https://api.github.com/repos/${REPO}/actions/workflows/${WORKFLOW}/dispatches`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GH_TOKEN}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      body: JSON.stringify({ ref: "main" }),
    }
  );

  if (ghRes.status === 204) {
    return new Response(
      JSON.stringify({ ok: true, message: "Bot triggered successfully" }),
      { headers: { ...CORS, "Content-Type": "application/json" } }
    );
  }

  const errText = await ghRes.text();
  return new Response(
    JSON.stringify({ ok: false, error: `GitHub ${ghRes.status}: ${errText}` }),
    { status: 502, headers: { ...CORS, "Content-Type": "application/json" } }
  );
});
