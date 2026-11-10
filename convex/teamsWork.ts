import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { requireAdmin, requireIdentity, requireSuperadmin } from "./lib/auth";
const dateOk=(s:string)=>/^\d{4}-\d{2}-\d{2}$/.test(s);
const statuses=v.union(v.literal("not_started"),v.literal("in_progress"),v.literal("completed"));
const dayNumber=(date:string)=>Math.floor(Date.parse(date+"T00:00:00Z")/86400000);
const dateFromDay=(day:number)=>new Date(day*86400000).toISOString().slice(0,10);
const shiftInterval=(shift:{startMinute:number;endMinute:number},day:number)=>({start:day*1440+shift.startMinute,end:day*1440+(shift.endMinute<=shift.startMinute?shift.endMinute+1440:shift.endMinute)});
const overlaps=(a:{start:number;end:number},b:{start:number;end:number})=>a.start<b.end&&b.start<a.end;

export const adminWorkspace=query({args:{workDate:v.string()},handler:async(ctx,{workDate})=>{
 const user=await requireAdmin(ctx);if(!dateOk(workDate))throw Error("INVALID_WORK_DATE");
 const [employees,shifts,teams,memberships,shiftRows,assignments,categories]=await Promise.all([
  ctx.db.query("employees").withIndex("by_org_code",q=>q.eq("organizationId",user.organizationId)).collect(),
  ctx.db.query("shifts").withIndex("by_org",q=>q.eq("organizationId",user.organizationId)).collect(),
  ctx.db.query("teams").withIndex("by_org",q=>q.eq("organizationId",user.organizationId)).collect(),
  ctx.db.query("teamMemberships").withIndex("by_org_date",q=>q.eq("organizationId",user.organizationId).eq("workDate",workDate)).collect(),
  ctx.db.query("shiftAssignments").withIndex("by_org_date",q=>q.eq("organizationId",user.organizationId).eq("workDate",workDate)).collect(),
  ctx.db.query("workAssignments").withIndex("by_org_date",q=>q.eq("organizationId",user.organizationId).eq("workDate",workDate)).take(100),
  ctx.db.query("workCategories").withIndex("by_org",q=>q.eq("organizationId",user.organizationId)).collect()
 ]);
 const employeeRows=employees.filter(e=>e.status==="active").map(e=>{
  const dated=shiftRows.filter(s=>s.employeeId===e._id);
  const effectiveShiftIds=dated.length?dated.map(s=>s.shiftId):(e.defaultShiftId?[e.defaultShiftId]:[]);
  return {_id:e._id,employeeCode:e.employeeCode,name:[e.firstName,e.lastName].filter(Boolean).join(" "),defaultShiftId:e.defaultShiftId??null,scheduledShiftIds:dated.map(s=>s.shiftId),shiftIds:effectiveShiftIds};
 });
 const teamRows=await Promise.all(teams.filter(t=>t.isActive).map(async t=>{const shift=await ctx.db.get(t.shiftId);const rows=await Promise.all(memberships.filter(m=>m.teamId===t._id&&m.isActive).map(async m=>{const e=await ctx.db.get(m.employeeId);return e?{name:[e.firstName,e.lastName].filter(Boolean).join(" "),employeeCode:e.employeeCode}:null;}));return {_id:t._id,name:t.name,shiftId:t.shiftId,shiftName:shift?.name??"Shift unavailable",members:rows.filter(Boolean)};}));
 const assignmentRows=await Promise.all(assignments.filter(a=>a.isActive).map(async a=>{const [team,employee,progress]=await Promise.all([a.teamId?ctx.db.get(a.teamId):null,a.employeeId?ctx.db.get(a.employeeId):null,ctx.db.query("workAssignmentProgress").withIndex("by_assignment",q=>q.eq("assignmentId",a._id)).collect()]);const rows=await Promise.all(progress.map(async p=>{const e=await ctx.db.get(p.employeeId);return {progressId:p._id,status:p.status,reviewNote:p.reviewNote??null,name:e?[e.firstName,e.lastName].filter(Boolean).join(" "):"Unknown",code:e?.employeeCode??""};}));return {_id:a._id,title:a.title,description:a.description??"",category:a.category,priority:a.priority,workDate:a.workDate,targetName:team?.name??(employee?[employee.firstName,employee.lastName].filter(Boolean).join(" "):"Unknown"),progress:rows};}));
 return {employees:employeeRows,shifts:shifts.filter(s=>s.isActive).map(s=>({_id:s._id,name:s.name,startMinute:s.startMinute,endMinute:s.endMinute,breakMinutes:s.breakMinutes,isActive:s.isActive})),categories:categories.filter(c=>c.isActive).map(c=>c.name),categoryRecords:categories.filter(c=>c.isActive).map(c=>({_id:c._id,name:c.name})),teams:teamRows,memberships:memberships.filter(m=>m.isActive).map(m=>({teamId:m.teamId,employeeId:m.employeeId})),assignments:assignmentRows};
}});

