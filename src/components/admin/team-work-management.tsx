"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { CreatableSelect } from "@/components/admin/creatable-select";

type Tab = "overview" | "assignments" | "teams" | "recurring" | "categories";
type Priority = "low" | "normal" | "high";
type TargetType = "team" | "employee" | "employees";

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const minute = (value: string) => {
  const [h, m] = value.split(":").map(Number);
  return h * 60 + m;
};
const errorText = (error: unknown) => error instanceof Error ? error.message.replaceAll("_", " ").toLowerCase() : "Something went wrong. Please try again.";

export function TeamWorkManagement() {
  const [date, setDate] = useState(today);
  const [tab, setTab] = useState<Tab>("overview");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [assignmentOpen, setAssignmentOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<any>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Flower operations");
  const [priority, setPriority] = useState<Priority>("normal");
  const [targetType, setTargetType] = useState<TargetType>("team");
  const [target, setTarget] = useState("");
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);

  const [teamOpen, setTeamOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<any>(null);
  const [teamName, setTeamName] = useState("");
  const [teamShift, setTeamShift] = useState("");
  const [memberTeam, setMemberTeam] = useState("");
  const [members, setMembers] = useState<string[]>([]);

  const [shiftOpen, setShiftOpen] = useState(false);
  const [shiftName, setShiftName] = useState("");
  const [shiftStart, setShiftStart] = useState("08:00");
  const [shiftEnd, setShiftEnd] = useState("17:00");
  const [shiftBreak, setShiftBreak] = useState("60");

  const [categoryOpen, setCategoryOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [categoryName, setCategoryName] = useState("");

  const [frequency, setFrequency] = useState<"daily" | "weekly">("daily");
  const [weekdays, setWeekdays] = useState<number[]>([1, 2, 3, 4, 5, 6]);
  const [recurrenceEnd, setRecurrenceEnd] = useState("");

  const data = useQuery(api.teamsWork.adminWorkspace, { workDate: date });
  const account = useQuery(api.account.getMyAccountStatus, {});
  const createTeam = useMutation(api.teamsWork.createTeam);
  const saveMembers = useMutation(api.teamsWork.setTeamMembers);
  const createAssignment = useMutation(api.teamsWork.createWorkAssignment);
  const createShift = useMutation(api.teamsWork.createShift);
  const createCategory = useMutation(api.teamsWork.createWorkCategory);
  const createRecurring = useMutation(api.teamsWork.createRecurringWorkSchedule);
  const setRecurringStatus = useMutation(api.teamsWork.setRecurringWorkScheduleStatus);
  const updateTeam = useMutation(api.adminCrud.updateTeam);
  const archiveTeam = useMutation(api.adminCrud.archiveTeam);
  const updateCategory = useMutation(api.adminCrud.updateWorkCategory);
  const archiveCategory = useMutation(api.adminCrud.archiveWorkCategory);
  const updateAssignment = useMutation(api.adminCrud.updateWorkAssignment);
  const archiveAssignment = useMutation(api.adminCrud.archiveWorkAssignment);
  const reviewWork = useMutation(api.teamsWork.reviewWorkSubmission);

  const selectedTeam = data?.teams.find((item: any) => item._id === memberTeam);
  const eligibleEmployees = useMemo(
    () => data?.employees.filter((employee: any) => employee.shiftIds.includes(selectedTeam?.shiftId)) ?? [],
    [data?.employees, selectedTeam],
  );
  const filteredAssignments = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (data?.assignments ?? []).filter((item: any) => {
      const matchesSearch = !q || [item.title, item.category, item.targetName].some((v: string) => v.toLowerCase().includes(q));
      const matchesPriority = priorityFilter === "all" || item.priority === priorityFilter;
      const statuses = item.progress.map((p: any) => p.status);
      const status = statuses.length && statuses.every((s: string) => s === "completed") ? "completed"
        : statuses.some((s: string) => s === "submitted_for_review") ? "review"
        : statuses.some((s: string) => s === "in_progress") ? "in_progress" : "not_started";
      return matchesSearch && matchesPriority && (statusFilter === "all" || status === statusFilter);
    });
  }, [data?.assignments, search, priorityFilter, statusFilter]);

  async function run(action: () => Promise<unknown>, success: string) {
    setNotice("");
    try { await action(); setNotice(success); }
    catch (error) { setNotice(errorText(error)); }
  }
  function resetAssignment() {
    setEditingAssignment(null); setTitle(""); setDescription(""); setCategory("Flower operations");
    setPriority("normal"); setTargetType("team"); setTarget(""); setSelectedEmployees([]);
  }
  function openNewAssignment() { resetAssignment(); setAssignmentOpen(true); }
  function openEditAssignment(item: any) {
    setEditingAssignment(item); setTitle(item.title); setDescription(item.description ?? "");
    setCategory(item.category); setPriority(item.priority); setAssignmentOpen(true);
  }
  function resetTeam() { setEditingTeam(null); setTeamName(""); setTeamShift(""); }
  function openEditTeam(item: any) { setEditingTeam(item); setTeamName(item.name); setTeamShift(item.shiftId); setTeamOpen(true); }
  function resetCategory() { setEditingCategory(null); setCategoryName(""); }

  if (!data || account === undefined) return <section className="sec"><p className="sub">Loading work management…</p></section>;

  const teamOptions = data.teams.map((item: any) => ({ value: item._id, label: item.name + " · " + item.shiftName }));
  const employeeOptions = data.employees.map((item: any) => ({ value: item._id, label: item.name + " · " + item.employeeCode }));
  const shiftOptions = data.shifts.map((item: any) => ({ value: item._id, label: item.name }));
  const categoryOptions = [...new Set(["Flower operations", "General operations", "Inventory", "Order fulfilment", "Other", ...data.categories])]
    .map((item) => ({ value: item, label: item }));

  const stats = {
    total: data.assignments.length,
    completed: data.assignments.filter((a: any) => a.progress.length > 0 && a.progress.every((p: any) => p.status === "completed")).length,
    review: data.assignments.filter((a: any) => a.progress.some((p: any) => p.status === "submitted_for_review")).length,
    teams: data.teams.length,
  };

  return <section className="sec">
    <div className="page-head" style={{ alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
      <div><h2 className="t-h1" style={{ fontSize: 24 }}>Work assignment</h2><p className="sub">Plan daily work, manage teams and track delivery in one place.</p></div>
      <div className="row gap-2" style={{ alignItems: "center" }}>
        <label className="t-caption text-tertiary" htmlFor="work-date">Work date</label>
        <input id="work-date" className="input" type="date" value={date} onChange={(event) => { setDate(event.target.value); setMembers([]); }} />
        <button type="button" className="btn btn-primary" onClick={openNewAssignment}>+ Create assignment</button>
      </div>
    </div>

    {notice && <div className="panel panel-body mt-3" role="status" aria-live="polite">{notice}</div>}

    <nav className="row gap-2 mt-4" aria-label="Work management sections" style={{ flexWrap: "wrap", borderBottom: "1px solid var(--border, #e5e7eb)", paddingBottom: 10 }}>
      {([
        ["overview", "Overview"], ["assignments", "Assignments"], ["teams", "Teams"],
        ["recurring", "Recurring schedules"], ["categories", "Categories"],
      ] as [Tab, string][]).map(([key, label]) =>
        <button key={key} type="button" className={tab === key ? "btn btn-primary btn-sm" : "btn btn-outline btn-sm"} onClick={() => { setTab(key); setSearch(""); }}>{label}</button>
      )}
    </nav>

    {assignmentOpen && <div className="panel mt-4">
      <div className="panel-head row justify-between"><b>{editingAssignment ? "Edit assignment" : "Create assignment"}</b><button type="button" className="btn btn-outline btn-sm" onClick={() => { setAssignmentOpen(false); resetAssignment(); }}>Close</button></div>
      <form className="panel-body grid-2-equal gap-3" onSubmit={(event) => {
        event.preventDefault();
        void run(async () => {
          if (editingAssignment) {
            await updateAssignment({ assignmentId: editingAssignment._id, title, description: description.trim() || undefined, category, priority, workDate: date });
          } else {
            await createAssignment({ title, description: description.trim() || undefined, category, priority, workDate: date, targetType,
              ...(targetType === "team" ? { teamId: target as any } : targetType === "employee" ? { employeeId: target as any } : { employeeIds: selectedEmployees as any }) });
          }
          setAssignmentOpen(false); resetAssignment();
        }, editingAssignment ? "Assignment updated." : "Work assigned.");
      }}>
        <label className="policy-field">Work title<input className="input" required maxLength={120} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Prepare rose bouquets" /></label>
        <div className="col gap-2"><span className="t-caption text-tertiary">Category</span><CreatableSelect label="" value={category} options={categoryOptions} placeholder="Choose category" onChange={setCategory} createLabel="Create category" onCreate={async (value) => { await createCategory({ name: value }); setCategory(value); return { value, label: value }; }} /></div>
        <label className="policy-field">Priority<select className="input" value={priority} onChange={(e) => setPriority(e.target.value as Priority)}><option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option></select></label>
        <label className="policy-field">Description / instructions<textarea className="input" rows={3} maxLength={2000} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Add clear instructions or expected outcome" /></label>
        {!editingAssignment && <>
          <label className="policy-field">Assign to<select className="input" value={targetType} onChange={(e) => { setTargetType(e.target.value as TargetType); setTarget(""); setSelectedEmployees([]); }}><option value="team">Team</option><option value="employee">One employee</option><option value="employees">Multiple employees</option></select></label>
          {targetType === "employees" ? <div className="col gap-2"><b className="t-body-sm">Select employees</b><div style={{ maxHeight: 190, overflowY: "auto" }}>{employeeOptions.map((item: any) => <label className="row gap-2" key={item.value}><input type="checkbox" checked={selectedEmployees.includes(item.value)} onChange={(e) => setSelectedEmployees((old) => e.target.checked ? [...old, item.value] : old.filter((id) => id !== item.value))} />{item.label}</label>)}</div></div>
            : <CreatableSelect label={targetType === "team" ? "Team" : "Employee"} value={target} options={targetType === "team" ? teamOptions : employeeOptions} placeholder="Choose a target" onChange={setTarget} />}
          <p className="t-caption text-tertiary" style={{ gridColumn: "1 / -1" }}>Team assignments use that team's active members for the selected date. Make sure team membership is up to date first.</p>
        </>}
        {editingAssignment && <p className="t-caption text-tertiary">The current assignee is retained. This edit changes the task details and work date only.</p>}
        <div className="row gap-2" style={{ gridColumn: "1 / -1" }}>
          <button className="btn btn-primary" type="submit" disabled={!title.trim() || (!editingAssignment && (targetType === "employees" ? !selectedEmployees.length : !target))}>{editingAssignment ? "Save changes" : "Assign work"}</button>
          <button className="btn btn-outline" type="button" onClick={() => { setAssignmentOpen(false); resetAssignment(); }}>Cancel</button>
        </div>
      </form>
    </div>}

    {teamOpen && <div className="panel mt-4">
      <div className="panel-head row justify-between"><b>{editingTeam ? "Edit team" : "Create team"}</b><button type="button" className="btn btn-outline btn-sm" onClick={() => { setTeamOpen(false); resetTeam(); }}>Close</button></div>
      <form className="panel-body grid-2-equal gap-3" onSubmit={(event) => { event.preventDefault(); void run(async () => {
        if (editingTeam) await updateTeam({ teamId: editingTeam._id, name: teamName, shiftId: teamShift as any });
        else await createTeam({ name: teamName, shiftId: teamShift as any });
        setTeamOpen(false); resetTeam();
      }, editingTeam ? "Team updated." : "Team created."); }}>
        <label className="policy-field">Team name<input className="input" required maxLength={80} value={teamName} onChange={(e) => setTeamName(e.target.value)} placeholder="e.g. Morning packing team" /></label>
        <CreatableSelect label="Shift" value={teamShift} options={shiftOptions} placeholder="Select a shift" onChange={setTeamShift} createLabel="Create shift" onCreateRequested={() => setShiftOpen(true)} />
        <div className="row gap-2" style={{ gridColumn: "1 / -1" }}><button className="btn btn-primary" type="submit" disabled={!teamName.trim() || !teamShift}>{editingTeam ? "Save team" : "Create team"}</button><button className="btn btn-outline" type="button" onClick={() => { setTeamOpen(false); resetTeam(); }}>Cancel</button></div>
      </form>
    </div>}

    {shiftOpen && <div className="panel mt-3"><div className="panel-head"><b>New shift</b></div><div className="panel-body grid-2-equal gap-3">
      <label className="policy-field">Shift name<input className="input" value={shiftName} onChange={(e) => setShiftName(e.target.value)} placeholder="Morning shift" /></label>
      <label className="policy-field">Start time<input className="input" type="time" value={shiftStart} onChange={(e) => setShiftStart(e.target.value)} /></label>
      <label className="policy-field">End time<input className="input" type="time" value={shiftEnd} onChange={(e) => setShiftEnd(e.target.value)} /></label>
      <label className="policy-field">Break (minutes)<input className="input" type="number" min="0" max="720" value={shiftBreak} onChange={(e) => setShiftBreak(e.target.value)} /></label>
      <div className="row gap-2" style={{ gridColumn: "1 / -1" }}><button type="button" className="btn btn-primary" disabled={!shiftName.trim() || !shiftStart || !shiftEnd || minute(shiftStart) === minute(shiftEnd) || !Number.isInteger(Number(shiftBreak)) || Number(shiftBreak) < 0 || Number(shiftBreak) > 720} onClick={() => void run(async () => { const id = await createShift({ name: shiftName, startMinute: minute(shiftStart), endMinute: minute(shiftEnd), breakMinutes: Number(shiftBreak) }); setTeamShift(String(id)); setShiftOpen(false); setShiftName(""); }, "Shift created and selected.")}>Create shift</button><button type="button" className="btn btn-outline" onClick={() => setShiftOpen(false)}>Cancel</button></div>
    </div></div>}

    {categoryOpen && <div className="panel mt-4"><div className="panel-head row justify-between"><b>{editingCategory ? "Rename category" : "New category"}</b><button type="button" className="btn btn-outline btn-sm" onClick={() => { setCategoryOpen(false); resetCategory(); }}>Close</button></div>
      <form className="panel-body row gap-2" onSubmit={(event) => { event.preventDefault(); void run(async () => { if (editingCategory) await updateCategory({ categoryId: editingCategory._id, name: categoryName }); else await createCategory({ name: categoryName }); setCategoryOpen(false); resetCategory(); }, editingCategory ? "Category updated." : "Category created."); }}>
        <input className="input" required maxLength={60} value={categoryName} onChange={(e) => setCategoryName(e.target.value)} placeholder="Category name" /><button className="btn btn-primary" type="submit" disabled={!categoryName.trim()}>{editingCategory ? "Save" : "Create"}</button><button className="btn btn-outline" type="button" onClick={() => { setCategoryOpen(false); resetCategory(); }}>Cancel</button>
      </form>
    </div>}

    {tab === "overview" && <>
      <div className="grid-2-equal mt-4">
        {[[ "Assignments", stats.total ], [ "Completed", stats.completed ], [ "Awaiting review", stats.review ], [ "Active teams", stats.teams ]].map(([label, value]) => <div className="kpi card" key={label as string}><span className="kpi-label">{label}</span><span className="kpi-val">{value}</span></div>)}
      </div>
      <div className="panel mt-4"><div className="panel-head row justify-between"><b>Today's work</b><button className="btn btn-outline btn-sm" onClick={() => setTab("assignments")}>View assignments</button></div><div className="panel-body col gap-3">
        {data.assignments.slice(0, 6).map((item: any) => <div className="row justify-between gap-3" key={item._id} style={{ alignItems: "flex-start" }}><div><b>{item.title}</b><p className="t-caption text-tertiary">{item.category} · {item.targetName}</p></div><span className={"badge " + (item.priority === "high" ? "badge-warning" : "badge-neutral")}>{item.priority}</span></div>)}
        {!data.assignments.length && <p className="sub">No work assigned for this date. Create an assignment to get started.</p>}
      </div></div>
      <div className="panel mt-4"><div className="panel-head row justify-between"><b>Team snapshot</b><button className="btn btn-outline btn-sm" onClick={() => setTab("teams")}>Manage teams</button></div><div className="panel-body grid-2-equal">{data.teams.slice(0, 4).map((item: any) => <div className="card p-3" key={item._id}><b>{item.name}</b><p className="t-caption text-tertiary">{item.shiftName} · {item.members.length} members</p></div>)}{!data.teams.length && <p className="sub">No teams created yet.</p>}</div></div>
    </>}

    {tab === "assignments" && <div className="panel mt-4">
      <div className="panel-head row justify-between" style={{ flexWrap: "wrap" }}><div><b>Assignments</b><p className="t-caption text-tertiary">Create, update and track work for {date}.</p></div><button className="btn btn-primary btn-sm" onClick={openNewAssignment}>+ New assignment</button></div>
      <div className="panel-body">
        <div className="grid-2-equal gap-2 mb-3"><input className="input" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search title, category or assignee" /><select className="input" value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}><option value="all">All priorities</option><option value="high">High</option><option value="normal">Normal</option><option value="low">Low</option></select><select className="input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}><option value="all">All progress</option><option value="not_started">Not started</option><option value="in_progress">In progress</option><option value="review">Awaiting review</option><option value="completed">Completed</option></select></div>
        <div className="col gap-3">{filteredAssignments.map((item: any) => {
          const completed = item.progress.filter((p: any) => p.status === "completed").length;
          const pendingReview = item.progress.filter((p: any) => p.status === "submitted_for_review");
          return <article className="card p-3" key={item._id}>
            <div className="row justify-between gap-2" style={{ alignItems: "flex-start" }}><div><b>{item.title}</b><p className="t-caption text-tertiary">{item.category} · {item.targetName}</p></div><span className={"badge " + (item.priority === "high" ? "badge-warning" : "badge-neutral")}>{item.priority}</span></div>
            {item.description && <p className="t-body-sm mt-2">{item.description}</p>}
            <p className="t-caption text-tertiary mt-2">{completed} of {item.progress.length} completed · {pendingReview.length} awaiting review</p>
            {item.progress.map((person: any) => <div className="row justify-between gap-2 mt-2" key={person.progressId} style={{ flexWrap: "wrap" }}><span className="t-body-sm">{person.name} <span className="text-tertiary">· {person.status.replaceAll("_", " ")}</span></span>
              {person.status === "submitted_for_review" && <span className="row gap-2"><button className="btn btn-outline btn-sm" onClick={() => void run(() => reviewWork({ progressId: person.progressId, decision: "approved" }), "Submission approved.")}>Approve</button><button className="btn btn-outline btn-sm" onClick={() => { const note = window.prompt("Reason for returning this work"); if (note?.trim()) void run(() => reviewWork({ progressId: person.progressId, decision: "returned", note: note.trim() }), "Work returned for updates."); }}>Return</button></span>}
            </div>)}
            <div className="row gap-2 mt-3"><button className="btn btn-outline btn-sm" onClick={() => openEditAssignment(item)}>Edit details</button><button className="btn btn-outline btn-sm" onClick={() => { if (window.confirm("Archive this assignment? Employee progress history will be retained.")) void run(() => archiveAssignment({ assignmentId: item._id }), "Assignment archived."); }}>Archive</button></div>
          </article>;
        })}{!filteredAssignments.length && <p className="sub">No assignments match these filters.</p>}</div>
      </div>
    </div>}

    {tab === "teams" && <div className="panel mt-4">
      <div className="panel-head row justify-between"><div><b>Teams & membership</b><p className="t-caption text-tertiary">Teams group employees by shift for daily work allocation.</p></div><button className="btn btn-primary btn-sm" onClick={() => { resetTeam(); setTeamOpen(true); }}>+ Create team</button></div>
      <div className="panel-body col gap-3">
        <div className="grid-2-equal gap-3"><CreatableSelect label="Select team to manage members" value={memberTeam} options={teamOptions} placeholder="Choose team" onChange={(value) => { setMemberTeam(value); setMembers(data.memberships.filter((m: any) => m.teamId === value).map((m: any) => m.employeeId)); }} /><p className="t-caption text-tertiary">Membership is date-specific. Employees must have the team's shift on the selected work date.</p></div>
        {selectedTeam && <div className="card p-3"><div className="row justify-between"><b>{selectedTeam.name} · {selectedTeam.shiftName}</b><span className="t-caption text-tertiary">{members.length} selected</span></div>
          <div className="grid-2-equal mt-3">{eligibleEmployees.map((employee: any) => <label className="row gap-2" key={employee._id}><input type="checkbox" checked={members.includes(employee._id)} onChange={(e) => setMembers((old) => e.target.checked ? [...old, employee._id] : old.filter((id) => id !== employee._id))} />{employee.name} · {employee.employeeCode}</label>)}</div>
          {!eligibleEmployees.length && <p className="sub mt-2">No active employees are scheduled for this team's shift on the selected date.</p>}
          <button className="btn btn-primary btn-sm mt-3" onClick={() => void run(() => saveMembers({ teamId: memberTeam as any, workDate: date, employeeIds: members as any }), "Team membership saved.")}>Save membership</button>
        </div>}
        <div className="grid-2-equal">{data.teams.map((item: any) => <article className="card p-3" key={item._id}><div className="row justify-between"><b>{item.name}</b><span className="badge badge-neutral">{item.members.length} members</span></div><p className="t-caption text-tertiary">{item.shiftName}</p><p className="t-body-sm mt-2">{item.members.map((m: any) => m.name).join(", ") || "No members assigned for this date"}</p><div className="row gap-2 mt-3"><button className="btn btn-outline btn-sm" onClick={() => openEditTeam(item)}>Edit</button><button className="btn btn-outline btn-sm" onClick={() => { if (window.confirm("Archive this team? Its historical assignments will remain.")) void run(() => archiveTeam({ teamId: item._id }), "Team archived."); }}>Archive</button></div></article>)}</div>
        {!data.teams.length && <p className="sub">No teams yet. Create a team and assign a shift to begin.</p>}
      </div>
    </div>}

    {tab === "recurring" && <div className="panel mt-4">
      <div className="panel-head"><b>Recurring schedules</b><p className="t-caption text-tertiary">Automatically create assignments for a team or selected employees.</p></div>
      <div className="panel-body col gap-3">
        <form className="grid-2-equal gap-3" onSubmit={(event) => { event.preventDefault(); void run(() => createRecurring({ title, description: description.trim() || undefined, category, priority, targetType, ...(targetType === "team" ? { teamId: target as any } : targetType === "employee" ? { employeeId: target as any } : { employeeIds: selectedEmployees as any }), frequency, weekdays: frequency === "weekly" ? weekdays : undefined, startDate: date, endDate: recurrenceEnd || undefined }), "Recurring schedule created."); }}>
          <label className="policy-field">Task title<input className="input" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Recurring task name" /></label>
          <div className="col gap-2"><span className="t-caption text-tertiary">Category</span><CreatableSelect label="" value={category} options={categoryOptions} onChange={setCategory} placeholder="Choose category" createLabel="Create category" onCreate={async (value) => { await createCategory({ name: value }); return { value, label: value }; }} /></div>
          <label className="policy-field">Priority<select className="input" value={priority} onChange={(e) => setPriority(e.target.value as Priority)}><option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option></select></label>
          <label className="policy-field">Assign to<select className="input" value={targetType} onChange={(e) => { setTargetType(e.target.value as TargetType); setTarget(""); setSelectedEmployees([]); }}><option value="team">Team</option><option value="employee">One employee</option><option value="employees">Multiple employees</option></select></label>
          {targetType === "employees" ? <div className="col gap-1">{employeeOptions.map((e: any) => <label className="row gap-2" key={e.value}><input type="checkbox" checked={selectedEmployees.includes(e.value)} onChange={(event) => setSelectedEmployees((old) => event.target.checked ? [...old, e.value] : old.filter((id) => id !== e.value))} />{e.label}</label>)}</div> : <CreatableSelect label="Target" value={target} options={targetType === "team" ? teamOptions : employeeOptions} onChange={setTarget} placeholder="Select target" />}
          <label className="policy-field">Frequency<select className="input" value={frequency} onChange={(e) => setFrequency(e.target.value as "daily" | "weekly")}><option value="daily">Every day</option><option value="weekly">Selected weekdays</option></select></label>
          {frequency === "weekly" && <div className="row gap-3 wrap">{["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, index) => <label className="row gap-1" key={day}><input type="checkbox" checked={weekdays.includes(index)} onChange={(e) => setWeekdays((old) => e.target.checked ? [...old, index] : old.filter((v) => v !== index))} />{day}</label>)}</div>}
          <label className="policy-field">End date (optional)<input className="input" type="date" min={date} value={recurrenceEnd} onChange={(e) => setRecurrenceEnd(e.target.value)} /></label>
          <label className="policy-field">Description<textarea className="input" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} /></label>
          <button className="btn btn-primary" type="submit" disabled={!title.trim() || !target || (frequency === "weekly" && !weekdays.length) || Boolean(recurrenceEnd && recurrenceEnd < date)}>Create schedule</button>
        </form>
        <div className="divider" />
        <b>Active schedules</b>
        {(data.recurringSchedules ?? []).map((item: any) => <div className="card p-3 row justify-between gap-2" key={item._id}><div><b>{item.title}</b><p className="t-caption text-tertiary">{item.frequency} · Next run {item.nextRunDate}{item.endDate ? " · Ends " + item.endDate : ""}</p></div><button className="btn btn-outline btn-sm" onClick={() => void run(() => setRecurringStatus({ scheduleId: item._id, isActive: false }), "Schedule paused.")}>Pause</button></div>)}
        {!(data.recurringSchedules ?? []).length && <p className="sub">No active recurring schedules.</p>}
      </div>
    </div>}

    {tab === "categories" && <div className="panel mt-4">
      <div className="panel-head row justify-between"><div><b>Work categories</b><p className="t-caption text-tertiary">Keep work classification consistent across teams.</p></div><button className="btn btn-primary btn-sm" onClick={() => { resetCategory(); setCategoryOpen(true); }}>+ Add category</button></div>
      <div className="panel-body col gap-2">{data.categoryRecords.map((item: any) => <div className="row justify-between gap-2 card p-3" key={item._id}><span>{item.name}</span><div className="row gap-2"><button className="btn btn-outline btn-sm" onClick={() => { setEditingCategory(item); setCategoryName(item.name); setCategoryOpen(true); }}>Rename</button><button className="btn btn-outline btn-sm" onClick={() => { if (window.confirm("Archive this category? Existing assignments keep their category text.")) void run(() => archiveCategory({ categoryId: item._id }), "Category archived."); }}>Archive</button></div></div>)}
        {!data.categoryRecords.length && <p className="sub">No custom categories yet. You can still use the built-in categories when assigning work.</p>}
      </div>
    </div>}
  </section>;
}
