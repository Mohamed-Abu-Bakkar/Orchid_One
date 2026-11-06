"use client";

import { useState } from "react";
import Script from "next/script";

type Screen = "home" | "docsScreen" | "attScreen" | "hoursScreen" | "payScreen" | "reqScreen" | "analyticsScreen" | "notifScreen" | "newReqScreen" | "helpScreen" | "moreScreen" | "polScreen" | "polDetailScreen";
type Sheet = "uploadSheet" | "feedbackSheet" | null;

export function EmployeeMockReplica() {
 const [screen,setScreen]=useState<Screen>("home");
 const [sheet,setSheet]=useState<Sheet>(null);
 const [toastMessage,setToastMessage]=useState("");
 const [checkedIn,setCheckedIn]=useState(false);
 const [navStack,setNavStack]=useState<Screen[]>(["home"]);
 const handleAction=(action:string)=>{
  const key=action.trim().split("(")[0];
  const arg=action.match(/\((?:'|")(.*?)(?:'|")\)/)?.[1];
  const screenMap:Record<string,Screen>={openDocs:"docsScreen",openAtt:"attScreen",openWorkingHours:"hoursScreen",openPayslips:"payScreen",openRequests:"reqScreen",openPerformance:"analyticsScreen",openNotifications:"notifScreen",openNewRequest:"newReqScreen",openHelpdesk:"helpScreen",openMore:"moreScreen",openPolicies:"polScreen",openPolicy:"polDetailScreen"};
  if(key==="goTo"&&arg){const next=arg as Screen;setScreen(next);setNavStack([next]);return}
  if(key==="pushScreen"&&arg){const next=arg as Screen;setScreen(next);setNavStack(stack=>[...stack,next]);return}
  if(screenMap[key]){const next=screenMap[key];setScreen(next);setNavStack(stack=>key==="openAtt"||key==="openRequests"||key==="openPerformance"||key==="openNotifications"||key==="openHelpdesk"||key==="openMore"||key==="openPolicies"?[next]:[...stack,next]);return}
  if(key.startsWith("close")){const next=key==="closeNewRequest"?"reqScreen":key==="closePolicyDetail"?"polScreen":"home";setScreen(next);setNavStack(stack=>stack.length>1?stack.slice(0,-1):["home"]);return}
  if(key==="goBack"){setNavStack(stack=>{const next=stack.length>1?stack.slice(0,-1):["home"];setScreen(next[next.length-1]);return next});return}
  if(key==="openUploadSheet"){setSheet("uploadSheet");return}
  if(key==="closeUploadSheet"||key==="closeFeedbackSheet"){setSheet(null);return}
  if(key==="openFeedbackSheet"){setSheet("feedbackSheet");return}
  if(key==="toggleCheckIn"){setCheckedIn(v=>!v);setToastMessage(checkedIn?"Checked out · see you tomorrow":"Checked in · shift started");return}
  if(key==="submitFeedback"){setSheet(null);setToastMessage("Feedback submitted");return}
  if(key==="simulateUpload"){setToastMessage("Choose a document to upload");return}
  if(key==="toast"){const match=action.match(/toast\((['"])(.*?)\1/);setToastMessage(match?.[2]??"");return}
  if(key==="confirmPolicyRead"){setToastMessage("Confirmation recorded — thanks for reading!");return}
  if(key==="submitNewRequest"){setToastMessage("Request submitted");setScreen("reqScreen");return}
  if(key==="window.location"){return}