export const createShift=mutation({args:{name:v.string(),startMinute:v.number(),endMinute:v.number(),breakMinutes:v.number()},handler:async(ctx,a)=>{const u=await requireSuperadmin(ctx),name=a.name.trim();if(!name||name.length>80)throw Error("INVALID_SHIFT_NAME");if(!Number.isInteger(a.startMinute)||a.startMinute<0||a.startMinute>=1440||!Number.isInteger(a.endMinute)||a.endMinute<0||a.endMinute>=1440||a.startMinute===a.endMinute)throw Error("INVALID_SHIFT_TIME");if(!Number.isInteger(a.breakMinutes)||a.breakMinutes<0||a.breakMinutes>720)throw Error("INVALID_BREAK_DURATION");const rows=await ctx.db.query("shifts").withIndex("by_org",q=>q.eq("organizationId",u.organizationId)).collect();if(rows.some(s=>s.name.toLowerCase()===name.toLowerCase()))throw Error("SHIFT_ALREADY_EXISTS");const id=await ctx.db.insert("shifts",{organizationId:u.organizationId,name,startMinute:a.startMinute,endMinute:a.endMinute,breakMinutes:a.breakMinutes,isActive:true});await ctx.db.insert("auditLogs",{organizationId:u.organizationId,actorUserId:u._id,action:"shift.created",entityType:"shift",entityId:String(id),metadata:{name,startMinute:a.startMinute,endMinute:a.endMinute,breakMinutes:a.breakMinutes},createdAt:Date.now()});return id;}});
export const createWorkCategory=mutation({args:{name:v.string()},handler:async(ctx,a)=>{const u=await requireSuperadmin(ctx),name=a.name.trim().replace(/\\s+/g," ");if(!name||name.length>60)throw Error("INVALID_WORK_CATEGORY");const rows=await ctx.db.query("workCategories").withIndex("by_org",q=>q.eq("organizationId",u.organizationId)).collect();if(rows.some(c=>c.name.toLowerCase()===name.toLowerCase()))throw Error("WORK_CATEGORY_ALREADY_EXISTS");const id=await ctx.db.insert("workCategories",{organizationId:u.organizationId,name,isActive:true,createdBy:u._id,createdAt:Date.now()});await ctx.db.insert("auditLogs",{organizationId:u.organizationId,actorUserId:u._id,action:"work_category.created",entityType:"workCategory",entityId:String(id),metadata:{name},createdAt:Date.now()});return id;}});

