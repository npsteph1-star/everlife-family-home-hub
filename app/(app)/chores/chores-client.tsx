"use client"

import { useState, useTransition } from "react"
import { createChore, updateChore, markChoreComplete, approveChore, denyChore, deleteChore } from "@/lib/actions/chores"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CheckSquare, Plus, Pencil, Trash2, Check, X, CheckCircle } from "lucide-react"
import { PinModal } from "@/components/pin-modal"
import { useRouter } from "next/navigation"
import type { Chore, FamilyProfile } from "@/types/app"

const STATUS_COLOR: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  completed: "bg-blue-100 text-blue-800",
  approved: "bg-green-100 text-green-800",
  denied: "bg-red-100 text-red-800",
}

interface Props { chores: Chore[]; members: FamilyProfile[] }

const blank = () => ({ title: "", description: "", assigned_to: "", frequency: "once", reward_points: 0, reward_money: 0, reward_screen_minutes: 0, reward_tokens: 0 })

export function ChoresClient({ chores, members }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [tab, setTab] = useState("all")
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Chore | null>(null)
  const [form, setForm] = useState(blank())
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [pinAction, setPinAction] = useState<{ type: string; id: string } | null>(null)

  const filtered = tab === "all" ? chores : chores.filter(c => c.status === tab)
  const memberMap = Object.fromEntries(members.map(m => [m.id, m]))

  function openAdd() { setEditing(null); setForm(blank()); setShowForm(true) }
  function openEdit(c: Chore) {
    setEditing(c)
    setForm({ title: c.title, description: c.description ?? "", assigned_to: c.assigned_to ?? "", frequency: c.frequency, reward_points: c.reward_points, reward_money: c.reward_money, reward_screen_minutes: c.reward_screen_minutes, reward_tokens: c.reward_tokens })
    setShowForm(true)
  }

  function handleSave() {
    if (!form.title.trim()) return
    startTransition(async () => {
      if (editing) {
        await updateChore(editing.id, { ...form, title: form.title.trim(), assigned_to: form.assigned_to || undefined })
      } else {
        await createChore({ ...form, title: form.title.trim(), assigned_to: form.assigned_to || undefined })
      }
      setShowForm(false)
      router.refresh()
    })
  }

  function pinProtected(type: string, id: string) { setPinAction({ type, id }) }

  function handlePinSuccess() {
    if (!pinAction) return
    const { type, id } = pinAction
    setPinAction(null)
    startTransition(async () => {
      if (type === "approve") await approveChore(id)
      else if (type === "deny") await denyChore(id)
      else if (type === "delete") await deleteChore(id)
      router.refresh()
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><CheckSquare className="h-6 w-6" /> Chores</h1>
          <p className="text-muted-foreground text-sm mt-1">Create, assign, and track family chores</p>
        </div>
        <Button onClick={openAdd} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="h-4 w-4 mr-2" /> Add Chore
        </Button>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
        </TabsList>
      </Tabs>

      {filtered.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No chores found. Add your first chore!</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(c => (
            <Card key={c.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold">{c.title}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[c.status]}`}>{c.status}</span>
                      <Badge variant="outline" className="text-xs">{c.frequency}</Badge>
                    </div>
                    {c.description && <p className="text-sm text-muted-foreground mt-1">{c.description}</p>}
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
                      {c.assigned_to && memberMap[c.assigned_to] && (
                        <span>👤 {memberMap[c.assigned_to].name}</span>
                      )}
                      {c.reward_points > 0 && <span>⭐ {c.reward_points} pts</span>}
                      {c.reward_money > 0 && <span>💰 ${c.reward_money}</span>}
                      {c.reward_screen_minutes > 0 && <span>📺 {c.reward_screen_minutes}min</span>}
                      {c.reward_tokens > 0 && <span>🪙 {c.reward_tokens} tokens</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {c.status === "pending" && (
                      <Button size="sm" variant="outline" onClick={() => startTransition(() => markChoreComplete(c.id).then(() => router.refresh()))}>
                        <CheckCircle className="h-4 w-4 mr-1" /> Done
                      </Button>
                    )}
                    {c.status === "completed" && (
                      <>
                        <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => pinProtected("approve", c.id)}>
                          <Check className="h-4 w-4 mr-1" /> Approve
                        </Button>
                        <Button size="sm" variant="outline" className="text-red-600" onClick={() => pinProtected("deny", c.id)}>
                          <X className="h-4 w-4 mr-1" /> Deny
                        </Button>
                      </>
                    )}
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(c)}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500" onClick={() => pinProtected("delete", c.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Edit Chore" : "Add Chore"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Clean your room" />
            </div>
            <div className="space-y-2">
              <Label>Description (optional)</Label>
              <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Details..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Assign To</Label>
                <Select value={form.assigned_to} onValueChange={v => setForm(f => ({ ...f, assigned_to: v === "none" ? "" : v }))}>
                  <SelectTrigger><SelectValue placeholder="Anyone" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Anyone</SelectItem>
                    {members.filter(m => m.role !== "Pet").map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Frequency</Label>
                <Select value={form.frequency} onValueChange={v => setForm(f => ({ ...f, frequency: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="once">Once</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="mb-2 block">Rewards</Label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: "reward_points", label: "Points ⭐" },
                  { key: "reward_money", label: "Money $ 💰" },
                  { key: "reward_screen_minutes", label: "Screen Min 📺" },
                  { key: "reward_tokens", label: "Tokens 🪙" },
                ].map(({ key, label }) => (
                  <div key={key} className="space-y-1">
                    <Label className="text-xs">{label}</Label>
                    <Input type="number" min={0} value={form[key as keyof typeof form]} onChange={e => setForm(f => ({ ...f, [key]: Number(e.target.value) }))} />
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={pending} className="bg-emerald-600 hover:bg-emerald-700">
                {pending ? "Saving..." : editing ? "Save Changes" : "Add Chore"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <PinModal
        open={!!pinAction}
        onClose={() => setPinAction(null)}
        onSuccess={handlePinSuccess}
        title={pinAction?.type === "approve" ? "Approve Chore" : pinAction?.type === "deny" ? "Deny Chore" : "Delete Chore"}
      />
    </div>
  )
}
