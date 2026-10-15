// =========================================================
// CHEMINANT — Edge Function « api »
// Seul point d'accès aux données depuis le navigateur (js/api.js, mode "supabase").
// Elle vérifie le jeton Supabase Auth, puis lit et écrit avec la clé service_role
// (qui contourne la RLS) : c'est donc ICI que chaque route contrôle le rôle et le
// périmètre du compte connecté. Contrats des routes : commentaires de js/api.js.
//
// GET /state renvoie, pour le compte connecté, un état de la même forme que l'état
// de démo (js/store.js), limité à ce que ce compte a le droit de voir : le
// navigateur ne reçoit jamais le score de compatibilité, le motif interne d'un
// refus, ni le montant d'un autre bénéficiaire.
//
// SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont fournis automatiquement par
// Supabase. Secrets facultatifs (supabase secrets set) : ALLOWED_ORIGIN (une ou
// plusieurs adresses séparées par des virgules), SITE_URL,
// PAYMENT_MODE ("simulation" tant qu'aucun prestataire n'est branché).
// =========================================================

import { createClient, type SupabaseClient, type User } from "npm:@supabase/supabase-js@2.45.4";

const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
  auth: { persistSession: false, autoRefreshToken: false }
});

// En local, le site s'ouvre aussi bien sur localhost que sur 127.0.0.1 : deux origines distinctes pour le navigateur
const ALLOWED_ORIGINS = (Deno.env.get("ALLOWED_ORIGIN") ?? "http://localhost:5173,http://127.0.0.1:5173")
  .split(",").map(o => o.trim().replace(/\/$/, "")).filter(Boolean);
const SITE_URL = Deno.env.get("SITE_URL") ?? ALLOWED_ORIGINS[0];
const PAYMENT_MODE = Deno.env.get("PAYMENT_MODE") ?? "simulation";

// Access-Control-Allow-Origin est ajouté par le point d'entrée, d'après l'origine de la requête
const cors = {
  "Access-Control-Allow-Headers": "authorization, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Vary": "Origin"
};

const json = (status: number, body: unknown) =>
  new Response(body === null ? null : JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json", "Cache-Control": "no-store" }
  });
const ok = (body: unknown = null) => (body === null ? new Response(null, { status: 204, headers: cors }) : json(200, body));

class HttpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
const fail = (status: number, message: string): never => { throw new HttpError(status, message); };

/* ---------- Constantes métier (miroir de js/data.js) ---------- */
const COURSE_COUNTS: Record<number, number> = { 1: 6, 2: 8, 3: 8, 4: 6, 5: 7, 6: 8, 7: 6, 8: 7, 9: 8, 10: 8 };
const MODULE_IDS = Object.keys(COURSE_COUNTS).map(Number);
const LESSON_COUNT = 6;           // formats de leçon par module (#/parcours)
const SESSION_COUNT = 5;          // séances d'accompagnement
const PREP_TASK_COUNT = 11;       // tâches de préparation au mariage
const MIN_SUSPENSION_DAYS = 2;
const PLANS = ["single", "cheminant"];
const REGIONS = ["europe", "afrique"];
const METHODS: Record<string, Record<string, string>> = {
  europe: { carte: "Stripe", paypal: "PayPal" },
  afrique: { mobile: "Agrégateur Mobile Money" }
};
const REPORT_REASONS = ["Propos irrespectueux ou déplacés", "Demande d'argent ou d'informations personnelles", "Faux profil ou usurpation", "Insistance malgré un refus", "Autre motif"];
const REFERENT_ROLES = ["Pasteur / prêtre", "Ancien", "Responsable de pastorale des couples", "Diacre", "Autre responsable", "Référent désigné"];
const DENOMINATIONS = ["Évangélique", "Catholique", "Protestante", "Pentecôtiste", "Baptiste", "Adventiste", "Orthodoxe", "Autre"];
const PALETTE = [["#3d7a5a", "#2f5f8a"], ["#a3204f", "#e08a5b"], ["#2f5f8a", "#7cb4c9"], ["#5b3e8a", "#c06c84"], ["#c7962c", "#a3204f"], ["#1f6f78", "#8fc1a9"], ["#b5485d", "#f2b880"], ["#7d153b", "#c06c84"]];

const FAITH: Record<string, string> = { centrale: "Foi centrale dans mon quotidien", importante: "Foi importante au quotidien", cheminement: "En cheminement dans la foi" };
const CHILDREN: Record<string, string> = { oui: "Souhaite des enfants", ouvert: "Ouvert(e) à avoir des enfants", non: "Ne souhaite pas d'enfants" };
const MOBILITY: Record<string, string> = { locale: "Souhaite rester dans sa région", france: "Mobile en France", monde: "Ouvert(e) à l'international" };
const VALUES: Record<string, string> = { priere: "Prier ensemble", communication: "Communication", service: "Servir ensemble", famille: "Famille", fidelite: "Fidélité", humour: "Humour", ambition: "Projets communs" };

