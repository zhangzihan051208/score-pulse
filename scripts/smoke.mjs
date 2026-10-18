import { chromium } from "playwright";

const BASE = process.env.BASE_URL || "http://127.0.0.1:43147";
const results = [];

function pass(name, detail = "") {
  results.push({ name, ok: true, detail });
}
function fail(name, detail = "") {
  results.push({ name, ok: false, detail });
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

try {
  const res = await page.goto(BASE, { waitUntil: "networkidle" });
  if (!res?.ok()) fail("home load", `status ${res?.status()}`);
  else pass("home load");

  const cssHref = await page
    .locator('link[rel="stylesheet"][href*="layout.css"]')
    .first()
    .getAttribute("href");
  if (cssHref) {
    const cssRes = await page.request.get(new URL(cssHref, BASE).toString());
    const type = cssRes.headers()["content-type"] || "";
    const body = await cssRes.text();
    if (cssRes.ok() && type.includes("text/css") && body.includes(".flex")) {
      pass("tailwind css", "layout.css served with utilities");
    } else {
      fail(
        "tailwind css",
        `ok=${cssRes.ok()} type=${type} hasFlex=${body.includes(".flex")}`,
      );
    }
  } else fail("tailwind css", "no layout.css link");

  const headerBg = await page.locator("header").evaluate((el) => {
    return getComputedStyle(el).backgroundColor;
  });
  if (headerBg === "rgb(20, 20, 20)") pass("styled header", headerBg);
  else fail("styled header", headerBg);

  const boards = await page.locator('a[href="/boards/nba"]').count();
  if (boards > 0) pass("nba board link");
  else fail("nba board link", "missing");

  await page.goto(`${BASE}/boards/nba`, { waitUntil: "networkidle" });
  const lakers = page.getByRole("link", { name: /Lakers vs Celtics/i });
  if ((await lakers.count()) > 0) pass("nba event list");
  else fail("nba event list");

  await page.goto(`${BASE}/events/lakers-celtics/tatum`, {
    waitUntil: "networkidle",
  });
  await page.waitForSelector('input[type="range"]', { timeout: 10000 });

  const overallBefore = await page
    .locator("form .text-primary.tabular-nums")
    .first()
    .textContent();
  const plus = page.locator('button[aria-label*=" +0.5"]').first();
  await plus.click();
  await page.waitForTimeout(150);
  const overallAfter = await page
    .locator("form .text-primary.tabular-nums")
    .first()
    .textContent();
  if (overallBefore !== overallAfter) pass("rating plus button", `${overallBefore} -> ${overallAfter}`);
  else fail("rating plus button", `stuck at ${overallBefore}`);

  const slider = page.locator('input[type="range"]').first();
  await slider.fill("9");
  const val = await slider.inputValue();
  if (Number(val) >= 8.5) pass("rating slider", `value ${val}`);
  else fail("rating slider", `value ${val}`);

  await page.selectOption("select", "zh");
  await page.waitForTimeout(400);
  const back = await page.getByText("返回比赛").count();
  if (back > 0) pass("locale switch zh");
  else fail("locale switch zh", "back label not Chinese");

  await page.fill("textarea", "Tatum attacked closeouts all fourth quarter long.");
  await page.getByRole("button", { name: /Post rating|提交评分/ }).click();
  await page.waitForTimeout(300);
  const saved = (await page.getByText(/Saved on this device|已保存在这台设备/).count()) > 0;
  const take = (await page.locator("#takes-list li").count()) > 0;
  if (saved && take) pass("submit rating + take");
  else fail("submit rating + take", `saved=${saved} takes=${take}`);

  await page.goto(`${BASE}/feed`, { waitUntil: "networkidle" });
  const feedItems = await page.locator("main ul li").count();
  if (feedItems > 0) pass("feed", `${feedItems} items`);
  else fail("feed", "empty");

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(BASE, { waitUntil: "networkidle" });
  const mobileNav = await page.locator('a[href="/boards/nba"]').count();
  if (mobileNav > 0) pass("mobile nav");
  else fail("mobile nav");
} catch (e) {
  fail("unexpected", String(e));
} finally {
  await browser.close();
}

const failed = results.filter((r) => !r.ok);
for (const r of results) {
  console.log(`${r.ok ? "PASS" : "FAIL"} ${r.name}${r.detail ? ` — ${r.detail}` : ""}`);
}
process.exit(failed.length ? 1 : 0);
