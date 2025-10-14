import { Router } from "express";
import { supabaseAdmin } from "../lib/supabase";
import { logger } from "../lib/logger";

const router = Router();

const MAX_PAGE_SIZE = 50;
const DEFAULT_PAGE_SIZE = 25;

const parsePositiveInt = (
  value: unknown,
  fallback: number,
  max: number
): number => {
  const raw =
    typeof value === "string"
      ? value
      : Array.isArray(value) && value.length > 0
      ? value[0]
      : null;
  if (!raw) return fallback;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, max);
};

router.get("/", async (req, res) => {
  const adminSecret = process.env.ADMIN_SECRET;
  const providedTokenHeader = req.header("x-admin-token");
  const bearerToken = req.header("authorization")?.replace("Bearer ", "").trim();

  const allowedEmails =
    process.env.ADMIN_EMAILS?.split(",").map((email) => email.trim().toLowerCase()).filter(Boolean) ?? [];

  if (bearerToken) {
    const { data, error } = await supabaseAdmin.auth.getUser(bearerToken);
    if (error || !data?.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (allowedEmails.length > 0) {
      const email = data.user.email?.toLowerCase();
      if (!email || !allowedEmails.includes(email)) {
        return res.status(403).json({ error: "Forbidden" });
      }
    }
  } else if (adminSecret && adminSecret.length > 0) {
    if (!providedTokenHeader || providedTokenHeader !== adminSecret) {
      return res.status(401).json({ error: "Unauthorized" });
    }
  } else {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const perPage = parsePositiveInt(
    req.query.perPage,
    DEFAULT_PAGE_SIZE,
    MAX_PAGE_SIZE
  );
  const page = parsePositiveInt(req.query.page, 1, Number.MAX_SAFE_INTEGER);
  const offset = (page - 1) * perPage;

  const opportunityFilter =
    typeof req.query.opportunityId === "string"
      ? req.query.opportunityId
      : undefined;

  let query = supabaseAdmin
    .from("signups")
    .select(
      "id, volunteer_name, volunteer_email, notes, created_at, opportunity_id",
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range(offset, offset + perPage - 1);

  if (opportunityFilter) {
    query = query.eq("opportunity_id", opportunityFilter);
  }

  const { data, error, count } = await query;

  if (error) {
    logger.error("Supabase signups fetch error", { error });
    return res.status(500).json({ error: "Failed to fetch signups" });
  }

  const normalized =
    data?.map((record) => ({
      id: record.id,
      volunteerName: record.volunteer_name,
      volunteerEmail: record.volunteer_email,
      notes: record.notes ?? undefined,
      createdAt: record.created_at,
      opportunityId: record.opportunity_id ?? null
    })) ?? [];

  const totalItems = count ?? normalized.length;
  const totalPages =
    perPage > 0 ? Math.max(Math.ceil(totalItems / perPage), 1) : 1;
  const hasMore = page < totalPages;

  res.json({
    items: normalized,
    page,
    perPage,
    totalItems,
    totalPages,
    hasMore,
    nextPage: hasMore ? page + 1 : null
  });
});

export { router as signupsRouter };