/* ---------- Petits utilitaires ---------- */
// Même règle que CH.clean côté client : retire le balisage et les caractères de contrôle
const clean = (v: unknown, max = 120) =>
  String(v ?? "").replace(/[<>"`\u0000-\u001f\u007f]/g, "").replace(/\s+/g, " ").trim().slice(0, max);
const text = (v: unknown, max = 2000) =>
  String(v ?? "").replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "").trim().slice(0, max);
const isUuid = (v: unknown) => typeof v === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) && v.length <= 160;
const pair = (x: string, y: string) => (x < y ? [x, y] : [y, x]);
const now = () => new Date().toISOString();
const frDate = (iso: string | null) => iso ? new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" }) : "";
const daysSince = (iso: string | null) => iso ? Math.floor((Date.now() - new Date(iso).getTime()) / 86400000) : null;
const fullName = (u: { first_name?: string; last_name?: string } | null) => u ? `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim() : "";

/* Vérifie une réponse supabase-js et renvoie ses données */
function must<T>(res: { data: T; error: { message: string; code?: string } | null }, status = 500): T {
  if (res.error) {
    console.error(res.error);
    const code = res.error.code;
    if (code === "42501") fail(403, "Action non autorisée.");
    if (code === "P0002") fail(404, "Élément introuvable.");
    if (code === "22023" || code === "23514") fail(422, "Cette action n'est pas possible.");
    if (code === "23505") fail(409, "Cet élément existe déjà.");
    fail(status, "Une erreur est survenue. Merci de réessayer.");
  }
  return res.data;
}

async function readJson(req: Request): Promise<Record<string, unknown>> {
  if (req.method === "GET" || req.method === "DELETE") return {};
  try {
    const body = await req.json();
    return body && typeof body === "object" ? body : {};
  } catch {
    return {};
  }
}

/* ---------- Routeur ---------- */
type Me = { id: string; role: "membre" | "referent" | "eglise" | "admin"; first_name: string; last_name: string; email: string | null; read_notifs: string[]; chat_charter_at: string | null; last_seen_at: string | null };
type Ctx = { req: Request; url: URL; user: User | null; me: Me; body: Record<string, unknown>; params: Record<string, string> };
type Handler = (ctx: Ctx) => Promise<Response>;
type Access = "public" | "auth" | Me["role"] | Me["role"][];
type Route = { method: string; pattern: RegExp; keys: string[]; access: Access; handler: Handler };

const routes: Route[] = [];
// Déclare une route : "/profiles/:id" → params.id. access : "public", "auth" ou rôle(s) autorisé(s).
function route(method: string, path: string, access: Access, handler: Handler) {
  const keys: string[] = [];
  const pattern = new RegExp("^" + path.replace(/:(\w+)/g, (_, k) => (keys.push(k), "([^/]+)")) + "$");
  routes.push({ method, pattern, keys, access, handler });
}

/* =========================================================
   Lectures partagées
   ========================================================= */

/* Églises actives, avec le nom de leur premier référent (affiché aux candidats) */
async function churchesWithReferent() {
  const churches = must(await db.from("churches").select("id, name, city, denomination, region, is_active, created_at").eq("is_active", true).order("name"));
  const refs = must(await db.from("church_referents").select("church_id, user_id, invited_at, users(first_name, last_name)").order("invited_at"));
  return churches.map(c => {
    const first = refs.find(r => r.church_id === c.id);
    // deno-lint-ignore no-explicit-any
    return { id: c.id, name: c.name, city: c.city, denomination: c.denomination, region: c.region, referent: first ? fullName((first as any).users) : "Référent de l'église" };
  });
}

/* Comptes actuellement suspendus ou désactivés */
async function sanctionedIds(ids?: string[]) {
  let q = db.from("member_sanctions").select("user_id, type, ends_at").is("lifted_at", null).in("type", ["suspension", "desactivation"]);
  if (ids) q = q.in("user_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);
  const rows = must(await q);
  return new Set(rows.filter(r => r.type === "desactivation" || (r.ends_at && new Date(r.ends_at) > new Date())).map(r => r.user_id));
}

/* Historique des sanctions par membre (administration) */
async function sanctionsOf(ids: string[]) {
  if (!ids.length) return {};
  const rows = must(await db.from("member_sanctions").select("user_id, report_id, type, starts_at, ends_at, lifted_at, note").in("user_id", ids).order("starts_at"));
  const map: Record<string, unknown[]> = {};
  rows.forEach(r => (map[r.user_id] ||= []).push({
    type: r.type, date: r.starts_at, reportId: r.report_id, note: r.note ?? "",
    until: r.type === "suspension" ? (r.lifted_at && r.lifted_at < (r.ends_at ?? "") ? r.lifted_at : r.ends_at) : undefined,
    lifted: Boolean(r.lifted_at)
  }));
  return map;
}

/* Membres d'une ou plusieurs églises (identifiants) */
async function membersOfChurches(churchIds: string[]) {
  if (!churchIds.length) return [];
  return must(await db.from("member_profiles").select("user_id").in("church_id", churchIds)).map(r => r.user_id);
}

/* Personnes citées dans un signalement : prénom, avatar et église, rien d'autre */
async function people(ids: string[]) {
  if (!ids.length) return {};
  const rows = must(await db.from("users").select("id, first_name, last_name, member_profiles(church_id, city, avatar_colors)").in("id", ids));
  const map: Record<string, unknown> = {};
  // deno-lint-ignore no-explicit-any
  rows.forEach((u: any) => {
    const mp = Array.isArray(u.member_profiles) ? u.member_profiles[0] : u.member_profiles;
    map[u.id] = { id: u.id, firstName: fullName(u), colors: mp?.avatar_colors ?? PALETTE[0], churchId: mp?.church_id ?? null, city: mp?.city ?? "" };
  });
  return map;
}

/* Signalements au format de l'interface */
// deno-lint-ignore no-explicit-any
const reportRow = (r: any) => ({
  id: String(r.id), reporter: r.reporter_id, reportedId: r.reported_id, reason: r.reason, details: r.details ?? "",
  context: r.context, excerpt: r.excerpt ?? [], date: r.created_at, status: r.status, referentNote: r.referent_note ?? "",
  decision: r.decision ?? undefined, decidedAt: r.decided_at ?? undefined, adminNote: r.admin_note ?? ""
});

/* Couples à l'École du mariage, avec la progression des cours de chaque conjoint */
async function schoolCouples(churchIds: string[] | null) {
  const rels = must(await db.from("relations").select("id, user_a, user_b, created_at, a_activated_at, b_activated_at").eq("status", "couple_en_cheminement"));
  if (!rels.length) return [];
  const ids = [...new Set(rels.flatMap(r => [r.user_a, r.user_b]))];
  const profiles = must(await db.from("member_profiles").select("user_id, church_id, avatar_colors, users(first_name)").in("user_id", ids));
  const progress = must(await db.from("course_progress").select("user_id, module_id, idx, done_at").in("user_id", ids));
  const weds = must(await db.from("weddings").select("relation_id, celebrated").in("relation_id", rels.map(r => r.id)));
  const sessions = must(await db.from("prep_sessions_done").select("relation_id").in("relation_id", rels.map(r => r.id)));
  const total = Object.values(COURSE_COUNTS).reduce((a, b) => a + b, 0);
  // deno-lint-ignore no-explicit-any
  const prof = (id: string) => profiles.find((p: any) => p.user_id === id) as any;
  const pct = (id: string) => Math.round((progress.filter(p => p.user_id === id).length / total) * 100);
  const current = (id: string) => MODULE_IDS.find(m => progress.filter(p => p.user_id === id && p.module_id === m).length < COURSE_COUNTS[m]) ?? 10;
  return rels
    .filter(r => !churchIds || [prof(r.user_a)?.church_id, prof(r.user_b)?.church_id].some(c => churchIds.includes(c)))
    .map(r => {
      const a = prof(r.user_a), b = prof(r.user_b);
      const last = progress.filter(p => p.user_id === r.user_a || p.user_id === r.user_b).map(p => p.done_at).sort().pop() ?? null;
      const married = weds.some(w => w.relation_id === r.id && w.celebrated);
      const status = married ? "Mariés" : sessions.some(s => s.relation_id === r.id) ? "Accompagnement" : "Couple en cheminement";
      const since = [r.a_activated_at, r.b_activated_at].sort().pop();
      return {
        id: r.id, names: `${a?.users?.first_name ?? ""} & ${b?.users?.first_name ?? ""}`,
        partners: [a?.users?.first_name ?? "", b?.users?.first_name ?? ""],
        churchId: a?.church_id ?? b?.church_id, since: since ? new Date(since).toLocaleDateString("fr-FR", { month: "long", year: "numeric" }) : "",
        status, progress: [pct(r.user_a), pct(r.user_b)], module: current(r.user_a), lastDays: daysSince(last),
        colors: [a?.avatar_colors ?? PALETTE[0], b?.avatar_colors ?? PALETTE[1]]
      };
    });
}

/* Référents (liste) au format de l'interface. trained : le référent s'est déjà connecté. */
async function referentsList(churchIds: string[] | null, withEmail: boolean) {
  let q = db.from("church_referents").select("church_id, user_id, title, invited_at, users(first_name, last_name, email, last_seen_at)").order("invited_at");
  if (churchIds) q = q.in("church_id", churchIds.length ? churchIds : ["00000000-0000-0000-0000-000000000000"]);
  // deno-lint-ignore no-explicit-any
  return must(await q).map((r: any) => ({
    id: r.user_id, churchId: r.church_id, name: fullName(r.users), role: r.title ?? "Référent désigné",
    trained: Boolean(r.users?.last_seen_at), ...(withEmail ? { email: r.users?.email ?? "" } : {})
  }));
}

/* Inscriptions validées et leur répartition (grand livre) */
async function ledgerRows(filter: { referentId?: string; churchIds?: string[] } = {}) {
  let q = db.from("validated_registrations").select("id, user_id, plan, region, currency, amount_ttc, amount_ht, referent_id, church_id, validated_at, reversements(beneficiary, amount)").order("validated_at", { ascending: false });
  if (filter.referentId) q = q.eq("referent_id", filter.referentId);
  if (filter.churchIds) q = q.in("church_id", filter.churchIds.length ? filter.churchIds : ["00000000-0000-0000-0000-000000000000"]);
  const rows = must(await q);
  const ids = [...new Set(rows.flatMap(r => [r.user_id, r.referent_id]))];
  const users = ids.length ? must(await db.from("users").select("id, first_name, last_name, member_profiles(avatar_colors)").in("id", ids)) : [];
  // deno-lint-ignore no-explicit-any
  const u = (id: string) => users.find((x: any) => x.id === id) as any;
  // deno-lint-ignore no-explicit-any
  return rows.map((r: any) => {
    const mp = Array.isArray(u(r.user_id)?.member_profiles) ? u(r.user_id).member_profiles[0] : u(r.user_id)?.member_profiles;
    const part = (b: string) => Number(r.reversements.find((x: { beneficiary: string }) => x.beneficiary === b)?.amount ?? 0);
    const round = (n: number) => r.currency === "XOF" ? Math.round(n) : Math.round(n * 100) / 100;
    return {
      id: r.id, name: fullName(u(r.user_id)), colors: mp?.avatar_colors ?? PALETTE[0], churchId: r.church_id,
      referentId: r.referent_id, referent: fullName(u(r.referent_id)), plan: r.plan, region: r.region,
      validatedAt: r.validated_at.slice(0, 10), currency: r.currency,
      gross: Number(r.amount_ttc), net: Number(r.amount_ht), tax: round(Number(r.amount_ttc) - Number(r.amount_ht)),
      toReferent: part("referent"), toChurch: part("eglise"), toPlatform: round(Number(r.amount_ht) - part("referent") - part("eglise"))
    };
  });
}

/* Notifications enregistrées pour un compte (décisions, sanctions, intérêts…) */
async function inbox(userId: string) {
  const rows = must(await db.from("notifications").select("id, icon, body, href, created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(30));
  return rows.map(n => ({ id: "n" + n.id, icon: n.icon, text: n.body, href: n.href, ts: n.created_at }));
}

/* =========================================================
   Compatibilité (serveur uniquement : le score n'est jamais renvoyé)
   ========================================================= */
type Answers = { faith?: string; children?: string; mobility?: string; values?: string[] };
// deno-lint-ignore no-explicit-any
function convergences(me: any, p: any, churches: Map<string, { denomination: string }>) {
  const a: Answers = me.answers ?? {}, b: Answers = p.answers ?? {};
  const order = ["centrale", "importante", "cheminement"];
  const gap = Math.abs(order.indexOf(a.faith ?? "") - order.indexOf(b.faith ?? ""));
  const faith = !a.faith || !b.faith ? "compatible" : gap === 0 ? "forte" : gap === 1 ? "convergence" : "discuter";
  const children = a.children === b.children ? "forte" : [a.children, b.children].includes("ouvert") ? "compatible" : "discuter";
  const sameCity = clean(me.city).toLowerCase() === clean(p.city).toLowerCase();
  const place = sameCity ? "forte" : [a.mobility, b.mobility].some(m => m === "france" || m === "monde") ? "compatible" : "discuter";
  const common = (a.values ?? []).filter(v => (b.values ?? []).includes(v)).length;
  const values = common >= 2 ? "forte" : common === 1 ? "convergence" : "compatible";
  const church = me.church_id === p.church_id ? "forte"
    : churches.get(me.church_id)?.denomination === churches.get(p.church_id)?.denomination ? "convergence" : "compatible";
  const conv: [string, string][] = [["Vision chrétienne", faith], ["Projet familial", children], ["Localisation", place], ["Valeurs du couple", values], ["Église et service", church]];
  const weight: Record<string, number> = { forte: 20, convergence: 15, compatible: 10, discuter: 4 };
  return { conv, score: conv.reduce((n, [, l]) => n + weight[l], 0) };
}

/* =========================================================
   GET /state : état du compte connecté
   ========================================================= */
route("GET", "/state", "auth", async ({ me }) => {
  if (!me.last_seen_at || Date.now() - new Date(me.last_seen_at).getTime() > 60000) {
    await db.from("users").update({ last_seen_at: now() }).eq("id", me.id);
  }
  const churches = await churchesWithReferent();
  if (me.role === "membre") return ok(await memberState(me, churches));
  if (me.role === "referent") return ok(await referentState(me, churches));
  if (me.role === "eglise") return ok(await churchState(me, churches));
  return ok(await adminState(me, churches));
});

// deno-lint-ignore no-explicit-any
async function memberState(me: Me, churches: any[]) {
  const mp = must(await db.from("member_profiles").select("*").eq("user_id", me.id).maybeSingle());
  const base = { role: "membre", email: me.email };
  if (!mp) {
    return { ...base, needsProfile: true, state: { user: { id: me.id, firstName: me.first_name, lastName: me.last_name, status: "incomplet", churchId: null, colors: PALETTE[0] } }, data: { churches } };
  }
  const review = must(await db.from("candidate_reviews").select("interview, interview_at, interview_place, decision, created_at").eq("user_id", me.id).maybeSingle());
  const mySanction = await sanctionedIds([me.id]);
  const paid = Boolean(mp.paid_until && new Date(mp.paid_until) > new Date());
  const active = mp.status === "actif";

  const user = {
    id: me.id, firstName: me.first_name, lastName: me.last_name, email: me.email, gender: mp.gender, age: mp.age, city: mp.city,
    churchId: mp.church_id, status: active ? "actif" : "en_attente_validation", candidateId: me.id, colors: mp.avatar_colors?.length ? mp.avatar_colors : PALETTE[0],
    plan: mp.plan, paid, paidUntil: mp.paid_until, paymentMethod: mp.payment_method, paymentRegion: mp.payment_region,
    job: mp.job ?? "", quote: mp.quote ?? "", about: mp.about ?? "", suspended: mySanction.has(me.id)
  };
  const myCandidate = {
    id: me.id, name: fullName(me), age: mp.age, city: mp.city, since: frDate(review?.created_at ?? mp.updated_at),
    interview: review?.interview ?? "a_planifier", date: review?.interview_at ?? null, place: review?.interview_place ?? "",
    decision: review?.decision ?? null, plan: mp.plan, colors: user.colors
  };

  const state: Record<string, unknown> = {
    user, interests: {}, passed: [], accompaniment: [], messages: {}, relationSince: {}, cheminantConsent: {}, chatRead: {},
    reports: [], sanctions: {}, blocked: [], chatCharter: Boolean(me.chat_charter_at), chatPing: true, discernment: {},
    modules: {}, notes: {}, courses: { me: {}, partner: {}, lastAt: { me: null, partner: null } },
    candidates: { [me.id]: { interview: myCandidate.interview, date: myCandidate.date, place: myCandidate.place, decision: myCandidate.decision } },
    coupleWith: null, prep: { sessions: [], tasks: [], weddingDate: "", married: false },
    settings: { suggestions: mp.suggestions_enabled, paused: mp.paused }, readNotifs: me.read_notifs ?? [],
    partnerRequests: [], extraChurches: [], extraReferents: [], payments: [], inbox: await inbox(me.id)
  };
  const data: Record<string, unknown> = { churches, candidates: [myCandidate], profiles: [], referents: await referentsList([mp.church_id], false) };

  const payments = must(await db.from("payments").select("created_at, plan, method, provider, region, currency, amount_ttc, period_end, status").eq("user_id", me.id).eq("status", "paye").order("created_at", { ascending: false }));
  state.payments = payments.map(p => ({ date: p.created_at, plan: p.plan, method: p.method, provider: p.provider, region: p.region, amount: Number(p.amount_ttc), currency: p.currency, until: p.period_end }));

  if (!active) return { ...base, state, data };

  /* ---------- Profils visibles : membres validés, ni suspendus ni désactivés ---------- */
  const others = must(await db.from("member_profiles")
    .select("user_id, church_id, gender, age, city, job, quote, about, faith, children, mobility, service, languages, interests, avatar_colors, paid_until, paused, suggestions_enabled, answers, users!inner(first_name, last_seen_at, deleted_at)")
    .eq("status", "actif").neq("user_id", me.id).is("users.deleted_at", null));
  const blockedMe = new Set(must(await db.from("member_blocks").select("user_id").eq("blocked_id", me.id)).map(r => r.user_id));
  const banned = await sanctionedIds();
  const churchMap = new Map(churches.map(c => [c.id, c]));
  const received = new Set(must(await db.from("interests").select("from_user").eq("to_user", me.id)).map(r => r.from_user));

  // deno-lint-ignore no-explicit-any
  const scored = others.filter((p: any) => !banned.has(p.user_id) && !blockedMe.has(p.user_id)).map((p: any) => {
    const { conv, score } = convergences(mp, p, churchMap);
    const a: Answers = p.answers ?? {};
    const seen = p.users.last_seen_at ? Math.floor((Date.now() - new Date(p.users.last_seen_at).getTime()) / 60000) : 1440;
    return {
      score, profile: {
        id: p.user_id, firstName: p.users.first_name, age: p.age, gender: p.gender, city: p.city, churchId: p.church_id,
        job: p.job ?? "", colors: p.avatar_colors?.length ? p.avatar_colors : PALETTE[0], quote: p.quote ?? "", about: p.about ?? "",
        faith: p.faith ?? FAITH[a.faith ?? ""] ?? "", children: p.children ?? CHILDREN[a.children ?? ""] ?? "",
        mobility: p.mobility ?? MOBILITY[a.mobility ?? ""] ?? "", service: p.service ?? "", languages: p.languages ?? "",
        interests: p.interests?.length ? p.interests : (a.values ?? []).map(v => VALUES[v]).filter(Boolean),
        conv, receivedInterest: received.has(p.user_id), status: "actif",
        paid: Boolean(p.paid_until && new Date(p.paid_until) > new Date()), paused: p.paused, lastSeenMin: seen < 3 ? 0 : seen
      }
    };
  });
  // Suggestions : les meilleurs points de convergence, sexe opposé, si le membre les accepte
  if (mp.suggestions_enabled) {
    scored.filter(x => x.profile.gender !== mp.gender && !x.profile.paused).sort((x, y) => y.score - x.score).slice(0, 6)
      .forEach(x => ((x.profile as Record<string, unknown>).suggested = true));
  }
  data.profiles = scored.map(x => x.profile);

  /* ---------- Intérêts, mises en relation, cheminement ---------- */
  const sent = must(await db.from("interests").select("to_user").eq("from_user", me.id));
  const interests: Record<string, string> = {};
  sent.forEach(r => (interests[r.to_user] = "interet"));
  const rels = must(await db.from("relations").select("*").or(`user_a.eq.${me.id},user_b.eq.${me.id}`).neq("status", "cloturee"));
  const relationSince: Record<string, string> = {}, consent: Record<string, unknown> = {};
  let coupleRel: { id: string; other: string } | null = null;
  rels.forEach(r => {
    const other = r.user_a === me.id ? r.user_b : r.user_a;
    const mine = r.user_a === me.id ? r.a_activated_at : r.b_activated_at;
    const theirs = r.user_a === me.id ? r.b_activated_at : r.a_activated_at;
    interests[other] = r.status === "couple_en_cheminement" ? "couple" : "relation";
    relationSince[other] = r.created_at;
    consent[other] = { me: mine, them: theirs };
    if (r.status === "couple_en_cheminement") coupleRel = { id: r.id, other };
  });
  Object.assign(state, { interests, relationSince, cheminantConsent: consent });
  state.passed = must(await db.from("profile_passes").select("passed_user").eq("user_id", me.id)).map(r => r.passed_user);
  state.accompaniment = must(await db.from("accompaniment_requests").select("about_user").eq("user_id", me.id)).map(r => r.about_user).filter(Boolean);
  state.blocked = must(await db.from("member_blocks").select("blocked_id").eq("user_id", me.id)).map(r => r.blocked_id);

  if (rels.length) {
    const steps = must(await db.from("discernment_steps").select("relation_id, step_index").in("relation_id", rels.map(r => r.id)));
    const disc: Record<string, number[]> = {};
    rels.forEach(r => { disc[r.user_a === me.id ? r.user_b : r.user_a] = steps.filter(s => s.relation_id === r.id).map(s => s.step_index); });
    state.discernment = disc;
  }

  /* ---------- Messagerie ---------- */
  const convs = must(await db.from("conversations").select("id, user_a, user_b").or(`user_a.eq.${me.id},user_b.eq.${me.id}`));
  if (convs.length) {
    const msgs = must(await db.from("messages").select("id, conversation_id, sender_id, body, created_at").in("conversation_id", convs.map(c => c.id)).order("created_at").limit(5000));
    const reacts = msgs.length ? must(await db.from("message_reactions").select("message_id, user_id, reaction").in("message_id", msgs.map(m => m.id))) : [];
    const reads = must(await db.from("conversation_reads").select("conversation_id, last_read_at").eq("user_id", me.id));
    const messages: Record<string, unknown[]> = {}, chatRead: Record<string, number> = {};
    convs.forEach(c => {
      const other = c.user_a === me.id ? c.user_b : c.user_a;
      const list = msgs.filter(m => m.conversation_id === c.id);
      messages[other] = list.map(m => {
        const mine = reacts.find(r => r.message_id === m.id && r.user_id === me.id);
        const theirs = reacts.find(r => r.message_id === m.id && r.user_id !== me.id);
        return { id: m.id, from: m.sender_id === null ? "system" : m.sender_id === me.id ? "me" : "them", text: m.body, ts: m.created_at, react: (mine ?? theirs)?.reaction };
      });
      const read = reads.find(r => r.conversation_id === c.id)?.last_read_at;
      chatRead[other] = read ? list.filter(m => m.created_at <= read).length : 0;
    });
    Object.assign(state, { messages, chatRead });
  }

  /* ---------- Parcours : modules, cours, préparation ---------- */
  const mods = must(await db.from("module_progress").select("module_id, idx").eq("user_id", me.id));
  const modules: Record<number, number[]> = {};
  mods.forEach(m => (modules[m.module_id] ||= []).push(m.idx));
  state.modules = modules;
  const notes = must(await db.from("module_notes").select("module_id, body").eq("user_id", me.id));
  state.notes = Object.fromEntries(notes.map(n => [n.module_id, n.body]));

  const coupleR = coupleRel as { id: string; other: string } | null;
  const courseOf = async (id: string) => {
    const rows = must(await db.from("course_progress").select("module_id, idx, done_at").eq("user_id", id));
    const map: Record<number, number[]> = {};
    rows.forEach(r => (map[r.module_id] ||= []).push(r.idx));
    return { map, last: rows.map(r => r.done_at).sort().pop() ?? null };
  };
  const mine = await courseOf(me.id);
  const partner = coupleR ? await courseOf(coupleR.other) : { map: {}, last: null };
  state.courses = { me: mine.map, partner: partner.map, lastAt: { me: mine.last, partner: partner.last } };

  if (coupleR) {
    state.coupleWith = coupleR.other;
    const sessions = must(await db.from("prep_sessions_done").select("session_index").eq("relation_id", coupleR.id)).map(r => r.session_index);
    const tasks = must(await db.from("prep_tasks_done").select("task_key").eq("relation_id", coupleR.id)).map(r => Number(r.task_key));
    const wed = must(await db.from("weddings").select("wedding_date, celebrated").eq("relation_id", coupleR.id).maybeSingle());
    state.prep = { sessions, tasks, weddingDate: wed?.wedding_date ?? "", married: Boolean(wed?.celebrated) };
  }
  return { ...base, state, data };
}

// deno-lint-ignore no-explicit-any
async function referentState(me: Me, churches: any[]) {
  const myChurches = must(await db.from("church_referents").select("church_id").eq("user_id", me.id)).map(r => r.church_id);
  const churchId = myChurches[0] ?? null;

  const cands = myChurches.length ? must(await db.from("member_profiles")
    .select("user_id, age, city, plan, status, avatar_colors, member_since, service, updated_at, users!inner(first_name, last_name, deleted_at), candidate_reviews(interview, interview_at, interview_place, decision, decided_at, referent_id, created_at)")
    .in("church_id", myChurches).is("users.deleted_at", null)) : [];
  // deno-lint-ignore no-explicit-any
  const candidates = cands.map((c: any) => {
    const r = Array.isArray(c.candidate_reviews) ? c.candidate_reviews[0] : c.candidate_reviews;
    return {
      id: c.user_id, name: fullName(c.users), age: c.age, city: c.city, since: frDate(r?.created_at ?? c.updated_at),
      interview: r?.interview ?? "a_planifier", date: r?.interview_at ?? null, place: r?.interview_place ?? "",
      decision: r?.decision ?? null, plan: c.plan, colors: c.avatar_colors?.length ? c.avatar_colors : PALETTE[0],
      note: [c.member_since ? `Membre depuis : ${c.member_since}` : "", c.service ?? ""].filter(Boolean).join(" · "),
      validatedAt: r?.decision === "valider" ? (r.decided_at ?? "").slice(0, 10) : null,
      validatedBy: r?.decision === "valider" ? r.referent_id : null
    };
  }).sort((a, b) => (b.since > a.since ? 1 : -1));

  const memberIds = await membersOfChurches(myChurches);
  const reports = memberIds.length ? must(await db.from("member_reports").select("*")
    .or(`reporter_id.in.(${memberIds.join(",")}),reported_id.in.(${memberIds.join(",")})`).order("created_at", { ascending: false })) : [];
  const accomp = memberIds.length ? must(await db.from("accompaniment_requests").select("id, user_id, about_user, created_at").in("user_id", memberIds).order("created_at", { ascending: false })) : [];
  const ppl = await people([...new Set([...reports.flatMap(r => [r.reporter_id, r.reported_id]), ...accomp.flatMap(a => [a.user_id, a.about_user]).filter(Boolean)])] as string[]);

  const earnings = (await ledgerRows({ referentId: me.id })).map(l => ({
    id: l.id, name: l.name, colors: l.colors, validatedAt: l.validatedAt, plan: l.plan, amount: l.toReferent, currency: l.currency
  }));

  return {
    role: "referent", email: me.email,
    state: {
      user: { id: me.id, firstName: me.first_name, lastName: me.last_name, name: fullName(me), churchId, churchIds: myChurches },
      reports: reports.map(reportRow), sanctions: {}, candidates: {}, readNotifs: me.read_notifs ?? [], inbox: await inbox(me.id)
    },
    data: {
      churches, candidates, people: ppl, referents: await referentsList(myChurches, false),
      couples: await schoolCouples(myChurches), referentEarnings: earnings,
      accompaniment: accomp.map(a => ({ id: a.id, member: a.user_id, about: a.about_user, date: a.created_at }))
    }
  };
}

// deno-lint-ignore no-explicit-any
async function churchState(me: Me, churches: any[]) {
  const mine = must(await db.from("church_accounts").select("church_id").eq("user_id", me.id)).map(r => r.church_id);
  const lines = (await ledgerRows({ churchIds: mine })).map(l => ({
    id: l.id, name: l.name, colors: l.colors, validatedAt: l.validatedAt, plan: l.plan, referentId: l.referentId, referent: l.referent, amount: l.toChurch, currency: l.currency
  }));
  return {
    role: "eglise", email: me.email,
    state: { user: { id: me.id, firstName: me.first_name, lastName: me.last_name, name: fullName(me), churchId: mine[0] ?? null }, readNotifs: me.read_notifs ?? [] },
    data: { churches, referents: await referentsList(mine, true), churchEarnings: lines }
  };
}

// deno-lint-ignore no-explicit-any
async function adminState(me: Me, churches: any[]) {
  const reports = must(await db.from("member_reports").select("*").order("created_at", { ascending: false }).limit(500));
  const involved = [...new Set(reports.flatMap(r => [r.reporter_id, r.reported_id]))];
  const requests = must(await db.from("church_requests").select("*").order("created_at", { ascending: false }));
  const counts = must(await db.from("member_profiles").select("church_id").eq("status", "actif"));
  const membersByChurch: Record<string, number> = {};
  counts.forEach(c => (membersByChurch[c.church_id] = (membersByChurch[c.church_id] ?? 0) + 1));
  const recent = new Set(must(await db.from("churches").select("id, created_at").gte("created_at", new Date(Date.now() - 30 * 86400000).toISOString())).map(c => c.id));

  return {
    role: "admin", email: me.email,
    state: {
      user: { id: me.id, firstName: me.first_name, lastName: me.last_name, name: fullName(me) },
      reports: reports.map(reportRow), sanctions: await sanctionsOf(involved), readNotifs: me.read_notifs ?? [],
      partnerRequests: requests.map(r => ({
        id: r.id, church: r.church_name, city: r.city, denomination: r.denomination, contact: r.contact_name, email: r.contact_email ?? "",
        phone: r.phone ?? "", referent: r.referent_name, members: r.members_range ?? "", date: frDate(r.created_at), status: r.status,
        questions: r.questions ?? [], message: r.admin_message ?? "", askedAt: frDate(r.asked_at), note: r.message ?? ""
      }))
    },
    data: {
      churches: churches.map(c => ({ ...c, extra: recent.has(c.id) })), people: await people(involved),
      referents: await referentsList(null, true), couples: await schoolCouples(null), ledger: await ledgerRows(), membersByChurch
    }
  };
}

/* =========================================================
   Session et compte
   ========================================================= */
route("GET", "/me", "auth", async ({ me }) =>
  ok({ user: { id: me.id, role: me.role, first_name: me.first_name, last_name: me.last_name, email: me.email } }));

/* Églises (publique : nécessaire avant l'inscription) */
route("GET", "/churches", "public", async ({ url }) => {
  const q = clean(url.searchParams.get("q"), 80).toLowerCase();
  const list = await churchesWithReferent();
  return ok(q ? list.filter(c => `${c.name} ${c.city}`.toLowerCase().includes(q)) : list);
});

/* Candidature : profil, questionnaire et église, après Supabase Auth signUp */
route("POST", "/candidates", "membre", async ({ me, body }) => {
  const existing = must(await db.from("member_profiles").select("user_id").eq("user_id", me.id).maybeSingle());
  if (existing) fail(409, "Votre candidature a déjà été envoyée.");
  const firstName = clean(body.firstName, 60), lastName = clean(body.lastName, 60);
  const gender = body.gender === "F" || body.gender === "M" ? body.gender : fail(422, "Merci d'indiquer si vous êtes un homme ou une femme.");
  const age = Number(body.age);
  if (!Number.isInteger(age) || age < 18 || age > 99) fail(422, "L'âge doit être compris entre 18 et 99 ans.");
  const city = clean(body.city, 80);
  if (!firstName || !lastName || !city) fail(422, "Merci de compléter votre prénom, votre nom et votre ville.");
  const churchId = isUuid(body.churchId) ? String(body.churchId) : fail(422, "Merci de choisir votre église.");
  const church = must(await db.from("churches").select("id").eq("id", churchId).eq("is_active", true).maybeSingle());
  if (!church) fail(422, "Cette église n'est pas partenaire de Cheminant.");
  const plan = PLANS.includes(String(body.plan)) ? String(body.plan) : "single";
  const ans = (body.answers ?? {}) as Record<string, unknown>;
  const answers: Answers = {
    faith: Object.hasOwn(FAITH, String(ans.faith)) ? String(ans.faith) : undefined,
    children: Object.hasOwn(CHILDREN, String(ans.children)) ? String(ans.children) : undefined,
    mobility: Object.hasOwn(MOBILITY, String(ans.mobility)) ? String(ans.mobility) : undefined,
    values: (Array.isArray(ans.values) ? ans.values : []).map(String).filter(v => Object.hasOwn(VALUES, v)).slice(0, 3)
  };
  must(await db.from("users").update({ first_name: firstName, last_name: lastName }).eq("id", me.id));
  must(await db.from("member_profiles").insert({
    user_id: me.id, church_id: churchId, gender, age, city, job: clean(body.job, 80) || null, about: text(body.about, 2000) || null,
    answers, plan, member_since: clean(body.since, 40) || null, avatar_colors: PALETTE[Math.floor(Math.random() * PALETTE.length)],
    faith: FAITH[answers.faith ?? ""] ?? null, children: CHILDREN[answers.children ?? ""] ?? null, mobility: MOBILITY[answers.mobility ?? ""] ?? null,
    interests: (answers.values ?? []).map(v => VALUES[v])
  }));
  must(await db.from("candidate_reviews").insert({ user_id: me.id }));
  const refs = must(await db.from("church_referents").select("user_id").eq("church_id", churchId));
  if (refs.length) await db.from("notifications").insert(refs.map(r => ({ user_id: r.user_id, icon: "users", body: `Nouvelle candidature : ${firstName} ${lastName}.`, href: "#/referent" })));
  return json(201, { status: "en_attente_validation" });
});

route("PATCH", "/me/profile", "membre", async ({ me, body }) => {
  must(await db.from("member_profiles").update({
    city: clean(body.city, 80) || undefined, job: clean(body.job, 80), quote: text(body.quote, 280), about: text(body.about, 2000), updated_at: now()
  }).eq("user_id", me.id));
  return ok();
});

route("PATCH", "/me/settings", "membre", async ({ me, body }) => {
  const patch: Record<string, boolean> = {};
  if (typeof body.suggestions === "boolean") patch.suggestions_enabled = body.suggestions;
  if (typeof body.paused === "boolean") patch.paused = body.paused;
  must(await db.from("member_profiles").update(patch).eq("user_id", me.id));
  return ok();
});

route("POST", "/me/read-notifs", "auth", async ({ me, body }) => {
  const ids = (Array.isArray(body.ids) ? body.ids : []).map(x => clean(x, 80)).filter(Boolean);
  const merged = [...new Set([...(me.read_notifs ?? []), ...ids])].slice(-300);
  must(await db.from("users").update({ read_notifs: merged }).eq("id", me.id));
  return ok();
});

route("POST", "/me/charter", "membre", async ({ me }) => {
  must(await db.from("users").update({ chat_charter_at: now() }).eq("id", me.id));
  return ok();
});

route("POST", "/me/deletion-request", "auth", async ({ me }) => {
  must(await db.from("users").update({ deletion_requested_at: now() }).eq("id", me.id));
  const admins = must(await db.from("users").select("id").eq("role", "admin"));
  if (admins.length) await db.from("notifications").insert(admins.map(a => ({ user_id: a.id, icon: "info", body: `Demande de suppression de compte : ${fullName(me)}.`, href: "#/admin" })));
  return ok();
});

/* Export RGPD : les données du membre connecté (jamais celles des autres) */
route("GET", "/me/export", "auth", async ({ me }) => {
  const [profile, payments, sentInterests, myMessages, reports] = await Promise.all([
    db.from("member_profiles").select("*").eq("user_id", me.id).maybeSingle(),
    db.from("payments").select("created_at, plan, method, provider, region, currency, amount_ttc, status, period_end").eq("user_id", me.id),
    db.from("interests").select("to_user, created_at").eq("from_user", me.id),
    db.from("messages").select("body, created_at").eq("sender_id", me.id),
    db.from("member_reports").select("reason, details, context, created_at, status").eq("reporter_id", me.id)
  ]);
  return ok({
    exportedAt: now(), account: { email: me.email, firstName: me.first_name, lastName: me.last_name, role: me.role },
    profile: profile.data, payments: payments.data, interests: sentInterests.data, messagesSent: myMessages.data, reports: reports.data
  });
});

/* =========================================================
   Membres : profils, intérêts, relations
   ========================================================= */
async function requireActive(id: string) {
  const mp = must(await db.from("member_profiles").select("status").eq("user_id", id).maybeSingle());
  if (mp?.status !== "actif") fail(403, "Cette action est réservée aux membres validés par leur référent.");
  if ((await sanctionedIds([id])).has(id)) fail(403, "Votre compte est suspendu : cette action n'est pas disponible.");
}
async function requireMember(id: string) {
  if (!isUuid(id)) fail(404, "Profil introuvable.");
  const mp = must(await db.from("member_profiles").select("status").eq("user_id", id).maybeSingle());
  if (mp?.status !== "actif" || (await sanctionedIds([id])).has(id)) fail(404, "Profil introuvable.");
}
async function relationWith(me: string, other: string) {
  if (!isUuid(other)) fail(404, "Relation introuvable.");
  const [a, b] = pair(me, other);
  const r = must(await db.from("relations").select("*").eq("user_a", a).eq("user_b", b).maybeSingle());
  return r ?? fail(404, "Relation introuvable.");
}

route("POST", "/interests", "membre", async ({ me, body }) => {
  await requireActive(me.id);
  const other = String(body.profileId ?? "");
  await requireMember(other);
  const status = must(await db.rpc("api_express_interest", { p_me: me.id, p_other: other }));
  return ok({ status });
});

route("POST", "/profiles/:id/pass", "membre", async ({ me, params }) => {
  if (!isUuid(params.id) || params.id === me.id) fail(404, "Profil introuvable.");
  must(await db.from("profile_passes").upsert({ user_id: me.id, passed_user: params.id }));
  must(await db.from("interests").delete().eq("from_user", me.id).eq("to_user", params.id));
  return ok();
});

route("POST", "/accompaniment-requests", "membre", async ({ me, body }) => {
  await requireActive(me.id);
  const about = isUuid(body.profileId) ? String(body.profileId) : null;
  const exists = about ? must(await db.from("accompaniment_requests").select("id").eq("user_id", me.id).eq("about_user", about).maybeSingle()) : null;
  if (!exists) {
    must(await db.from("accompaniment_requests").insert({ user_id: me.id, about_user: about, message: text(body.message, 1000) || null }));
    const mp = must(await db.from("member_profiles").select("church_id").eq("user_id", me.id).single());
    const refs = must(await db.from("church_referents").select("user_id").eq("church_id", mp.church_id));
    if (refs.length) await db.from("notifications").insert(refs.map(r => ({ user_id: r.user_id, icon: "hands", body: `${fullName(me)} demande un accompagnement.`, href: "#/referent/couples" })));
  }
  return json(201, { ok: true });
});

route("POST", "/relations/:id/discernment", "membre", async ({ me, params, body }) => {
  const r = await relationWith(me.id, params.id);
  const step = Number(body.step);
  if (!Number.isInteger(step) || step < 0 || step > 20) fail(422, "Étape inconnue.");
  if (body.done) must(await db.from("discernment_steps").upsert({ relation_id: r.id, step_index: step }));
  else must(await db.from("discernment_steps").delete().eq("relation_id", r.id).eq("step_index", step));
  return ok();
});

/* Activation du parcours Cheminant par le membre connecté (3 mois d'échange minimum) */
route("POST", "/relations/:id/advance", "membre", async ({ me, params }) => {
  await relationWith(me.id, params.id);
  const res = must(await db.rpc("api_activate_cheminant", { p_me: me.id, p_other: params.id }));
  if (res === "verrouille") fail(403, "Le parcours Cheminant s'active après trois mois d'échange depuis la mise en relation.");
  return ok({ status: res === "active" ? "couple_en_cheminement" : "en_attente_partenaire" });
});

/* =========================================================
   Messagerie : membres validés ET à jour de leur formule, des deux côtés
   ========================================================= */
async function chatAllowed(me: string, other: string) {
  if (!isUuid(other) || other === me) fail(404, "Membre introuvable.");
  const rows = must(await db.from("member_profiles").select("user_id, status, paid_until").in("user_id", [me, other]));
  const ok = (id: string) => {
    const r = rows.find(x => x.user_id === id);
    return r?.status === "actif" && r.paid_until && new Date(r.paid_until) > new Date();
  };
  if (!ok(me)) fail(403, "La messagerie s'ouvre après la validation de votre profil et le règlement de votre formule.");
  if (!ok(other)) fail(403, "Ce membre ne peut pas recevoir de messages pour le moment.");
  if ((await sanctionedIds([me, other])).size) fail(403, "Cette conversation n'est pas disponible.");
  const blocks = must(await db.from("member_blocks").select("user_id").or(`and(user_id.eq.${me},blocked_id.eq.${other}),and(user_id.eq.${other},blocked_id.eq.${me})`));
  if (blocks.length) fail(403, "Cette conversation n'est pas disponible.");
}
async function conversationWith(me: string, other: string, create: boolean) {
  const [a, b] = pair(me, other);
  const c = must(await db.from("conversations").select("id").eq("user_a", a).eq("user_b", b).maybeSingle());
  if (c || !create) return c?.id ?? null;
  return must(await db.from("conversations").insert({ user_a: a, user_b: b }).select("id").single()).id;
}

route("POST", "/conversations/:id/messages", "membre", async ({ me, params, body }) => {
  const msg = text(body.text, 2000);
  if (!msg) fail(422, "Votre message est vide.");
  if (!me.chat_charter_at) fail(403, "Merci d'accepter la charte des échanges avant votre premier message.");
  await chatAllowed(me.id, params.id);
  // Limite : 20 messages par minute
  const since = new Date(Date.now() - 60000).toISOString();
  const { count } = await db.from("messages").select("id", { count: "exact", head: true }).eq("sender_id", me.id).gte("created_at", since);
  if ((count ?? 0) >= 20) fail(429, "Vous envoyez beaucoup de messages. Merci de patienter un instant.");
  const conv = await conversationWith(me.id, params.id, true);
  const m = must(await db.from("messages").insert({ conversation_id: conv, sender_id: me.id, body: msg }).select("id, created_at").single());
  await db.from("conversations").update({ last_message_at: m.created_at }).eq("id", conv);
  await db.from("conversation_reads").upsert({ conversation_id: conv, user_id: me.id, last_read_at: m.created_at });
  return json(201, { id: m.id, from: "me", text: msg, ts: m.created_at });
});

route("POST", "/conversations/:id/read", "membre", async ({ me, params }) => {
  if (!isUuid(params.id)) fail(404, "Conversation introuvable.");
  const conv = await conversationWith(me.id, params.id, false);
  if (conv) must(await db.from("conversation_reads").upsert({ conversation_id: conv, user_id: me.id, last_read_at: now() }));
  return ok();
});

route("PUT", "/messages/:id/reaction", "membre", async ({ me, params, body }) => {
  const id = Number(params.id);
  if (!Number.isInteger(id)) fail(404, "Message introuvable.");
  const m = must(await db.from("messages").select("id, conversation_id, conversations(user_a, user_b)").eq("id", id).maybeSingle());
  // deno-lint-ignore no-explicit-any
  const c = (m as any)?.conversations;
  if (!c || (c.user_a !== me.id && c.user_b !== me.id)) fail(404, "Message introuvable.");
  const key = String(body.key ?? "");
  if (["amen", "merci", "bravo"].includes(key)) must(await db.from("message_reactions").upsert({ message_id: id, user_id: me.id, reaction: key }));
  else must(await db.from("message_reactions").delete().eq("message_id", id).eq("user_id", me.id));
  return ok();
});

route("POST", "/members/:id/block", "membre", async ({ me, params }) => {
  if (!isUuid(params.id) || params.id === me.id) fail(404, "Membre introuvable.");
  must(await db.from("member_blocks").upsert({ user_id: me.id, blocked_id: params.id }));
  return ok();
});
route("DELETE", "/members/:id/block", "membre", async ({ me, params }) => {
  if (!isUuid(params.id)) fail(404, "Membre introuvable.");
  must(await db.from("member_blocks").delete().eq("user_id", me.id).eq("blocked_id", params.id));
  return ok();
});

/* Signalement : transmis au référent de l'église du membre et à l'administrateur */
route("POST", "/reports", "membre", async ({ me, body }) => {
  const reported = String(body.reportedId ?? "");
  if (!isUuid(reported) || reported === me.id) fail(422, "Membre introuvable.");
  const reason = REPORT_REASONS.includes(String(body.reason)) ? String(body.reason) : fail(422, "Merci de choisir un motif.");
  const context = ["Messagerie", "Notre cheminement"].includes(String(body.context)) ? String(body.context) : "Messagerie";
  const { count } = await db.from("member_reports").select("id", { count: "exact", head: true }).eq("reporter_id", me.id).gte("created_at", new Date(Date.now() - 86400000).toISOString());
  if ((count ?? 0) >= 10) fail(429, "Vous avez déjà envoyé plusieurs signalements aujourd'hui. L'équipe Cheminant les examine.");
  // Les extraits sont relus côté serveur : seulement des messages reçus de ce membre
  const conv = await conversationWith(me.id, reported, false);
  const received = conv ? must(await db.from("messages").select("body").eq("conversation_id", conv).eq("sender_id", reported).order("created_at", { ascending: false }).limit(3)).map(m => m.body).reverse() : [];
  const excerpt = (Array.isArray(body.excerpt) ? body.excerpt : []).map(String).filter(t => received.includes(t)).slice(0, 3);
  must(await db.from("member_reports").insert({ reporter_id: me.id, reported_id: reported, reason, context, details: text(body.details, 1000) || null, excerpt }));
  const admins = must(await db.from("users").select("id").eq("role", "admin"));
  const mp = must(await db.from("member_profiles").select("church_id").in("user_id", [me.id, reported]));
  const refs = mp.length ? must(await db.from("church_referents").select("user_id").in("church_id", mp.map(x => x.church_id))) : [];
  const notify = [...new Set([...admins.map(a => a.id), ...refs.map(r => r.user_id)])];
  if (notify.length) await db.from("notifications").insert(notify.map(id => ({ user_id: id, icon: "shield", body: "Nouveau signalement à examiner.", href: refs.some(r => r.user_id === id) ? "#/referent/signalements" : "#/admin/signalements" })));
  return json(201, { ok: true });
});

/* =========================================================
   École du mariage et préparation (couple en cheminement uniquement)
   ========================================================= */
async function coupleOf(me: string) {
  const r = must(await db.from("relations").select("id, user_a, user_b").or(`user_a.eq.${me},user_b.eq.${me}`).eq("status", "couple_en_cheminement").maybeSingle());
  return r ?? fail(403, "L'École du mariage s'ouvre à l'entrée dans le parcours Cheminant.");
}

route("POST", "/school/courses/:m/:i/watched", "membre", async ({ me, params }) => {
  await coupleOf(me.id);
  const m = Number(params.m), i = Number(params.i);
  if (!COURSE_COUNTS[m] || !Number.isInteger(i) || i < 0 || i >= COURSE_COUNTS[m]) fail(404, "Cours introuvable.");
  if (m > 1) {
    const { count } = await db.from("course_progress").select("idx", { count: "exact", head: true }).eq("user_id", me.id).eq("module_id", m - 1);
    if ((count ?? 0) < COURSE_COUNTS[m - 1]) fail(403, "Ce module s'ouvre quand le précédent a été suivi en entier.");
  }
  must(await db.from("course_progress").upsert({ user_id: me.id, module_id: m, idx: i }));
  return ok();
});

route("POST", "/school/modules/:m/lessons/:i/complete", "membre", async ({ me, params, body }) => {
  await coupleOf(me.id);
  const m = Number(params.m), i = Number(params.i);
  if (!COURSE_COUNTS[m] || !Number.isInteger(i) || i < 0 || i >= LESSON_COUNT) fail(404, "Leçon introuvable.");
  if (m > 1) {
    const { count } = await db.from("module_progress").select("idx", { count: "exact", head: true }).eq("user_id", me.id).eq("module_id", m - 1);
    if ((count ?? 0) < LESSON_COUNT) fail(403, "Ce module s'ouvre quand le précédent est terminé.");
  }
  must(await db.from("module_progress").upsert({ user_id: me.id, module_id: m, idx: i }));
  if (typeof body.notes === "string") must(await db.from("module_notes").upsert({ user_id: me.id, module_id: m, body: text(body.notes, 5000), updated_at: now() }));
  return ok();
});

route("POST", "/prep/sessions/:i", "membre", async ({ me, params }) => {
  const r = await coupleOf(me.id);
  const i = Number(params.i);
  if (!Number.isInteger(i) || i < 0 || i >= SESSION_COUNT) fail(404, "Séance introuvable.");
  must(await db.from("prep_sessions_done").upsert({ relation_id: r.id, session_index: i }));
  return ok();
});

route("PUT", "/prep/tasks/:i", "membre", async ({ me, params, body }) => {
  const r = await coupleOf(me.id);
  const i = Number(params.i);
  if (!Number.isInteger(i) || i < 0 || i >= PREP_TASK_COUNT) fail(404, "Tâche introuvable.");
  if (body.done) must(await db.from("prep_tasks_done").upsert({ relation_id: r.id, task_key: String(i) }));
  else must(await db.from("prep_tasks_done").delete().eq("relation_id", r.id).eq("task_key", String(i)));
  return ok();
});

route("PUT", "/prep/wedding", "membre", async ({ me, body }) => {
  const r = await coupleOf(me.id);
  const patch: Record<string, unknown> = { relation_id: r.id };
  if ("weddingDate" in body) patch.wedding_date = /^\d{4}-\d{2}-\d{2}$/.test(String(body.weddingDate)) ? body.weddingDate : null;
  if (body.married === true) patch.celebrated = true;
  must(await db.from("weddings").upsert(patch));
  return ok();
});

/* =========================================================
   Formule et paiement
   PAYMENT_MODE = "simulation" : le règlement est enregistré sans prestataire (tests).
   Avant l'ouverture au public : brancher Stripe / PayPal / Mobile Money
   (redirection vers le prestataire, puis webhook signé qui appelle recordPayment).
   ========================================================= */
async function recordPayment(userId: string, plan: string, method: string, region: string, providerRef: string | null) {
  const price = must(await db.from("plan_prices").select("*").eq("region", region).eq("plan", plan).single());
  const mp = must(await db.from("member_profiles").select("paid_until").eq("user_id", userId).single());
  const start = mp.paid_until && new Date(mp.paid_until) > new Date() ? new Date(mp.paid_until) : new Date();
  const until = new Date(start);
  until.setMonth(until.getMonth() + price.months);
  must(await db.from("payments").insert({
    user_id: userId, plan, method, provider: METHODS[region][method], region, currency: price.currency,
    amount_ttc: price.amount_ttc, provider_ref: providerRef, status: "paye", period_end: until.toISOString()
  }));
  must(await db.from("member_profiles").update({ plan, paid_until: until.toISOString(), payment_method: method, payment_region: region }).eq("user_id", userId));
  return { date: now(), plan, method, provider: METHODS[region][method], region, amount: Number(price.amount_ttc), currency: price.currency, until: until.toISOString() };
}

route("POST", "/payments/checkout", "membre", async ({ me, body }) => {
  await requireActive(me.id);
  const plan = PLANS.includes(String(body.plan)) ? String(body.plan) : fail(422, "Formule inconnue.");
  const region = REGIONS.includes(String(body.region)) ? String(body.region) : fail(422, "Région inconnue.");
  const method = Object.hasOwn(METHODS[region], String(body.method)) ? String(body.method) : fail(422, "Moyen de paiement indisponible pour cette région.");
  if (PAYMENT_MODE !== "simulation") fail(501, "Le paiement en ligne n'est pas encore ouvert. Merci de réessayer prochainement.");
  return ok({ status: "paye", payment: await recordPayment(me.id, plan, method, region, null) });
});

/* =========================================================
   Espace référent : uniquement les candidats de son église
   ========================================================= */
async function requireCandidateOf(referent: string, candidate: string) {
  if (!isUuid(candidate)) fail(404, "Candidat introuvable.");
  const mp = must(await db.from("member_profiles").select("church_id").eq("user_id", candidate).maybeSingle());
  const mine = mp ? must(await db.from("church_referents").select("church_id").eq("user_id", referent).eq("church_id", mp.church_id).maybeSingle()) : null;
  if (!mine) fail(404, "Candidat introuvable.");
}

route("POST", "/referent/candidates/:id/interview", "referent", async ({ me, params, body }) => {
  await requireCandidateOf(me.id, params.id);
  const date = String(body.date ?? "");
  const at = new Date(date);
  if (isNaN(at.getTime())) fail(422, "Merci d'indiquer la date et l'heure de l'entretien.");
  const place = clean(body.place, 160) || "Bureau pastoral de l'église";
  must(await db.from("candidate_reviews").upsert({ user_id: params.id, referent_id: me.id, interview: "planifie", interview_at: at.toISOString(), interview_place: place }));
  await db.from("notifications").insert({ user_id: params.id, icon: "calendar", body: `Votre entretien de validation est planifié le ${at.toLocaleString("fr-FR", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" })} (${place}).`, href: "#/tableau-de-bord" });
  return ok({ interview: "planifie" });
});

