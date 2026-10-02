import React, { useState, useEffect, useRef } from 'react'
import { Home, LayoutGrid, FolderKanban, ListChecks, Users, BookOpen, Puzzle, BarChart3, Settings, Search, Bell, ChevronDown,
  MoreHorizontal, Pause, Play, Sparkles, Paperclip, PlusCircle, Send, Rocket, ChevronRight, X, Files, GitBranch, Blocks,
  Terminal as TermIcon, FileCode2, Globe, ArrowLeft, ArrowRight, RotateCw, Plus, SquarePlus, SquarePen, Info, Wand2, Upload, FileBarChart, ListTree, BookUp, Cable } from 'lucide-react'
import { OWNER, AGENTS, JOBS, SYSTEM, QUICK_ACTIONS, SPECIALTIES, NAV } from './data.js'
import crest from './assets/mh-crest.webp'
import portrait from './assets/builder-portrait.webp'

import art from './assets/agentArt.js'
const NAV_ICONS = [Home, LayoutGrid, FolderKanban, ListChecks, Users, BookOpen, Puzzle, BarChart3, Settings]
const QA = [[SquarePlus, '#60a5fa'], [SquarePen, '#60a5fa'], [Info, '#f5b301'], [Wand2, '#93c5fd'], [Upload, '#4ade80'], [FileBarChart, '#c084fc']]
const SP = [[ListTree, '#818cf8'], [SquarePen, '#4ade80'], [BookUp, '#f5b301'], [Wand2, '#e879f9'], [Cable, '#60a5fa']]

function Header() {
  return (
    <header className="wf-header">
      <img className="crest" src={crest} alt="MH" width="190" height="94" />
      <div className="wf-title">
        <p className="wf-kicker">{OWNER.title}</p>
        <h1>AGENT WORKFORCE</h1>
        <p className="wf-tagline">ONE VISION. MULTIPLE AGENTS. REAL RESULTS.</p>
      </div>
      <div className="wf-owner">
        <div className="wf-owner-text">
          <span className="signature">{OWNER.name}</span>
          {OWNER.roles.map((r) => <span key={r} className="owner-role">{r}</span>)}
        </div>
        <img className="portrait" src={portrait} alt={OWNER.name} width="172" height="104" />
      </div>
    </header>
  )
}

function TopNav() {
  return (
    <nav className="wf-nav" aria-label="Workforce">
      <ul>
        {NAV.map((n, i) => { const I = NAV_ICONS[i]; return (
          <li key={n}><a href="#" className="nav-link" aria-current={i === 0 ? 'page' : undefined}><I size={17} aria-hidden="true" />{n}</a></li>
        ) })}
      </ul>
      <label className="nav-search"><Search size={16} aria-hidden="true" /><span className="sr-only">Search</span>
        <input type="search" placeholder="Search agents, tasks, or projects..." /></label>
      <button className="icon-btn" aria-label="Notifications"><Bell size={19} /></button>
      <button className="avatar-btn" aria-label="Account menu"><span className="avatar-mono">MH</span><ChevronDown size={15} aria-hidden="true" /></button>
    </nav>
  )
}

function StatusPill({ status }) {
  const paused = status === 'paused'
  return (
    <span className={`status-pill ${status}`}>
      <span className="status-dot">{paused ? <Pause size={10} strokeWidth={3} /> : <Play size={10} strokeWidth={3} />}</span>
      {paused ? 'Paused' : 'Active'}
    </span>
  )
}

function AgentCard({ a, onOpen }) {
  return (
    <article className={`agent-card a-${a.id}`}>
      <button className="card-hit" onClick={() => onOpen(a)} aria-label={`Open ${a.project} workspace, ${a.role}, ${a.status}`} />
      <div className="card-head">
        <span className="card-num">{a.id}</span>
        <h2 className="card-title">{a.project}</h2>
        <button className="card-menu" aria-label={`${a.project} options`}><MoreHorizontal size={20} /></button>
      </div>
      <img className="card-art" src={art[a.id]} alt="" />
      <div className="card-foot">
        <StatusPill status={a.status} />
        <span className="card-role">{a.role}</span>
      </div>
    </article>
  )
}

