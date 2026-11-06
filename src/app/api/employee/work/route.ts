import { NextResponse } from "next/server";
import { fetchAuthMutation, isAuthenticated } from "@/lib/auth-server";
import { api } from "@/../convex/_generated/api";
export const dynamic="force-dynamic";
export async function PATCH(request:Request){if(!(await isAuthenticated()))return NextResponse.json({error:"UNAUTHENTICATED"},{status:401});try{const body=await request.json();const result=await fetchAuthMutation(api.teamsWork.updateMyWorkStatus,{progressId:body.progressId,status:body.status});return NextResponse.json({success:result},{headers:{"Cache-Control":"private, no-store"}});}catch(error){return NextResponse.json({error:error instanceof Error?error.message:"WORK_STATUS_UPDATE_FAILED"},{status:400});}}
