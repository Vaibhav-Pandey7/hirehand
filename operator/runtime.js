import { openBrowser } from "./browser/session.js";

// The browser can't live inside saved state (it isn't serializable), so it lives here
let ctx = null;

export async function getPage() {
  if (!ctx) ctx = await openBrowser();
  return ctx.page;
}

export async function closeBrowser() {
  if (ctx) await ctx.browser.close();
  ctx = null;
}