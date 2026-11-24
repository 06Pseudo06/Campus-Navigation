import { test, expect } from "@playwright/test";

test.describe("Admin Workspace & Access Control", () => {
  test("unauthenticated user is redirected from /admin to /login", async ({ page }) => {
    // Navigate directly to /admin without session
    await page.goto("/admin");

    // Must redirect to login with redirect parameter
    await expect(page).toHaveURL(/\/login\?redirect=%2Fadmin|\/login\?redirect=\/admin/, { timeout: 15_000 });
  });

  test("student account receives 403 Forbidden card and cannot access admin workspace", async ({ page }) => {
    // 1. Log in as a student
    await page.goto("/login");
    await page.fill('input[type="email"]', "student@campusway.lpu.in");
    await page.fill('input[type="password"]', "Student@CampusWay2026!");
    await page.click('button[type="submit"]');

    // Wait for redirect to /explore or home
    await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 15_000 });

    // 2. Attempt to navigate to /admin
    await page.goto("/admin");

    // 3. Verify access denied banner is displayed
    await expect(page.getByText("Administrative Privileges Required")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("restricted to verified campus operators")).toBeVisible();
    await expect(page.getByRole("link", { name: "Return to Public CampusWay" })).toBeVisible();
  });

  test("admin user can access dashboard, telemetry, and all operations tabs", async ({ page }) => {
    // 1. Log in with pre-seeded administrator credentials
    await page.goto("/login");
    await page.fill('input[type="email"]', "admin@campusway.lpu.in");
    await page.fill('input[type="password"]', "Admin@CampusWay2026!");
    await page.click('button[type="submit"]');

    // Wait for navigation
    await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 15_000 });

    // 2. Navigate to /admin
    await page.goto("/admin");

    // 3. Verify Dashboard Overview elements
    await expect(page.getByRole("heading", { name: "Operations Command" })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("CONTROL CENTRE")).toBeVisible();
    await expect(page.getByText("CORE TELEMETRY")).toBeVisible();

    // Verify KPI metric cards
    await expect(page.getByText("Locations", { exact: true })).toBeVisible();
    await expect(page.getByText("Spatial Graph")).toBeVisible();
    await expect(page.getByText("Directory")).toBeVisible();
    await expect(page.getByText("Assistance & Issues")).toBeVisible();

    // 4. Verify User Management route
    await page.goto("/admin/users");
    await expect(page.getByRole("heading", { name: "User Account Management" })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("RBAC & DIRECTORY")).toBeVisible();
    await expect(page.getByPlaceholder("Search by email or name...")).toBeVisible();

    // 5. Verify Location Management route
    await page.goto("/admin/locations");
    await expect(page.getByRole("heading", { name: "Campus Location Management" })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("SPATIAL REPOSITORY")).toBeVisible();
    await expect(page.getByRole("button", { name: "Add POI Location" })).toBeVisible();

    // 6. Verify Routing Graph route
    await page.goto("/admin/routes");
    await expect(page.getByRole("heading", { name: "Routing Graph Management" })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("TOPOLOGY & PATHFINDING")).toBeVisible();
    await expect(page.getByText("Graph Diagnostics")).toBeVisible();

    // 7. Verify Reports & Assistance route
    await page.goto("/admin/reports");
    await expect(page.getByRole("heading", { name: "Assistance & Issue Reports" })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("Mobility Assistance")).toBeVisible();
    await expect(page.getByText("Map Discrepancy Reports")).toBeVisible();

    // 8. Verify Audit Logs route
    await page.goto("/admin/audit-logs");
    await expect(page.getByRole("heading", { name: "Administrative Activity Trail" })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("SECURITY AUDIT TRAIL")).toBeVisible();

    // 9. Verify Settings route
    await page.goto("/admin/settings");
    await expect(page.getByRole("heading", { name: "Administrative Settings & Policies" })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("Runtime Telemetry")).toBeVisible();
  });
});
