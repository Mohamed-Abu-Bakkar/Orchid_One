import { ArrowUpRight, CalendarDays, Clock3, Flower2, Users, WalletCards } from "lucide-react";

const modules = [
  { title: "Employee directory", detail: "Profiles, employment and documents", icon: Users },
  { title: "Attendance", detail: "GPS check-in, check-out and exceptions", icon: Clock3 },
  { title: "Leave & shifts", detail: "Requests, schedules and approvals", icon: CalendarDays },
  { title: "Wage management", detail: "Hourly workforce and wage summaries", icon: WalletCards }
];

export default function Home() {
  return <main className="shell">
    <aside className="sidebar">
      <div className="brand"><span className="brand-mark"><Flower2 size={22}/></span><span>orchid<span className="brand-light"> one</span></span></div>
      <p className="nav-label">WORKSPACE</p>
      <a className="nav-item active" href="#overview">Overview</a>
      <a className="nav-item" href="#modules">HR Management</a>
      <div className="sidebar-foot"><span className="status-dot"/> Phase 1 workspace</div>
    </aside>
    <section className="content">
      <header className="topbar"><div><span className="eyebrow">ORCHID FLOWERS</span><h1>People & workforce</h1></div><div className="profile"><span className="avatar">OF</span><span>Workspace preview</span></div></header>
      <section id="overview" className="welcome"><div><span className="eyebrow light">HUMAN RESOURCE MANAGEMENT</span><h2>One place for your people.</h2><p>Manage employee records, attendance, leave, shifts and hourly workforce operations.</p></div><Flower2 className="welcome-flower" size={92}/></section>
      <div className="section-heading" id="modules"><div><span className="eyebrow">PHASE 1</span><h2>HR modules</h2></div><span className="muted">Implementation workspace</span></div>
      <div className="module-grid">{modules.map(({title,detail,icon:Icon})=><article className="module-card" key={title}><span className="module-icon"><Icon size={21}/></span><h3>{title}</h3><p>{detail}</p><span className="card-link">Module foundation <ArrowUpRight size={15}/></span></article>)}</div>
      <div className="notice"><strong>Implementation status</strong><p>This is the production application foundation. Live employee data, authentication and transactions will be enabled after the connected Convex and identity environments are configured. No demo credentials or fabricated payroll figures are used.</p></div>
      <footer>Orchid One · Phase 1 HRM · CUSP Tech</footer>
    </section>
  </main>;
}
