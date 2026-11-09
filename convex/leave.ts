import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./lib/auth";

const validDate=(s:string)=>/^\\d{4}-\\d{2}-\\d{2}$/.test(s)&&new Date(s+"T00:00:00Z").toISOString().slice(0,10)===s;
const audit=async(ctx:any,user:any,action:string,type:string,id:string,metadata?:any)=>ctx.db.insert("auditLogs",{organizationId:user.organizationId,actorUserId:user._id,action,entityType:type,entityId:id,metadata,createdAt:Date.now()});
const workingDayCount=(from:string,to:string,off:number[],holidays:Set<string>)=>{let count=0;for(let d=new Date(from+"T00:00:00Z"),end=new Date(to+"T00:00:00Z");d<=end;d.setUTCDate(d.getUTCDate()+1)){const key=d.toISOString().slice(0,10);if(!off.includes(d.getUTCDay())&&!holidays.has(key))count++;}return count;};

export const adminWorkspace=query({args:{year:v.number()},handler:async(ctx,{year})=>{
 const user=await requireAdmin(ctx);
 const [employees,types,requests,holidays,locations,calendars]=await Promise.all([
  ctx.db.query("employees").withIndex("by_org_code",q=>q.eq("organizationId",user.organizationId)).collect(),
  ctx.db.query("leaveTypes").withIndex("by_org",q=>q.eq("organizationId",user.organizationId)).collect(),
  ctx.db.query("leaveRequests").withIndex("by_org_status",q=>q.eq("organizationId",user.organizationId)).take(500),
  ctx.db.query("holidays").withIndex("by_org_date",q=>q.eq("organizationId",user.organizationId)).gte("date",String(year)+"-01-01").lte("date",String(year)+"-12-31").collect(),
  ctx.db.query("locations").withIndex("by_org",q=>q.eq("organizationId",user.organizationId)).collect(),
  ctx.db.query("workCalendars").withIndex("by_org",q=>q.eq("organizationId",user.organizationId)).collect()
 ]);
 const balances=(await Promise.all(employees.map(e=>ctx.db.query("leaveBalances").withIndex("by_employee_year",q=>q.eq("employeeId",e._id).eq("periodYear",year)).collect()))).flat();
 const employeeRows=employees.map(e=>({_id:e._id,name:[e.firstName,e.lastName].filter(Boolean).join(" "),employeeCode:e.employeeCode,locationId:e.locationId,locationName:locations.find(l=>l._id===e.locationId)?.name??"Unknown"}));
 const balanceRows=await Promise.all(balances.filter(b=>employees.some(e=>e._id===b.employeeId)).map(async b=>({ ...b,employeeName:employeeRows.find(e=>e._id===b.employeeId)?.name??"Unknown",employeeCode:employeeRows.find(e=>e._id===b.employeeId)?.employeeCode??"",leaveTypeName:types.find(t=>t._id===b.leaveTypeId)?.name??"Unknown"})));
 const requestRows=await Promise.all(requests.map(async r=>({ ...r,employeeName:employeeRows.find(e=>e._id===r.employeeId)?.name??"Unknown",employeeCode:employeeRows.find(e=>e._id===r.employeeId)?.employeeCode??"",locationId:employeeRows.find(e=>e._id===r.employeeId)?.locationId,leaveTypeName:types.find(t=>t._id===r.leaveTypeId)?.name??"Unknown"})));
 return {employees:employeeRows,leaveTypes:types,balances:balanceRows,requests:requestRows,holidays,locations,calendars};
}});

