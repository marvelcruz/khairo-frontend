import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const BASE = process.env.CRM_QA_FRONTEND_URL || "http://localhost:3007";
const API = process.env.CRM_QA_API_URL || "http://localhost:5001/api";
const EMAIL = process.env.CRM_QA_ADMIN_EMAIL || "crm.qa.admin@fitlunge.local";
const PASSWORD = process.env.CRM_QA_ADMIN_PASSWORD || "FitLungeCRMQA2026";
const CHROME = process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const OUT = process.env.CRM_QA_SCREENSHOT_DIR || path.join(process.env.HOME || "/tmp", "Desktop");

function fail(message) {
  console.error(`FAIL: ${message}`);
  process.exit(1);
}

if (BASE !== "http://localhost:3007") fail(`Refusing non-QA frontend: ${BASE}`);
if (API !== "http://localhost:5001/api") fail(`Refusing non-QA API: ${API}`);
if (!fs.existsSync(CHROME)) fail(`Chrome not found at ${CHROME}`);

const health = await fetch(`${API}/health`).catch(() => null);
if (!health?.ok) fail("QA backend is not healthy on localhost:5001.");

const require = createRequire(import.meta.url);
let puppeteer;
try {
  const resolved = require.resolve("puppeteer-core", {
    paths: ["/tmp/fitlunge-mobile-qa-tools/node_modules", "/tmp/fitlunge-mobile-qa-tools", process.cwd()],
  });
  puppeteer = require(resolved);
} catch {
  fail("puppeteer-core is not available in the FitLunge QA tools folder.");
}

fs.mkdirSync(OUT, { recursive: true });
const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
});
const page = await browser.newPage();
page.setDefaultTimeout(25000);

const files = [];

async function shot(name) {
  const file = path.join(OUT, name);
  await page.screenshot({ path: file, fullPage: false });
  files.push(file);
}

async function assertNoPageOverflow(label) {
  const result = await page.evaluate(() => ({
    viewport: window.innerWidth,
    documentWidth: document.documentElement.scrollWidth,
    bodyWidth: document.body.scrollWidth,
  }));
  const overflow = Math.max(result.documentWidth, result.bodyWidth) - result.viewport;
  if (overflow > 2) throw new Error(`${label} has ${overflow}px page-level horizontal overflow.`);
  console.log(`${label.padEnd(34, ".")} PASS  ${result.viewport}px`);
}

async function clickTestId(id) {
  const selector = `[data-testid="${id}"]`;
  await page.waitForSelector(selector, { visible: true });
  await page.click(selector);
  await new Promise((resolve) => setTimeout(resolve, 250));
}

try {
  console.log("========================================");
  console.log("FITLUNGE CRM PROFESSIONAL UI QA");
  console.log("STABLE TEST-ID VISUAL SMOKE CHECKS");
  console.log("========================================");

  await page.setViewport({ width: 1440, height: 1000, isMobile: false, hasTouch: false });
  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("#email", { visible: true });
  await page.type("#email", EMAIL);
  await page.type("#password", PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForFunction(() => window.location.pathname.startsWith("/dashboard"));

  await page.goto(`${BASE}/dashboard/crm`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector('[data-testid="crm-root"]', { visible: true });
  await page.waitForSelector('[data-testid="crm-pipeline"]', { visible: true });
  await assertNoPageOverflow("Desktop pipeline");
  await shot("fitlunge-crm-professional-desktop-pipeline.png");

  await clickTestId("crm-tab-contacts");
  await page.waitForSelector('[data-testid="crm-contacts"]', { visible: true });
  await assertNoPageOverflow("Desktop contacts");
  await shot("fitlunge-crm-professional-desktop-contacts.png");

  const firstRow = await page.$('[data-testid="crm-contacts-table"] tbody tr');
  if (firstRow) {
    await firstRow.click();
    await page.waitForSelector('[data-testid="crm-drawer"]', { visible: true });
    await page.waitForSelector('[data-testid="crm-quick-actions"]', { visible: true });
    await assertNoPageOverflow("Desktop contact drawer");
    await shot("fitlunge-crm-professional-desktop-contact.png");
    await page.keyboard.press("Escape");
    await page.waitForFunction(() => !document.querySelector('[data-testid="crm-drawer"]'));
  }

  await clickTestId("crm-tab-followups");
  await page.waitForSelector('[data-testid="crm-followups"]', { visible: true });
  await assertNoPageOverflow("Desktop follow-ups");
  await shot("fitlunge-crm-professional-desktop-followups.png");

  await clickTestId("crm-tab-pipeline");
  await page.waitForSelector('[data-testid="crm-pipeline"]', { visible: true });

  await page.setViewport({ width: 390, height: 844, isMobile: false, hasTouch: false });
  await new Promise((resolve) => setTimeout(resolve, 250));
  await assertNoPageOverflow("390px pipeline");
  await shot("fitlunge-crm-professional-mobile-390.png");

  await page.setViewport({ width: 320, height: 760, isMobile: false, hasTouch: false });
  await new Promise((resolve) => setTimeout(resolve, 250));
  await assertNoPageOverflow("320px pipeline");
  await shot("fitlunge-crm-professional-mobile-320.png");

  console.log("");
  console.log("PROFESSIONAL UI SMOKE QA PASSED");
  console.log("Screenshots:");
  for (const file of files) console.log(file);
} catch (error) {
  const failPng = path.join(OUT, "fitlunge-crm-professional-FAIL.png");
  const failTxt = path.join(OUT, "fitlunge-crm-professional-FAIL.txt");
  await page.screenshot({ path: failPng, fullPage: true }).catch(() => {});
  const diagnostic = await page.evaluate(() => ({
    url: location.href,
    title: document.title,
    body: document.body.innerText.slice(0, 20000),
    viewport: { width: innerWidth, height: innerHeight },
  })).catch(() => ({ url: "unknown", body: "unavailable" }));
  fs.writeFileSync(failTxt, `${error?.stack || error}\n\n${JSON.stringify(diagnostic, null, 2)}\n`);
  console.error(`Diagnostic screenshot: ${failPng}`);
  console.error(`Diagnostic text: ${failTxt}`);
  console.error(`FAIL: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
} finally {
  await browser.close();
}
