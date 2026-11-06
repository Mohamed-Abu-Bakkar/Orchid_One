import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireIdentity, requireAdmin } from "./lib/auth";
const allowedTypes=["application/pdf","image/jpeg","image/png"];
export const generateUploadUrl=mutation({args:{},handler:async(ctx)=>{
 const user=await requireIdentity(ctx);if(!user.employeeId)throw Error("EMPLOYEE_PROFILE_REQUIRED");
 const employee=await ctx.db.get(user.employeeId);if(!employee||employee.organizationId!==user.organizationId||employee.status!=="active")throw Error("EMPLOYEE_INACTIVE");
 return ctx.storage.generateUploadUrl();
}});
export const saveMyDocument=mutation({args:{storageId:v.id("_storage"),documentCategory:v.string(),documentType:v.string(),originalFileName:v.string(),mimeType:v.string()},handler:async(ctx,args)=>{
 const user=await requireIdentity(ctx);if(!user.employeeId)throw Error("EMPLOYEE_PROFILE_REQUIRED");
 const employee=await ctx.db.get(user.employeeId);if(!employee||employee.organizationId!==user.organizationId||employee.status!=="active")throw Error("EMPLOYEE_INACTIVE");
 const category=args.documentCategory.trim(),type=args.documentType.trim(),fileName=args.originalFileName.trim();
 if(!category||category.length>40||!type||type.length>100||!fileName||fileName.length>180)throw Error("DOCUMENT_DETAILS_REQUIRED");
 if(!allowedTypes.includes(args.mimeType))throw Error("UNSUPPORTED_DOCUMENT_TYPE");
 const metadata=await ctx.storage.getMetadata(args.storageId);if(!metadata||metadata.contentType!==args.mimeType||metadata.size<=0||metadata.size>15*1024*1024)throw Error("DOCUMENT_UPLOAD_INVALID");
 const employeeDocs=await ctx.db.query("employeeDocuments").withIndex("by_employee",q=>q.eq("employeeId",employee._id)).collect();
 const matches=employeeDocs.filter(doc=>doc.documentType.trim().toLowerCase()===type.toLowerCase()&&(!doc.documentCategory||doc.documentCategory.toLowerCase()===category.toLowerCase()));
 if(matches.some(doc=>doc.reviewStatus==="pending"))throw Error("DOCUMENT_REVIEW_ALREADY_PENDING");
 const active=matches.find(doc=>doc.reviewStatus==="verified");
 const id=await ctx.db.insert("employeeDocuments",{organizationId:user.organizationId,employeeId:employee._id,documentCategory:category,documentType:type,storageId:args.storageId,originalFileName:fileName,mimeType:args.mimeType,uploadedBy:user._id,uploadedAt:Date.now(),reviewStatus:"pending",replacesDocumentId:active?._id});
 await ctx.db.insert("auditLogs",{organizationId:user.organizationId,actorUserId:user._id,action:"employee.document.uploaded",entityType:"employeeDocument",entityId:String(id),metadata:{documentCategory:category,documentType:type,replacesDocumentId:active?._id??null},createdAt:Date.now()});
 return id;
}});
export const listPendingForAdmin=query({args:{},handler:async(ctx)=>{
 const admin=await requireAdmin(ctx);
 const rows=await ctx.db.query("employeeDocuments").withIndex("by_org_status",q=>q.eq("organizationId",admin.organizationId).eq("reviewStatus","pending")).order("desc").collect();
 return Promise.all(rows.map(async doc=>{
  const employee=await ctx.db.get(doc.employeeId);
  const [department,url,previous]=await Promise.all([employee?ctx.db.get(employee.departmentId):null,ctx.storage.getUrl(doc.storageId),doc.replacesDocumentId?ctx.db.get(doc.replacesDocumentId):null]);
  return {...doc,employeeName:employee?[employee.firstName,employee.lastName].filter(Boolean).join(" "):"Employee",employeeCode:employee?.employeeCode??"",departmentName:department?.name??"",url,replacingFileName:previous?.originalFileName??null};
 }));
}});
export const reviewDocument=mutation({args:{documentId:v.id("employeeDocuments"),decision:v.union(v.literal("verified"),v.literal("rejected")),note:v.optional(v.string())},handler:async(ctx,args)=>{
 const admin=await requireAdmin(ctx),doc=await ctx.db.get(args.documentId);if(!doc||doc.organizationId!==admin.organizationId)throw Error("DOCUMENT_NOT_FOUND");
 if(doc.reviewStatus!=="pending")throw Error("DOCUMENT_ALREADY_REVIEWED");
 const now=Date.now(),note=args.note?.trim();if(args.decision==="rejected"&&!note)throw Error("REJECTION_REASON_REQUIRED");
 if(args.decision==="verified"&&doc.replacesDocumentId){
  const old=await ctx.db.get(doc.replacesDocumentId);
  if(!old||old.organizationId!==admin.organizationId||old.employeeId!==doc.employeeId||old.reviewStatus!=="verified")throw Error("REPLACED_DOCUMENT_NOT_ACTIVE");
  await ctx.db.patch(old._id,{reviewStatus:"replaced",replacedByDocumentId:doc._id});
  await ctx.storage.delete(old.storageId);
 }
 await ctx.db.patch(doc._id,{reviewStatus:args.decision,reviewedBy:admin._id,reviewedAt:now,reviewNote:note||undefined});
 await ctx.db.insert("auditLogs",{organizationId:admin.organizationId,actorUserId:admin._id,action:"employee.document."+args.decision,entityType:"employeeDocument",entityId:String(doc._id),metadata:{documentType:doc.documentType,employeeId:String(doc.employeeId),note:note??null,replacedDocumentId:doc.replacesDocumentId?String(doc.replacesDocumentId):null},createdAt:now});
 return {success:true};
}});
export const getMyDocumentFileUrl=query({args:{documentId:v.id("employeeDocuments")},handler:async(ctx,args)=>{
 const user=await requireIdentity(ctx);if(!user.employeeId)throw Error("FORBIDDEN");
 const doc=await ctx.db.get(args.documentId);if(!doc||doc.employeeId!==user.employeeId||doc.organizationId!==user.organizationId||doc.reviewStatus==="replaced")throw Error("DOCUMENT_NOT_FOUND");
 return ctx.storage.getUrl(doc.storageId);
}});
