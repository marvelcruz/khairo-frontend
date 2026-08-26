import fs from "node:fs";

const API = process.env.WORKFLOWS_QA_API || "http://localhost:5001/api";
const QA_DB = process.env.FITLUNGE_CRM_QA_DB || "fitlunge_crm_qa_20260815";
const ADMIN_EMAIL = process.env.FITLUNGE_CRM_QA_ADMIN || "crm.qa.admin@fitlunge.local";
const SALES_EMAIL = process.env.FITLUNGE_CRM_QA_SALES || "crm.qa.sales@fitlunge.local";
const PASSWORD = process.env.FITLUNGE_CRM_QA_PASSWORD || "FitLungeCRMQA2026";
const BACKEND_LOG = process.env.FITLUNGE_CRM_QA_BACKEND_LOG || "/tmp/fitlunge-crm-qa-backend.log";
const results = [];
let adminToken = "";
let salesToken = "";
let salesUser = null;
let workflowAddTag = null;
let workflowRemoveTag = null;
let triggerTag = null;

function assert(value, message) { if (!value) throw new Error(message); }
function line(name, status, detail = "") { const dots=".".repeat(Math.max(2,48-name.length)); console.log(`${name}${dots} ${status}${detail?`  ${detail}`:""}`); results.push({name,status,detail}); }
async function test(name, fn) { try { const detail=await fn(); line(name,"PASS",detail||""); } catch(error){ line(name,"FAIL",error.message||String(error)); throw error; } }
async function request(path,{method="GET",token,body}={}) { const headers={Accept:"application/json"}; if(token)headers.Authorization=`Bearer ${token}`; if(body!==undefined)headers["Content-Type"]="application/json"; const res=await fetch(`${API}${path}`,{method,headers,body:body===undefined?undefined:JSON.stringify(body)}); const text=await res.text(); let data={}; try{data=text?JSON.parse(text):{}}catch{data={raw:text}} return {status:res.status,data}; }
async function login(email){const res=await request("/auth/login",{method:"POST",body:{email,password:PASSWORD}});assert(res.status===200,`${email} login HTTP ${res.status}`);assert(res.data?.token,"No token");return res.data.token;}
async function sleep(ms){return new Promise(resolve=>setTimeout(resolve,ms));}
async function waitFor(fn,{timeout=7000,interval=250,label="condition"}={}){const end=Date.now()+timeout;let last;while(Date.now()<end){last=await fn();if(last)return last;await sleep(interval)}throw new Error(`Timed out waiting for ${label}`)}
async function contactDetail(id){const res=await request(`/crm/contacts/${id}`,{token:adminToken});assert(res.status===200,`Contact detail HTTP ${res.status}`);return res.data;}
async function createLead(suffix){const res=await request("/crm/contacts",{method:"POST",token:adminToken,body:{fullName:`Workflow QA ${suffix}`,email:`workflow.qa.${suffix}@example.com`,phone:`0809${String(Date.now()).slice(-7)}`,source:"workflow_qa",programInterest:"core",assignedTo:salesUser?._id,estimatedValue:42000}});assert(res.status===201,`Create lead HTTP ${res.status}: ${res.data?.message||""}`);return res.data.contact;}
async function createWorkflow(body){const res=await request("/workflows",{method:"POST",token:adminToken,body});assert(res.status===201,`Create workflow HTTP ${res.status}: ${res.data?.message||""}`);return res.data.workflow;}
async function activate(id){const res=await request(`/workflows/${id}/status`,{method:"PATCH",token:adminToken,body:{status:"active"}});assert(res.status===200,`Activate HTTP ${res.status}`);return res.data.workflow;}
async function runs(workflowId){const res=await request(`/workflows/runs?workflowId=${workflowId}`,{token:adminToken});assert(res.status===200,`Runs HTTP ${res.status}`);return res.data.runs||[];}

