import fs from "node:fs";
import process from "node:process";

const API = process.env.FITLUNGE_CRM_QA_API || "http://localhost:5001/api";
const QA_DB = process.env.FITLUNGE_CRM_QA_DB || "fitlunge_crm_qa_20260815";
const ADMIN_EMAIL = process.env.FITLUNGE_CRM_QA_ADMIN || "crm.qa.admin@fitlunge.local";
const SALES_EMAIL = process.env.FITLUNGE_CRM_QA_SALES || "crm.qa.sales@fitlunge.local";
const STAFF_EMAIL = process.env.FITLUNGE_CRM_QA_STAFF || "crm.qa.staff@fitlunge.local";
const PASSWORD = process.env.FITLUNGE_CRM_QA_PASSWORD || "FitLungeCRMQA2026";
const BACKEND_LOG = process.env.FITLUNGE_CRM_QA_BACKEND_LOG || "/tmp/fitlunge-crm-qa-backend.log";

const results = [];
const createdContacts = [];
let adminToken = "";
let salesToken = "";
let staffToken = "";
let primary = null;
let task = null;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function line(name, status, detail = "") {
  const width = 44;
  const dots = ".".repeat(Math.max(2, width - name.length));
  console.log(`${name}${dots} ${status}${detail ? `  ${detail}` : ""}`);
  results.push({ name, status, detail });
}

async function test(name, fn) {
  try {
    const detail = await fn();
    line(name, "PASS", detail || "");
  } catch (error) {
    line(name, "FAIL", error.message || String(error));
    throw error;
  }
}

