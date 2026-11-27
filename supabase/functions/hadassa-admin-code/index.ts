import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

const url = Deno.env.get("SUPABASE_URL")!;
const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

async function digest(email: string, code: string) {
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(serviceKey), { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(email + ":" + code));
  return Array.from(new Uint8Array(signature), b => b.toString(16).padStart(2, "0")).join("");
}

function makeCode() {
  const values = new Uint32Array(1);
  crypto.getRandomValues(values);
  return String(values[0] % 1_000_000).padStart(6, "0");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Méthode non autorisée." }, 405);

  try {
    const body = await req.json();
    const action = body?.action;
    const email = String(body?.email || "").trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return json({ error: "Adresse e-mail invalide." }, 400);
    }
    if (email === "drivelinkxv76@gmail.com") return json({ error: "Le Super Admin utilise son mot de passe." }, 403);

    const { data: invite, error: inviteError } = await admin
      .from("hadassa_admin_users").select("id,email,is_active")
      .eq("email", email).eq("is_active", true).maybeSingle();
    if (inviteError) throw inviteError;
    if (!invite) return json({ error: "Cette adresse n’a pas été invitée ou son accès est désactivé." }, 403);

    if (action === "issue") {
      const authorization = req.headers.get("Authorization") || "";
      const token = authorization.replace(/^Bearer\s+/i, "");
      if (!token) return json({ error: "Authentification Super Admin requise." }, 401);
      const caller = createClient(url, anonKey, {
        auth: { persistSession: false, autoRefreshToken: false },
        global: { headers: { Authorization: "Bearer " + token } },
      });
      const { data: userData, error: userError } = await caller.auth.getUser(token);
      if (userError || !userData.user) return json({ error: "Session Super Admin invalide." }, 401);
      const { data: root, error: rootError } = await admin.from("hadassa_admin_users")
        .select("id").eq("user_id", userData.user.id).eq("role", "super_admin")
        .eq("is_active", true).maybeSingle();
      if (rootError) throw rootError;
      if (!root) return json({ error: "Seul le Super Admin peut générer un code." }, 403);

      const { data: users, error: usersError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      if (usersError) throw usersError;
      if (!users.users.some((u) => (u.email || "").toLowerCase() === email)) {
        const { error: createError } = await admin.auth.admin.createUser({ email, email_confirm: true });
        if (createError) throw createError;
      }

      const code = makeCode();
      const codeHash = await digest(email, code);
      const { error: saveError } = await admin.from("hadassa_admin_login_codes").upsert({
        email, code_hash: codeHash, expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        attempts: 0, used_at: null, updated_at: new Date().toISOString(),
      }, { onConflict: "email" });
      if (saveError) throw saveError;
      return json({ code, expires_in_seconds: 900 });
    }

    if (action === "redeem") {
      const code = String(body?.code || "").trim();
      if (!/^\d{6}$/.test(code)) return json({ error: "Le code doit contenir 6 chiffres." }, 400);
      const codeHash = await digest(email, code);
      const { data: consumed, error: consumeError } = await admin.rpc("consume_hadassa_admin_code", {
        p_email: email, p_code_hash: codeHash,
      });
      if (consumeError) throw consumeError;
      if (consumed !== true) return json({ error: "Code incorrect, expiré ou déjà utilisé." }, 401);

      const { data: link, error: linkError } = await admin.auth.admin.generateLink({ type: "magiclink", email });
      if (linkError) throw linkError;
      const tokenHash = link?.properties?.hashed_token;
      if (!tokenHash) throw new Error("Supabase n’a pas généré le jeton de session.");
      return json({ token_hash: tokenHash });
    }

    return json({ error: "Action inconnue." }, 400);
  } catch (error) {
    console.error("hadassa-admin-code:", error);
    return json({ error: error instanceof Error ? error.message : "Erreur interne." }, 500);
  }
});
