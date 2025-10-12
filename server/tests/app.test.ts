import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockOpportunityRow = {
  id: "op-1",
  title: "Mock Opportunity",
  organization: "Test Org",
  location: "Remote",
  description: "Help with testing the application.",
  date: "2024-03-10",
  tags: ["Remote", "Testing"],
  spots_remaining: 5
};

const mockSignupRow = {
  id: "sign-1",
  volunteer_name: "Jane Volunteer",
  volunteer_email: "volunteer@example.com",
  notes: "Happy to help",
  created_at: "2024-03-08T12:00:00Z",
  opportunity_id: mockOpportunityRow.id
};

const opportunitiesOrderMock = vi.fn();
const signupsOrderMock = vi.fn();
const getUserMock = vi.fn();

vi.mock("../src/lib/supabase", () => ({
  supabaseAdmin: {
    from: vi.fn((table: string) => {
      if (table === "opportunities") {
        return {
          select: vi.fn(() => ({
            order: opportunitiesOrderMock
          }))
        };
      }

      if (table === "signups") {
        return {
          select: vi.fn(() => ({
            order: signupsOrderMock
          }))
        };
      }

      throw new Error(`Unexpected table requested in test: ${table}`);
    }),
    auth: {
      getUser: getUserMock
    }
  }
}));

import { app } from "../src/app";

describe("Volunteer Board API", () => {
beforeEach(() => {
  process.env.ADMIN_EMAILS = "admin@example.com";

  opportunitiesOrderMock.mockReset();
  signupsOrderMock.mockReset();
  getUserMock.mockReset();

  opportunitiesOrderMock.mockResolvedValue({
    data: [mockOpportunityRow],
    error: null
  });

  signupsOrderMock.mockResolvedValue({
    data: [mockSignupRow],
    error: null
  });

  getUserMock.mockResolvedValue({
    data: {
      user: {
        email: "admin@example.com"
      }
    },
    error: null
  });
});

afterEach(() => {
  process.env.ADMIN_EMAILS = "admin@example.com";
});

  it("returns health status", async () => {
    const response = await request(app).get("/api/health");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok" });
  });

  it("lists opportunities", async () => {
    const response = await request(app).get("/api/opportunities");
    expect(response.status).toBe(200);
    expect(response.body).toEqual([
      {
        id: mockOpportunityRow.id,
        title: mockOpportunityRow.title,
        organization: mockOpportunityRow.organization,
        location: mockOpportunityRow.location,
        description: mockOpportunityRow.description,
        date: mockOpportunityRow.date,
        tags: mockOpportunityRow.tags,
        spotsRemaining: mockOpportunityRow.spots_remaining
      }
    ]);
  });

  it("returns unauthorized for signups when token missing", async () => {
    const response = await request(app).get("/api/signups");
    expect(response.status).toBe(401);
  });

  it("lists signups when admin token provided", async () => {
    process.env.ADMIN_EMAILS = "admin@example.com";
    const response = await request(app)
      .get("/api/signups")
      .set("authorization", `Bearer test-token`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual([
      {
        id: mockSignupRow.id,
        volunteerName: mockSignupRow.volunteer_name,
        volunteerEmail: mockSignupRow.volunteer_email,
        notes: mockSignupRow.notes,
        createdAt: mockSignupRow.created_at,
        opportunityId: mockSignupRow.opportunity_id
      }
    ]);
  });

  it("rejects signups when token email is not allowed", async () => {
    process.env.ADMIN_EMAILS = "owner@example.com";
    getUserMock.mockResolvedValueOnce({
      data: {
        user: {
          email: "outsider@example.com"
        }
      },
      error: null
    });

    const response = await request(app)
      .get("/api/signups")
      .set("authorization", `Bearer test-token`);

    expect(response.status).toBe(403);
  });

  it("accepts legacy admin secret header", async () => {
    delete process.env.ADMIN_EMAILS;
    const response = await request(app)
      .get("/api/signups")
      .set("x-admin-token", process.env.ADMIN_SECRET ?? "");

    expect(response.status).toBe(200);
  });
});