function Instructions() {
  const [text, setText] = useState('')
  return (
    <section className="panel instructions" aria-labelledby="ins-h">
      <div className="panel-head">
        <h2 id="ins-h"><Sparkles size={18} className="ic-blue" aria-hidden="true" />Give Your Agent Instructions</h2>
        <label className="select sm"><span className="sr-only">Language</span><select defaultValue="English"><option>English</option><option>Español</option></select></label>
      </div>
      <label className="sr-only" htmlFor="ins-text">Instructions</label>
      <textarea id="ins-text" value={text} onChange={(e) => setText(e.target.value)} placeholder="Describe what you want this agent to do..." />
      <div className="ins-actions">
        <button className="ghost-btn"><Paperclip size={15} aria-hidden="true" />Attach File</button>
        <button className="ghost-btn"><PlusCircle size={15} aria-hidden="true" />Add Context</button>
        <label className="select"><span className="sr-only">Agent</span>
          <select defaultValue=""><option value="">Select Agent (Optional)</option>{AGENTS.map((a) => <option key={a.id}>{a.project}</option>)}</select></label>
        <button className="send-btn" disabled={!text.trim()}><Send size={16} aria-hidden="true" />Send</button>
      </div>
    </section>
  )
}

function LinkList({ title, icon: I, items, icons, action }) {
  return (
    <section className="panel list-panel">
      <div className="panel-head"><h2><I size={18} className="ic-blue" aria-hidden="true" />{title}</h2>{action}</div>
      <ul className="link-list">
        {items.map((t, i) => (
          <li key={t}><a href="#">{(() => { const [Ic, col] = icons[i % icons.length]; return <Ic size={16} className="li-ic" style={{ color: col }} aria-hidden="true" /> })()}{t}{!action && <ChevronRight size={16} className="li-cue" aria-hidden="true" />}</a></li>
        ))}
      </ul>
    </section>
  )
}