route("POST", "/referent/candidates/:id/interview-done", "referent", async ({ me, params }) => {
  await requireCandidateOf(me.id, params.id);
  must(await db.from("candidate_reviews").upsert({ user_id: params.id, referent_id: me.id, interview: "realise" }));
  return ok({ interview: "realise" });
});

route("POST", "/referent/candidates/:id/decision", "referent", async ({ me, params, body }) => {
  await requireCandidateOf(me.id, params.id);
  const decision = ["valider", "refuser", "demander_infos", "mettre_en_attente"].includes(String(body.decision)) ? String(body.decision) : fail(422, "Décision inconnue.");
  must(await db.rpc("api_decide_candidate", {
    p_referent: me.id, p_candidate: params.id, p_decision: decision,
    p_note: text(body.internalNote, 2000), p_message: text(body.message, 1000)
  }));
  return ok();
});

route("POST", "/referent/reports/:id/note", "referent", async ({ me, params, body }) => {
  const rep = must(await db.from("member_reports").select("reporter_id, reported_id").eq("id", Number(params.id)).maybeSingle());
  if (!rep) fail(404, "Signalement introuvable.");
  const myChurches = must(await db.from("church_referents").select("church_id").eq("user_id", me.id)).map(r => r.church_id);
  const members = await membersOfChurches(myChurches);
  if (![rep!.reporter_id, rep!.reported_id].some(id => members.includes(id))) fail(404, "Signalement introuvable.");
  const note = text(body.note, 1000);
  if (!note) fail(422, "Votre avis est vide.");
  must(await db.from("member_reports").update({ referent_note: note }).eq("id", Number(params.id)));
  return ok();
});