export const createTeam=mutation({args:{name:v.string(),shiftId:v.id("shifts")},handler:async(ctx,a)=>{const u=await requireSuperadmin(ctx),name=a.name.trim(),s=await ctx.db.get(a.shiftId);if(!name||name.length>80)throw Error("TEAM_NAME_INVALID");if(!s||s.organizationId!==u.organizationId||!s.isActive)throw Error("SHIFT_NOT_AVAILABLE");const id=await ctx.db.insert("teams",{organizationId:u.organizationId,name,shiftId:a.shiftId,isActive:true,createdBy:u._id,createdAt:Date.now()});await ctx.db.insert("auditLogs",{organizationId:u.organizationId,actorUserId:u._id,action:"team.created",entityType:"team",entityId:String(id),createdAt:Date.now()});return id;}});
export const setTeamMembers=mutation({args:{teamId:v.id("teams"),workDate:v.string(),employeeIds:v.array(v.id("employees"))},handler:async(ctx,a)=>{
 const u=await requireSuperadmin(ctx);
 if(!dateOk(a.workDate)||a.employeeIds.length>100||new Set(a.employeeIds).size!==a.employeeIds.length)throw Error("INVALID_MEMBERS");
 const t=await ctx.db.get(a.teamId);
 if(!t||t.organizationId!==u.organizationId||!t.isActive)throw Error("TEAM_NOT_AVAILABLE");
 for(const id of a.employeeIds){
  const e=await ctx.db.get(id);
  if(!e||e.organizationId!==u.organizationId||e.status!=="active")throw Error("EMPLOYEE_NOT_AVAILABLE");
  const dated=await ctx.db.query("shiftAssignments").withIndex("by_employee_date",q=>q.eq("employeeId",id).eq("workDate",a.workDate)).collect();
  const effective=dated.length?dated.map(row=>row.shiftId):(e.defaultShiftId?[e.defaultShiftId]:[]);
  if(!effective.some(shiftId=>shiftId===t.shiftId))throw Error("EMPLOYEE_SHIFT_MISMATCH");
  const otherMemberships=await ctx.db.query("teamMemberships").withIndex("by_employee_date",q=>q.eq("employeeId",id).eq("workDate",a.workDate)).collect();
  for(const membership of otherMemberships.filter(m=>m.isActive&&m.teamId!==t._id)){
   const otherTeam=await ctx.db.get(membership.teamId);
   if(otherTeam?.shiftId===t.shiftId)throw Error("EMPLOYEE_ALREADY_IN_TEAM_FOR_SHIFT");
  }
 }
 const old=await ctx.db.query("teamMemberships").withIndex("by_team_date",q=>q.eq("teamId",t._id).eq("workDate",a.workDate)).collect(),keep=new Set(a.employeeIds.map(String));
 for(const m of old)if(m.isActive&&!keep.has(String(m.employeeId)))await ctx.db.patch(m._id,{isActive:false});
 for(const id of a.employeeIds){
  const prior=old.find(m=>m.employeeId===id);
  if(prior){if(!prior.isActive)await ctx.db.patch(prior._id,{isActive:true,assignedBy:u._id});}
  else await ctx.db.insert("teamMemberships",{organizationId:u.organizationId,teamId:t._id,employeeId:id,workDate:a.workDate,isActive:true,assignedBy:u._id,createdAt:Date.now()});
 }
 await ctx.db.insert("auditLogs",{organizationId:u.organizationId,actorUserId:u._id,action:"team.members_updated",entityType:"team",entityId:String(t._id),metadata:{workDate:a.workDate},createdAt:Date.now()});
 return true;
}});

export const setEmployeeDefaultShift=mutation({args:{employeeId:v.id("employees"),shiftId:v.union(v.id("shifts"),v.null())},handler:async(ctx,a)=>{
 const u=await requireSuperadmin(ctx),employee=await ctx.db.get(a.employeeId);
 if(!employee||employee.organizationId!==u.organizationId)throw Error("EMPLOYEE_NOT_FOUND");
 if(employee.status!=="active")throw Error("EMPLOYEE_NOT_ACTIVE");
 let nextDefault=null;
 if(a.shiftId){nextDefault=await ctx.db.get(a.shiftId);if(!nextDefault||nextDefault.organizationId!==u.organizationId||!nextDefault.isActive)throw Error("SHIFT_NOT_AVAILABLE");}
 if(nextDefault){
  const dated=await ctx.db.query("shiftAssignments").withIndex("by_employee_date",q=>q.eq("employeeId",employee._id)).collect();
  const datedDays=new Set(dated.map(row=>row.workDate));
  for(const row of dated){
   const scheduled=await ctx.db.get(row.shiftId);if(!scheduled)continue;
   for(const adjacentDay of [dayNumber(row.workDate)-1,dayNumber(row.workDate)+1]){
    const adjacentDate=dateFromDay(adjacentDay);
    if(datedDays.has(adjacentDate))continue;
    if(overlaps(shiftInterval(scheduled,dayNumber(row.workDate)),shiftInterval(nextDefault,adjacentDay)))throw Error("SHIFTS_OVERLAP");
   }
  }
 }
 const previous=employee.defaultShiftId??null;
 await ctx.db.patch(employee._id,{defaultShiftId:a.shiftId??undefined,updatedAt:Date.now()});
 const memberships=await ctx.db.query("teamMemberships").withIndex("by_employee_date",q=>q.eq("employeeId",employee._id)).collect();
 for(const membership of memberships.filter(row=>row.isActive)){
  const dated=await ctx.db.query("shiftAssignments").withIndex("by_employee_date",q=>q.eq("employeeId",employee._id).eq("workDate",membership.workDate)).collect();
  if(dated.length)continue;
  const team=await ctx.db.get(membership.teamId);
  if(!team||team.shiftId!==a.shiftId)await ctx.db.patch(membership._id,{isActive:false});
 }
 await ctx.db.insert("auditLogs",{organizationId:u.organizationId,actorUserId:u._id,action:"employee.default_shift_updated",entityType:"employee",entityId:String(employee._id),metadata:{previousShiftId:previous?String(previous):null,newShiftId:a.shiftId?String(a.shiftId):null},createdAt:Date.now()});
 return true;
}});

