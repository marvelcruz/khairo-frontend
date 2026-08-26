import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const BASE = process.env.CUSTOM_FIELDS_QA_FRONTEND_URL || "http://localhost:3007";
const API = process.env.CUSTOM_FIELDS_QA_API_URL || "http://localhost:5001/api";
const EMAIL = process.env.FITLUNGE_CRM_QA_ADMIN || "crm.qa.admin@fitlunge.local";
const PASSWORD = process.env.FITLUNGE_CRM_QA_PASSWORD || "FitLungeCRMQA2026";
const CHROME = process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const OUT = process.env.CUSTOM_FIELDS_QA_SCREENSHOT_DIR || path.join(process.env.HOME || "/tmp", "Desktop");

function fail(message) {
  throw new Error(message);
}

if (BASE !== "http://localhost:3007") fail(`Refusing non-QA frontend: ${BASE}`);
if (API !== "http://localhost:5001/api") fail(`Refusing non-QA API: ${API}`);
if (!fs.existsSync(CHROME)) fail(`Chrome not found at ${CHROME}`);

const health = await fetch(`${API}/health`).catch(() => null);
if (!health?.ok) fail("QA backend is not healthy on localhost:5001.");

const login = await fetch(`${API}/auth/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
}).catch(() => null);
if (!login?.ok) fail(`Admin QA login failed${login ? ` with HTTP ${login.status}` : ""}.`);
const loginPayload = await login.json();
const token = loginPayload?.token;
if (!token) fail("Admin QA login returned no token.");

const me = await fetch(`${API}/auth/me`, {
  headers: { Authorization: `Bearer ${token}` },
}).catch(() => null);
if (!me?.ok) fail("QA token could not read /auth/me.");
const mePayload = await me.json();
const roles = mePayload?.user?.roles || [];
if (!roles.includes("admin")) fail(`QA user is not Admin. Roles: ${roles.join(", ") || "none"}`);

const require = createRequire(import.meta.url);
let puppeteer;
try {
  const resolved = require.resolve("puppeteer-core", {
    paths: ["/tmp/fitlunge-mobile-qa-tools/node_modules", "/private/tmp/fitlunge-mobile-qa-tools/node_modules", process.cwd()],
  });
  puppeteer = require(resolved);
} catch {
  fail("puppeteer-core is not available in the FitLunge QA tools folder.");
}

fs.mkdirSync(OUT, { recursive: true });
const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
});

const page = await browser.newPage();
page.setDefaultTimeout(25000);
const browserErrors = [];
page.on("pageerror", (error) => browserErrors.push(`PAGE ERROR: ${error.message}`));
page.on("console", (message) => {
  if (message.type() === "error") browserErrors.push(`CONSOLE ERROR: ${message.text()}`);
});

// This runs before React/AuthContext on every navigation, avoiding the auth race
// that occurred when localStorage was populated only after /login had already booted.
await page.evaluateOnNewDocument((staffToken) => {
  localStorage.setItem("fitlunge_staff_token", staffToken);
}, token);

async function check(label, width, output) {
  await page.setViewport({ width, height: 950, isMobile: false, hasTouch: false });
  const response = await page.goto(`${BASE}/dashboard/custom-fields`, {
    waitUntil: "domcontentloaded",
    timeout: 30000,
  });
  if (!response) fail(`${label}: navigation returned no response.`);
  if (response.status() >= 400) fail(`${label}: page returned HTTP ${response.status()}.`);

  await page.waitForSelector('[data-testid="custom-fields-admin"]', {
    visible: true,
    timeout: 25000,
  });

  const state = await page.evaluate(() => ({
    url: location.href,
    width: document.documentElement.scrollWidth,
    viewport: document.documentElement.clientWidth,
    heading: document.querySelector("h1")?.textContent?.trim() || "",
  }));

  if (!state.url.includes("/dashboard/custom-fields")) {
    fail(`${label}: redirected unexpectedly to ${state.url}`);
  }
  if (state.heading !== "Custom Fields") {
    fail(`${label}: expected Custom Fields heading, found ${JSON.stringify(state.heading)}.`);
  }
  if (state.width > state.viewport + 2) {
    fail(`${label}: horizontal overflow ${state.width}px > ${state.viewport}px.`);
  }

  await page.screenshot({ path: output, fullPage: true });
  console.log(`${label.padEnd(34, ".")} PASS  ${width}px`);
}

try {
  console.log("========================================");
  console.log("FITLUNGE CUSTOM FIELDS UI QA - FIXED");
  console.log("TOKEN-AUTHENTICATED VISUAL CHECKS");
  console.log("========================================");
  console.log(`Admin role.......................... PASS`);

  await check("Desktop custom fields", 1440, path.join(OUT, "fitlunge-custom-fields-desktop.png"));
  await check("390px custom fields", 390, path.join(OUT, "fitlunge-custom-fields-mobile-390.png"));
  await check("320px custom fields", 320, path.join(OUT, "fitlunge-custom-fields-mobile-320.png"));

  console.log("");
  console.log("CUSTOM FIELDS UI QA PASSED");
  console.log("Screenshots:");
  console.log(path.join(OUT, "fitlunge-custom-fields-desktop.png"));
  console.log(path.join(OUT, "fitlunge-custom-fields-mobile-390.png"));
  console.log(path.join(OUT, "fitlunge-custom-fields-mobile-320.png"));
} catch (error) {
  const failPng = path.join(OUT, "fitlunge-custom-fields-FAIL.png");
  const failTxt = path.join(OUT, "fitlunge-custom-fields-FAIL.txt");
  await page.screenshot({ path: failPng, fullPage: true }).catch(() => {});
  const diagnostic = await page.evaluate(() => ({
    url: location.href,
    title: document.title,
    body: document.body?.innerText?.slice(0, 20000) || "",
    viewport: { width: innerWidth, height: innerHeight },
    testids: Array.from(document.querySelectorAll("[data-testid]")).map((node) => node.getAttribute("data-testid")),
    tokenPresent: Boolean(localStorage.getItem("fitlunge_staff_token")),
  })).catch(() => ({ url: "unknown", body: "unavailable" }));
  fs.writeFileSync(
    failTxt,
    `${error?.stack || error}\n\n${browserErrors.join("\n")}\n\n${JSON.stringify(diagnostic, null, 2)}\n`,
  );
  console.error(`Diagnostic screenshot: ${failPng}`);
  console.error(`Diagnostic text: ${failTxt}`);
  console.error(`FAIL: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
} finally {
  await browser.close();
}
