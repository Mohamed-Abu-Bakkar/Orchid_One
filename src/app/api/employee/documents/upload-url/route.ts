import {NextResponse} from "next/server";
import {fetchAuthMutation,isAuthenticated} from "@/lib/auth-server";
import {api} from "@/../convex/_generated/api";
export const dynamic="force-dynamic";
export async function POST(){if(!(await isAuthenticated()))return NextResponse.json({error:"UNAUTHENTICATED"},{status:401});try{const url=await fetchAuthMutation(api.employeeDocuments.generateUploadUrl,{});return NextResponse.json({url},{headers:{"Cache-Control":"no-store"}});}catch(error){return NextResponse.json({error:error instanceof Error?error.message:"UPLOAD_URL_FAILED"},{status:400});}}