export const setEmployeeShiftsForDate=mutation({args:{employeeId:v.id("employees"),workDate:v.string(),shiftIds:v.array(v.id("shifts"))},handler:async(ctx,a)=>{
 const u=await requireSuperadmin(ctx),employee=await ctx.db.get(a.employeeId);
 if(!dateOk(a.workDate)||a.shiftIds.length>10||new Set(a.shiftIds).size!==a.shiftIds.length)throw Error("INVALID_SHIFT_ASSIGNMENTS");
 if(!employee||employee.organizationId!==u.organizationId)throw Error("EMPLOYEE_NOT_FOUND");
 if(employee.status!=="active")throw Error("EMPLOYEE_NOT_ACTIVE");
 const selected=await Promise.all(a.shiftIds.map(id=>ctx.db.get(id)));
 if(selected.some(s=>!s||s.organizationId!==u.organizationId||!s.isActive))throw Error("SHIFT_NOT_AVAILABLE");
 const existing=await ctx.db.query("shiftAssignments").withIndex("by_employee_date",q=>q.eq("employeeId",employee._id).gte("workDate",dateFromDay(dayNumber(a.workDate)-1)).lte("workDate",dateFromDay(dayNumber(a.workDate)+1))).collect();
 const targetDay=dayNumber(a.workDate);
 const adjacent=existing.filter(row=>row.workDate!==a.workDate&&Math.abs(dayNumber(row.workDate)-targetDay)<=1);
 const adjacentIntervals=await Promise.all(adjacent.map(async row=>{const shift=await ctx.db.get(row.shiftId);return shift?shiftInterval(shift,dayNumber(row.workDate)):null;}));
 const effectiveCandidates=selected.length?selected:(employee.defaultShiftId?[await ctx.db.get(employee.defaultShiftId)]:[]);
 const candidates=effectiveCandidates.map(s=>{if(!s)throw Error("SHIFT_NOT_AVAILABLE");return shiftInterval(s,targetDay);});
 for(let i=0;i<candidates.length;i++){
  if(candidates.some((other,j)=>i!==j&&overlaps(candidates[i],other)))throw Error("SHIFTS_OVERLAP");
  if(adjacentIntervals.some(other=>other&&overlaps(candidates[i],other)))throw Error("SHIFTS_OVERLAP");
 }
 const current=existing.filter(row=>row.workDate===a.workDate);
 for(const row of current)await ctx.db.delete(row._id);
 for(const shiftId of a.shiftIds)await ctx.db.insert("shiftAssignments",{organizationId:u.organizationId,employeeId:employee._id,shiftId,workDate:a.workDate,assignedBy:u._id});
 const memberships=await ctx.db.query("teamMemberships").withIndex("by_employee_date",q=>q.eq("employeeId",employee._id).eq("workDate",a.workDate)).collect();
 for(const membership of memberships.filter(row=>row.isActive)){
  const team=await ctx.db.get(membership.teamId);
  if(!team||!a.shiftIds.includes(team.shiftId))await ctx.db.patch(membership._id,{isActive:false});
 }
 await ctx.db.insert("auditLogs",{organizationId:u.organizationId,actorUserId:u._id,action:"employee.date_shifts_updated",entityType:"employee",entityId:String(employee._id),metadata:{workDate:a.workDate,previousShiftIds:current.map(row=>String(row.shiftId)),newShiftIds:a.shiftIds.map(String)},createdAt:Date.now()});
 return true;
}});

