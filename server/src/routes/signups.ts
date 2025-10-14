import { Router } from "express";
import { supabaseAdmin } from "../lib/supabase";
import { logger } from "../lib/logger";

const router = Router();

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

  const { data, error } = await supabaseAdmin
    .from("signups")
    .select(
      "id, volunteer_name, volunteer_email, notes, created_at, opportunity_id"
    )
    .order("created_at", { ascending: false });

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

  res.json(normalized);
});

export { router as signupsRouter };
