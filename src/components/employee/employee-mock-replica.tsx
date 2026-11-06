"use client";

import { useState } from "react";

type Screen = "home" | "docsScreen" | "attScreen" | "hoursScreen" | "payScreen" | "reqScreen" | "analyticsScreen" | "notifScreen" | "newReqScreen" | "helpScreen" | "moreScreen" | "polScreen" | "polDetailScreen";
type Sheet = "uploadSheet" | "feedbackSheet" | null;

export function EmployeeMockReplica() {
 const [screen,setScreen]=useState<Screen>("home");
 const [sheet,setSheet]=useState<Sheet>(null);
 const [toastMessage,setToastMessage]=useState("");
 const [checkedIn,setCheckedIn]=useState(false);
 const handleAction=(action:string)=>{
  const key=action.trim().split("(")[0];
  const nav:Record<string,Screen>={openDocs:"docsScreen",openAtt:"attScreen",openWorkingHours:"hoursScreen",openPayslips:"payScreen",openRequests:"reqScreen",openPerformance:"analyticsScreen",openNotifications:"notifScreen",openNewRequest:"newReqScreen",openHelpdesk:"helpScreen",openMore:"moreScreen",openPolicies:"polScreen",openPolicy:"polDetailScreen"};
  const back:Record<string,Screen>={closeDocs:"home",closeAtt:"home",closeHours:"home",closePayslips:"home",closeRequests:"home",closePerformance:"home",closeNotifications:"home",closeNewRequest:"reqScreen",closeHelpdesk:"home",closeMore:"home",closePolicies:"home",closePolicyDetail:"polScreen"};
  if(nav[key]){setScreen(nav[key]);return}
  if(back[key]){setScreen(back[key]);return}
  if(key==="openUploadSheet"){setSheet("uploadSheet");return}
  if(key==="closeUploadSheet"||key==="closeFeedbackSheet"){setSheet(null);return}
  if(key==="openFeedbackSheet"){setSheet("feedbackSheet");return}
  if(key==="toggleCheckIn"){setCheckedIn(v=>!v);setToastMessage(checkedIn?"Checked out · see you tomorrow":"Checked in · shift started");return}
  if(key==="submitFeedback"){setSheet(null);setToastMessage("Feedback submitted");return}
  if(key==="simulateUpload"){setToastMessage("Choose a document to upload");return}
  if(key==="toast"){const match=action.match(/toast\((['"])(.*?)\1/);setToastMessage(match?.[2]??"");return}
  if(key==="confirmPolicyRead"){setToastMessage("Policy acknowledgement saved");return}
  if(key==="submitNewRequest"){setToastMessage("Request submitted");setScreen("reqScreen");return}
  if(key==="renderPolicies"){return}
  if(key==="window.location"){return}
 };
 return <div className="employee-react-root" data-active-screen={screen} data-active-sheet={sheet??""} onClick={event=>{const target=(event.target as HTMLElement).closest<HTMLElement>("[data-action]");if(target){event.preventDefault();handleAction(target.dataset.action??"")}}} onInput={event=>{const target=event.target as HTMLElement;if(target.dataset.inputAction==="renderPolicies(this.value)")return}}>
 {body}
 {toastMessage&&<div className="employee-react-toast" role="status" onClick={()=>setToastMessage("")}>{toastMessage}</div>}
 </div>;
}
