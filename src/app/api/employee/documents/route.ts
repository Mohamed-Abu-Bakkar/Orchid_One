import {NextResponse} from "next/server";
import type {Id} from "@/../convex/_generated/dataModel";
import {fetchAuthMutation,isAuthenticated} from "@/lib/auth-server";
import {api} from "@/../convex/_generated/api";
export const dynamic="force-dynamic";
export async function POST(request:Request){if(!(await isAuthenticated()))return NextResponse.json({error:"UNAUTHENTICATED"},{status:401});try{const body=await request.json();const documentId=await fetchAuthMutation(api.employeeDocuments.saveMyDocument,{storageId:body.storageId as Id<"_storage">,documentCategory:body.documentCategory,documentType:body.documentType,originalFileName:body.originalFileName,mimeType:body.mimeType});return NextResponse.json({documentId},{headers:{"Cache-Control":"no-store"}});}catch(error){return NextResponse.json({error:error instanceof Error?error.message:"DOCUMENT_SAVE_FAILED"},{status:400});}}
