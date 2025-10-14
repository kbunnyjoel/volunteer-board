import { test, expect } from "@playwright/test";

test.describe("Volunteer Board smoke tests", () => {
  test("visitor can load volunteer opportunities", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByRole("link", { name: "Volunteer Board" })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Volunteer Board" })
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "Admin" })).toBeVisible();
  });

  test("visitor can reach admin dashboard scaffold", async ({ page }) => {
    await page.goto("/admin");

    await expect(page.getByRole("heading", { name: "Recent Signups" })).toBeVisible();
    await expect(
      page.getByRole("button", { name: /refresh/i })
    ).toBeVisible();
  });
});