/* =========================================================
   Invitations (référents, comptes d'église)
   ========================================================= */
async function invite(email: string, name: string, role: "referent" | "eglise", churchId: string, title?: string) {
  email = email.toLowerCase();
  let userId: string | null = null;
  const existing = must(await db.from("users").select("id, role").eq("email", email).maybeSingle());
  if (existing) {
    const hasProfile = must(await db.from("member_profiles").select("user_id").eq("user_id", existing.id).maybeSingle());
    if (existing.role === "admin" || hasProfile || (existing.role !== "membre" && existing.role !== role)) {
      fail(409, "Un compte existe déjà avec cette adresse e-mail.");
    }
    // Un référent ou un compte d'église déjà rattaché à une autre église ne peut pas être repris
    if (existing.role === role) {
      const table = role === "referent" ? "church_referents" : "church_accounts";
      const other = must(await db.from(table).select("church_id").eq("user_id", existing.id).neq("church_id", churchId).limit(1));
      if (other.length) fail(409, "Cette adresse e-mail est déjà rattachée à une autre église.");
    }
    userId = existing.id;
  } else {
    const res = await db.auth.admin.inviteUserByEmail(email, { data: { first_name: name, last_name: "" }, redirectTo: SITE_URL });
    if (res.error || !res.data.user) {
      console.error(res.error);
      // Service d'e-mails de Supabase : nombre d'envois par heure limité
      if (res.error?.status === 429) fail(429, "Trop d'e-mails envoyés en peu de temps. Réessayez dans une heure.");
      fail(502, "L'invitation n'a pas pu être envoyée. Vérifiez l'adresse e-mail et réessayez.");
    }
    userId = res.data.user!.id;
  }
  must(await db.from("users").update({ role, first_name: name, last_name: "" }).eq("id", userId));
  if (role === "referent") must(await db.from("church_referents").upsert({ church_id: churchId, user_id: userId, title: title ?? "Référent désigné" }));
  else must(await db.from("church_accounts").upsert({ church_id: churchId, user_id: userId }));
  return userId;
}

