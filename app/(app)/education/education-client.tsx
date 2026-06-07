"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Plus, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import type { EducationItem, FamilyProfile } from "@/types/app"

const SUBJECTS = ["Math","Reading","Science","History","Art","Music","PE","Language Arts","Bible","Other"]
const STATUS_COLOR: Record<string, string> = { todo: "bg-gray-100 text-gray-700", in_progress: "bg-blue-100 text-blue-700", done: "bg-green-100 text-green-700" }

interface Props { items: EducationItem[]; members: FamilyProfile[] }

export function EducationClient({ items, members }: Props) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [formType, setFormType] = useState<"assignment" | "goal" | "reading">("assignment")
  const [form, setForm] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  async function getHid() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    const { data } = await supabase.from("household_members").select("household_id").eq("user_id", user.id).single()
    return data?.household_id ?? null
  }

  function openAdd(type: typeof formType) {
    setFormType(type)
    const today = new Date().toISOString().split("T")[0]
    if (type === "assignment") setForm({ member_id: "", subject: "Math", title: "", due_date: today, status: "todo", notes: "" })
    if (type === "goal") setForm({ member_id: "", subject: "Math", title: "", target_date: "", notes: "" })
    if (type === "reading") setForm({ member_id: "", title: "", notes: "" })
    setShowForm(true)
  }

  async function handleSave() {
    if (!form.title?.trim()) return
    setLoading(true)
    const supabase = createClient()
    const hid = await getHid()
    if (hid) {
      await supabase.from("education_items").insert({
        household_id: hid,
        type: formType,
        member_id: form.member_id || null,
        title: form.title.trim(),
        subject: form.subject || null,
        status: form.status || null,
        due_date: form.due_date || form.target_date || null,
        notes: form.notes || null,
        completed: false,
      })
    }
    setShowForm(false)
    router.refresh()
    setLoading(false)
  }

  async function cycleStatus(item: EducationItem) {
    const supabase = createClient()
    const next = { todo: "in_progress", in_progress: "done", done: "todo" }[item.status ?? "todo"] ?? "todo"
    await supabase.from("education_items").update({ status: next, completed: next === "done" }).eq("id", item.id)
    router.refresh()
  }

  async function deleteItem(id: string) {
    const supabase = createClient()
    await supabase.from("education_items").delete().eq("id", id)
    router.refresh()
  }

  const memberMap = Object.fromEntries(members.map(m => [m.id, m]))
  const assignments = items.filter(i => i.type === "assignment")
  const goals = items.filter(i => i.type === "goal")
  const readings = items.filter(i => i.type === "reading")

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><BookOpen className="h-6 w-6" /> Education</h1>
          <p className="text-muted-foreground text-sm mt-1">Assignments, learning goals, and reading logs</p>
        </div>
      </div>

      <Tabs defaultValue="assignments">
        <TabsList>
          <TabsTrigger value="assignments">📚 Assignments</TabsTrigger>
          <TabsTrigger value="goals">🎯 Goals</TabsTrigger>
          <TabsTrigger value="reading">📖 Reading Log</TabsTrigger>
        </TabsList>

        {([
          { key: "assignments", items: assignments, type: "assignment" as const, label: "Assignment" },
          { key: "goals", items: goals, type: "goal" as const, label: "Goal" },
          { key: "reading", items: readings, type: "reading" as const, label: "Reading" },
        ] as const).map(({ key, items: list, type, label }) => (
          <TabsContent key={key} value={key} className="mt-4 space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => openAdd(type)} className="bg-emerald-600 hover:bg-emerald-700">
                <Plus className="h-4 w-4 mr-2" /> Add {label}
              </Button>
            </div>
            {list.length === 0 ? (
              <Card><CardContent className="py-12 text-center text-muted-foreground">No {key} yet.</CardContent></Card>
            ) : (
              <div className="space-y-2">
                {list.map(item => (
                  <Card key={item.id}>
                    <CardContent className="p-3 flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm">{item.title}</span>
                          {item.subject && <Badge variant="outline" className="text-xs">{item.subject}</Badge>}
                          {item.status && (
                            <button onClick={() => cycleStatus(item)} className={`text-xs px-2 py-0.5 rounded-full font-medium cursor-pointer ${STATUS_COLOR[item.status]}`}>
                              {item.status.replace("_", " ")}
                            </button>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5 flex gap-2">
                          {item.member_id && memberMap[item.member_id] && <span>👤 {memberMap[item.member_id].name}</span>}
                          {item.due_date && <span>📅 {new Date(item.due_date + "T12:00:00").toLocaleDateString()}</span>}
                        </div>
                      </div>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-red-500" onClick={() => deleteItem(item.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add {formType === "assignment" ? "Assignment" : formType === "goal" ? "Learning Goal" : "Reading Log"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2"><Label>Title</Label><Input value={form.title ?? ""} onChange={e => setForm(f => ({...f,title:e.target.value}))} /></div>
            {members.length > 0 && (
              <div className="space-y-2"><Label>Student</Label>
                <Select value={form.member_id ?? ""} onValueChange={v => setForm(f => ({...f,member_id:v}))}>
                  <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Anyone</SelectItem>
                    {members.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            {(formType === "assignment" || formType === "goal") && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Subject</Label>
                  <Select value={form.subject ?? "Math"} onValueChange={v => setForm(f => ({...f,subject:v}))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{SUBJECTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>{formType === "assignment" ? "Due Date" : "Target Date"}</Label>
                  <Input type="date" value={form.due_date ?? form.target_date ?? ""} onChange={e => setForm(f => ({...f,due_date:e.target.value,target_date:e.target.value}))} />
                </div>
              </div>
            )}
            <div className="space-y-2"><Label>Notes (optional)</Label><Input value={form.notes ?? ""} onChange={e => setForm(f => ({...f,notes:e.target.value}))} /></div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={loading} className="bg-emerald-600 hover:bg-emerald-700">Add</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