export const saveLeaveType=mutation({args:{leaveTypeId:v.optional(v.id("leaveTypes")),name:v.string(),code:v.string(),isPaid:v.boolean()},handler:async(ctx,a)=>{
 const u=await requireAdmin(ctx),name=a.name.trim(),code=a.code.trim().toUpperCase();
 if(!name||name.length>80||!code||code.length>20)throw Error("INVALID_LEAVE_TYPE");
 const all=await ctx.db.query("leaveTypes").withIndex("by_org",q=>q.eq("organizationId",u.organizationId)).collect();
 if(all.some(x=>x._id!==a.leaveTypeId&&(x.code===code||x.name.toLowerCase()===name.toLowerCase())))throw Error("LEAVE_TYPE_EXISTS");
 if(a.leaveTypeId){const old=await ctx.db.get(a.leaveTypeId);if(!old||old.organizationId!==u.organizationId)throw Error("LEAVE_TYPE_NOT_FOUND");await ctx.db.patch(a.leaveTypeId,{name,code,isPaid:a.isPaid});await audit(ctx,u,"leave.type.updated","leaveType",String(a.leaveTypeId),{name,code,isPaid:a.isPaid});return a.leaveTypeId;}
 const id=await ctx.db.insert("leaveTypes",{organizationId:u.organizationId,name,code,isPaid:a.isPaid,isActive:true});await audit(ctx,u,"leave.type.created","leaveType",String(id),{name,code,isPaid:a.isPaid});return id;
}});
export const setLeaveTypeActive=mutation({args:{leaveTypeId:v.id("leaveTypes"),isActive:v.boolean()},handler:async(ctx,a)=>{const u=await requireAdmin(ctx),row=await ctx.db.get(a.leaveTypeId);if(!row||row.organizationId!==u.organizationId)throw Error("LEAVE_TYPE_NOT_FOUND");await ctx.db.patch(a.leaveTypeId,{isActive:a.isActive});await audit(ctx,u,a.isActive?"leave.type.activated":"leave.type.archived","leaveType",String(a.leaveTypeId));}});
export const saveWorkCalendar=mutation({args:{locationId:v.optional(v.id("locations")),weeklyOffDays:v.array(v.number())},handler:async(ctx,a)=>{
 const u=await requireAdmin(ctx);if(a.weeklyOffDays.some(d=>!Number.isInteger(d)||d<0||d>6)||new Set(a.weeklyOffDays).size!==a.weeklyOffDays.length||a.weeklyOffDays.length===7)throw Error("INVALID_WEEKLY_OFF_DAYS");
 if(a.locationId){const loc=await ctx.db.get(a.locationId);if(!loc||loc.organizationId!==u.organizationId)throw Error("LOCATION_NOT_FOUND");}
 const rows=await ctx.db.query("workCalendars").withIndex("by_org",q=>q.eq("organizationId",u.organizationId)).collect(),old=rows.find(x=>x.locationId===a.locationId);
 if(old)await ctx.db.patch(old._id,{weeklyOffDays:a.weeklyOffDays,updatedAt:Date.now(),updatedBy:u._id});else await ctx.db.insert("workCalendars",{organizationId:u.organizationId,locationId:a.locationId,weeklyOffDays:a.weeklyOffDays,updatedAt:Date.now(),updatedBy:u._id});
 await audit(ctx,u,"leave.calendar.updated","workCalendar",String(a.locationId??"organization"),{weeklyOffDays:a.weeklyOffDays});
}});
export const saveHoliday=mutation({args:{holidayId:v.optional(v.id("holidays")),name:v.string(),date:v.string(),locationId:v.optional(v.id("locations"))},handler:async(ctx,a)=>{
 const u=await requireAdmin(ctx),name=a.name.trim();if(!name||name.length>100||!validDate(a.date))throw Error("INVALID_HOLIDAY");
 if(a.locationId){const l=await ctx.db.get(a.locationId);if(!l||l.organizationId!==u.organizationId)throw Error("LOCATION_NOT_FOUND");}
 if(a.holidayId){const old=await ctx.db.get(a.holidayId);if(!old||old.organizationId!==u.organizationId)throw Error("HOLIDAY_NOT_FOUND");await ctx.db.patch(a.holidayId,{name,date:a.date,locationId:a.locationId});await audit(ctx,u,"holiday.updated","holiday",String(a.holidayId),{name,date:a.date});return a.holidayId;}
 const id=await ctx.db.insert("holidays",{organizationId:u.organizationId,name,date:a.date,locationId:a.locationId});await audit(ctx,u,"holiday.created","holiday",String(id),{name,date:a.date});return id;
}});
export const deleteHoliday=mutation({args:{holidayId:v.id("holidays")},handler:async(ctx,{holidayId})=>{const u=await requireAdmin(ctx),row=await ctx.db.get(holidayId);if(!row||row.organizationId!==u.organizationId)throw Error("HOLIDAY_NOT_FOUND");await ctx.db.delete(holidayId);await audit(ctx,u,"holiday.deleted","holiday",String(holidayId),{name:row.name,date:row.date});}});
export const saveBalance=mutation({args:{employeeId:v.id("employees"),leaveTypeId:v.id("leaveTypes"),periodYear:v.number(),allocated:v.number()},handler:async(ctx,a)=>{
 const u=await requireAdmin(ctx);if(!Number.isInteger(a.periodYear)||a.periodYear<2020||a.periodYear>2100||!Number.isFinite(a.allocated)||a.allocated<0||a.allocated>366)throw Error("INVALID_LEAVE_ALLOCATION");
 const [e,t]=await Promise.all([ctx.db.get(a.employeeId),ctx.db.get(a.leaveTypeId)]);if(!e||e.organizationId!==u.organizationId||!t||t.organizationId!==u.organizationId||!t.isActive)throw Error("INVALID_EMPLOYEE_OR_LEAVE_TYPE");
 const rows=await ctx.db.query("leaveBalances").withIndex("by_employee_year",q=>q.eq("employeeId",a.employeeId).eq("periodYear",a.periodYear)).collect(),old=rows.find(x=>x.leaveTypeId===a.leaveTypeId);
 if(old){if(a.allocated<old.used+old.pending)throw Error("ALLOCATION_BELOW_COMMITTED_DAYS");await ctx.db.patch(old._id,{allocated:a.allocated});await audit(ctx,u,"leave.balance.updated","leaveBalance",String(old._id),{allocated:a.allocated});return old._id;}
 const id=await ctx.db.insert("leaveBalances",{organizationId:u.organizationId,employeeId:a.employeeId,leaveTypeId:a.leaveTypeId,periodYear:a.periodYear,allocated:a.allocated,used:0,pending:0});await audit(ctx,u,"leave.balance.created","leaveBalance",String(id),{allocated:a.allocated,periodYear:a.periodYear});return id;
}});
export const decideRequest=mutation({args:{requestId:v.id("leaveRequests"),decision:v.union(v.literal("approved"),v.literal("rejected")),note:v.optional(v.string())},handler:async(ctx,a)=>{
 const u=await requireAdmin(ctx),r=await ctx.db.get(a.requestId);if(!r||r.organizationId!==u.organizationId)throw Error("LEAVE_REQUEST_NOT_FOUND");if(r.status!=="pending")throw Error("LEAVE_REQUEST_ALREADY_DECIDED");
 const [employee,type]=await Promise.all([ctx.db.get(r.employeeId),ctx.db.get(r.leaveTypeId)]);
 if(!employee||!type)throw Error("LEAVE_REFERENCE_MISSING");
 const days=r.requestedDays;
 const year=Number(r.fromDate.slice(0,4));if(Number(r.toDate.slice(0,4))!==year)throw Error("CROSS_YEAR_LEAVE_REQUIRES_SPLIT_REQUEST");
 const balances=await ctx.db.query("leaveBalances").withIndex("by_employee_year",q=>q.eq("employeeId",r.employeeId).eq("periodYear",year)).collect(),balance=balances.find(x=>x.leaveTypeId===r.leaveTypeId);
 if(!balance)throw Error("LEAVE_BALANCE_NOT_CONFIGURED");
 if(a.decision==="approved"&&balance.used+Math.max(0,balance.pending-r.requestedDays)+days>balance.allocated)throw Error("INSUFFICIENT_LEAVE_BALANCE");
 if(balance.pending<r.requestedDays)throw Error("LEAVE_PENDING_BALANCE_MISMATCH");
 await ctx.db.patch(balance._id,{pending:Math.max(0,balance.pending-r.requestedDays),used:balance.used+(a.decision==="approved"?days:0)});
 await ctx.db.patch(r._id,{status:a.decision});
 await audit(ctx,u,"leave.request."+a.decision,"leaveRequest",String(r._id),{requestedDays:days,note:a.note?.trim()??""});
 return {status:a.decision,workingDays:days};
}});
