"use client";
import { useEffect, useState } from "react";
import Script from "next/script";
type Screen = "home" | "docsScreen" | "attScreen" | "hoursScreen" | "payScreen" | "reqScreen" | "analyticsScreen" | "notifScreen" | "newReqScreen" | "helpScreen" | "moreScreen" | "polScreen" | "polDetailScreen";
type Sheet = "uploadSheet" | "feedbackSheet" | null;
export function EmployeeMockReplica() {
 const [screen,setScreen]=useState<Screen>("home");
 const [sheet,setSheet]=useState<Sheet>(null);
 const [toastMessage,setToastMessage]=useState("");
 const [checkedIn,setCheckedIn]=useState(false);
 const [navStack,setNavStack]=useState<Screen[]>(["home"]);
 const [ready,setReady]=useState(false);
 useEffect(()=>{const timer=window.setTimeout(()=>setReady(true),1600);return()=>window.clearTimeout(timer)},[]);
 const handleAction=(action:string)=>{
  const key=action.trim().split("(")[0];
  const arg=action.match(/\((?:'|")(.*?)(?:'|")\)/)?.[1];
  const screenMap:Record<string,Screen>={openDocs:"docsScreen",openAtt:"attScreen",openWorkingHours:"hoursScreen",openPayslips:"payScreen",openRequests:"reqScreen",openPerformance:"analyticsScreen",openNotifications:"notifScreen",openNewRequest:"newReqScreen",openHelpdesk:"helpScreen",openMore:"moreScreen",openPolicies:"polScreen",openPolicy:"polDetailScreen"};
  if(key==="goTo"&&arg){const next=arg as Screen;setScreen(next);setNavStack([next]);return}
  if(key==="pushScreen"&&arg){const next=arg as Screen;setScreen(next);setNavStack(stack=>[...stack,next]);return}
  if(screenMap[key]){const next=screenMap[key];setScreen(next);setNavStack(stack=>["openAtt","openRequests","openPerformance","openNotifications","openHelpdesk","openMore","openPolicies"].includes(key)?[next]:[...stack,next]);return}
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
 };
 return <>
  <Script id="orchid-tailwind-config" strategy="afterInteractive">{"\n        tailwind.config = {\n          darkMode: \"class\",\n          theme: {\n            extend: {\n              \"colors\": {\n                      \"primary\": \"#4a1254\",\n                      \"surface\": \"#fcf9f8\",\n                      \"on-secondary\": \"#ffffff\",\n                      \"secondary\": \"#6f5385\",\n                      \"surface-tint\": \"#83488b\",\n                      \"surface-container-highest\": \"#e4e2e1\",\n                      \"outline-variant\": \"#d1c2ce\",\n                      \"on-primary-container\": \"#db97e1\",\n                      \"secondary-fixed\": \"#f2daff\",\n                      \"surface-variant\": \"#e4e2e1\",\n                      \"tertiary-fixed-dim\": \"#c8c6c3\",\n                      \"primary-fixed-dim\": \"#f4affa\",\n                      \"primary-container\": \"#632b6c\",\n                      \"on-secondary-container\": \"#6a4e80\",\n                      \"on-tertiary-container\": \"#b0aeac\",\n                      \"surface-dim\": \"#dcd9d9\",\n                      \"outline\": \"#80737e\",\n                      \"on-surface-variant\": \"#4e444d\",\n                      \"on-tertiary\": \"#ffffff\",\n                      \"on-primary-fixed\": \"#350040\",\n                      \"surface-container\": \"#f0eded\",\n                      \"on-background\": \"#1b1c1c\",\n                      \"error\": \"#ba1a1a\",\n                      \"on-error-container\": \"#93000a\",\n                      \"surface-container-high\": \"#eae7e7\",\n                      \"surface-bright\": \"#fcf9f8\",\n                      \"on-tertiary-fixed-variant\": \"#474745\",\n                      \"secondary-fixed-dim\": \"#dcbaf3\",\n                      \"on-secondary-fixed\": \"#290e3d\",\n                      \"inverse-on-surface\": \"#f3f0f0\",\n                      \"primary-fixed\": \"#ffd6ff\",\n                      \"on-secondary-fixed-variant\": \"#573b6b\",\n                      \"surface-container-low\": \"#f6f3f2\",\n                      \"inverse-primary\": \"#f4affa\",\n                      \"on-primary\": \"#ffffff\",\n                      \"error-container\": \"#ffdad6\",\n                      \"secondary-container\": \"#e8c5fe\",\n                      \"on-surface\": \"#1b1c1c\",\n                      \"tertiary-fixed\": \"#e5e2df\",\n                      \"background\": \"#fcf9f8\",\n                      \"tertiary\": \"#2c2c2a\",\n                      \"tertiary-container\": \"#434240\",\n                      \"on-error\": \"#ffffff\",\n                      \"on-tertiary-fixed\": \"#1c1c1a\",\n                      \"surface-container-lowest\": \"#ffffff\",\n                      \"on-primary-fixed-variant\": \"#683071\",\n                      \"inverse-surface\": \"#303030\"\n              },\n              \"borderRadius\": {\n                      \"DEFAULT\": \"0.25rem\",\n                      \"lg\": \"0.5rem\",\n                      \"xl\": \"0.75rem\",\n                      \"full\": \"9999px\"\n              },\n              \"spacing\": {\n                      \"gutter\": \"24px\",\n                      \"stack-sm\": \"4px\",\n                      \"container-padding-desktop\": \"32px\",\n                      \"base\": \"8px\",\n                      \"container-padding-mobile\": \"16px\",\n                      \"stack-md\": \"12px\",\n                      \"stack-lg\": \"24px\"\n              },\n              \"fontFamily\": {\n                      \"display-lg\": [\"Manrope\"],\n                      \"label-sm\": [\"Inter\"],\n                      \"headline-lg\": [\"Manrope\"],\n                      \"tabular-nums\": [\"Inter\"],\n                      \"body-md\": [\"Inter\"],\n                      \"headline-lg-mobile\": [\"Manrope\"],\n                      \"body-lg\": [\"Inter\"],\n                      \"title-md\": [\"Manrope\"]\n              },\n              \"fontSize\": {\n                      \"display-lg\": [\"48px\", {\"lineHeight\": \"56px\", \"letterSpacing\": \"-0.02em\", \"fontWeight\": \"700\"}],\n                      \"label-sm\": [\"12px\", {\"lineHeight\": \"16px\", \"letterSpacing\": \"0.01em\", \"fontWeight\": \"500\"}],\n                      \"headline-lg\": [\"32px\", {\"lineHeight\": \"40px\", \"fontWeight\": \"600\"}],\n                      \"tabular-nums\": [\"14px\", {\"lineHeight\": \"20px\", \"fontWeight\": \"400\"}],\n                      \"body-md\": [\"14px\", {\"lineHeight\": \"20px\", \"fontWeight\": \"400\"}],\n                      \"headline-lg-mobile\": [\"24px\", {\"lineHeight\": \"32px\", \"fontWeight\": \"600\"}],\n                      \"body-lg\": [\"16px\", {\"lineHeight\": \"24px\", \"fontWeight\": \"400\"}],\n                      \"title-md\": [\"20px\", {\"lineHeight\": \"28px\", \"fontWeight\": \"600\"}]\n              }\n      },\n          },\n        }\n    "}</Script>
  <Script src="https://cdn.tailwindcss.com?plugins=forms,container-queries" strategy="afterInteractive" />
  <div className="employee-react-root" data-active-screen={screen} data-active-sheet={sheet??""} data-ready={ready} onClick={event=>{const target=(event.target as HTMLElement).closest<HTMLElement>("[data-action]");if(target){event.preventDefault();handleAction(target.dataset.action??"")}}}>

{/* Splash Screen */}
<div className="fixed inset-0 z-[100] bg-surface text-on-surface flex flex-col items-center justify-center overflow-hidden" id="splash">
<div className="absolute inset-0 orchid-pattern z-0"></div>
<div className="absolute top-0 left-0 w-[500px] h-[500px] bg-secondary-fixed opacity-30 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
<div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-primary-fixed-dim opacity-20 rounded-full blur-[120px] translate-x-1/3 translate-y-1/3 pointer-events-none"></div>
<main className="relative z-10 flex flex-col items-center text-center px-container-padding-mobile md:px-container-padding-desktop">
<div className="mb-stack-lg fade-in-up delay-100 relative group">
<div className="absolute inset-0 bg-primary-container rounded-3xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-700"></div>
<div className="w-24 h-24 md:w-32 md:h-32 bg-surface-container-lowest rounded-3xl shadow-sm border border-outline-variant/30 flex items-center justify-center relative z-10 overflow-hidden">
<img src="https://raw.githubusercontent.com/Mohamed-Abu-Bakkar/Orchid_One/feature/orchid-one-production/OrchidHRM/assets/android/launchericon-192x192.png" alt="Orchid One" className="w-full h-full object-contain" />
</div>
</div>
<h1 className="font-display-lg text-display-lg text-primary tracking-tight mb-stack-sm fade-in-up delay-300">
            ORCHID ONE
        </h1>
<p className="font-title-md text-title-md text-secondary fade-in-up delay-500">
            People. Workforce. Performance.
        </p>
<div className="mt-16 fade-in-up delay-500">
<div className="w-48 h-1 bg-surface-variant rounded-full overflow-hidden">
<div className="w-1/3 h-full bg-primary rounded-full animate-[loading_2s_ease-in-out_infinite]"></div>
</div>
</div>
</main>
</div>
{/* Main Content Area */}
<main className="flex-1 w-full max-w-[430px] mx-auto">
{/* TopAppBar */}
<header className="flex justify-between items-center w-full px-4 h-16 bg-surface shadow-sm sticky top-0 z-30">
<div className="flex flex-col">
<span className="text-title-md font-title-md font-bold text-primary leading-tight">Orchid One</span>
<span className="text-label-sm font-label-sm text-on-surface-variant">Employee · OH-2041</span>
</div>
<div className="flex items-center gap-2">
<button className="text-primary hover:bg-surface-container-highest transition-colors rounded-full p-2 relative" data-action={"openNotifications()"}>
<span className="material-symbols-outlined">notifications</span>
<span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#E4572E] border border-surface"></span>
</button>
<img className="w-9 h-10 rounded-full object-cover border border-outline-variant/40" alt="Arun Kumar Profile Picture" data-action={"window.location='/code.html'"} data-alt="A highly detailed professional portrait of an Indian male software developer in his early 30s. He is wearing a clean, modern button-down shirt. The background is a bright, softly blurred tech office environment with high-key lighting. The overall mood is confident, approachable, and corporate. Modern enterprise aesthetic." src="https://lh3.googleusercontent.com/aida-public/AB6AXuDXNPrDoUMs9RbNq_QWsCKuqHdut5wgiSN5WsG9rr4HeQVv6dbfo0v0GSGhS8gRf0nTJl3t_bDRsOL97IJ4eM7-_9Orl9JFxfPr1r4JqcYArptD_dlWmW_KmI7gNZJJILF-vKRxKu_ywMV5kxpo-aym3w3DSJ4nBbcEmjmVtlLlytiHPy1btyFbaJx1Lrgs2YepibWmfk0rMNSpf6nEahUpMFsixXCkpRG_U6ylFYjinUzMJQE75ctZ"/>
</div>
</header>
<div className="p-4 flex flex-col gap-3">
{/* Header Section */}
<div>
<h2 className="text-headline-lg-mobile font-headline-lg-mobile text-primary">Good morning, Arun Kumar</h2>
<p className="text-body-md font-body-md text-on-surface-variant mt-1">Here is your daily summary for today.</p>
</div>
{/* Check In Hero */}
<div className="bento-card flex flex-col items-center justify-center py-8 px-5 relative overflow-hidden group">
<div className="absolute inset-0 bg-gradient-to-br from-primary-fixed to-surface opacity-30"></div>
<div className="w-full z-10 flex items-center justify-between">
<span className="flex items-center gap-1.5 px-2.5 py-1 bg-secondary-fixed text-on-secondary-fixed rounded-full text-label-sm font-label-sm font-medium">
<span className="w-1.5 h-1.5 rounded-full bg-[#34A853]"></span>Morning Shift · 06:00 – 14:00
</span>
</div>
<p className="z-10 text-headline-lg-mobile font-headline-lg-mobile text-primary font-semibold tracking-tight mt-5 font-tabular-nums" id="heroClock">06:00:00</p>
<p className="z-10 text-body-md font-body-md text-on-surface-variant mt-1" id="heroDate">Thursday, 14 Aug 2026</p>
<div className="z-10 my-7 flex items-center justify-center" id="heroRingWrap">
<div className="hero-ring" id="heroRing"><span className="material-symbols-outlined text-primary text-[40px] relative z-10" style={{"fontVariationSettings":"'FILL' 0"}}>fingerprint</span></div>
</div>
<p className="z-10 text-body-lg font-body-lg font-semibold text-on-surface" id="heroStateLabel">You are not checked in yet</p>
<p className="z-10 text-body-md font-body-md text-on-surface-variant mt-1 text-center" id="heroStateSub">Location verified · inside the attendance area</p>
<button className="z-10 mt-5 bg-primary text-white text-body-lg font-body-lg font-bold rounded-lg px-7 py-3 shadow-sm hover:bg-primary-container transition-colors" id="heroBtn" data-action={"toggleCheckIn()"}>Check In</button>
</div>
{/* Quick Stats */}
<div className="grid grid-cols-2 gap-3">
<div className="bento-card flex flex-col">
<p className="text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider">Today's hours</p>
<p className="text-headline-lg-mobile font-headline-lg-mobile text-primary font-semibold mt-2 font-tabular-nums">0.0</p>
<p className="text-label-sm font-label-sm text-on-surface-variant mt-1">Not checked in</p>
</div>
<div className="bento-card flex flex-col">
<p className="text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider">Month attendance</p>
<p className="text-headline-lg-mobile font-headline-lg-mobile text-[#1E8E4E] font-semibold mt-2 font-tabular-nums">18 / 22</p>
<p className="text-label-sm font-label-sm text-on-surface-variant mt-1">82% attendance</p>
</div>
<div className="bento-card flex flex-col">
<p className="text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider">Leave balance</p>
<p className="text-headline-lg-mobile font-headline-lg-mobile text-primary font-semibold mt-2 font-tabular-nums">8</p>
<p className="text-label-sm font-label-sm text-on-surface-variant mt-1">Casual leave</p>
</div>
<div className="bento-card flex flex-col">
<p className="text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider">This week's wage</p>
<p className="text-headline-lg-mobile font-headline-lg-mobile text-[#1E8E4E] font-semibold mt-2 font-tabular-nums">₹4,800</p>
<p className="text-label-sm font-label-sm text-on-surface-variant mt-1">40 hrs · submitted</p>
</div>
</div>
{/* Quick Actions */}
<p className="text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider mt-1">Quick actions</p>
<div className="grid grid-cols-2 gap-2">
<button className="bg-surface hover:bg-surface-container-low border border-outline-variant/50 rounded-lg p-3 flex flex-col items-center justify-center gap-2 transition-colors" data-action={"openPayslips()"}>
<span className="material-symbols-outlined text-secondary">receipt_long</span>
<span className="text-label-sm font-label-sm text-on-surface-variant">Payslips</span>
</button>
<button className="bg-surface hover:bg-surface-container-low border border-outline-variant/50 rounded-lg p-3 flex flex-col items-center justify-center gap-2 transition-colors" data-action={"openDocs()"}>
<span className="material-symbols-outlined text-secondary">edit_document</span>
<span className="text-label-sm font-label-sm text-on-surface-variant">Documents</span>
</button>
<button className="bg-surface hover:bg-surface-container-low border border-outline-variant/50 rounded-lg p-3 flex flex-col items-center justify-center gap-2 transition-colors" data-action={"openPolicies()"}>
<span className="material-symbols-outlined text-secondary">approval</span>
<span className="text-label-sm font-label-sm text-on-surface-variant">Policies</span>
</button>
<button className="bg-surface hover:bg-surface-container-low border border-outline-variant/50 rounded-lg p-3 flex flex-col items-center justify-center gap-2 transition-colors" data-action={"openHelpdesk()"}>
<span className="material-symbols-outlined text-secondary">support_agent</span>
<span className="text-label-sm font-label-sm text-on-surface-variant">Helpdesk</span>
</button>
</div>
{/* Upcoming */}
<p className="text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider mt-1">Upcoming</p>
<div className="bento-card p-0 overflow-hidden">
<div className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-surface-container-high transition-colors cursor-pointer">
<div className="flex flex-col flex-1 min-w-0">
<p className="text-body-md font-body-md font-medium text-on-surface">Independence Day</p>
<p className="text-label-sm font-label-sm text-on-surface-variant mt-0.5">Public holiday · Tomorrow</p>
</div>
<span className="flex-shrink-0 px-2 py-0.5 rounded-full bg-surface-container-highest text-on-surface-variant text-[10px] font-medium tracking-wide">15 Aug</span>
</div>
<div className="h-px bg-outline-variant/30 mx-4"></div>
<div className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-surface-container-high transition-colors cursor-pointer">
<div className="flex flex-col flex-1 min-w-0">
<p className="text-body-md font-body-md font-medium text-on-surface">Birthday · Meena S</p>
<p className="text-label-sm font-label-sm text-on-surface-variant mt-0.5">Logistics · send your wishes</p>
</div>
<span className="flex-shrink-0 px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed text-[10px] font-medium tracking-wide">Today</span>
</div>
<div className="h-px bg-outline-variant/30 mx-4"></div>
<div className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-surface-container-high transition-colors cursor-pointer">
<div className="flex flex-col flex-1 min-w-0">
<p className="text-body-md font-body-md font-medium text-on-surface">Evening shift · 15 Aug</p>
<p className="text-label-sm font-label-sm text-on-surface-variant mt-0.5">Next scheduled shift change</p>
</div>
<span className="flex-shrink-0 text-label-sm font-label-sm text-on-surface-variant">14:00</span>
</div>
</div>
</div>
</main>
{/* My Documents Screen */}
<div className="fixed inset-0 z-[90] bg-surface hidden" id="docsScreen">
<div className="flex flex-col h-full">
<header className="flex items-center justify-between px-4 h-16 bg-surface shadow-sm border-b border-outline-variant/40">
<button className="text-on-surface hover:bg-surface-container-highest transition-colors rounded-full p-2" data-action={"closeDocs()"}>
<span className="material-symbols-outlined">arrow_back</span>
</button>
<span className="text-title-md font-title-md font-semibold text-on-surface">My Documents</span>
<button className="text-primary hover:bg-secondary-fixed transition-colors rounded-full p-2" data-action={"openUploadSheet()"}>
<span className="material-symbols-outlined">add</span>
</button>
</header>
<div className="flex-1 overflow-y-auto px-4 py-4 pb-28">
<div className="flex gap-2 mb-4 flex-wrap" id="docTabs">
<button className="tab-chip active" data-doc="all">All</button>
<button className="tab-chip" data-doc="identity">Identity</button>
<button className="tab-chip" data-doc="education">Education</button>
<button className="tab-chip" data-doc="employment">Employment</button>
</div>
<div className="flex flex-col gap-2" id="docContent"></div>
</div>
</div>
</div>
{/* Upload Sheet */}
<div className="fixed inset-0 z-[110] hidden" id="uploadSheet">
<div className="absolute inset-0 bg-black/40" data-action={"closeUploadSheet()"}></div>
<div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-surface rounded-t-2xl p-5 pb-8 shadow-2xl">
<div className="w-10 h-1 bg-outline-variant rounded-full mx-auto mb-4"></div>
<p className="text-title-md font-title-md font-semibold text-on-surface">Upload document</p>
<p className="text-body-md font-body-md text-on-surface-variant mt-1">Add a new document to your records</p>
<div className="mt-5 border-2 border-dashed border-outline-variant rounded-lg py-8 flex flex-col items-center justify-center cursor-pointer hover:bg-surface-container-low transition-colors" data-action={"simulateUpload(this)"}>
<span className="material-symbols-outlined text-on-surface-variant text-[28px] mb-1.5">upload</span>
<p className="text-body-md font-body-md text-on-surface">Tap to choose a document</p>
<p className="text-label-sm font-label-sm text-on-surface-variant mt-1">Aadhaar, PAN, certificates, etc.</p>
</div>
<div className="mt-4">
<p className="text-label-sm font-label-sm text-on-surface-variant mb-1.5">Category</p>
<select className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2.5 text-body-md font-body-md text-on-surface focus:outline-none focus:border-primary">
<option>Identity</option>
<option>Education</option>
<option>Employment</option>
</select>
</div>
<div className="mt-4">
<p className="text-label-sm font-label-sm text-on-surface-variant mb-1.5">Document name</p>
<input className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2.5 text-body-md font-body-md text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary" placeholder="e.g. Aadhaar Card" />
</div>
<button className="w-full mt-5 bg-primary text-white text-body-lg font-body-lg font-bold rounded-lg py-3 hover:bg-primary-container transition-colors" data-action={"toast('Document uploaded for verification');closeUploadSheet()"}>Upload</button>
</div>
</div>
{/* Feedback Sheet */}
<div className="fixed inset-0 z-[110] hidden" id="feedbackSheet">
<div className="absolute inset-0 bg-black/40" data-action={"closeFeedbackSheet()"}></div>
<div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-surface rounded-t-2xl p-5 pb-8 shadow-2xl">
<div className="w-10 h-1 bg-outline-variant rounded-full mx-auto mb-4"></div>
<p className="text-title-md font-title-md font-semibold text-on-surface">Add self feedback</p>
<p className="text-body-md font-body-md text-on-surface-variant mt-1">Share your highlights and areas to improve for this month.</p>
<div className="mt-5">
<p className="text-label-sm font-label-sm text-on-surface-variant mb-1.5">What went well</p>
<textarea className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2.5 text-body-md font-body-md text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary resize-none h-20" placeholder="e.g. Completed all assigned tasks on time"></textarea>
</div>
<div className="mt-4">
<p className="text-label-sm font-label-sm text-on-surface-variant mb-1.5">Areas to improve</p>
<textarea className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2.5 text-body-md font-body-md text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary resize-none h-20" placeholder="e.g. Improve punctuality"></textarea>
</div>
<button className="w-full mt-5 bg-primary text-white text-body-lg font-body-lg font-bold rounded-lg py-3 hover:bg-primary-container transition-colors" data-action={"submitFeedback()"}>Submit feedback</button>
</div>
</div>
{/* Attendance Screen */}
<div className="fixed inset-0 z-[90] bg-surface hidden" id="attScreen">
<div className="flex flex-col h-full">
<header className="flex justify-between items-center w-full px-4 h-16 bg-surface shadow-sm border-b border-outline-variant/40">
<div className="flex flex-col">
<span className="text-title-md font-title-md font-bold text-primary leading-tight">Orchid One</span>
<span className="text-label-sm font-label-sm text-on-surface-variant">Employee · OH-2041</span>
</div>
<div className="flex items-center gap-2">
<button className="text-primary hover:bg-surface-container-highest transition-colors rounded-full p-2 relative" data-action={"openNotifications()"}>
<span className="material-symbols-outlined">notifications</span>
<span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#E4572E] border border-surface"></span>
</button>
<img className="w-9 h-10 rounded-full object-cover border border-outline-variant/40" alt="Arun Kumar Profile Picture" data-action={"window.location='/code.html'"} data-alt="A highly detailed professional portrait of an Indian male software developer in his early 30s. He is wearing a clean, modern button-down shirt. The background is a bright, softly blurred tech office environment with high-key lighting. The overall mood is confident, approachable, and corporate. Modern enterprise aesthetic." src="https://lh3.googleusercontent.com/aida-public/AB6AXuDXNPrDoUMs9RbNq_QWsCKuqHdut5wgiSN5WsG9rr4HeQVv6dbfo0v0GSGhS8gRf0nTJl3t_bDRsOL97IJ4eM7-_9Orl9JFxfPr1r4JqcYArptD_dlWmW_KmI7gNZJJILF-vKRxKu_ywMV5kxpo-aym3w3DSJ4nBbcEmjmVtlLlytiHPy1btyFbaJx1Lrgs2YepibWmfk0rMNSpf6nEahUpMFsixXCkpRG_U6ylFYjinUzMJQE75ctZ"/>
</div>
</header>
<div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
<div className="flex items-center justify-between">
<div>
<p className="text-title-md font-title-md font-semibold text-on-surface">Thursday, 14 Aug</p>
<p className="text-label-sm font-label-sm text-on-surface-variant mt-0.5">Morning Shift · 06:00 – 14:00</p>
</div>
<div className="flex flex-col items-end">
<p className="text-headline-lg-mobile font-headline-lg-mobile font-semibold text-primary font-tabular-nums" id="attClock">06:00</p>
<p className="text-label-sm font-label-sm text-on-surface-variant">Live</p>
</div>
</div>
{/* GPS status */}
<div className="bento-card flex items-center gap-3">
<div className="w-11 h-11 rounded-lg bg-secondary-fixed text-primary flex items-center justify-center flex-shrink-0" id="gpsIcon">
<span className="material-symbols-outlined text-[22px]">location_on</span>
</div>
<div className="flex flex-col flex-1 min-w-0">
<p className="text-body-md font-body-md font-semibold text-on-surface">Inside the attendance area</p>
<p className="text-label-sm font-label-sm text-on-surface-variant mt-0.5">120 m from office · accuracy ±8 m</p>
</div>
<span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#e6f4ea] text-[#1E8E4E] text-[10px] font-semibold flex-shrink-0"><span className="w-1.5 h-1.5 rounded-full bg-[#1E8E4E]"></span>Verified</span>
</div>
{/* Circular control */}
<div className="bento-card flex flex-col items-center">
<div className="att-ring">
<div className="ring-center">
<p className="text-label-sm font-label-sm text-on-surface-variant">Working time</p>
<p className="text-headline-lg-mobile font-headline-lg-mobile font-semibold text-primary font-tabular-nums mt-1" id="ringTime">0:00:00</p>
<p className="text-label-sm font-label-sm text-on-surface-variant font-semibold mt-0.5" id="ringSub">Not checked in</p>
</div>
</div>
<div className="mt-5 flex items-center gap-2">
<button className="bg-primary text-white text-body-lg font-body-lg font-bold rounded-lg px-7 py-3 shadow-sm hover:bg-primary-container transition-colors" id="attCheckBtn" data-action={"toggleCheckIn()"}>Check In</button>
</div>
</div>
{/* Shift info */}
<div className="bento-card">
<div className="flex items-center justify-between mb-2">
<span className="text-body-lg font-body-lg font-semibold text-on-surface">Your shift</span>
<span className="text-label-sm font-label-sm text-primary font-semibold cursor-pointer" data-action={"toast('Shift schedule')"}>View schedule</span>
</div>
<div className="flex justify-between py-2 border-b border-outline-variant/30"><span className="text-body-md font-body-md text-on-surface-variant">Shift</span><span className="text-body-md font-body-md font-medium text-on-surface">Morning</span></div>
<div className="flex justify-between py-2 border-b border-outline-variant/30"><span className="text-body-md font-body-md text-on-surface-variant">Working hours</span><span className="text-body-md font-body-md font-medium text-on-surface">06:00 – 14:00</span></div>
<div className="flex justify-between py-2 border-b border-outline-variant/30"><span className="text-body-md font-body-md text-on-surface-variant">Break</span><span className="text-body-md font-body-md font-medium text-on-surface">30 min</span></div>
<div className="flex justify-between py-2"><span className="text-body-md font-body-md text-on-surface-variant">Expected check-out</span><span className="text-body-md font-body-md font-medium text-on-surface">14:00</span></div>
</div>
{/* Team by shifts */}
<div className="bento-card">
<div className="flex items-center justify-between mb-3">
<span className="text-body-lg font-body-lg font-semibold text-on-surface">Team by shifts</span>
<span className="text-label-sm font-label-sm text-on-surface-variant">Today · 03 Nov</span>
</div>
{/* Morning shift group */}
<div className="mb-4">
<div className="flex items-center gap-2 mb-2">
<span className="w-2 h-2 rounded-full bg-[#34A853]"></span>
<span className="text-body-md font-body-md font-semibold text-on-surface">Morning shift · 06:00 – 14:00</span>
<span className="ml-auto text-label-sm font-label-sm text-on-surface-variant">3 members</span>
</div>
<div className="flex flex-col gap-3">
{/* member */}
<div className="flex items-start gap-3 p-2 rounded-lg bg-surface-container-low">
<div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-semibold text-label-md flex-shrink-0">AK</div>
<div className="flex-1 min-w-0">
<p className="text-body-md font-body-md font-semibold text-on-surface">Arun Kumar <span className="text-label-sm text-primary font-semibold">(You)</span></p>
<p className="text-label-sm font-label-sm text-on-surface-variant mt-0.5">Oversees: Bulk procurement · Quality grading</p>
<p className="text-label-sm font-label-sm text-on-surface mt-1"><span className="font-semibold">Tasks:</span> Inspect incoming lot, Grade flowers, Update stock sheet</p>
</div>
<span className="text-label-sm font-label-sm text-[#34A853] font-semibold flex-shrink-0">On shift</span>
</div>
<div className="flex items-start gap-3 p-2 rounded-lg bg-surface-container-low">
<div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-semibold text-label-md flex-shrink-0">RK</div>
<div className="flex-1 min-w-0">
<p className="text-body-md font-body-md font-semibold text-on-surface">Ravi Kumar</p>
<p className="text-label-sm font-label-sm text-on-surface-variant mt-0.5">Oversees: Cold storage · Sorting</p>
<p className="text-label-sm font-label-sm text-on-surface mt-1"><span className="font-semibold">Tasks:</span> Sort roses, Log wastage, Handover to dispatch</p>
</div>
<span className="text-label-sm font-label-sm text-[#34A853] font-semibold flex-shrink-0">On shift</span>
</div>
<div className="flex items-start gap-3 p-2 rounded-lg bg-surface-container-low">
<div className="w-10 h-10 rounded-full bg-secondary text-on-secondary flex items-center justify-center font-semibold text-label-md flex-shrink-0">AP</div>
<div className="flex-1 min-w-0">
<p className="text-body-md font-body-md font-semibold text-on-surface">Anita Patel</p>
<p className="text-label-sm font-label-sm text-on-surface-variant mt-0.5">Oversees: Packing · Dispatch</p>
<p className="text-label-sm font-label-sm text-on-surface mt-1"><span className="font-semibold">Tasks:</span> Pack bouquets, Update dispatch sheet, Seal crates</p>
</div>
<span className="text-label-sm font-label-sm text-[#34A853] font-semibold flex-shrink-0">On shift</span>
</div>
<div className="flex items-start gap-3 p-2 rounded-lg bg-surface-container-low">
<div className="w-10 h-10 rounded-full bg-tertiary text-on-tertiary flex items-center justify-center font-semibold text-label-md flex-shrink-0">SM</div>
<div className="flex-1 min-w-0">
<p className="text-body-md font-body-md font-semibold text-on-surface">Suresh Menon</p>
<p className="text-label-sm font-label-sm text-on-surface-variant mt-0.5">Oversees: Cold room · Equipment</p>
<p className="text-label-sm font-label-sm text-on-surface mt-1"><span className="font-semibold">Tasks:</span> Service cooler, Log downtime, Safety check</p>
</div>
<span className="text-label-sm font-label-sm text-on-surface-variant font-semibold flex-shrink-0">On break</span>
</div>
</div>
</div>
{/* Evening shift group */}
<div>
<div className="flex items-center gap-2 mb-2">
<span className="w-2 h-2 rounded-full bg-[#F9AB00]"></span>
<span className="text-body-md font-body-md font-semibold text-on-surface">Evening shift · 15:00 – 23:00</span>
<span className="ml-auto text-label-sm font-label-sm text-on-surface-variant">2 members</span>
</div>
<div className="flex flex-col gap-3">
<div className="flex items-start gap-3 p-2 rounded-lg bg-surface-container-low opacity-70">
<div className="w-10 h-10 rounded-full bg-surface-variant text-on-surface-variant flex items-center justify-center font-semibold text-label-md flex-shrink-0">NP</div>
<div className="flex-1 min-w-0">
<p className="text-body-md font-body-md font-semibold text-on-surface">Neha Patel</p>
<p className="text-label-sm font-label-sm text-on-surface-variant mt-0.5">Oversees: Finishing · District dispatch</p>
<p className="text-label-sm font-label-sm text-on-surface mt-1"><span className="font-semibold">Tasks:</span> Final QC, Label crates, Handover to night</p>
</div>
<span className="text-label-sm font-label-sm text-on-surface-variant font-semibold flex-shrink-0">Upcoming</span>
</div>
<div className="flex items-start gap-3 p-2 rounded-lg bg-surface-container-low opacity-70">
<div className="w-10 h-10 rounded-full bg-surface-variant text-on-surface-variant flex items-center justify-center font-semibold text-label-md flex-shrink-0">VK</div>
<div className="flex-1 min-w-0">
<p className="text-body-md font-body-md font-semibold text-on-surface">Vikram Khanna</p>
<p className="text-label-sm font-label-sm text-on-surface-variant mt-0.5">Oversees: Warehouse · Inventory</p>
<p className="text-label-sm font-label-sm text-on-surface mt-1"><span className="font-semibold">Tasks:</span> Stock audit, Reorder alerts, Zone cleanup</p>
</div>
<span className="text-label-sm font-label-sm text-on-surface-variant font-semibold flex-shrink-0">Upcoming</span>
</div>
</div>
</div>
</div>
<button className="w-full bg-surface text-primary border border-primary text-body-md font-body-md font-semibold rounded-lg py-3 hover:bg-secondary-fixed transition-colors flex items-center justify-center gap-1" data-action={"openWorkingHours()"}>View working hours<span className="material-symbols-outlined text-[18px]">chevron_right</span></button>
{/* Office location */}
<div className="bento-card flex items-center gap-3">
<div className="w-11 h-11 rounded-lg bg-[#e6f4ea] text-[#1E8E4E] flex items-center justify-center flex-shrink-0">
<span className="material-symbols-outlined text-[22px]">location_city</span>
</div>
<div className="flex flex-col flex-1 min-w-0">
<p className="text-body-md font-body-md font-semibold text-on-surface">Orchid Flowers — Main Campus</p>
<p className="text-label-sm font-label-sm text-on-surface-variant mt-0.5">Kovaipudur, Coimbatore · 641042</p>
</div>
</div>
</div>
<nav className="w-full flex justify-around items-center px-2 py-3 bg-surface border-t border-outline-variant">
<a className="flex flex-col items-center justify-center text-on-surface-variant hover:bg-surface-variant active:scale-90 duration-200 transition-all px-2 py-1 rounded-lg" href="#" data-action={"closeAtt()"}>
<span className="material-symbols-outlined">home</span>
<span className="text-label-sm font-label-sm mt-1">Home</span>
</a>
<a className="flex flex-col items-center justify-center bg-secondary-container text-on-secondary-container rounded-full px-4 py-1 hover:bg-surface-variant active:scale-90 duration-200 transition-all" href="#">
<span className="material-symbols-outlined icon-filled">fingerprint</span>
<span className="text-label-sm font-label-sm text-primary font-bold">Attendance</span>
</a>
<a className="flex flex-col items-center justify-center text-on-surface-variant hover:bg-surface-variant active:scale-90 duration-200 transition-all px-2 py-1 rounded-lg" href="#" data-action={"openPerformance()"}>
<span className="material-symbols-outlined">monitoring</span>
<span className="text-label-sm font-label-sm mt-1">Performance</span>
</a>
<a className="flex flex-col items-center justify-center text-on-surface-variant hover:bg-surface-variant active:scale-90 duration-200 transition-all px-2 py-1 rounded-lg" href="#" data-action={"openRequests()"}>
<span className="material-symbols-outlined">pending_actions</span>
<span className="text-label-sm font-label-sm mt-1">Requests</span>
</a>
<a className="flex flex-col items-center justify-center text-on-surface-variant hover:bg-surface-variant active:scale-90 duration-200 transition-all px-2 py-1 rounded-lg" href="#" data-action={"openMore()"}>
<span className="material-symbols-outlined">menu</span>
<span className="text-label-sm font-label-sm mt-1">More</span>
</a>
</nav>
</div>
</div>
{/* Working Hours Screen */}
<div className="fixed inset-0 z-[90] bg-surface hidden" id="hoursScreen">
<div className="flex flex-col h-full">
<header className="flex items-center justify-between px-4 h-16 bg-surface shadow-sm border-b border-outline-variant/40">
<button className="text-on-surface hover:bg-surface-container-highest transition-colors rounded-full p-2" data-action={"closeHours()"}>
<span className="material-symbols-outlined">arrow_back</span>
</button>
<span className="text-title-md font-title-md font-semibold text-on-surface">Working Hours</span>
<button className="text-primary hover:bg-secondary-fixed transition-colors rounded-full p-2" data-action={"toast('Filters')"}>
<span className="material-symbols-outlined">filter_list</span>
</button>
</header>
<div className="flex-1 overflow-y-auto px-4 py-4 pb-28">
<div className="flex bg-surface-container-low rounded-lg p-1" id="hoursSeg">
<button className="flex-1 py-2 rounded-md text-body-md font-body-md font-semibold text-primary bg-surface shadow-sm" data-view="week">Week</button>
<button className="flex-1 py-2 rounded-md text-body-md font-body-md text-on-surface-variant" data-view="month">Month</button>
</div>
{/* This week */}
<div className="bento-card mt-4">
<div className="flex items-center justify-between mb-3">
<span className="text-body-lg font-body-lg font-semibold text-on-surface">This week</span>
<span className="text-label-sm font-label-sm text-on-surface-variant">10 – 16 Aug</span>
</div>
<div className="flex items-end gap-2 h-32" id="weekBars"></div>
<div className="flex justify-between mt-2">
<span className="text-label-sm font-label-sm text-on-surface-variant">Mon</span>
<span className="text-label-sm font-label-sm text-on-surface-variant">Tue</span>
<span className="text-label-sm font-label-sm text-on-surface-variant">Wed</span>
<span className="text-label-sm font-label-sm text-on-surface-variant">Thu</span>
<span className="text-label-sm font-label-sm text-on-surface-variant">Fri</span>
<span className="text-label-sm font-label-sm text-on-surface-variant">Sat</span>
<span className="text-label-sm font-label-sm text-on-surface-variant">Sun</span>
</div>
</div>
{/* Stats */}
<div className="grid grid-cols-2 gap-3 mt-4">
<div className="bento-card flex flex-col">
<p className="text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider">Regular hours</p>
<p className="text-headline-lg-mobile font-headline-lg-mobile text-primary font-semibold mt-2 font-tabular-nums">40.0</p>
<p className="text-label-sm font-label-sm text-on-surface-variant mt-1">5 days</p>
</div>
<div className="bento-card flex flex-col">
<p className="text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider">Overtime</p>
<p className="text-headline-lg-mobile font-headline-lg-mobile text-[#b26a00] font-semibold mt-2 font-tabular-nums">4.5</p>
<p className="text-label-sm font-label-sm text-on-surface-variant mt-1">+₹675</p>
</div>
<div className="bento-card flex flex-col">
<p className="text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider">Payable hours</p>
<p className="text-headline-lg-mobile font-headline-lg-mobile text-primary font-semibold mt-2 font-tabular-nums">44.5</p>
<p className="text-label-sm font-label-sm text-on-surface-variant mt-1">incl. breaks</p>
</div>
<div className="bento-card flex flex-col">
<p className="text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider">Estimated wage</p>
<p className="text-headline-lg-mobile font-headline-lg-mobile text-[#1E8E4E] font-semibold mt-2 font-tabular-nums">₹5,475</p>
<p className="text-label-sm font-label-sm text-on-surface-variant mt-1">Week 33</p>
</div>
</div>
{/* Daily breakdown */}
<p className="text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider mt-4">Daily breakdown</p>
<div className="bento-card p-0 overflow-hidden mt-2" id="dailyHours"></div>
</div>
</div>
</div>
{/* Payslips Screen */}
<div className="fixed inset-0 z-[90] bg-surface hidden" id="payScreen">
<div className="flex flex-col h-full">
<header className="flex items-center justify-between px-4 h-16 bg-surface shadow-sm border-b border-outline-variant/40">
<button className="text-on-surface hover:bg-surface-container-highest transition-colors rounded-full p-2" data-action={"closePayslips()"}>
<span className="material-symbols-outlined">arrow_back</span>
</button>
<span className="text-title-md font-title-md font-semibold text-on-surface">Payslips</span>
<button className="text-primary hover:bg-secondary-fixed transition-colors rounded-full p-2" data-action={"toast('Filters')"}>
<span className="material-symbols-outlined">filter_list</span>
</button>
</header>
<div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
{/* Latest payslip */}
<div className="bento-card relative overflow-hidden">
<div className="absolute inset-0 bg-gradient-to-br from-primary-fixed to-surface opacity-30 pointer-events-none"></div>
<div className="relative z-10">
<div className="flex items-center justify-between">
<span className="flex items-center gap-1.5 px-2.5 py-1 bg-secondary-fixed text-on-secondary-fixed rounded-full text-label-sm font-label-sm font-medium">
<span className="w-1.5 h-1.5 rounded-full bg-[#34A853]"></span>Latest · Aug 2026
</span>
<span className="text-label-sm font-label-sm text-on-surface-variant">Week 33</span>
</div>
<p className="text-headline-lg-mobile font-headline-lg-mobile font-semibold text-primary mt-4 font-tabular-nums">₹5,475</p>
<p className="text-label-sm font-label-sm text-on-surface-variant mt-0.5">Net pay · 10 – 16 Aug 2026</p>
<div className="flex items-center justify-between mt-4 pt-3 border-t border-outline-variant/30">
<div className="flex flex-col">
<p className="text-label-sm font-label-sm text-on-surface-variant">Paid on</p>
<p className="text-body-md font-body-md font-medium text-on-surface mt-0.5">Sat, 16 Aug</p>
</div>
<div className="flex flex-col items-end">
<p className="text-label-sm font-label-sm text-on-surface-variant">Status</p>
<span className="text-label-sm font-label-sm text-[#1E8E4E] font-semibold mt-0.5">Submitted</span>
</div>
</div>
<button className="w-full mt-4 bg-primary text-white text-body-lg font-body-lg font-bold rounded-lg py-3 shadow-sm hover:bg-primary-container transition-colors" data-action={"toast('Payslip PDF downloaded')"}>Download payslip</button>
</div>
</div>
{/* Earnings & deductions */}
<p className="text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider mt-1">Aug 2026 · breakdown</p>
<div className="bento-card">
<div className="flex justify-between py-2 border-b border-outline-variant/30"><span className="text-body-md font-body-md text-on-surface-variant">Regular hours</span><span className="text-body-md font-body-md font-medium text-on-surface">40.0 hrs</span></div>
<div className="flex justify-between py-2 border-b border-outline-variant/30"><span className="text-body-md font-body-md text-on-surface-variant">Overtime</span><span className="text-body-md font-body-md font-medium text-on-surface">4.5 hrs</span></div>
<div className="flex justify-between py-2 border-b border-outline-variant/30"><span className="text-body-md font-body-md text-on-surface-variant">Gross earnings</span><span className="text-body-md font-body-md font-medium text-on-surface">₹5,475</span></div>
<div className="flex justify-between py-2 border-b border-outline-variant/30"><span className="text-body-md font-body-md text-on-surface-variant">Deductions</span><span className="text-body-md font-body-md font-medium text-on-surface text-[#ba1a1a]">−₹0</span></div>
<div className="flex justify-between py-2"><span className="text-body-md font-body-md font-semibold text-on-surface">Net pay</span><span className="text-body-md font-body-md font-semibold text-[#1E8E4E] font-tabular-nums">₹5,475</span></div>
</div>
{/* History */}
<p className="text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider mt-1">History</p>
<div className="bento-card p-0 overflow-hidden">
<div className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-surface-container-high transition-colors cursor-pointer" data-action={"toast('Week 32 payslip')"}>
<div className="flex flex-col flex-1 min-w-0">
<p className="text-body-md font-body-md font-medium text-on-surface">Week 32</p>
<p className="text-label-sm font-label-sm text-on-surface-variant mt-0.5">03 – 09 Aug 2026</p>
</div>
<p className="text-body-md font-body-md font-semibold text-on-surface flex-shrink-0">₹4,760</p>
<span className="flex-shrink-0 px-2 py-0.5 rounded-full bg-[#e6f4ea] text-[#1E8E4E] text-[10px] font-semibold">Approved</span>
</div>
<div className="h-px bg-outline-variant/30 mx-4"></div>
<div className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-surface-container-high transition-colors cursor-pointer" data-action={"toast('Week 31 payslip')"}>
<div className="flex flex-col flex-1 min-w-0">
<p className="text-body-md font-body-md font-medium text-on-surface">Week 31</p>
<p className="text-label-sm font-label-sm text-on-surface-variant mt-0.5">27 Jul – 02 Aug 2026</p>
</div>
<p className="text-body-md font-body-md font-semibold text-on-surface flex-shrink-0">₹4,880</p>
<span className="flex-shrink-0 px-2 py-0.5 rounded-full bg-[#e6f4ea] text-[#1E8E4E] text-[10px] font-semibold">Approved</span>
</div>
<div className="h-px bg-outline-variant/30 mx-4"></div>
<div className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-surface-container-high transition-colors cursor-pointer" data-action={"toast('Week 30 payslip')"}>
<div className="flex flex-col flex-1 min-w-0">
<p className="text-body-md font-body-md font-medium text-on-surface">Week 30</p>
<p className="text-label-sm font-label-sm text-on-surface-variant mt-0.5">20 – 26 Jul 2026</p>
</div>
<p className="text-body-md font-body-md font-semibold text-on-surface flex-shrink-0">₹5,040</p>
<span className="flex-shrink-0 px-2 py-0.5 rounded-full bg-[#e6f4ea] text-[#1E8E4E] text-[10px] font-semibold">Approved</span>
</div>
</div>
</div>
</div>
</div>
{/* Requests Screen */}
<div className="fixed inset-0 z-[90] bg-surface hidden" id="reqScreen">
<div className="flex flex-col h-full">
<header className="flex justify-between items-center w-full px-4 h-16 bg-surface shadow-sm border-b border-outline-variant/40">
<div className="flex flex-col">
<span className="text-title-md font-title-md font-bold text-primary leading-tight">Orchid One</span>
<span className="text-label-sm font-label-sm text-on-surface-variant">Employee · OH-2041</span>
</div>
<div className="flex items-center gap-2">
<button className="text-primary hover:bg-surface-container-highest transition-colors rounded-full p-2 relative" data-action={"openNotifications()"}>
<span className="material-symbols-outlined">notifications</span>
<span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#E4572E] border border-surface"></span>
</button>
<img className="w-9 h-10 rounded-full object-cover border border-outline-variant/40" alt="Arun Kumar Profile Picture" data-action={"window.location='/code.html'"} data-alt="A highly detailed professional portrait of an Indian male software developer in his early 30s. He is wearing a clean, modern button-down shirt. The background is a bright, softly blurred tech office environment with high-key lighting. The overall mood is confident, approachable, and corporate. Modern enterprise aesthetic." src="https://lh3.googleusercontent.com/aida-public/AB6AXuDXNPrDoUMs9RbNq_QWsCKuqHdut5wgiSN5WsG9rr4HeQVv6dbfo0v0GSGhS8gRf0nTJl3t_bDRsOL97IJ4eM7-_9Orl9JFxfPr1r4JqcYArptD_dlWmW_KmI7gNZJJILF-vKRxKu_ywMV5kxpo-aym3w3DSJ4nBbcEmjmVtlLlytiHPy1btyFbaJx1Lrgs2YepibWmfk0rMNSpf6nEahUpMFsixXCkpRG_U6ylFYjinUzMJQE75ctZ"/>
</div>
</header>
<div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
<div className="flex items-center justify-between">
<div>
<h2 className="text-headline-lg-mobile font-headline-lg-mobile text-primary">My Requests</h2>
<p className="text-body-md font-body-md text-on-surface-variant mt-1">Track your leaves, overtime and wage requests.</p>
</div>
<button className="bg-primary text-white text-body-md font-body-md font-bold rounded-lg px-4 py-2.5 shadow-sm hover:bg-primary-container transition-colors flex items-center gap-1" data-action={"openNewRequest()"}>
<span className="material-symbols-outlined text-[18px]">add</span>Request
</button>
</div>
<div className="flex bg-surface-container-low rounded-lg p-1" id="reqTabs">
<button className="flex-1 py-2 rounded-md text-body-md font-body-md font-semibold text-primary bg-surface shadow-sm" data-rt="pending">Pending (2)</button>
<button className="flex-1 py-2 rounded-md text-body-md font-body-md text-on-surface-variant" data-rt="history">History</button>
</div>
<div className="flex flex-col gap-3" id="reqContent"></div>
</div>
<nav className="w-full flex justify-around items-center px-2 py-3 bg-surface border-t border-outline-variant">
<a className="flex flex-col items-center justify-center text-on-surface-variant hover:bg-surface-variant active:scale-90 duration-200 transition-all px-2 py-1 rounded-lg" href="#" data-action={"closeRequests()"}>
<span className="material-symbols-outlined">home</span>
<span className="text-label-sm font-label-sm mt-1">Home</span>
</a>
<a className="flex flex-col items-center justify-center text-on-surface-variant hover:bg-surface-variant active:scale-90 duration-200 transition-all px-2 py-1 rounded-lg" href="#" data-action={"closeRequests();openAtt()"}>
<span className="material-symbols-outlined">fingerprint</span>
<span className="text-label-sm font-label-sm mt-1">Attendance</span>
</a>
<a className="flex flex-col items-center justify-center text-on-surface-variant hover:bg-surface-variant active:scale-90 duration-200 transition-all px-2 py-1 rounded-lg" href="#" data-action={"openPerformance()"}>
<span className="material-symbols-outlined">monitoring</span>
<span className="text-label-sm font-label-sm mt-1">Performance</span>
</a>
<a className="flex flex-col items-center justify-center bg-secondary-container text-on-secondary-container rounded-full px-4 py-1 hover:bg-surface-variant active:scale-90 duration-200 transition-all" href="#">
<span className="material-symbols-outlined icon-filled">pending_actions</span>
<span className="text-label-sm font-label-sm text-primary font-bold">Requests</span>
</a>
<a className="flex flex-col items-center justify-center text-on-surface-variant hover:bg-surface-variant active:scale-90 duration-200 transition-all px-2 py-1 rounded-lg" href="#" data-action={"openMore()"}>
<span className="material-symbols-outlined">menu</span>
<span className="text-label-sm font-label-sm mt-1">More</span>
</a>
</nav>
</div>
</div>
{/* BottomNavBar (Mobile Only) */}
<nav className="fixed bottom-0 w-full z-50 flex justify-around items-center px-2 py-3 bg-surface dark:bg-surface-container border-t border-outline-variant shadow-lg pb-safe">
<a className="flex flex-col items-center justify-center bg-secondary-container text-on-secondary-container rounded-full px-4 py-1 hover:bg-surface-variant active:scale-90 duration-200 transition-all" href="#">
<span className="material-symbols-outlined icon-filled">home</span>
<span className="text-label-sm font-label-sm text-primary font-bold">Home</span>
</a>
<a className="flex flex-col items-center justify-center text-on-surface-variant hover:bg-surface-variant active:scale-90 duration-200 transition-all px-2 py-1 rounded-lg" href="#" data-action={"openAtt()"}>
<span className="material-symbols-outlined">fingerprint</span>
<span className="text-label-sm font-label-sm mt-1">Attendance</span>
</a>
<a className="flex flex-col items-center justify-center text-on-surface-variant hover:bg-surface-variant active:scale-90 duration-200 transition-all px-2 py-1 rounded-lg" href="#" data-action={"openPerformance()"}>
<span className="material-symbols-outlined">monitoring</span>
<span className="text-label-sm font-label-sm mt-1">Performance</span>
</a>
<a className="flex flex-col items-center justify-center text-on-surface-variant hover:bg-surface-variant active:scale-90 duration-200 transition-all px-2 py-1 rounded-lg" href="#" data-action={"openRequests()"}>
<span className="material-symbols-outlined">pending_actions</span>
<span className="text-label-sm font-label-sm mt-1">Requests</span>
</a>
<a className="flex flex-col items-center justify-center text-on-surface-variant hover:bg-surface-variant active:scale-90 duration-200 transition-all px-2 py-1 rounded-lg" href="#" data-action={"openMore()"}>
<span className="material-symbols-outlined">menu</span>
<span className="text-label-sm font-label-sm mt-1">More</span>
</a>
</nav>
{/* Performance Screen */}
<div className="fixed inset-0 z-[90] bg-surface hidden" id="analyticsScreen">
<div className="flex flex-col h-full">
<header className="flex justify-between items-center w-full px-4 h-16 bg-surface shadow-sm border-b border-outline-variant/40">
<div className="flex flex-col">
<span className="text-title-md font-title-md font-bold text-primary leading-tight">Orchid One</span>
<span className="text-label-sm font-label-sm text-on-surface-variant">Employee · OH-2041</span>
</div>
<div className="flex items-center gap-2">
<button className="text-primary hover:bg-surface-container-highest transition-colors rounded-full p-2 relative" data-action={"openNotifications()"}>
<span className="material-symbols-outlined">notifications</span>
<span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#E4572E] border border-surface"></span>
</button>
<img className="w-9 h-10 rounded-full object-cover border border-outline-variant/40" alt="Arun Kumar Profile Picture" data-action={"window.location='/code.html'"} src="https://lh3.googleusercontent.com/aida-public/AB6AXuDXNPrDoUMs9RbNq_QWsCKuqHdut5wgiSN5WsG9rr4HeQVv6dbfo0v0GSGhS8gRf0nTJl3t_bDRsOL97IJ4eM7-_9Orl9JFxfPr1r4JqcYArptD_dlWmW_KmI7gNZJJILF-vKRxKu_ywMV5kxpo-aym3w3DSJ4nBbcEmjmVtlLlytiHPy1btyFbaJx1Lrgs2YepibWmfk0rMNSpf6nEahUpMFsixXCkpRG_U6ylFYjinUzMJQE75ctZ"/>
</div>
</header>
<div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
<div className="flex items-center justify-between">
<div>
<h2 className="text-headline-lg-mobile font-headline-lg-mobile text-primary">Performance</h2>
<p className="text-body-md font-body-md text-on-surface-variant mt-1">Your performance at a glance.</p>
</div>
<button className="bg-surface text-primary border border-primary text-body-md font-body-md font-semibold rounded-lg px-4 py-2 hover:bg-secondary-fixed transition-colors flex items-center gap-1" data-action={"toast('Report generated')"}>
<span className="material-symbols-outlined text-[18px]">download</span>Report
</button>
</div>
{/* Summary cards */}
<div className="grid grid-cols-2 gap-3">
<div className="bento-card flex flex-col">
<div className="flex items-center justify-between">
<span className="material-symbols-outlined text-secondary">schedule</span>
<span className="flex items-center gap-0.5 text-[10px] font-semibold text-[#1E8E4E] bg-[#e6f4ea] px-1.5 py-0.5 rounded-full"><span className="material-symbols-outlined text-[12px]">arrow_upward</span>5%</span>
</div>
<p className="text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider mt-2">Total Hours</p>
<p className="text-headline-lg-mobile font-headline-lg-mobile text-primary font-semibold mt-1 font-tabular-nums">44.5<span className="text-title-md font-title-md text-on-surface-variant">h</span></p>
</div>
<div className="bento-card flex flex-col">
<div className="flex items-center justify-between">
<span className="material-symbols-outlined text-secondary">how_to_reg</span>
<span className="flex items-center gap-0.5 text-[10px] font-semibold text-[#1E8E4E] bg-[#e6f4ea] px-1.5 py-0.5 rounded-full"><span className="material-symbols-outlined text-[12px]">arrow_upward</span>2%</span>
</div>
<p className="text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider mt-2">Avg. Attendance</p>
<p className="text-headline-lg-mobile font-headline-lg-mobile text-primary font-semibold mt-1 font-tabular-nums">94<span className="text-title-md font-title-md text-on-surface-variant">%</span></p>
</div>
<div className="bento-card flex flex-col">
<div className="flex items-center justify-between">
<span className="material-symbols-outlined text-secondary">payments</span>
<span className="flex items-center gap-0.5 text-[10px] font-semibold text-[#b26a00] bg-[#fff4e0] px-1.5 py-0.5 rounded-full"><span className="material-symbols-outlined text-[12px]">trending_up</span>8%</span>
</div>
<p className="text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider mt-2">Avg. Wage</p>
<p className="text-headline-lg-mobile font-headline-lg-mobile text-primary font-semibold mt-1 font-tabular-nums">₹5,100<span className="text-title-md font-title-md text-on-surface-variant">/wk</span></p>
</div>
<div className="bento-card flex flex-col">
<div className="flex items-center justify-between">
<span className="material-symbols-outlined text-secondary">local_florist</span>
<span className="flex items-center gap-0.5 text-[10px] font-semibold text-[#1E8E4E] bg-[#e6f4ea] px-1.5 py-0.5 rounded-full"><span className="material-symbols-outlined text-[12px]">arrow_upward</span>3%</span>
</div>
<p className="text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider mt-2">Shifts Completed</p>
<p className="text-headline-lg-mobile font-headline-lg-mobile text-primary font-semibold mt-1 font-tabular-nums">22<span className="text-title-md font-title-md text-on-surface-variant">/mo</span></p>
</div>
</div>
{/* Trends chart */}
<div className="bento-card">
<div className="flex items-center justify-between mb-3">
<span className="text-body-lg font-body-lg font-semibold text-on-surface">Trends</span>
<div className="flex bg-surface-container-low rounded-lg p-1">
<button className="px-3 py-1 text-label-sm font-label-sm rounded-md bg-primary text-white shadow-sm transition-all">Weekly</button>
<button className="px-3 py-1 text-label-sm font-label-sm rounded-md text-on-surface-variant transition-all" data-action={"toast('Monthly view')"}>Monthly</button>
</div>
</div>
<p className="text-label-sm font-label-sm text-on-surface-variant">Daily working hours</p>
<div className="h-40 w-full flex items-end justify-between gap-2 pt-4 relative mt-2">
<div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-6">
<div className="border-b border-outline-variant/40 w-full h-0"></div>
<div className="border-b border-outline-variant/40 w-full h-0"></div>
<div className="border-b border-outline-variant/40 w-full h-0"></div>
<div className="border-b border-outline-variant/40 w-full h-0"></div>
</div>
<div className="flex flex-col items-center flex-1 gap-2 z-10">
<div className="w-full bg-secondary-container rounded-t-sm h-[88%]"></div>
<span className="text-[10px] text-on-surface-variant">Mon</span>
</div>
<div className="flex flex-col items-center flex-1 gap-2 z-10">
<div className="w-full bg-secondary-container rounded-t-sm h-[88%]"></div>
<span className="text-[10px] text-on-surface-variant">Tue</span>
</div>
<div className="flex flex-col items-center flex-1 gap-2 z-10">
<div className="w-full bg-primary rounded-t-sm h-[92%]"></div>
<span className="text-[10px] text-on-surface-variant">Wed</span>
</div>
<div className="flex flex-col items-center flex-1 gap-2 z-10">
<div className="w-full bg-secondary-container rounded-t-sm h-[82%]"></div>
<span className="text-[10px] text-on-surface-variant">Thu</span>
</div>
<div className="flex flex-col items-center flex-1 gap-2 z-10">
<div className="w-full bg-secondary-container rounded-t-sm h-[80%]"></div>
<span className="text-[10px] text-on-surface-variant">Fri</span>
</div>
<div className="flex flex-col items-center flex-1 gap-2 z-10">
<div className="w-full bg-outline-variant/40 rounded-t-sm h-[6%]"></div>
<span className="text-[10px] text-on-surface-variant">Sat</span>
</div>
<div className="flex flex-col items-center flex-1 gap-2 z-10">
<div className="w-full bg-outline-variant/40 rounded-t-sm h-[6%]"></div>
<span className="text-[10px] text-on-surface-variant">Sun</span>
</div>
</div>
</div>
{/* Attendance insights */}
<div className="bento-card">
<div className="flex items-center justify-between mb-3">
<span className="text-body-lg font-body-lg font-semibold text-on-surface">Attendance insights</span>
<span className="text-label-sm font-label-sm text-primary font-semibold cursor-pointer" data-action={"toast('Full insights')"}>View all</span>
</div>
<div className="flex justify-between py-2 border-b border-outline-variant/30"><span className="text-body-md font-body-md text-on-surface-variant">On-time check-ins</span><span className="text-body-md font-body-md font-medium text-on-surface">17 / 18</span></div>
<div className="flex justify-between py-2 border-b border-outline-variant/30"><span className="text-body-md font-body-md text-on-surface-variant">Late arrivals</span><span className="text-body-md font-body-md font-medium text-on-surface">1 day</span></div>
<div className="flex justify-between py-2 border-b border-outline-variant/30"><span className="text-body-md font-body-md text-on-surface-variant">Overtime earned</span><span className="text-body-md font-body-md font-medium text-[#1E8E4E]">4.5 hrs · ₹675</span></div>
<div className="flex justify-between py-2"><span className="text-body-md font-body-md text-on-surface-variant">Streak</span><span className="text-body-md font-body-md font-medium text-on-surface">14 days</span></div>
</div>

{/* Self feedback */}
<div className="bento-card">
<div className="flex items-center justify-between mb-3">
<span className="text-body-lg font-body-lg font-semibold text-on-surface">Self feedback</span>
<span className="text-label-sm font-label-sm text-primary font-semibold cursor-pointer" data-action={"openFeedbackSheet()"}>Add</span>
</div>
<p className="text-body-md font-body-md text-on-surface-variant" id="fbStatus">No feedback submitted yet for this month.</p>
<p className="text-label-sm font-label-sm text-[#EA4335] font-semibold mt-2">Deadline: 2 days remaining</p>
</div>
</div>
<nav className="w-full flex justify-around items-center px-2 py-3 bg-surface border-t border-outline-variant">
<a className="flex flex-col items-center justify-center text-on-surface-variant hover:bg-surface-variant active:scale-90 duration-200 transition-all px-2 py-1 rounded-lg" href="#" data-action={"closePerformance()"}>
<span className="material-symbols-outlined">home</span>
<span className="text-label-sm font-label-sm mt-1">Home</span>
</a>
<a className="flex flex-col items-center justify-center text-on-surface-variant hover:bg-surface-variant active:scale-90 duration-200 transition-all px-2 py-1 rounded-lg" href="#" data-action={"closePerformance();openAtt()"}>
<span className="material-symbols-outlined">fingerprint</span>
<span className="text-label-sm font-label-sm mt-1">Attendance</span>
</a>
<a className="flex flex-col items-center justify-center bg-secondary-container text-on-secondary-container rounded-full px-4 py-1 hover:bg-surface-variant active:scale-90 duration-200 transition-all" href="#">
<span className="material-symbols-outlined icon-filled">monitoring</span>
<span className="text-label-sm font-label-sm text-primary font-bold">Performance</span>
</a>
<a className="flex flex-col items-center justify-center text-on-surface-variant hover:bg-surface-variant active:scale-90 duration-200 transition-all px-2 py-1 rounded-lg" href="#" data-action={"closePerformance();openRequests()"}>
<span className="material-symbols-outlined">pending_actions</span>
<span className="text-label-sm font-label-sm mt-1">Requests</span>
</a>
<a className="flex flex-col items-center justify-center text-on-surface-variant hover:bg-surface-variant active:scale-90 duration-200 transition-all px-2 py-1 rounded-lg" href="#" data-action={"openMore()"}>
<span className="material-symbols-outlined">menu</span>
<span className="text-label-sm font-label-sm mt-1">More</span>
</a>
</nav>
</div>
</div>
{/* Notifications Screen */}
<div className="fixed inset-0 z-[90] bg-surface hidden" id="notifScreen">
<div className="flex flex-col h-full">
<header className="flex items-center justify-between w-full px-4 h-16 bg-surface shadow-sm border-b border-outline-variant/40">
<div className="flex items-center gap-3">
<button className="text-on-surface hover:bg-surface-container-highest transition-colors rounded-full p-2" data-action={"closeNotifications()"}>
<span className="material-symbols-outlined">arrow_back</span>
</button>
<div className="flex flex-col">
<span className="text-title-md font-title-md font-bold text-on-surface leading-tight">Notifications</span>
<span className="text-label-sm font-label-sm text-on-surface-variant">3 new updates</span>
</div>
</div>
<button className="text-primary hover:bg-surface-container-highest transition-colors rounded-full p-2" data-action={"toast('All notifications marked as read')"}>
<span className="material-symbols-outlined">done_all</span>
</button>
</header>
<div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
<div className="flex bg-surface-container-low rounded-lg p-1" id="notifTabs">
<button className="flex-1 py-2 rounded-md text-body-md font-body-md font-semibold text-primary bg-surface shadow-sm" data-nt="all">All</button>
<button className="flex-1 py-2 rounded-md text-body-md font-body-md text-on-surface-variant" data-nt="leave">Leave</button>
<button className="flex-1 py-2 rounded-md text-body-md font-body-md text-on-surface-variant" data-nt="wage">Wage</button>
<button className="flex-1 py-2 rounded-md text-body-md font-body-md text-on-surface-variant" data-nt="overtime">Overtime</button>
<button className="flex-1 py-2 rounded-md text-body-md font-body-md text-on-surface-variant" data-nt="announcement">Alerts</button>
</div>
<div className="flex flex-col gap-2" id="notifList"></div>
</div>
</div>
</div>
{/* New Request Screen */}
<div className="fixed inset-0 z-[90] bg-surface hidden" id="newReqScreen">
<div className="flex flex-col h-full">
<header className="flex items-center justify-between w-full px-4 h-16 bg-surface shadow-sm border-b border-outline-variant/40">
<div className="flex items-center gap-3">
<button className="text-on-surface hover:bg-surface-container-highest transition-colors rounded-full p-2" data-action={"closeNewRequest()"}>
<span className="material-symbols-outlined">arrow_back</span>
</button>
<div className="flex flex-col">
<span className="text-title-md font-title-md font-bold text-on-surface leading-tight">New Request</span>
<span className="text-label-sm font-label-sm text-on-surface-variant">Raise a request for approval</span>
</div>
</div>
</header>
<div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
<div className="bento-card">
<p className="text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider mb-2">Request type</p>
<div className="grid grid-cols-2 gap-2" id="reqTypeGrid">
<button className="req-type-card active" data-type="leave">
<span className="material-symbols-outlined text-secondary">event_available</span>
<span className="text-label-sm font-label-sm text-on-surface-variant">Leave</span>
</button>
<button className="req-type-card" data-type="overtime">
<span className="material-symbols-outlined text-secondary">schedule</span>
<span className="text-label-sm font-label-sm text-on-surface-variant">Overtime</span>
</button>
<button className="req-type-card" data-type="wage">
<span className="material-symbols-outlined text-secondary">payments</span>
<span className="text-label-sm font-label-sm text-on-surface-variant">Wage</span>
</button>
<button className="req-type-card" data-type="other">
<span className="material-symbols-outlined text-secondary">more_horiz</span>
<span className="text-label-sm font-label-sm text-on-surface-variant">Other</span>
</button>
</div>
</div>
<div className="bento-card" id="reqFields">
<p className="text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider mb-2">Details</p>
<div className="flex flex-col gap-3">
<div>
<label className="text-label-sm font-label-sm text-on-surface-variant block mb-1">Leave type</label>
<select id="reqLeaveType" className="w-full bg-surface-container-low rounded-lg px-3 py-2.5 text-body-md font-body-md text-on-surface border border-outline-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30">
<option>Casual Leave</option>
<option>Sick Leave</option>
<option>Privilege Leave</option>
<option>Unpaid Leave</option>
</select>
</div>
<div className="grid grid-cols-2 gap-2">
<div>
<label className="text-label-sm font-label-sm text-on-surface-variant block mb-1">From</label>
<input type="date" value="2026-08-19" id="reqFrom" className="w-full bg-surface-container-low rounded-lg px-3 py-2.5 text-body-md font-body-md text-on-surface border border-outline-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30" />
</div>
<div>
<label className="text-label-sm font-label-sm text-on-surface-variant block mb-1">To</label>
<input type="date" value="2026-08-19" id="reqTo" className="w-full bg-surface-container-low rounded-lg px-3 py-2.5 text-body-md font-body-md text-on-surface border border-outline-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30" />
</div>
</div>
<div>
<label className="text-label-sm font-label-sm text-on-surface-variant block mb-1">Reason</label>
<textarea id="reqReason" rows="3" placeholder="Briefly describe the reason" className="w-full bg-surface-container-low rounded-lg px-3 py-2.5 text-body-md font-body-md text-on-surface border border-outline-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"></textarea>
</div>
</div>
</div>
<button className="bg-primary text-white text-body-md font-body-md font-bold rounded-lg px-4 py-3 shadow-sm hover:bg-primary-container transition-colors w-full" data-action={"submitNewRequest()"}>
Submit Request
</button>
</div>
</div>
</div>
{/* Helpdesk Screen */}
<div className="fixed inset-0 z-[90] bg-surface hidden" id="helpScreen">
<div className="flex flex-col h-full">
<header className="flex items-center justify-between w-full px-4 h-16 bg-surface shadow-sm border-b border-outline-variant/40">
<div className="flex items-center gap-3">
<button className="text-on-surface hover:bg-surface-container-highest transition-colors rounded-full p-2" data-action={"closeHelpdesk()"}>
<span className="material-symbols-outlined">arrow_back</span>
</button>
<div className="flex flex-col">
<span className="text-title-md font-title-md font-bold text-on-surface leading-tight">Helpdesk</span>
<span className="text-label-sm font-label-sm text-on-surface-variant">We're here to help</span>
</div>
</div>
</header>
<div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
<div className="bento-card bg-primary text-white border-0">
<p className="text-body-md font-body-md font-semibold opacity-90">Need assistance?</p>
<p className="text-body-md font-body-md opacity-70 mt-1">Chat with an agent or raise a ticket for any HR, payroll or IT issue.</p>
<div className="flex items-center gap-2 mt-3">
<button className="flex-1 bg-white text-primary text-body-md font-body-md font-bold rounded-lg px-4 py-2.5 hover:opacity-90 transition-opacity" data-action={"toast('Chat with agent')"}>
<span className="material-symbols-outlined text-[18px] align-middle">chat</span> Chat
</button>
<button className="flex-1 bg-white/20 text-white text-body-md font-body-md font-bold rounded-lg px-4 py-2.5 hover:bg-white/30 transition-colors" data-action={"toast('Ticket raised')"}>
<span className="material-symbols-outlined text-[18px] align-middle">confirmation_number</span> Ticket
</button>
</div>
</div>
<p className="text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider mt-1">Common topics</p>
<div className="bento-card p-0 overflow-hidden">
<div className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-surface-container-high transition-colors cursor-pointer" data-action={"toast('Payroll guide opens')"}>
<div className="flex flex-col flex-1 min-w-0">
<p className="text-body-md font-body-md font-medium text-on-surface">Payroll & wages</p>
<p className="text-label-sm font-label-sm text-on-surface-variant mt-0.5">Payslip, tax, bank details</p>
</div>
<span className="material-symbols-outlined text-on-surface-variant flex-shrink-0">chevron_right</span>
</div>
<div className="h-px bg-outline-variant/30 mx-4"></div>
<div className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-surface-container-high transition-colors cursor-pointer" data-action={"toast('Attendance guide opens')"}>
<div className="flex flex-col flex-1 min-w-0">
<p className="text-body-md font-body-md font-medium text-on-surface">Attendance & shifts</p>
<p className="text-label-sm font-label-sm text-on-surface-variant mt-0.5">Check-in, geofence, shift swap</p>
</div>
<span className="material-symbols-outlined text-on-surface-variant flex-shrink-0">chevron_right</span>
</div>
<div className="h-px bg-outline-variant/30 mx-4"></div>
<div className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-surface-container-high transition-colors cursor-pointer" data-action={"toast('Leave guide opens')"}>
<div className="flex flex-col flex-1 min-w-0">
<p className="text-body-md font-body-md font-medium text-on-surface">Leaves & requests</p>
<p className="text-label-sm font-label-sm text-on-surface-variant mt-0.5">Balance, approval, policy</p>
</div>
<span className="material-symbols-outlined text-on-surface-variant flex-shrink-0">chevron_right</span>
</div>
<div className="h-px bg-outline-variant/30 mx-4"></div>
<div className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-surface-container-high transition-colors cursor-pointer" data-action={"toast('IT support opens')"}>
<div className="flex flex-col flex-1 min-w-0">
<p className="text-body-md font-body-md font-medium text-on-surface">IT support</p>
<p className="text-label-sm font-label-sm text-on-surface-variant mt-0.5">Device, app, access issues</p>
</div>
<span className="material-symbols-outlined text-on-surface-variant flex-shrink-0">chevron_right</span>
</div>
</div>
<p className="text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider mt-1">Contact</p>
<div className="bento-card flex items-center justify-between gap-3" data-action={"toast('Dialing helpdesk')"}>
<div className="flex items-center gap-3 min-w-0">
<div className="w-10 h-10 rounded-full bg-secondary-fixed flex items-center justify-center flex-shrink-0">
<span className="material-symbols-outlined text-secondary">call</span>
</div>
<div className="flex flex-col min-w-0">
<p className="text-body-md font-body-md font-medium text-on-surface">Helpdesk line</p>
<p className="text-label-sm font-label-sm text-on-surface-variant mt-0.5 font-tabular-nums">1800-123-4567 · Mon–Sat, 9am–6pm</p>
</div>
</div>
<span className="material-symbols-outlined text-on-surface-variant flex-shrink-0">chevron_right</span>
</div>
</div>
</div>
</div>
{/* More Screen */}
<div className="fixed inset-0 z-[90] bg-surface hidden" id="moreScreen">
<div className="flex flex-col h-full">
<header className="flex items-center justify-between w-full px-4 h-16 bg-surface shadow-sm border-b border-outline-variant/40">
<div className="flex items-center gap-3">
<button className="text-on-surface hover:bg-surface-container-highest transition-colors rounded-full p-2" data-action={"closeMore()"}>
<span className="material-symbols-outlined">arrow_back</span>
</button>
<div className="flex flex-col">
<span className="text-title-md font-title-md font-bold text-on-surface leading-tight">More</span>
<span className="text-label-sm font-label-sm text-on-surface-variant">Everything else</span>
</div>
</div>
</header>
<div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
<div className="bento-card bg-primary text-white border-0 p-4">
<div className="flex items-center gap-3">
<img className="w-12 h-13 rounded-full object-cover border-2 border-white/30 flex-shrink-0" alt="Arun Kumar Profile Picture" data-action={"window.location='/code.html'"} data-alt="A highly detailed professional portrait of an Indian male software developer in his early 30s. He is wearing a clean, modern button-down shirt. The background is a bright, softly blurred tech office environment with high-key lighting. The overall mood is confident, approachable, and corporate. Modern enterprise aesthetic." src="https://lh3.googleusercontent.com/aida-public/AB6AXuDXNPrDoUMs9RbNq_QWsCKuqHdut5wgiSN5WsG9rr4HeQVv6dbfo0v0GSGhS8gRf0nTJl3t_bDRsOL97IJ4eM7-_9Orl9JFxfPr1r4JqcYArptD_dlWmW_KmI7gNZJJILF-vKRxKu_ywMV5kxpo-aym3w3DSJ4nBbcEmjmVtlLlytiHPy1btyFbaJx1Lrgs2YepibWmfk0rMNSpf6nEahUpMFsixXCkpRG_U6ylFYjinUzMJQE75ctZ"/>
<div className="flex flex-col flex-1 min-w-0">
<p className="text-body-lg font-body-lg font-semibold">Arun Kumar</p>
<p className="text-label-sm font-label-sm opacity-80 mt-0.5">OH-2041 · Software Engineer · IT</p>
</div>
<button className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 transition-colors flex items-center justify-center flex-shrink-0" data-action={"toast('Profile opens')"}>
<span className="material-symbols-outlined text-[18px]">chevron_right</span>
</button>
</div>
<div className="grid grid-cols-3 gap-2 mt-4">
<div className="rounded-lg bg-white/10 p-2.5 text-center">
<p className="text-body-md font-body-md font-bold font-tabular-nums">2</p>
<p className="text-[10px] opacity-75 mt-0.5">Years at Orchid</p>
</div>
<div className="rounded-lg bg-white/10 p-2.5 text-center">
<p className="text-body-md font-body-md font-bold font-tabular-nums">12</p>
<p className="text-[10px] opacity-75 mt-0.5">Leave balance</p>
</div>
<div className="rounded-lg bg-white/10 p-2.5 text-center">
<p className="text-body-md font-body-md font-bold font-tabular-nums">94%</p>
<p className="text-[10px] opacity-75 mt-0.5">Attendance</p>
</div>
</div>
</div>
<div>
<p className="text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider mb-2">Work</p>
<div className="bento-card p-0 overflow-hidden">
<div className="more-item" data-action={"toast('Attendance opens')"}>
<span className="more-ic bg-secondary-fixed text-secondary"><span className="material-symbols-outlined">fingerprint</span></span>
<span className="flex flex-col flex-1 min-w-0"><span className="text-body-md font-body-md font-medium text-on-surface">Attendance</span><span className="text-label-sm font-label-sm text-on-surface-variant mt-0.5">Check in, shift and history</span></span>
<span className="material-symbols-outlined text-on-surface-variant flex-shrink-0 text-[18px]">chevron_right</span>
</div>
<div className="h-px bg-outline-variant/30 mx-4"></div>
<div className="more-item" data-action={"toast('Working hours opens')"}>
<span className="more-ic bg-[#e6f4ea] text-[#1E8E4E]"><span className="material-symbols-outlined">schedule</span></span>
<span className="flex flex-col flex-1 min-w-0"><span className="text-body-md font-body-md font-medium text-on-surface">Working Hours</span><span className="text-label-sm font-label-sm text-on-surface-variant mt-0.5">Weekly and monthly hours</span></span>
<span className="material-symbols-outlined text-on-surface-variant flex-shrink-0 text-[18px]">chevron_right</span>
</div>
<div className="h-px bg-outline-variant/30 mx-4"></div>
<div className="more-item" data-action={"toast('Shift schedule opens')"}>
<span className="more-ic bg-[#fdf1e1] text-[#B26A00]"><span className="material-symbols-outlined">calendar_month</span></span>
<span className="flex flex-col flex-1 min-w-0"><span className="text-body-md font-body-md font-medium text-on-surface">My Schedule</span><span className="text-label-sm font-label-sm text-on-surface-variant mt-0.5">Upcoming shifts and swaps</span></span>
<span className="material-symbols-outlined text-on-surface-variant flex-shrink-0 text-[18px]">chevron_right</span>
</div>
</div>
</div>
<div>
<p className="text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider mb-2">Me</p>
<div className="bento-card p-0 overflow-hidden">
<div className="more-item" data-action={"openPayslips()"}>
<span className="more-ic bg-[#e6f4ea] text-[#1E8E4E]"><span className="material-symbols-outlined">receipt_long</span></span>
<span className="flex flex-col flex-1 min-w-0"><span className="text-body-md font-body-md font-medium text-on-surface">My Wages</span><span className="text-label-sm font-label-sm text-on-surface-variant mt-0.5">Payslips and wage history</span></span>
<span className="material-symbols-outlined text-on-surface-variant flex-shrink-0 text-[18px]">chevron_right</span>
</div>
<div className="h-px bg-outline-variant/30 mx-4"></div>
<div className="more-item" data-action={"openDocs()"}>
<span className="more-ic bg-secondary-fixed text-secondary"><span className="material-symbols-outlined">folder</span></span>
<span className="flex flex-col flex-1 min-w-0"><span className="text-body-md font-body-md font-medium text-on-surface">My Documents</span><span className="text-label-sm font-label-sm text-on-surface-variant mt-0.5">Identity and education proofs</span></span>
<span className="material-symbols-outlined text-on-surface-variant flex-shrink-0 text-[18px]">chevron_right</span>
</div>
<div className="h-px bg-outline-variant/30 mx-4"></div>
<div className="more-item" data-action={"toast('Profile opens')"}>
<span className="more-ic bg-[#fdf1e1] text-[#B26A00]"><span className="material-symbols-outlined">account_circle</span></span>
<span className="flex flex-col flex-1 min-w-0"><span className="text-body-md font-body-md font-medium text-on-surface">Profile</span><span className="text-label-sm font-label-sm text-on-surface-variant mt-0.5">Personal details and contact</span></span>
<span className="material-symbols-outlined text-on-surface-variant flex-shrink-0 text-[18px]">chevron_right</span>
</div>
</div>
</div>
<div>
<p className="text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider mb-2">Company</p>
<div className="bento-card p-0 overflow-hidden">
<div className="more-item" data-action={"openPolicies()"}>
<span className="more-ic bg-[#fde8e8] text-[#B3261E]"><span className="material-symbols-outlined">menu_book</span></span>
<span className="flex flex-col flex-1 min-w-0"><span className="text-body-md font-body-md font-medium text-on-surface">HR Policies</span><span className="text-label-sm font-label-sm text-on-surface-variant mt-0.5">Leave, code of conduct and more</span></span>
<span className="material-symbols-outlined text-on-surface-variant flex-shrink-0 text-[18px]">chevron_right</span>
</div>
<div className="h-px bg-outline-variant/30 mx-4"></div>
<div className="more-item" data-action={"toast('Holiday calendar opens')"}>
<span className="more-ic bg-[#e6f4ea] text-[#1E8E4E]"><span className="material-symbols-outlined">calendar_month</span></span>
<span className="flex flex-col flex-1 min-w-0"><span className="text-body-md font-body-md font-medium text-on-surface">Holiday Calendar</span><span className="text-label-sm font-label-sm text-on-surface-variant mt-0.5">Public and festival holidays</span></span>
<span className="material-symbols-outlined text-on-surface-variant flex-shrink-0 text-[18px]">chevron_right</span>
</div>
<div className="h-px bg-outline-variant/30 mx-4"></div>
<div className="more-item" data-action={"toast('Events opens')"}>
<span className="more-ic bg-[#fdf1e1] text-[#B26A00]"><span className="material-symbols-outlined">celebration</span></span>
<span className="flex flex-col flex-1 min-w-0"><span className="text-body-md font-body-md font-medium text-on-surface">Company Events</span><span className="text-label-sm font-label-sm text-on-surface-variant mt-0.5">Celebrations and birthdays</span></span>
<span className="material-symbols-outlined text-on-surface-variant flex-shrink-0 text-[18px]">chevron_right</span>
</div>
</div>
</div>
<div>
<p className="text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider mb-2">Account</p>
<div className="bento-card p-0 overflow-hidden">
<div className="more-item" data-action={"toast('Settings opens')"}>
<span className="more-ic bg-secondary-fixed text-secondary"><span className="material-symbols-outlined">settings</span></span>
<span className="flex flex-col flex-1 min-w-0"><span className="text-body-md font-body-md font-medium text-on-surface">Settings</span><span className="text-label-sm font-label-sm text-on-surface-variant mt-0.5">Language, security and more</span></span>
<span className="material-symbols-outlined text-on-surface-variant flex-shrink-0 text-[18px]">chevron_right</span>
</div>
<div className="h-px bg-outline-variant/30 mx-4"></div>
<div className="more-item" data-action={"openHelpdesk()"}>
<span className="more-ic bg-[#fdf1e1] text-[#B26A00]"><span className="material-symbols-outlined">support_agent</span></span>
<span className="flex flex-col flex-1 min-w-0"><span className="text-body-md font-body-md font-medium text-on-surface">Help & Support</span><span className="text-label-sm font-label-sm text-on-surface-variant mt-0.5">Helpdesk and common topics</span></span>
<span className="material-symbols-outlined text-on-surface-variant flex-shrink-0 text-[18px]">chevron_right</span>
</div>
</div>
</div>
<button className="flex items-center justify-center gap-2 text-[#B3261E] text-body-md font-body-md font-semibold rounded-lg px-4 py-3 border border-[#B3261E]/30 bg-[#fde8e8] hover:bg-[#fde8e8]/70 transition-colors w-full" data-action={"toast('Logged out')"}>
<span className="material-symbols-outlined text-[18px]">logout</span>Sign Out
</button>
</div>
</div>
</div>
{/* Policies Screen */}
<div className="fixed inset-0 z-[90] bg-surface hidden" id="polScreen">
<div className="flex flex-col h-full">
<header className="flex items-center justify-between w-full px-4 h-16 bg-surface shadow-sm border-b border-outline-variant/40">
<div className="flex items-center gap-3">
<button className="text-on-surface hover:bg-surface-container-highest transition-colors rounded-full p-2" data-action={"closePolicies()"}>
<span className="material-symbols-outlined">arrow_back</span>
</button>
<div className="flex flex-col">
<span className="text-title-md font-title-md font-bold text-on-surface leading-tight">HR Policies</span>
<span className="text-label-sm font-label-sm text-on-surface-variant">Company policies at a glance</span>
</div>
</div>
</header>
<div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
<div className="flex items-center gap-2 bg-surface-container-low rounded-lg px-3 py-2.5">
<span className="material-symbols-outlined text-on-surface-variant flex-shrink-0">search</span>
<input id="polSearch" data-input-action="renderPolicies(this.value)" placeholder="Search policies..." className="w-full bg-transparent text-body-md font-body-md text-on-surface placeholder:text-on-surface-variant focus:outline-none" />
</div>
<p className="text-label-sm font-label-sm text-on-surface-variant">6 policies · updated 01 Apr 2026</p>
<div className="flex flex-col gap-2" id="polList"></div>
</div>
</div>
</div>
{/* Policy Detail Screen */}
<div className="fixed inset-0 z-[90] bg-surface hidden" id="polDetailScreen">
<div className="flex flex-col h-full">
<header className="flex items-center justify-between w-full px-4 h-16 bg-surface shadow-sm border-b border-outline-variant/40">
<div className="flex items-center gap-3">
<button className="text-on-surface hover:bg-surface-container-highest transition-colors rounded-full p-2" data-action={"closePolicyDetail()"}>
<span className="material-symbols-outlined">arrow_back</span>
</button>
<div className="flex flex-col">
<span className="text-title-md font-title-md font-bold text-on-surface leading-tight" id="pdTitle">Attendance Policy</span>
<span className="text-label-sm font-label-sm text-on-surface-variant" id="pdMeta">v3.1 · Effective 01 Apr 2026</span>
</div>
</div>
</header>
<div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
<div className="bento-card">
<div className="flex items-center justify-between gap-3">
<div className="flex flex-col flex-1 min-w-0">
<p className="text-body-lg font-body-lg font-semibold text-on-surface" id="pdName">Attendance Policy</p>
<p className="text-label-sm font-label-sm text-on-surface-variant mt-0.5" id="pdVersion">v3.1 · Effective 01 Apr 2026</p>
</div>
<span className="flex-shrink-0 px-2 py-0.5 rounded-full bg-surface-container-highest text-on-surface-variant text-[10px] font-semibold" id="pdBadge">v3.1</span>
</div>
<p className="text-body-md font-body-md text-on-surface-variant mt-3" id="pdSummary"></p>
</div>
<div className="bento-card">
<p className="text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider mb-2">Document</p>
<div className="flex items-center gap-3">
<div className="w-10 h-10 rounded-lg bg-secondary-fixed text-secondary flex items-center justify-center flex-shrink-0">
<span className="material-symbols-outlined">description</span>
</div>
<div className="flex flex-col flex-1 min-w-0">
<p className="text-body-md font-body-md font-medium text-on-surface" id="pdFile">Attendance_Policy_v3.1.pdf</p>
<p className="text-label-sm font-label-sm text-on-surface-variant mt-0.5">1.2 MB</p>
</div>
<button className="text-primary hover:bg-secondary-fixed transition-colors rounded-full p-2 flex-shrink-0" data-action={"toast('Downloading ' + document.getElementById('pdFile').textContent)"}>
<span className="material-symbols-outlined">download</span>
</button>
</div>
</div>
<div className="bento-card">
<p className="text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider mb-2">Key points</p>
<div className="flex flex-col" id="pdPoints"></div>
</div>
<button className="bg-primary text-white text-body-md font-body-md font-bold rounded-lg px-4 py-3 shadow-sm hover:bg-primary-container transition-colors w-full flex items-center justify-center gap-2" data-action={"confirmPolicyRead()"}>
<span className="material-symbols-outlined text-[18px]" id="pdCheckIcon">check_circle</span>I have read this policy
</button>
</div>
</div>
</div>

   {toastMessage&&<div className="employee-react-toast" role="status" onClick={()=>setToastMessage("")}>{toastMessage}</div>}
  </div>
 </>;
}