function Jobs() {
  return (
    <section className="panel jobs" aria-labelledby="jobs-h">
      <div className="panel-head"><h2 id="jobs-h"><LayoutGrid size={18} className="ic-blue" aria-hidden="true" />Recently Submitted Jobs</h2><a href="#" className="view-all">View All</a></div>
      <table>
        <thead><tr><th>ID</th><th>Agent</th><th>Title</th><th>Status</th><th>Progress</th><th>Updated</th></tr></thead>
        <tbody>
          {JOBS.map((j) => (
            <tr key={j.id}>
              <td>#{j.id}</td><td>{j.agent}</td><td className="job-title">{j.title}</td>
              <td><span className={`job-status ${j.status}`}>{j.status[0].toUpperCase() + j.status.slice(1)}</span></td>
              <td><span className="bar" role="progressbar" aria-valuenow={j.progress} aria-valuemin="0" aria-valuemax="100" aria-label={`Job ${j.id} progress`}><span style={{ width: `${j.progress}%` }} className={j.status} /></span><span className="pct">{j.progress}%</span></td>
              <td>{j.updated}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}

function SystemStatus() {
  const rows = [['Agents Online', `${SYSTEM.online}/${SYSTEM.total}`, 'ok'], ['Running Tasks', SYSTEM.running, 'info'], ['Queued Tasks', SYSTEM.queued, 'warn'], ['Completed Today', SYSTEM.completedToday, 'ok'], ['Failed Tasks', SYSTEM.failed, 'bad']]
  return (
    <section className="panel status" aria-labelledby="st-h">
      <div className="panel-head"><h2 id="st-h">System Status</h2><a href="#" className="view-all">View All</a></div>
      <ul className="status-list">{rows.map(([k, v, t]) => <li key={k}><span className={`st-dot ${t}`} aria-hidden="true" />{k}<b className={t}>{v}</b></li>)}</ul>
      <p className="st-updated">Last Updated: {SYSTEM.updated}</p>
    </section>
  )
}

const CODE = `import React from 'react'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'

export default function HeroSection() {
  return (
    <section className="relative py-20">
      <div className="container max-w-4xl mx-auto px-6">
        <h1 className="text-5xl md:text-6xl font-bold">
          Build Anything With A.S.K.
        </h1>
        <p className="mt-6 text-xl text-gray-300">
          Your AI-powered development partner.
        </p>
        <div className="mt-8 flex gap-4 justify-center">
          <Button size="lg">Start Building</Button>
          <Button variant="outline" size="lg">Watch Demo</Button>
        </div>
      </div>
    </section>
  )
}`

function WorkspacePanel({ agent, onClose }) {
  const closeRef = useRef(null)
  useEffect(() => {
    if (!agent) return
    closeRef.current && closeRef.current.focus()
    const k = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k)
  }, [agent, onClose])
  if (!agent) return null
  const files = ['HeroSection.tsx', 'Navigation.tsx', 'page.tsx']
  return (
    <div className="ws-scrim" onClick={onClose}>
      <div className="ws" role="dialog" aria-modal="true" aria-label={`${agent.project} workspace`} onClick={(e) => e.stopPropagation()}>
        <div className="ws-top">
          <button ref={closeRef} className="icon-btn" onClick={onClose} aria-label="Close workspace"><X size={18} /></button>
          <span className="ws-name">{agent.id} · {agent.project}</span>
          <div className="ws-tabs"><div role="tablist" aria-label="Open files" className="ws-tablist">{files.map((f, i) => <button key={f} role="tab" aria-selected={i === 0} className="ws-tab"><FileCode2 size={14} aria-hidden="true" />{f}</button>)}</div>
            <button className="icon-btn sm" aria-label="New tab"><Plus size={15} /></button></div>
          <StatusPill status={agent.status} />
        </div>
        <div className="ws-body">
          <nav className="ws-side" aria-label="Workspace">
            {[['Explorer', Files], ['Search', Search], ['Source Control', GitBranch], ['Run', Play], ['Extensions', Blocks], ['Settings', Settings]].map(([t, I], i) => (
              <a href="#" key={t} aria-current={i === 0 ? 'page' : undefined}><I size={16} aria-hidden="true" />{t}</a>))}
          </nav>
          <div className="ws-main">
            <pre className="ws-code" aria-label="HeroSection.tsx">{CODE.split('\n').map((l, i) => <span key={i} className="ln"><i>{i + 1}</i>{l || ' '}{'\n'}</span>)}</pre>
            <div className="ws-term">
              <div className="ws-term-tabs" role="tablist" aria-label="Panel">{['Terminal', 'Problems', 'Output', 'Debug Console'].map((t, i) => <button key={t} role="tab" className="ws-ttab" aria-selected={i === 0}>{t}</button>)}</div>
              <pre className="term-out">{`> npm run dev
> next dev
  ▲ Next.js 14.2.1
  - Local:   http://localhost:3000
  ✓ Ready in 1.2s
  ✓ Compiled / in 892ms`}</pre>
            </div>
            <label className="ws-chat"><Sparkles size={16} className="ic-blue" aria-hidden="true" /><span className="sr-only">Message the workspace</span>
              <input placeholder="Send a message to the workspace..." /><button className="send-btn sq" aria-label="Send"><Send size={16} /></button></label>
          </div>
          <div className="ws-right">
            <section><h3>Jobs</h3>{JOBS.filter((j) => j.agent === agent.project).map((j) => (
              <div key={j.id} className="ws-job"><b>#{j.id} {j.title}</b><span className="bar"><span style={{ width: `${j.progress}%` }} className={j.status} /></span></div>))}
              {!JOBS.some((j) => j.agent === agent.project) && <p className="muted">No jobs for this agent</p>}</section>
            <section className="ws-browser"><h3><Globe size={14} aria-hidden="true" />Browser</h3>
              <div className="ws-urlbar"><ArrowLeft size={14} /><ArrowRight size={14} /><RotateCw size={13} /><span>localhost:3000</span></div>
              <div className="ws-preview"><p>Preview appears when the dev server is running.</p></div></section>
          </div>
        </div>
      </div>
    </div>
  )
}

export function AgentWorkforceFront() {
  const [open, setOpen] = useState(null)
  return (
    <div className="wf">
      <Header />
      <TopNav />
      <main className="wf-grid">
        {AGENTS.slice(0, 8).map((a) => <AgentCard key={a.id} a={a} onOpen={setOpen} />)}
        <div className="row3">
          {AGENTS.slice(8).map((a) => <AgentCard key={a.id} a={a} onOpen={setOpen} />)}
          <Instructions />
          <LinkList title="Quick Actions" icon={Rocket} items={QUICK_ACTIONS} icons={QA} />
        </div>
        <div className="row4">
          <Jobs />
          <LinkList title="Agent Specialties" icon={Sparkles} items={SPECIALTIES} icons={SP} action={<a href="#" className="view-all">Edit</a>} />
          <SystemStatus />
        </div>
      </main>
      <footer className="wf-foot"><span>MARCUS HAWKINS JR'S AGENT WORKFORCE</span><span>ONE VISION. MULTIPLE AGENTS. REAL RESULTS.</span></footer>
      <WorkspacePanel agent={open} onClose={() => setOpen(null)} />
    </div>
  )
}