async function request(path, { method = "GET", token, body } = {}) {
  const headers = { Accept: "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers["Content-Type"] = "application/json";

  const response = await fetch(`${API}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }
  return { status: response.status, data };
}

async function login(email) {
  const res = await request("/auth/login", {
    method: "POST",
    body: { email, password: PASSWORD },
  });
  assert(res.status === 200, `${email} login returned HTTP ${res.status}`);
  assert(res.data?.token, `${email} login returned no token`);
  return res.data.token;
}

function watIso(daysFromToday, hour, minute = 0) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Lagos",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const part = (type) => parts.find((item) => item.type === type)?.value;
  const base = new Date(`${part("year")}-${part("month")}-${part("day")}T00:00:00.000Z`);
  base.setUTCDate(base.getUTCDate() + daysFromToday);
  const y = base.getUTCFullYear();
  const m = String(base.getUTCMonth() + 1).padStart(2, "0");
  const d = String(base.getUTCDate()).padStart(2, "0");
  const utcHour = hour - 1;
  return `${y}-${m}-${d}T${String(utcHour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00.000Z`;
}

async function findByEmail(email) {
  const res = await request(`/crm/contacts?search=${encodeURIComponent(email)}`, { token: adminToken });
  assert(res.status === 200, `Search returned HTTP ${res.status}`);
  const row = (res.data?.contacts || []).find((item) => item.email === email);
  assert(row, `CRM contact ${email} was not found`);
  return row;
}

async function detail(contactId) {
  const res = await request(`/crm/contacts/${contactId}`, { token: adminToken });
  assert(res.status === 200, `Contact detail returned HTTP ${res.status}`);
  return res.data;
}

async function archive(contactId) {
  try {
    await request(`/crm/contacts/${contactId}`, { method: "DELETE", token: adminToken });
  } catch {
    // Best-effort cleanup only. QA failures should remain inspectable.
  }
}

async function safetyGuard() {
  assert(API === "http://localhost:5001/api", `Safety stop: API must be http://localhost:5001/api, got ${API}`);
  assert(QA_DB.startsWith("fitlunge_crm_qa_"), `Safety stop: invalid QA DB name ${QA_DB}`);
  assert(fs.existsSync(BACKEND_LOG), `Safety stop: QA backend log not found at ${BACKEND_LOG}`);
  const log = fs.readFileSync(BACKEND_LOG, "utf8");
  assert(log.includes(`CRM QA target database:\n${QA_DB}`), `Safety stop: backend log does not confirm ${QA_DB}`);
  assert(log.includes("CRM QA backend port:\n5001"), "Safety stop: backend log does not confirm port 5001");
  const health = await request("/health");
  assert(health.status === 200, `Safety stop: QA backend health returned HTTP ${health.status}`);
}

async function main() {
  console.log("========================================");
  console.log("FITLUNGE CRM AUTOMATED QA");
  console.log("ISOLATED QA DATABASE ONLY");
  console.log("========================================");
  console.log(`API: ${API}`);
  console.log(`QA DB: ${QA_DB}`);
  console.log("");

  await test("00 Safety guard", async () => {
    await safetyGuard();
    return "localhost:5001 + QA DB confirmed";
  });

  await test("01 Admin login", async () => {
    adminToken = await login(ADMIN_EMAIL);
  });

  await test("02 Sales login", async () => {
    salesToken = await login(SALES_EMAIL);
  });

  await test("03 Staff login", async () => {
    staffToken = await login(STAFF_EMAIL);
  });

  await test("04 CRM role permissions", async () => {
    const [admin, sales, staff] = await Promise.all([
      request("/crm/overview", { token: adminToken }),
      request("/crm/overview", { token: salesToken }),
      request("/crm/overview", { token: staffToken }),
    ]);
    assert(admin.status === 200, `Admin CRM expected 200, got ${admin.status}`);
    assert(sales.status === 200, `Sales CRM expected 200, got ${sales.status}`);
    assert(staff.status === 403, `Staff CRM expected 403, got ${staff.status}`);
    return "Admin 200 / Sales 200 / Staff 403";
  });

  const assigneesRes = await request("/crm/assignees", { token: adminToken });
  assert(assigneesRes.status === 200, `Assignee lookup returned HTTP ${assigneesRes.status}`);
  const salesUser = (assigneesRes.data?.users || []).find((u) => (u.roles || []).includes("sales"));
  assert(salesUser?._id, "No active sales assignee found in QA database");

  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const email = `autoqa.${suffix}@example.com`;
  const phone = `0800${String(Date.now()).slice(-7)}`;
  const followUpIso = watIso(1, 10, 0);
  const taskDueIso = watIso(2, 11, 0);

  await test("05 Lead creation", async () => {
    const res = await request("/crm/contacts", {
      method: "POST",
      token: adminToken,
      body: {
        fullName: `AUTO QA Lead ${suffix}`,
        email,
        phone,
        source: "automated_qa",
        programInterest: "core",
        assignedTo: salesUser._id,
        estimatedValue: 35000,
        nextFollowUpAt: followUpIso,
        note: "Automated QA initial lead note.",
      },
    });
    assert(res.status === 201, `Lead creation expected 201, got ${res.status}: ${res.data?.message || ""}`);
    assert(res.data?.contact?._id, "Created lead has no contact id");
    assert(res.data?.contact?.opportunity?._id, "Created lead has no opportunity id");
    primary = {
      contactId: res.data.contact._id,
      opportunityId: res.data.contact.opportunity._id,
      email,
    };
    createdContacts.push(primary.contactId);
    assert(res.data.contact.opportunity.stage === "new", "New lead did not start in new stage");
    assert(res.data.contact.opportunity.estimatedValue === 35000, "Estimated value was not stored as 35000");
    assert(res.data.contact.opportunity.nextFollowUpAt === followUpIso, "Follow-up ISO was not stored exactly");
  });

  await test("06 Search + detail integrity", async () => {
    const found = await findByEmail(email);
    assert(found._id === primary.contactId, "Search returned a different contact");
    const data = await detail(primary.contactId);
    assert(data.contact.email === email, "Detail email mismatch");
    assert(data.opportunity.stage === "new", "Detail stage mismatch");
    assert(data.opportunity.assignedTo?._id === salesUser._id, "Sales assignment mismatch");
    assert((data.activities || []).some((a) => a.type === "note" && a.body === "Automated QA initial lead note."), "Initial note missing from activity history");
  });

  await test("07 Duplicate protection", async () => {
    const res = await request("/crm/contacts", {
      method: "POST",
      token: adminToken,
      body: {
        fullName: "AUTO QA Duplicate",
        email,
        phone: `+234 ${phone}`,
        source: "automated_qa",
        programInterest: "core",
      },
    });
    assert(res.status === 409, `Duplicate lead expected 409, got ${res.status}`);
  });

  await test("08 Invalid follow-up rejection", async () => {
    const res = await request(`/crm/opportunities/${primary.opportunityId}`, {
      method: "PATCH",
      token: adminToken,
      body: { nextFollowUpAt: "1016-08-16T09:00:00.000Z" },
    });
    assert(res.status === 400, `Invalid follow-up expected 400, got ${res.status}`);
    const data = await detail(primary.contactId);
    assert(data.opportunity.nextFollowUpAt === followUpIso, "Valid follow-up changed after rejected invalid date");
  });

  await test("09 New -> Qualified", async () => {
    const res = await request(`/crm/opportunities/${primary.opportunityId}`, {
      method: "PATCH",
      token: adminToken,
      body: { stage: "qualified" },
    });
    assert(res.status === 200, `Stage move expected 200, got ${res.status}`);
    assert(res.data?.opportunity?.stage === "qualified", "Opportunity did not move to qualified");
    const data = await detail(primary.contactId);
    const stageActivity = (data.activities || []).find((a) => a.type === "stage_change");
    assert(stageActivity, "Stage-change activity was not created");
    assert(stageActivity.metadata?.from === "new" && stageActivity.metadata?.to === "qualified", "Stage-change metadata is incorrect");
  });

  await test("10 Stage audit record", async () => {
    const res = await request("/audit", { token: adminToken });
    assert(res.status === 200, `Audit lookup expected 200, got ${res.status}`);
    const match = (res.data?.logs || []).find(
      (log) => log.action === "Moved CRM opportunity" && log.entityId === primary.opportunityId && log.details === "new → qualified"
    );
    assert(match, "Audit trail does not contain new → qualified transition");
  });

  await test("11 Call activity", async () => {
    const res = await request(`/crm/contacts/${primary.contactId}/activities`, {
      method: "POST",
      token: adminToken,
      body: {
        type: "call",
        body: "Automated QA call activity.",
      },
    });
    assert(res.status === 201, `Call activity expected 201, got ${res.status}`);
    assert(res.data?.activity?.type === "call", "Created activity is not a call");
  });

  await test("12 Task date + isolation", async () => {
    const res = await request(`/crm/contacts/${primary.contactId}/activities`, {
      method: "POST",
      token: adminToken,
      body: {
        type: "task",
        body: "Automated QA follow-up task.",
        dueAt: taskDueIso,
        assignedTo: salesUser._id,
      },
    });
    assert(res.status === 201, `Task creation expected 201, got ${res.status}: ${res.data?.message || ""}`);
    task = res.data.activity;
    assert(task?._id, "Task has no id");
    assert(task.dueAt === taskDueIso, `Task due date mismatch: ${task.dueAt} vs ${taskDueIso}`);
    const data = await detail(primary.contactId);
    assert(data.opportunity.nextFollowUpAt === followUpIso, "Creating task changed opportunity follow-up date");
    const storedTask = (data.activities || []).find((a) => a._id === task._id);
    assert(storedTask?.dueAt === taskDueIso, "Task detail due date mismatch");
  });

  await test("13 Invalid task-date rejection", async () => {
    const res = await request(`/crm/contacts/${primary.contactId}/activities`, {
      method: "POST",
      token: adminToken,
      body: {
        type: "task",
        body: "Invalid automated QA task.",
        dueAt: "1016-08-17T10:00:00.000Z",
      },
    });
    assert(res.status === 400, `Invalid task date expected 400, got ${res.status}`);
    const data = await detail(primary.contactId);
    const invalid = (data.activities || []).find((a) => a.body === "Invalid automated QA task.");
    assert(!invalid, "Invalid task was persisted despite rejection");
  });

  await test("14 Task completion toggle", async () => {
    const complete = await request(`/crm/activities/${task._id}/complete`, {
      method: "PATCH",
      token: adminToken,
    });
    assert(complete.status === 200, `Task completion expected 200, got ${complete.status}`);
    assert(complete.data?.activity?.completedAt, "Task completion did not set completedAt");
    const reopen = await request(`/crm/activities/${task._id}/complete`, {
      method: "PATCH",
      token: adminToken,
    });
    assert(reopen.status === 200, `Task reopen expected 200, got ${reopen.status}`);
    assert(!reopen.data?.activity?.completedAt, "Task reopen did not clear completedAt");
  });

  await test("15 Opportunity value integrity", async () => {
    const res = await request(`/crm/opportunities/${primary.opportunityId}`, {
      method: "PATCH",
      token: adminToken,
      body: { estimatedValue: 42000 },
    });
    assert(res.status === 200, `Value update expected 200, got ${res.status}`);
    assert(res.data?.opportunity?.estimatedValue === 42000, "Estimated value did not update to 42000");
    const data = await detail(primary.contactId);
    assert(data.opportunity.nextFollowUpAt === followUpIso, "Value update changed follow-up date");
  });

  await test("16 CRM -> Requests conversion", async () => {
    const res = await request(`/crm/contacts/${primary.contactId}/to-application`, {
      method: "POST",
      token: adminToken,
    });
    assert([200, 201].includes(res.status), `Conversion expected 200/201, got ${res.status}: ${res.data?.message || ""}`);
    assert(res.data?.application?._id, "Conversion returned no application id");
    const applicationId = res.data.application._id;
    const data = await detail(primary.contactId);
    assert(data.contact.lifecycleStage === "applicant", `Expected applicant lifecycle, got ${data.contact.lifecycleStage}`);
    assert(data.contact.application?._id === applicationId, "CRM contact was not linked to application");
    assert(
      data.opportunity.stage === "qualified",
      `Qualified opportunity regressed during application conversion: ${data.opportunity.stage}`
    );
    assert((data.activities || []).some((a) => a.type === "application"), "Application activity missing from CRM history");
  });

  await test("17 Conversion idempotency", async () => {
    const res = await request(`/crm/contacts/${primary.contactId}/to-application`, {
      method: "POST",
      token: adminToken,
    });
    assert(res.status === 200, `Second conversion expected 200, got ${res.status}`);
    assert(res.data?.alreadyExists === true, "Second conversion did not report alreadyExists=true");
  });

  const publicEmail = `autoqa.public.${suffix}@example.com`;
  let publicContactId = "";
  await test("18 Public Contact -> CRM", async () => {
    const res = await request("/public/contact", {
      method: "POST",
      body: {
        name: `AUTO QA Public ${suffix}`,
        email: publicEmail,
        phone: `0801${String(Date.now()).slice(-7)}`,
        message: "Automated QA website enquiry.",
        programInterest: "plus",
      },
    });
    assert(res.status === 201, `Public contact expected 201, got ${res.status}: ${res.data?.message || ""}`);
    const found = await findByEmail(publicEmail);
    publicContactId = found._id;
    createdContacts.push(publicContactId);
    assert(found.source === "website_contact", `Public lead source expected website_contact, got ${found.source}`);
    const data = await detail(publicContactId);
    assert((data.activities || []).some((a) => a.type === "email" && a.subject === "Website enquiry"), "Website enquiry activity missing");
  });

  await test("19 Sales write permission", async () => {
    const salesEmail = `autoqa.sales.${suffix}@example.com`;
    const res = await request("/crm/contacts", {
      method: "POST",
      token: salesToken,
      body: {
        fullName: `AUTO QA Sales Lead ${suffix}`,
        email: salesEmail,
        phone: `0802${String(Date.now()).slice(-7)}`,
        source: "automated_qa",
        programInterest: "not_sure",
      },
    });
    assert(res.status === 201, `Sales lead creation expected 201, got ${res.status}`);
    createdContacts.push(res.data.contact._id);
  });

  await test("20 Staff write restriction", async () => {
    const res = await request("/crm/contacts", {
      method: "POST",
      token: staffToken,
      body: {
        fullName: `AUTO QA Staff Block ${suffix}`,
        email: `autoqa.staff.${suffix}@example.com`,
        phone: `0803${String(Date.now()).slice(-7)}`,
        programInterest: "core",
      },
    });
    assert(res.status === 403, `Staff CRM create expected 403, got ${res.status}`);
  });

  console.log("");
  console.log("========================================");
  console.log("FITLUNGE CRM QA COMPLETE");
  console.log("========================================");
  console.log(`${results.filter((r) => r.status === "PASS").length}/${results.length} PASSED`);
  console.log(`Primary automated lead: ${email}`);
  console.log(`Public automated lead:  ${publicEmail}`);
  console.log("");
  console.log("No production API was contacted.");
  console.log("QA test records were left in the isolated QA database for inspection.");
}

main().catch(async (error) => {
  console.error("");
  console.error("========================================");
  console.error("FITLUNGE CRM QA STOPPED");
  console.error("========================================");
  console.error(error.stack || error.message || String(error));
  console.error("");
  console.error("No production API was contacted.");
  console.error("The failing QA records were intentionally left in the QA database for inspection.");
  process.exitCode = 1;
});