async function resendInvite(userId: string) {
  const u = must(await db.from("users").select("email, last_seen_at").eq("id", userId).maybeSingle());
  if (!u?.email) fail(404, "Référent introuvable.");
  if (u!.last_seen_at) fail(422, "Ce référent a déjà activé son espace.");
  // Lien de création du mot de passe (même parcours que « mot de passe oublié »)
  const res = await db.auth.resetPasswordForEmail(u!.email, { redirectTo: SITE_URL });
  if (res.error?.status === 429) fail(429, "Trop d'e-mails envoyés en peu de temps. Réessayez dans une heure.");
  if (res.error) fail(502, "L'invitation n'a pas pu être renvoyée.");
}

route("POST", "/church/referents", "eglise", async ({ me, body }) => {
  const church = must(await db.from("church_accounts").select("church_id").eq("user_id", me.id).maybeSingle());
  if (!church) fail(403, "Aucune église n'est rattachée à ce compte.");
  const name = clean(body.name, 80), email = clean(body.email, 160);
  if (!name) fail(422, "Merci d'indiquer le nom du référent.");
  if (!isEmail(email)) fail(422, "Adresse e-mail invalide.");
  const role = REFERENT_ROLES.includes(String(body.role)) ? String(body.role) : "Autre responsable";
  const id = await invite(email, name, "referent", church!.church_id, role);
  return json(201, { id });
});

