import fs from "node:fs";

const API = process.env.FITLUNGE_CRM_QA_API || "http://localhost:5001/api";
const QA_DB = process.env.FITLUNGE_CRM_QA_DB || "fitlunge_crm_qa_20260815";
const ADMIN_EMAIL = process.env.FITLUNGE_CRM_QA_ADMIN || "crm.qa.admin@fitlunge.local";
const SALES_EMAIL = process.env.FITLUNGE_CRM_QA_SALES || "crm.qa.sales@fitlunge.local";
const STAFF_EMAIL = process.env.FITLUNGE_CRM_QA_STAFF || "crm.qa.staff@fitlunge.local";
const PASSWORD = process.env.FITLUNGE_CRM_QA_PASSWORD || "FitLungeCRMQA2026";
const BACKEND_LOG = process.env.FITLUNGE_CRM_QA_BACKEND_LOG || "/tmp/fitlunge-crm-qa-backend.log";

let adminToken = "";
let salesToken = "";
let staffToken = "";
let field = null;
let secondField = null;
let lead = null;
let application = null;
let client = null;
let passes = 0;

function assert(condition, message) { if (!condition) throw new Error(message); }
function row(name, status, detail = "") { const dots = ".".repeat(Math.max(2, 45 - name.length)); console.log(`${name}${dots} ${status}${detail ? `  ${detail}` : ""}`); }
async function test(name, fn) { try { const detail = await fn(); passes += 1; row(name, "PASS", detail || ""); } catch (error) { row(name, "FAIL", error.message || String(error)); throw error; } }

