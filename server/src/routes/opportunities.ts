import { Router } from "express";
import { z } from "zod";
import { supabaseAdmin } from "../lib/supabase";
import type {
  Opportunity,
  CreateOpportunityPayload,
  UpdateOpportunityPayload,
  SignupPayload
} from "../types";

const router = Router();

type OpportunityRow = {
  id: string;
  title: string;
  organization: string;
  location: string;
  description: string;
  date: string;
  tags: string[] | null;
  spots_remaining: number;
};

type SignupRow = {
  id: string;
  opportunity_id: string;
  volunteer_name: string;
  volunteer_email: string;
  notes: string | null;
  created_at: string;
};

const opportunitySchema = z.object({
  title: z.string().min(3),
  organization: z.string().min(2),
  location: z.string().min(2),
  description: z.string().min(10),
  date: z.string(),
  tags: z.array(z.string()).default([]),
  spotsRemaining: z.number().int().nonnegative()
});

const updateSchema = opportunitySchema.partial();

const signupSchema = z.object({
  opportunityId: z.string(),
  volunteerName: z.string().min(2),
  volunteerEmail: z.string().email(),
  notes: z.string().optional()
});

const mapOpportunityRow = (row: OpportunityRow): Opportunity => ({
  id: row.id,
  title: row.title,
  organization: row.organization,
  location: row.location,
  description: row.description,
  date: row.date,
  tags: row.tags ?? [],
  spotsRemaining: row.spots_remaining
});

const mapSignupRow = (row: SignupRow): SignupPayload & {
  id: string;
  createdAt: string;
} => ({
  id: row.id,
  createdAt: row.created_at,
  opportunityId: row.opportunity_id,
  volunteerName: row.volunteer_name,
  volunteerEmail: row.volunteer_email,
  notes: row.notes ?? undefined
});

router.get("/", async (_req, res) => {
  const { data, error } = await supabaseAdmin
    .from("opportunities")
    .select(
      "id, title, organization, location, description, date, tags, spots_remaining"
    )
    .order("date", { ascending: true });

  if (error) {
    console.error("Supabase list error", error);
    return res.status(500).json({ error: "Failed to fetch opportunities" });
  }

  const normalized = (data ?? []).map(mapOpportunityRow);
  res.json(normalized);
});

router.post("/", async (req, res) => {
  const parseResult = opportunitySchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: parseResult.error.flatten() });
  }

  const payload: CreateOpportunityPayload = parseResult.data;
  const { data, error } = await supabaseAdmin
    .from("opportunities")
    .insert({
      title: payload.title,
      organization: payload.organization,
      location: payload.location,
      description: payload.description,
      date: payload.date,
      tags: payload.tags,
      spots_remaining: payload.spotsRemaining
    })
    .select(
      "id, title, organization, location, description, date, tags, spots_remaining"
    )
    .single();

  if (error) {
    console.error("Supabase insert error", error);
    return res.status(500).json({ error: "Failed to create opportunity" });
  }

  res.status(201).json(mapOpportunityRow(data));
});

router.patch("/:id", async (req, res) => {
  const parseResult = updateSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: parseResult.error.flatten() });
  }

  const updates: Record<string, unknown> = {};
  const payload = parseResult.data;

  if (payload.title !== undefined) updates.title = payload.title;
  if (payload.organization !== undefined)
    updates.organization = payload.organization;
  if (payload.location !== undefined) updates.location = payload.location;
  if (payload.description !== undefined)
    updates.description = payload.description;
  if (payload.date !== undefined) updates.date = payload.date;
  if (payload.tags !== undefined) updates.tags = payload.tags;
  if (payload.spotsRemaining !== undefined)
    updates.spots_remaining = payload.spotsRemaining;

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: "No updates provided" });
  }

  const { data, error, status } = await supabaseAdmin
    .from("opportunities")
    .update(updates)
    .eq("id", req.params.id)
    .select(
      "id, title, organization, location, description, date, tags, spots_remaining"
    )
    .single();

  if (status === 406) {
    return res.status(404).json({ error: "Opportunity not found" });
  }

  if (error) {
    console.error("Supabase update error", error);
    return res.status(500).json({ error: "Failed to update opportunity" });
  }

  res.json(mapOpportunityRow(data));
});

router.delete("/:id", async (req, res) => {
  const { data, error, status } = await supabaseAdmin
    .from("opportunities")
    .delete()
    .eq("id", req.params.id)
    .select("id")
    .single();

  if (status === 406) {
    return res.status(404).json({ error: "Opportunity not found" });
  }

  if (error) {
    console.error("Supabase delete error", error);
    return res.status(500).json({ error: "Failed to delete opportunity" });
  }

  if (!data) {
    return res.status(404).json({ error: "Opportunity not found" });
  }

  return res.status(204).send();
});

router.post("/:id/signups", async (req, res) => {
  const parseResult = signupSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: parseResult.error.flatten() });
  }

  if (req.params.id !== parseResult.data.opportunityId) {
    return res.status(400).json({
      error: "Opportunity ID mismatch"
    });
  }

  const { data: opportunity, error: fetchError } = await supabaseAdmin
    .from("opportunities")
    .select("id, spots_remaining")
    .eq("id", req.params.id)
    .single();

  if (fetchError) {
    if (fetchError.code === "PGRST116") {
      return res.status(404).json({ error: "Opportunity not found" });
    }
    console.error("Supabase fetch for signup error", fetchError);
    return res.status(500).json({ error: "Failed to load opportunity" });
  }

  if (!opportunity) {
    return res.status(404).json({ error: "Opportunity not found" });
  }

  if (opportunity.spots_remaining <= 0) {
    return res.status(409).json({ error: "No spots remaining" });
  }

  const { error: signupError } = await supabaseAdmin.from("signups").insert({
    opportunity_id: req.params.id,
    volunteer_name: parseResult.data.volunteerName,
    volunteer_email: parseResult.data.volunteerEmail,
    notes: parseResult.data.notes ?? null
  });

  if (signupError) {
    console.error("Supabase signup insert error", signupError);
    return res.status(500).json({ error: "Failed to record signup" });
  }

  const { error: decrementError } = await supabaseAdmin
    .from("opportunities")
    .update({
      spots_remaining: opportunity.spots_remaining - 1
    })
    .eq("id", req.params.id);

  if (decrementError) {
    console.error("Supabase decrement error", decrementError);
    return res
      .status(500)
      .json({ error: "Signup recorded but failed to decrement spots" });
  }

  res.status(201).json({
    success: true,
    message: "Signup recorded. Organizer will follow up soon."
  });
});

router.get("/:id/signups", async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from("signups")
    .select(
      "id, opportunity_id, volunteer_name, volunteer_email, notes, created_at"
    )
    .eq("opportunity_id", req.params.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Supabase signup list error", error);
    return res.status(500).json({ error: "Failed to fetch signups" });
  }

  res.json((data ?? []).map(mapSignupRow));
});

export { router as opportunitiesRouter };