route("POST", "/church/referents/:id/resend", "eglise", async ({ me, params }) => {
  const church = must(await db.from("church_accounts").select("church_id").eq("user_id", me.id).maybeSingle());
  const link = church && isUuid(params.id) ? must(await db.from("church_referents").select("user_id").eq("church_id", church.church_id).eq("user_id", params.id).maybeSingle()) : null;
  if (!link) fail(404, "Référent introuvable.");
  await resendInvite(params.id);
  return ok();
});

/* Demande de partenariat (publique) */
route("POST", "/church-requests", "public", async ({ body }) => {
  const payload = {
    church_name: clean(body.church, 120), city: clean(body.city, 80), denomination: DENOMINATIONS.includes(String(body.denomination)) ? String(body.denomination) : "Autre",
    contact_name: clean(body.contact, 80), contact_email: clean(body.email, 160), phone: clean(body.phone, 30) || null,
    referent_name: clean(body.referent, 80), members_range: clean(body.members, 40) || null, message: text(body.message, 2000) || null
  };
  if (!payload.church_name || !payload.city || !payload.contact_name || !payload.referent_name) fail(422, "Merci de compléter tous les champs obligatoires.");
  if (!isEmail(payload.contact_email)) fail(422, "Adresse e-mail invalide.");
  const { count } = await db.from("church_requests").select("id", { count: "exact", head: true }).eq("contact_email", payload.contact_email).gte("created_at", new Date(Date.now() - 86400000).toISOString());
  if ((count ?? 0) >= 3) fail(429, "Votre demande a bien été reçue. Nous reviendrons vers vous rapidement.");
  const row = must(await db.from("church_requests").insert(payload).select("id").single());
  const admins = must(await db.from("users").select("id").eq("role", "admin"));
  if (admins.length) await db.from("notifications").insert(admins.map(a => ({ user_id: a.id, icon: "church", body: `Nouvelle demande de partenariat : ${payload.church_name}.`, href: "#/admin/demandes" })));
  return json(201, { id: row.id });
});

