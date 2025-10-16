import { test, expect } from "@playwright/test";

test.describe("Volunteer Board smoke tests", () => {
  test("visitor can browse opportunities and open the drawer", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("link", { name: "Volunteer Board" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Volunteer Board" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Admin" })).toBeVisible();

    const firstCard = page.locator(".opportunity-card").first();
    await expect(firstCard).toBeVisible();

    const viewButton = firstCard.getByRole("button", { name: "View & Apply" });
    await viewButton.click();

    const drawer = page.getByRole("dialog");
    await expect(drawer).toBeVisible();
    await expect(drawer.getByRole("heading")).toBeVisible();
    await expect(drawer.getByText(/Location:/i)).toBeVisible();

    await drawer.getByRole("button", { name: "×" }).click();
    await expect(drawer).not.toBeVisible();

    const loadMoreButton = page.getByRole("button", { name: /load more opportunities/i });
    if (await loadMoreButton.count()) {
      await expect(loadMoreButton).toBeVisible();
    }
  });

  test("admin login scaffold renders expected actions", async ({ page }) => {
    await page.goto("/admin");

    await expect(page.getByRole("heading", { name: "Recent Signups" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Export CSV" })).toBeVisible();
    await expect(page.getByRole("button", { name: /refresh/i })).toBeVisible();

    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(page.getByRole("button", { name: /continue/i })).toBeVisible();
  });
});
