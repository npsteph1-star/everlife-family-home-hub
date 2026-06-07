"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { RotateCcw, Plus, Pencil, Trash2, X } from "lucide-react"
import { useRouter } from "next/navigation"
import type { FamilyProfile, RoutineTask } from "@/types/app"

const PERIODS = ["morning", "afternoon", "evening", "custom"] as const
const PERIOD_ICONS: Record<string, string> = { morning: "🌅", afternoon: "☀️", evening: "🌙", custom: "⚡" }
const FAITH_TASKS = ["🙏 Prayer", "📖 Devotional", "📕 Bible Reading", "🙌 Gratitude"]

type Period = "morning" | "afternoon" | "evening" | "custom"

interface RoutineRow {
  id: string
  household_id: string
  title: string
  period: Period
  assigned_to: string | null
  tasks: RoutineTask[]
  faith_enabled: boolean
  created_at: string
}

interface FormState {
  title: string
  period: Period
  assigned_to: string
  tasks: RoutineTask[]
  faith_enabled: boolean
}

const blank = (): FormState => ({ title: "", period: "morning", assigned_to: "", tasks: [], faith_enabled: false })

interface Props { routines: RoutineRow[]; members: FamilyProfile[]; faithEnabled: boolean }

export function RoutinesClient({ routines, members, faithEnabled }: Props) {
  const router = useRouter()
  const [tab, setTab] = useState("morning")
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<RoutineRow | null>(null)
  const [form, setForm] = useState<FormState>(blank())
  const [newTask, setNewTask] = useState("")

  const filtered = routines.filter(r => r.period === tab)

  function openAdd() { setEditing(null); setForm({ ...blank(), period: tab as Period }); setNewTask(""); setShowForm(true) }
  function openEdit(r: RoutineRow) {
    setEditing(r)
    setForm({ title: r.title, period: r.period, assigned_to: r.assigned_to ?? "", tasks: [...r.tasks], faith_enabled: r.faith_enabled })
    setNewTask("")
    setShowForm(true)
  }

  function addTask() {
    if (!newTask.trim()) return
    setForm(f => ({ ...f, tasks: [...f.tasks, { id: crypto.randomUUID(), label: newTask.trim(), done: false }] }))
    setNewTask("")
  }

  async function handleSave() {
    if (!form.title.trim()) return
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: memberData } = await supabase.from("household_members").select("household_id").eq("user_id", user.id).single()
    const row = memberData as { household_id: string } | null
    const hid = row?.household_id
    if (!hid) return

    if (editing) {
      await supabase.from("routines").update({
        title: form.title.trim(), period: form.period,
        assigned_to: form.assigned_to || null,
        tasks: form.tasks as unknown as Record<string, unknown>[],
        faith_enabled: form.faith_enabled
      }).eq("id", editing.id).eq("household_id", hid)
    } else {
      await supabase.from("routines").insert({
        household_id: hid, title: form.title.trim(), period: form.period,
        assigned_to: form.assigned_to || null,
        tasks: form.tasks as unknown as Record<string, unknown>[],
        faith_enabled: form.faith_enabled
      })
    }
    setShowForm(false)
    router.refresh()
  }

  async function toggleTask(routineId: string, taskId: string) {
    const supabase = createClient()
    const routine = routines.find(r => r.id === routineId)
    if (!routine) return
    const tasks: RoutineTask[] = routine.tasks.map(t => t.id === taskId ? { ...t, done: !t.done } : t)
    await supabase.from("routines").update({ tasks: tasks as unknown as Record<string, unknown>[] }).eq("id", routineId)
    router.refresh()
  }

  async function deleteRoutine(id: string) {
    const supabase = createClient()
    await supabase.from("routines").delete().eq("id", id)
    router.refresh()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><RotateCcw className="h-6 w-6" /> Routines</h1>
          <p className="text-muted-foreground text-sm mt-1">Daily routines and task checklists</p>
        </div>
        <Button onClick={openAdd} className="bg-emerald-600 hover:bg-emerald-700"><Plus className="h-4 w-4 mr-2" /> Add Routine</Button>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          {PERIODS.map(p => <TabsTrigger key={p} value={p}>{PERIOD_ICONS[p]} {p.charAt(0).toUpperCase() + p.slice(1)}</TabsTrigger>)}
        </TabsList>
      </Tabs>

      {filtered.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No {tab} routines yet.</CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map(r => {
            const done = r.tasks.filter(t => t.done).length
            return (
              <Card key={r.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold">{r.title}</h3>
                      {r.assigned_to && members.find(m => m.id === r.assigned_to) && (
                        <div className="text-xs text-muted-foreground">👤 {members.find(m => m.id === r.assigned_to)?.name}</div>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(r)}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-red-500" onClick={() => deleteRoutine(r.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </div>
                  {r.tasks.length > 0 && (
                    <>
                      <Progress value={(done / r.tasks.length) * 100} className="h-1.5 mb-3" />
                      <div className="text-xs text-muted-foreground mb-2">{done}/{r.tasks.length} tasks</div>
                      <div className="space-y-1.5">
                        {r.tasks.map(t => (
                          <button key={t.id} onClick={() => toggleTask(r.id, t.id)}
                            className={`w-full text-left flex items-center gap-2 p-2 rounded-lg text-sm transition-colors ${t.done ? "bg-emerald-50 text-emerald-700" : "hover:bg-gray-50"}`}>
                            <div className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center ${t.done ? "bg-emerald-500 border-emerald-500" : "border-gray-300"}`}>
                              {t.done && <span className="text-white text-[10px]">✓</span>}
                            </div>
                            <span className={t.done ? "line-through" : ""}>{t.label}</span>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Edit Routine" : "Add Routine"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2"><Label>Title</Label><Input value={form.title} onChange={e => setForm(f => ({...f,title:e.target.value}))} placeholder="Morning routine" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Period</Label>
                <Select value={form.period} onValueChange={v => setForm(f => ({...f,period:v as Period}))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{PERIODS.map(p => <SelectItem key={p} value={p}>{PERIOD_ICONS[p]} {p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Assign To</Label>
                <Select value={form.assigned_to} onValueChange={v => setForm(f => ({...f,assigned_to:v === "none" ? "" : v}))}>
                  <SelectTrigger><SelectValue placeholder="Anyone" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Anyone</SelectItem>
                    {members.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Tasks</Label>
              {faithEnabled && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {FAITH_TASKS.map(ft => (
                    <button key={ft} type="button" onClick={() => { if (!form.tasks.some(t => t.label === ft)) setForm(f => ({...f,tasks:[...f.tasks,{id:crypto.randomUUID(),label:ft,done:false}]})) }}
                      className="text-xs bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5 text-amber-800 hover:bg-amber-100">
                      {ft}
                    </button>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <Input value={newTask} onChange={e => setNewTask(e.target.value)} placeholder="Add task..." onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addTask())} />
                <Button type="button" variant="outline" onClick={addTask}><Plus className="h-4 w-4" /></Button>
              </div>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {form.tasks.map(t => (
                  <div key={t.id} className="flex items-center justify-between bg-gray-50 rounded px-2 py-1 text-sm">
                    <span>{t.label}</span>
                    <button onClick={() => setForm(f => ({...f,tasks:f.tasks.filter(x => x.id !== t.id)}))}><X className="h-3.5 w-3.5 text-red-500" /></button>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700">{editing ? "Save" : "Create"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
