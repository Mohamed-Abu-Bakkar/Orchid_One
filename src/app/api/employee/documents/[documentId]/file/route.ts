import {NextResponse} from "next/server";
import type {Id} from "@/../convex/_generated/dataModel";
import {fetchAuthQuery,isAuthenticated} from "@/lib/auth-server";
import {api} from "@/../convex/_generated/api";
export const dynamic="force-dynamic";
export async function GET(_request:Request,{params}:{params:Promise<{documentId:string}>}){if(!(await isAuthenticated()))return NextResponse.json({error:"UNAUTHENTICATED"},{status:401});try{const {documentId}=await params;const url=await fetchAuthQuery(api.employeeDocuments.getMyDocumentFileUrl,{documentId:documentId as Id<"employeeDocuments">});if(!url)return NextResponse.json({error:"DOCUMENT_NOT_FOUND"},{status:404});return NextResponse.redirect(url,{headers:{"Cache-Control":"private, no-store, max-age=0"}});}catch{return NextResponse.json({error:"DOCUMENT_NOT_FOUND"},{status:404});}}