/* =========================================================
   Administration
   ========================================================= */
route("POST", "/admin/reports/:id/decision", "admin", async ({ me, params, body }) => {
  const id = Number(params.id);
  if (!Number.isInteger(id)) fail(404, "Signalement introuvable.");
  const decision = String(body.decision ?? "");
  const days = Math.max(MIN_SUSPENSION_DAYS, Math.min(365, Number(body.days) || MIN_SUSPENSION_DAYS));
  must(await db.rpc("api_decide_report", { p_admin: me.id, p_report: id, p_decision: decision, p_days: days, p_note: text(body.note, 1000) }));
  return ok();
});

route("POST", "/admin/members/:id/lift-suspension", "admin", async ({ params }) => {
  if (!isUuid(params.id)) fail(404, "Membre introuvable.");
  must(await db.from("member_sanctions").update({ lifted_at: now() }).eq("user_id", params.id).eq("type", "suspension").is("lifted_at", null).gt("ends_at", now()));
  return ok();
});

route("POST", "/admin/church-requests/:id/questions", "admin", async ({ me, params, body }) => {
  if (!isUuid(params.id)) fail(404, "Demande introuvable.");
  const questions = (Array.isArray(body.questions) ? body.questions : []).map(q => text(q, 300)).filter(Boolean).slice(0, 12);
  if (!questions.length) fail(422, "Merci de choisir au moins une question.");
  must(await db.from("church_requests").update({ status: "precisions", questions, admin_message: text(body.message, 3000), asked_at: now(), reviewed_by: me.id }).eq("id", params.id));
  return ok();
});

