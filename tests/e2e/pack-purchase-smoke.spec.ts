import { expect, test } from "@playwright/test";

const packUrl = process.env.E2E_PACK_URL;

test.describe("pack purchase smoke", () => {
  test.skip(!packUrl, "Set E2E_PACK_URL to a paid pack detail path or URL to run this smoke test.");

  test("shows a paid-pack CTA and can mock checkout when buying is available", async ({ page, baseURL }) => {
    await page.route("**/api/packs/checkout", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ url: `${baseURL}/__mock-stripe-checkout` }),
      });
    });

    await page.goto(packUrl!);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    const buyButton = page.getByRole("button", { name: /(buy|checkout) for \$/i }).first();
    const signupButton = page.getByRole("button", { name: /sign up free to download/i }).first();

    if (await buyButton.isVisible()) {
      const emailInput = page.getByLabel(/email for receipt/i).first();
      if (await emailInput.isVisible()) {
        await emailInput.fill("buyer@example.com");
      }
      await buyButton.click();
      await expect(page).toHaveURL(/__mock-stripe-checkout/);
      return;
    }

    await expect(signupButton).toBeVisible();
  });
});
