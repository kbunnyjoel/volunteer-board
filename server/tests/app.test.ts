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

const opportunitiesRangeMock = vi.hoisted(() => vi.fn());
const signupsRangeMock = vi.hoisted(() => vi.fn());
const getUserMock = vi.hoisted(() => vi.fn());
const rpcMock = vi.hoisted(() => vi.fn());

vi.mock("../src/lib/supabase", () => ({
  supabaseAdmin: {
    from: vi.fn((table: string) => {
      if (table === "opportunities") {
        return {
          select: vi.fn(() => ({
            order: vi.fn(() => ({
              range: opportunitiesRangeMock
            }))
          }))
        };
      }

      if (table === "signups") {
        return {
          select: vi.fn(() => ({
            order: vi.fn(() => ({
              range: signupsRangeMock
            }))
          }))
        };
      }

      throw new Error(`Unexpected table requested in test: ${table}`);
    }),
    auth: {
      getUser: getUserMock
    },
    rpc: rpcMock
  }
}));

import { app } from "../src/app";

describe("Volunteer Board API", () => {
beforeEach(() => {
  process.env.ADMIN_EMAILS = "admin@example.com";

  opportunitiesRangeMock.mockReset();
  signupsRangeMock.mockReset();
  getUserMock.mockReset();
  rpcMock.mockReset();

  opportunitiesRangeMock.mockResolvedValue({
    data: [mockOpportunityRow],
    error: null,
    count: 1
  });

  signupsRangeMock.mockResolvedValue({
    data: [mockSignupRow],
    error: null,
    count: 1
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
    expect(response.body).toMatchObject({
      items: [
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
      ],
      page: 1,
      totalItems: 1,
      totalPages: 1,
      hasMore: false,
      nextPage: null
    });
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
    expect(response.body).toMatchObject({
      items: [
        {
          id: mockSignupRow.id,
          volunteerName: mockSignupRow.volunteer_name,
          volunteerEmail: mockSignupRow.volunteer_email,
          notes: mockSignupRow.notes,
          createdAt: mockSignupRow.created_at,
          opportunityId: mockSignupRow.opportunity_id
        }
      ],
      page: 1,
      totalItems: 1,
      totalPages: 1,
      hasMore: false,
      nextPage: null
    });
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