route("PATCH", "/admin/church-requests/:id", "admin", async ({ me, params, body }) => {
  if (!isUuid(params.id)) fail(404, "Demande introuvable.");
  const status = ["acceptee", "declinee"].includes(String(body.status)) ? String(body.status) : fail(422, "Statut inconnu.");
  const r = must(await db.from("church_requests").select("*").eq("id", params.id).maybeSingle());
  if (!r) fail(404, "Demande introuvable.");
  if (!["nouvelle", "precisions"].includes(r!.status)) fail(409, "Cette demande a déjà été traitée.");
  let churchId: string | null = null;
  if (status === "acceptee") {
    const region = REGIONS.includes(String(body.region)) ? String(body.region) : "europe";
    churchId = must(await db.from("churches").insert({ name: r!.church_name, city: r!.city, denomination: r!.denomination, region }).select("id").single()).id;
    // Le responsable reçoit l'accès à l'espace église ; il désignera ensuite ses référents
    if (r!.contact_email) await invite(String(r!.contact_email), r!.contact_name, "eglise", churchId!);
  }
  must(await db.from("church_requests").update({ status, reviewed_by: me.id }).eq("id", params.id));
  return ok({ churchId });
});

route("POST", "/admin/referents", "admin", async ({ body }) => {
  const name = clean(body.name, 80), email = clean(body.email, 160);
  if (!name) fail(422, "Merci d'indiquer le nom du référent.");
  if (!isEmail(email)) fail(422, "Adresse e-mail invalide.");
  const churchId = isUuid(body.churchId) ? String(body.churchId) : fail(422, "Merci de choisir une église.");
  const church = must(await db.from("churches").select("id").eq("id", churchId).maybeSingle());
  if (!church) fail(422, "Église introuvable.");
  const role = REFERENT_ROLES.includes(String(body.role)) ? String(body.role) : "Autre responsable";
  return json(201, { id: await invite(email, name, "referent", churchId, role) });
});

route("POST", "/admin/referents/:id/resend", "admin", async ({ params }) => {
  if (!isUuid(params.id)) fail(404, "Référent introuvable.");
  await resendInvite(params.id);
  return ok();
});

/* =========================================================
   Point d'entrée
   ========================================================= */
Deno.serve(async (req) => {
  const origin = req.headers.get("Origin") ?? "";
  const res = await handle(req);
  res.headers.set("Access-Control-Allow-Origin", ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]);
  return res;
});

async function handle(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/(functions\/v1\/)?api/, "") || "/";
  const match = routes.find(r => r.method === req.method && r.pattern.test(path));
  if (!match) return json(404, { message: "Route inconnue." });

  try {
    let user: User | null = null;
    let me: Me | null = null;
    const token = req.headers.get("Authorization")?.replace(/^Bearer /, "");
    if (token) user = (await db.auth.getUser(token)).data.user;
    if (match.access !== "public") {
      if (!user) fail(401, "Votre session a expiré. Merci de vous reconnecter.");
      me = must(await db.from("users").select("id, role, first_name, last_name, email, read_notifs, chat_charter_at, last_seen_at, deleted_at").eq("id", user!.id).maybeSingle()) as Me | null;
      if (!me || (me as Me & { deleted_at: string | null }).deleted_at) fail(401, "Compte introuvable.");
      const allowed = match.access === "auth" ? null : Array.isArray(match.access) ? match.access : [match.access];
      if (allowed && !allowed.includes(me!.role)) fail(403, "Action non autorisée.");
    }
    const values = path.match(match.pattern)!.slice(1).map(decodeURIComponent);
    const params = Object.fromEntries(match.keys.map((k, i) => [k, values[i]]));
    const body = await readJson(req);
    return await match.handler({ req, url, user, me: me as Me, body, params });
  } catch (err) {
    if (err instanceof HttpError) return json(err.status, { message: err.message });
    console.error(err);
    return json(500, { message: "Une erreur est survenue. Merci de réessayer." });
  }
}