async function main(){
 console.log("========================================");console.log("FITLUNGE WORKFLOW BUILDER AUTOMATED QA");console.log("ISOLATED QA DATABASE ONLY");console.log("========================================");console.log(`API: ${API}`);console.log(`QA DB: ${QA_DB}\n`);
 await test("00 Safety guard",async()=>{assert(API==="http://localhost:5001/api",`Safety stop: API ${API}`);assert(QA_DB.startsWith("fitlunge_crm_qa_"),`Safety stop: DB ${QA_DB}`);assert(fs.existsSync(BACKEND_LOG),"Safety stop: backend log missing");const log=fs.readFileSync(BACKEND_LOG,"utf8");assert(log.includes(`CRM QA target database:\n${QA_DB}`),"Safety stop: QA DB not confirmed");assert(log.includes("CRM QA backend port:\n5001"),"Safety stop: port 5001 not confirmed");const health=await request("/health");assert(health.status===200,"QA backend unhealthy");return "localhost:5001 + QA DB confirmed"});
 await test("01 Admin + Sales login",async()=>{adminToken=await login(ADMIN_EMAIL);salesToken=await login(SALES_EMAIL);const assignees=await request("/crm/assignees",{token:adminToken});salesUser=(assignees.data?.users||[]).find(u=>(u.roles||[]).includes("sales"));assert(salesUser?._id,"No QA sales user");});
 await test("02 Workflow access ceiling",async()=>{const [admin,sales]=await Promise.all([request("/workflows",{token:adminToken}),request("/workflows",{token:salesToken})]);assert(admin.status===200,`Admin expected 200 got ${admin.status}`);assert(sales.status===403,`Sales expected 403 got ${sales.status}`);return "Admin 200 / Sales 403"});
 await test("03 Reference data + controlled tags",async()=>{
   const [res,tagsRes]=await Promise.all([
     request("/workflows/reference-data",{token:adminToken}),
     request("/crm/tags?includeInactive=true",{token:adminToken})
   ]);
   assert(res.status===200,"Reference data failed");
   assert((res.data?.stages||[]).includes("qualified"),"CRM stages missing");
   assert((res.data?.users||[]).some(u=>u._id===salesUser._id),"Assignee missing");
   assert(tagsRes.status===200,`Controlled tags HTTP ${tagsRes.status}`);

   const active=(tagsRes.data?.tags||[]).filter(tag=>tag.active!==false);
   assert(active.length>=3,`Expected at least 3 active controlled tags, found ${active.length}`);

   [workflowAddTag,workflowRemoveTag,triggerTag]=active;

   assert(workflowAddTag?.key,"Workflow add tag key missing");
   assert(workflowRemoveTag?.key,"Workflow remove tag key missing");
   assert(triggerTag?.key,"Workflow trigger tag key missing");
 });
 await test("04 Definition validation",async()=>{const res=await request("/workflows",{method:"POST",token:adminToken,body:{name:"Invalid QA",trigger:{type:"manual",config:{}},actions:[]}});assert(res.status===400,`Expected 400 got ${res.status}`);});
 const suffix=`${Date.now()}-${Math.random().toString(36).slice(2,6)}`;
 let manualWorkflow, manualContact;
 await test("05 Create manual workflow",async()=>{manualWorkflow=await createWorkflow({name:`QA Manual Workflow ${suffix}`,description:"Safe automated QA workflow",trigger:{type:"manual",config:{}},actions:[{type:"add_note",config:{body:"Automated note for {{contact.name}}"}},{type:"create_task",config:{body:"Call {{contact.name}} about {{contact.program}}",dueInDays:2,hour:11}},{type:"add_tag",config:{tag:workflowAddTag.key}},{type:"remove_tag",config:{tag:workflowRemoveTag.key}},{type:"set_follow_up",config:{daysFromNow:3,hour:10}},{type:"set_stage",config:{stage:"qualified"}},{type:"assign_owner",config:{userId:salesUser._id}}]});assert(manualWorkflow.status==="draft","New workflow not draft");assert(manualWorkflow.actions.length===7,"Actions missing");});
 await test("06 Activate manual workflow",async()=>{manualWorkflow=await activate(manualWorkflow._id);assert(manualWorkflow.status==="active","Workflow not active")});
 await test("07 Create manual target lead",async()=>{
   manualContact=await createLead(`manual-${suffix}`);
   assert(manualContact?._id,"Lead missing");

   const seedTag=await request("/crm/tags/bulk",{
     method:"POST",
     token:adminToken,
     body:{
       contactIds:[manualContact._id],
       add:[workflowRemoveTag.key],
       remove:[]
     }
   });

   assert(seedTag.status===200,`Seed controlled tag HTTP ${seedTag.status}`);

   const before=await contactDetail(manualContact._id);
   assert(
     before.contact?.tags?.includes(workflowRemoveTag.key),
     "Tag intended for workflow removal was not seeded"
   );
 });
 await test("08 Manual run executes actions",async()=>{const res=await request(`/workflows/${manualWorkflow._id}/run`,{method:"POST",token:adminToken,body:{contactId:manualContact._id}});assert(res.status===201,`Manual run HTTP ${res.status}: ${res.data?.message||""}`);assert(res.data?.run?.status==="success",`Run status ${res.data?.run?.status}`);assert((res.data?.run?.steps||[]).length===7,"Run steps missing");});
 await test("09 CRM action results persisted",async()=>{
   const detail=await contactDetail(manualContact._id);

   assert(
     detail.contact?.tags?.includes(workflowAddTag.key),
     "Controlled workflow add_tag result missing"
   );

   assert(
     !detail.contact?.tags?.includes(workflowRemoveTag.key),
     "Controlled workflow remove_tag did not remove the tag"
   );

   assert(
     detail.opportunity?.stage==="qualified",
     `Stage ${detail.opportunity?.stage}`
   );

   assert(
     String(detail.opportunity?.assignedTo?._id||detail.opportunity?.assignedTo)===String(salesUser._id),
     "Owner not assigned"
   );

   assert(detail.opportunity?.nextFollowUpAt,"Follow-up missing");

   const activities=detail.activities||[];

   assert(
     activities.some(a=>a.type==="note"&&String(a.body).includes("Automated note")),
     "Workflow note missing"
   );

   assert(
     activities.some(a=>a.type==="task"&&String(a.body).includes("Call Workflow QA")),
     "Workflow task missing"
   );
 });
 await test("10 Run history recorded",async()=>{const rows=await runs(manualWorkflow._id);assert(rows.length>=1,"No run history");assert(rows[0].status==="success","Latest run not success");assert(rows[0].steps.length===7,"Run step audit missing");});
 let stageWorkflow, stageContact;
 await test("11 Stage-trigger workflow",async()=>{stageWorkflow=await createWorkflow({name:`QA Qualified Follow-up ${suffix}`,trigger:{type:"crm_stage_changed",config:{toStage:"qualified"}},actions:[{type:"add_note",config:{body:"Qualified workflow fired for {{contact.name}}"}}]});await activate(stageWorkflow._id);stageContact=await createLead(`stage-${suffix}`);const opportunityId=stageContact.opportunity?._id;assert(opportunityId,"Opportunity missing");const move=await request(`/crm/opportunities/${opportunityId}`,{method:"PATCH",token:adminToken,body:{stage:"qualified"}});assert(move.status===200,`Stage move HTTP ${move.status}`);await waitFor(async()=>{const rows=await runs(stageWorkflow._id);return rows.find(r=>r.status==="success")},{label:"stage workflow run"});const detail=await contactDetail(stageContact._id);assert((detail.activities||[]).some(a=>String(a.body).includes("Qualified workflow fired")),"Triggered note missing");});
 let leadWorkflow, leadContact;
 await test("12 New-lead trigger workflow",async()=>{leadWorkflow=await createWorkflow({name:`QA New Lead ${suffix}`,trigger:{type:"crm_lead_created",config:{programInterest:"core",source:"workflow_qa"}},actions:[{type:"add_tag",config:{tag:triggerTag.key}}]});await activate(leadWorkflow._id);leadContact=await createLead(`lead-${suffix}`);await waitFor(async()=>{const rows=await runs(leadWorkflow._id);return rows.find(r=>r.status==="success")},{label:"lead workflow run"});const detail=await contactDetail(leadContact._id);assert(detail.contact?.tags?.includes(triggerTag.key),"Lead-trigger controlled tag missing");});
 await test("13 Pause stops future runs",async()=>{const pause=await request(`/workflows/${leadWorkflow._id}/status`,{method:"PATCH",token:adminToken,body:{status:"paused"}});assert(pause.status===200,"Pause failed");const before=(await runs(leadWorkflow._id)).length;await createLead(`paused-${suffix}`);await sleep(700);const after=(await runs(leadWorkflow._id)).length;assert(after===before,`Paused workflow ran: ${before} -> ${after}`);});
 let formWorkflow, form;
 await test("14 Form-submitted trigger",async()=>{const formCreate=await request("/forms",{method:"POST",token:adminToken,body:{name:`Workflow QA Form ${suffix}`,slug:`workflow-qa-form-${suffix}`,visibility:"public",targetEntityType:"crm_contact",publicAction:"create_crm_lead",elements:[{kind:"field",source:"standard",standardKey:"fullName",label:"Full name",required:true},{kind:"field",source:"standard",standardKey:"email",label:"Email",required:true}]}});assert(formCreate.status===201,`Form create ${formCreate.status}`);form=formCreate.data.form;const publish=await request(`/forms/${form._id}/status`,{method:"PATCH",token:adminToken,body:{status:"published"}});assert(publish.status===200,"Form publish failed");const get=await request(`/forms/${form._id}`,{token:adminToken});form=get.data.form;formWorkflow=await createWorkflow({name:`QA Form Workflow ${suffix}`,trigger:{type:"form_submitted",config:{formId:form._id}},actions:[{type:"add_tag",config:{tag:workflowAddTag.key}},{type:"add_note",config:{body:"Form received: {{form.name}}"}}]});await activate(formWorkflow._id);const fullNameField=form.elements.find(e=>e.standardKey==="fullName");const emailField=form.elements.find(e=>e.standardKey==="email");assert(fullNameField?._id&&emailField?._id,"Form field ids missing");const submit=await request(`/forms/public/${form.slug}/submit`,{method:"POST",body:{answers:{[fullNameField._id]:`Workflow Form ${suffix}`,[emailField._id]:`workflow.form.${suffix}@example.com`}}});assert(submit.status===201,`Public submit ${submit.status}: ${submit.data?.message||""}`);await waitFor(async()=>{const rows=await runs(formWorkflow._id);return rows.find(r=>r.status==="success")},{label:"form workflow run"});});
 await test("15 Form workflow linked CRM result",async()=>{const search=await request(`/crm/contacts?search=${encodeURIComponent(`workflow.form.${suffix}@example.com`)}`,{token:adminToken});const contact=(search.data?.contacts||[])[0];assert(contact?._id,"Form-created CRM contact missing");const detail=await contactDetail(contact._id);assert(detail.contact?.tags?.includes(workflowAddTag.key),"Form workflow controlled tag missing");assert((detail.activities||[]).some(a=>String(a.body).includes("Form received")),"Form workflow note missing");});
 await test("16 Update workflow definition",async()=>{const res=await request(`/workflows/${manualWorkflow._id}`,{method:"PATCH",token:adminToken,body:{name:`QA Manual Workflow Updated ${suffix}`}});assert(res.status===200,`Update HTTP ${res.status}`);assert(res.data?.workflow?.name.includes("Updated"),"Name not updated");});
 await test("17 Invalid action rejected",async()=>{const res=await request(`/workflows/${manualWorkflow._id}`,{method:"PATCH",token:adminToken,body:{actions:[{type:"set_stage",config:{stage:"invalid_stage"}}]}});assert(res.status===400,`Expected 400 got ${res.status}`);});
 await test("18 Manual run requires contact",async()=>{const res=await request(`/workflows/${manualWorkflow._id}/run`,{method:"POST",token:adminToken,body:{}});assert(res.status===400,`Expected 400 got ${res.status}`);});
 await test("19 Workflow actions audited",async()=>{const res=await request("/audit?limit=100",{token:adminToken});assert(res.status===200,`Audit HTTP ${res.status}`);const logs=res.data?.logs||res.data?.auditLogs||[];assert(logs.some(l=>String(l.action||"").includes("workflow")),"Workflow audit entry not found");});
 await test("20 Library stats consistent",async()=>{const res=await request("/workflows",{token:adminToken});assert(res.status===200,"Workflow list failed");assert(res.data?.stats?.total>=4,"Workflow stats total too low");assert(Array.isArray(res.data?.workflows),"Workflow rows missing");});
 console.log("\n========================================");console.log("FITLUNGE WORKFLOW BUILDER QA COMPLETE");console.log("========================================");console.log(`${results.length}/${results.length} PASSED`);console.log(`Manual workflow: ${manualWorkflow._id}`);console.log(`Stage workflow: ${stageWorkflow._id}`);console.log(`Form workflow: ${formWorkflow._id}`);console.log("\nNo production API was contacted.");console.log("QA records were left in the isolated QA database for inspection.");
}
main().catch(error=>{console.error("\n========================================");console.error("FITLUNGE WORKFLOW BUILDER QA STOPPED");console.error("========================================");console.error(error.stack||error);console.error("\nNo production API was contacted.");process.exit(1)});