async function request(path, { method = "GET", token, body } = {}) {
  const headers = { Accept: "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers["Content-Type"] = "application/json";
  const response = await fetch(`${API}${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  const text = await response.text();
  let data = null; try { data = text ? JSON.parse(text) : null; } catch { data = { raw: text }; }
  return { status: response.status, data };
}

async function login(email) {
  const res = await request("/auth/login", { method: "POST", body: { email, password: PASSWORD } });
  assert(res.status === 200 && res.data?.token, `${email} login failed with HTTP ${res.status}`);
  return res.data.token;
}

async function main() {
  console.log("========================================");
  console.log("FITLUNGE CUSTOM FIELDS AUTOMATED QA");
  console.log("ISOLATED QA DATABASE ONLY");
  console.log("========================================");
  console.log(`API: ${API}`); console.log(`QA DB: ${QA_DB}`); console.log("");

  await test("00 Safety guard", async () => {
    assert(API === "http://localhost:5001/api", `API must be localhost:5001, got ${API}`);
    assert(QA_DB.startsWith("fitlunge_crm_qa_"), `Unexpected QA database ${QA_DB}`);
    assert(fs.existsSync(BACKEND_LOG), "QA backend log is missing");
    const log = fs.readFileSync(BACKEND_LOG, "utf8");
    assert(log.includes(`CRM QA target database:\n${QA_DB}`), "Backend log does not confirm isolated QA database");
    const health = await request("/health"); assert(health.status === 200, `Health returned ${health.status}`);
    return "localhost:5001 + QA DB confirmed";
  });

  await test("01 Role logins", async () => { [adminToken, salesToken, staffToken] = await Promise.all([login(ADMIN_EMAIL), login(SALES_EMAIL), login(STAFF_EMAIL)]); });

  await test("02 Field-library access", async () => {
    const [admin, sales] = await Promise.all([request("/custom-fields/definitions?includeInactive=true", { token: adminToken }), request("/custom-fields/definitions", { token: salesToken })]);
    assert(admin.status === 200, `Admin library expected 200, got ${admin.status}`);
    assert(sales.status === 403, `Sales library expected 403, got ${sales.status}`);
  });

  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  await test("03 Create reusable field", async () => {
    const res = await request("/custom-fields/definitions", { method: "POST", token: adminToken, body: { label: `AUTO QA Preferred channel ${suffix}`, type: "select", entityTypes: ["crm_contact", "application", "client"], required: true, description: "Automated QA field", options: [{ value: "whatsapp", label: "WhatsApp" }, { value: "email", label: "Email" }] } });
    assert(res.status === 201, `Create field expected 201, got ${res.status}: ${res.data?.message || ""}`); field = res.data.field; assert(field?._id, "Created field has no id");
  });

  await test("04 Create second field + ordering", async () => {
    const res = await request("/custom-fields/definitions", { method: "POST", token: adminToken, body: { label: `AUTO QA Reference ${suffix}`, type: "text", entityTypes: ["crm_contact"], required: false } });
    assert(res.status === 201, `Create second field expected 201, got ${res.status}`); secondField = res.data.field;
    const reorder = await request("/custom-fields/definitions/reorder", { method: "PATCH", token: adminToken, body: { ids: [secondField._id, field._id] } });
    assert(reorder.status === 200, `Reorder expected 200, got ${reorder.status}`);
  });

  const email = `customfields.${suffix}@example.com`;
  await test("05 Create QA CRM lead", async () => {
    const res = await request("/crm/contacts", { method: "POST", token: adminToken, body: { fullName: `AUTO QA Custom Fields ${suffix}`, email, phone: `080${String(Date.now()).slice(-8)}`, source: "custom_fields_qa", programInterest: "core" } });
    assert(res.status === 201, `Lead creation expected 201, got ${res.status}`); lead = res.data.contact; assert(lead?._id, "Lead id missing");
  });

  await test("06 Required validation", async () => {
    const res = await request(`/custom-fields/records/crm_contact/${lead._id}`, { method: "PUT", token: adminToken, body: { values: { [field._id]: null } } });
    assert(res.status === 400, `Blank required value expected 400, got ${res.status}`);
  });

  await test("07 Save + read CRM value", async () => {
    const save = await request(`/custom-fields/records/crm_contact/${lead._id}`, { method: "PUT", token: salesToken, body: { values: { [field._id]: "whatsapp", [secondField._id]: "QA-REF" } } });
    assert(save.status === 200, `Sales save expected 200, got ${save.status}: ${save.data?.message || ""}`);
    const read = await request(`/custom-fields/records/crm_contact/${lead._id}`, { token: salesToken });
    assert(read.status === 200, `Sales read expected 200, got ${read.status}`); assert(read.data.values?.[field._id] === "whatsapp", "Stored CRM value mismatch");
  });

  await test("08 Invalid option rejected", async () => {
    const res = await request(`/custom-fields/records/crm_contact/${lead._id}`, { method: "PUT", token: adminToken, body: { values: { [field._id]: "sms" } } });
    assert(res.status === 400, `Invalid select expected 400, got ${res.status}`);
  });

  await test("09 Role ceiling enforced", async () => {
    const write = await request(`/custom-fields/records/crm_contact/${lead._id}`, { method: "PUT", token: staffToken, body: { values: { [field._id]: "email" } } });
    assert(write.status === 403, `Staff CRM write expected 403, got ${write.status}`);
  });

  await test("10 CRM -> Requests value continuity", async () => {
    const convert = await request(`/crm/contacts/${lead._id}/to-application`, { method: "POST", token: adminToken });
    assert([200, 201].includes(convert.status), `Conversion expected 200/201, got ${convert.status}: ${convert.data?.message || ""}`); application = convert.data.application; assert(application?._id, "Application id missing");
    const read = await request(`/custom-fields/records/application/${application._id}`, { token: salesToken });
    assert(read.status === 200, `Application custom fields expected 200, got ${read.status}`); assert(read.data.values?.[field._id] === "whatsapp", "CRM value did not carry into Requests");
  });

  await test("11 Client values + staff read-only", async () => {
    const create = await request("/clients", { method: "POST", token: adminToken, body: { fullName: `AUTO QA Client ${suffix}`, email: `client.${suffix}@example.com`, phone: `081${String(Date.now()).slice(-8)}`, program: "core" } });
    assert(create.status === 201, `Client creation expected 201, got ${create.status}: ${create.data?.message || ""}`); client = create.data.client;
    const save = await request(`/custom-fields/records/client/${client._id}`, { method: "PUT", token: adminToken, body: { values: { [field._id]: "email" } } }); assert(save.status === 200, `Client custom save expected 200, got ${save.status}`);
    const read = await request(`/custom-fields/records/client/${client._id}`, { token: staffToken }); assert(read.status === 200, `Staff client read expected 200, got ${read.status}`); assert(read.data.values?.[field._id] === "email", "Client value mismatch");
    const write = await request(`/custom-fields/records/client/${client._id}`, { method: "PUT", token: staffToken, body: { values: { [field._id]: "whatsapp" } } }); assert(write.status === 403, `Staff client write expected 403, got ${write.status}`);
  });

  await test("12 Type-change protection", async () => {
    const res = await request(`/custom-fields/definitions/${field._id}`, { method: "PATCH", token: adminToken, body: { type: "number" } });
    assert(res.status === 409, `Type change after saved values expected 409, got ${res.status}`);
  });

  await test("13 Activate / deactivate", async () => {
    const off = await request(`/custom-fields/definitions/${field._id}`, { method: "PATCH", token: adminToken, body: { active: false } }); assert(off.status === 200, `Deactivate expected 200, got ${off.status}`);
    const hidden = await request(`/custom-fields/records/crm_contact/${lead._id}`, { token: salesToken }); assert(hidden.status === 200, `Read after deactivate expected 200, got ${hidden.status}`); assert(!(hidden.data.fields || []).some((item) => item._id === field._id), "Inactive field still returned to records");
    const on = await request(`/custom-fields/definitions/${field._id}`, { method: "PATCH", token: adminToken, body: { active: true } }); assert(on.status === 200, `Reactivate expected 200, got ${on.status}`);
    const restored = await request(`/custom-fields/records/crm_contact/${lead._id}`, { token: salesToken }); assert(restored.data.values?.[field._id] === "whatsapp", "Stored value was lost during deactivate/reactivate");
  });

  await test("14 Definition edit", async () => {
    const res = await request(`/custom-fields/definitions/${field._id}`, { method: "PATCH", token: adminToken, body: { label: `AUTO QA Preferred contact ${suffix}` } }); assert(res.status === 200, `Edit expected 200, got ${res.status}`); assert(res.data.field?.label.includes("Preferred contact"), "Definition label did not update");
  });

  console.log("\n========================================"); console.log("FITLUNGE CUSTOM FIELDS QA COMPLETE"); console.log("========================================"); console.log(`${passes}/15 PASSED`); console.log(`QA field: ${field._id}`); console.log(`QA lead: ${lead._id}`); console.log(`QA request: ${application._id}`); console.log(`QA client: ${client._id}`); console.log("\nNo production API was contacted."); console.log("QA records were left in the isolated QA database for inspection.");
}

main().catch((error) => { console.error(`\nSTOP: ${error.message || error}`); process.exit(1); });