export const createWorkAssignment=mutation({args:{title:v.string(),description:v.optional(v.string()),category:v.string(),priority:v.union(v.literal("low"),v.literal("normal"),v.literal("high")),workDate:v.string(),targetType:v.union(v.literal("employee"),v.literal("team")),employeeId:v.optional(v.id("employees")),teamId:v.optional(v.id("teams"))},handler:async(ctx,a)=>{const u=await requireSuperadmin(ctx);if(!dateOk(a.workDate)||!a.title.trim()||a.title.length>120||!a.category.trim())throw Error("INVALID_WORK");let ids:Id<"employees">[]=[];if(a.targetType==="employee"){if(!a.employeeId||a.teamId)throw Error("INVALID_TARGET");const e=await ctx.db.get(a.employeeId);if(!e||e.organizationId!==u.organizationId||e.status!=="active")throw Error("EMPLOYEE_NOT_AVAILABLE");ids=[a.employeeId];}else{if(!a.teamId||a.employeeId)throw Error("INVALID_TARGET");const t=await ctx.db.get(a.teamId);if(!t||t.organizationId!==u.organizationId||!t.isActive)throw Error("TEAM_NOT_AVAILABLE");const ms=await ctx.db.query("teamMemberships").withIndex("by_team_date",q=>q.eq("teamId",t._id).eq("workDate",a.workDate)).collect();ids=ms.filter(m=>m.isActive).map(m=>m.employeeId);if(!ids.length)throw Error("TEAM_HAS_NO_MEMBERS");}const id=await ctx.db.insert("workAssignments",{organizationId:u.organizationId,title:a.title.trim(),description:a.description?.trim()||undefined,category:a.category.trim(),priority:a.priority,workDate:a.workDate,targetType:a.targetType,employeeId:a.employeeId,teamId:a.teamId,createdBy:u._id,createdAt:Date.now(),isActive:true});for(const employeeId of ids){await ctx.db.insert("workAssignmentProgress",{organizationId:u.organizationId,assignmentId:id,employeeId,workDate:a.workDate,status:"not_started",updatedAt:Date.now()});const recipients=await ctx.db.query("users").withIndex("by_org_employee",q=>q.eq("organizationId",u.organizationId).eq("employeeId",employeeId)).collect();for(const recipient of recipients)await ctx.db.insert("notifications",{organizationId:u.organizationId,userId:recipient._id,title:"New work assigned",body:a.title.trim(),createdAt:Date.now()});}await ctx.db.insert("auditLogs",{organizationId:u.organizationId,actorUserId:u._id,action:"work_assignment.created",entityType:"workAssignment",entityId:String(id),createdAt:Date.now()});return id;}});
export const updateMyWorkStatus=mutation({args:{progressId:v.id("workAssignmentProgress"),status:v.union(v.literal("in_progress"),v.literal("submitted_for_review"))},handler:async(ctx,a)=>{
 const u=await requireIdentity(ctx);if(!u.employeeId)throw Error("EMPLOYEE_PROFILE_REQUIRED");
 const p=await ctx.db.get(a.progressId);if(!p||p.organizationId!==u.organizationId||p.employeeId!==u.employeeId)throw Error("FORBIDDEN");
 const task=await ctx.db.get(p.assignmentId);if(!task||task.organizationId!==u.organizationId||!task.isActive)throw Error("WORK_UNAVAILABLE");
 if(a.status==="in_progress"&&p.status!=="not_started"&&p.status!=="in_progress")throw Error("INVALID_WORK_TRANSITION");
 if(a.status==="submitted_for_review"&&p.status!=="in_progress")throw Error("WORK_MUST_BE_IN_PROGRESS");
 await ctx.db.patch(p._id,{status:a.status,reviewNote:undefined,reviewedBy:undefined,reviewedAt:undefined,updatedAt:Date.now()});
 await ctx.db.insert("auditLogs",{organizationId:u.organizationId,actorUserId:u._id,action:"work_assignment.status_updated",entityType:"workAssignmentProgress",entityId:String(p._id),metadata:{status:a.status},createdAt:Date.now()});
 return true;
}});
export const reviewWorkSubmission=mutation({args:{progressId:v.id("workAssignmentProgress"),decision:v.union(v.literal("approved"),v.literal("returned")),note:v.optional(v.string())},handler:async(ctx,a)=>{
 const u=await requireAdmin(ctx),p=await ctx.db.get(a.progressId);
 if(!p||p.organizationId!==u.organizationId)throw Error("WORK_PROGRESS_NOT_FOUND");
 if(p.status!=="submitted_for_review")throw Error("WORK_NOT_AWAITING_REVIEW");
 const note=a.note?.trim();
 if(a.decision==="returned"&&(!note||note.length>1000))throw Error("REVIEW_NOTE_REQUIRED");
 const status=a.decision==="approved"?"completed":"in_progress";
 await ctx.db.patch(p._id,{status,reviewNote:note||undefined,reviewedBy:u._id,reviewedAt:Date.now(),updatedAt:Date.now()});
 await ctx.db.insert("auditLogs",{organizationId:u.organizationId,actorUserId:u._id,action:"work_assignment.reviewed",entityType:"workAssignmentProgress",entityId:String(p._id),metadata:{decision:a.decision,note:note||undefined},createdAt:Date.now()});
 const employeeUsers=await ctx.db.query("users").withIndex("by_org_employee",q=>q.eq("organizationId",u.organizationId).eq("employeeId",p.employeeId)).collect();
 for(const recipient of employeeUsers)await ctx.db.insert("notifications",{organizationId:u.organizationId,userId:recipient._id,title:a.decision==="approved"?"Work completed":"Work needs an update",body:a.decision==="approved"?"Your work submission was approved.":note||"Your work was returned for updates.",createdAt:Date.now()});
 return {status};
}});
export const myWorkDashboard=query({args:{workDate:v.string()},handler:async(ctx,a)=>{
 const u=await requireIdentity(ctx);if(!dateOk(a.workDate))throw Error("INVALID_WORK_DATE");
 if(!u.employeeId)return {team:null,teams:[],assignments:[]};
 const e=await ctx.db.get(u.employeeId);if(!e||e.organizationId!==u.organizationId)return {team:null,teams:[],assignments:[]};
 const memberships=await ctx.db.query("teamMemberships").withIndex("by_employee_date",q=>q.eq("employeeId",e._id).eq("workDate",a.workDate)).filter(q=>q.eq(q.field("isActive"),true)).collect();
 const teams=await Promise.all(memberships.map(async membership=>{
  const t=await ctx.db.get(membership.teamId);if(!t||t.organizationId!==u.organizationId||!t.isActive)return null;
  const [s,ms]=await Promise.all([ctx.db.get(t.shiftId),ctx.db.query("teamMemberships").withIndex("by_team_date",q=>q.eq("teamId",t._id).eq("workDate",a.workDate)).collect()]);
  const members=await Promise.all(ms.filter(m=>m.isActive).map(async m=>{const x=await ctx.db.get(m.employeeId);return x?{name:[x.firstName,x.lastName].filter(Boolean).join(" "),employeeCode:x.employeeCode}:null;}));
  return {name:t.name,shiftName:s?.name??"Shift unavailable",members:members.filter(Boolean)};
 }));
 const rows=await ctx.db.query("workAssignmentProgress").withIndex("by_employee",q=>q.eq("employeeId",e._id)).take(200);
 const today= a.workDate;
 const assignmentRows=await Promise.all(rows.map(async p=>{const t=await ctx.db.get(p.assignmentId);return t&&t.organizationId===u.organizationId&&t.isActive?{progressId:p._id,title:t.title,description:t.description??"",category:t.category,priority:t.priority,status:p.status,workDate:t.workDate,reviewNote:p.reviewNote??null}:null;}));
 const validAssignments=assignmentRows.filter((row):row is NonNullable<typeof row>=>row!==null);
 const assignments=validAssignments.filter(row=>row.workDate>=today).sort((x,y)=>x.workDate.localeCompare(y.workDate));
 const history=validAssignments.filter(row=>row.workDate<today).sort((x,y)=>y.workDate.localeCompare(x.workDate));
 const validTeams=teams.filter((team):team is NonNullable<typeof team>=>team!==null);
 return {team:validTeams[0]??null,teams:validTeams,assignments,history};
}});


export const archiveShift=mutation({args:{shiftId:v.id("shifts")},handler:async(ctx,{shiftId})=>{
 const user=await requireSuperadmin(ctx),shift=await ctx.db.get(shiftId);
 if(!shift||shift.organizationId!==user.organizationId)throw Error("SHIFT_NOT_FOUND");
 if(!shift.isActive)return {archived:false};
 const [teams,assignments,employees]=await Promise.all([
  ctx.db.query("teams").withIndex("by_org",q=>q.eq("organizationId",user.organizationId)).collect(),
  ctx.db.query("shiftAssignments").withIndex("by_org_date",q=>q.eq("organizationId",user.organizationId)).collect(),
  ctx.db.query("employees").withIndex("by_org_code",q=>q.eq("organizationId",user.organizationId)).collect()
 ]);
 if(teams.some(team=>team.shiftId===shiftId)||assignments.some(row=>row.shiftId===shiftId)||employees.some(employee=>employee.defaultShiftId===shiftId))throw Error("SHIFT_IN_USE_ARCHIVE_BLOCKED");
 await ctx.db.patch(shiftId,{isActive:false});
 await ctx.db.insert("auditLogs",{organizationId:user.organizationId,actorUserId:user._id,action:"shift.archived",entityType:"shift",entityId:String(shiftId),metadata:{name:shift.name},createdAt:Date.now()});
 return {archived:true};
}});
