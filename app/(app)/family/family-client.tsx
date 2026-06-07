"use client"

import { useState, useTransition } from "react"
import { addFamilyMember, updateFamilyMember, deleteFamilyMember } from "@/lib/actions/family"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Plus, Pencil, Trash2, Users } from "lucide-react"
import type { FamilyProfile } from "@/types/app"
import { useRouter } from "next/navigation"

const ROLES = ["Mom", "Dad", "Child", "Toddler", "Pet"]
const AVATARS = ["👩","👨","🧒","👶","👧","👦","👴","👵","🐶","🐱","🐰","🐹","🦜","🐠","🐢","🦎","🐕","🐈"]
const COLORS = ["#ef4444","#f97316","#eab308","#22c55e","#3b82f6","#a855f7","#ec4899","#6b7280"]
const ROLE_EMOJI: Record<string, string> = { Mom:"👩", Dad:"👨", Child:"🧒", Toddler:"👶", Pet:"🐾" }

interface Props { members: FamilyProfile[] }

export function FamilyClient({ members }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<FamilyProfile | null>(null)
  const [form, setForm] = useState({ name: "", role: "Child", avatar: "🧒", color: "", birthday: "" })
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  function openAdd() {
    setEditing(null)
    setForm({ name: "", role: "Child", avatar: "🧒", color: "", birthday: "" })
    setShowForm(true)
  }

  function openEdit(m: FamilyProfile) {
    setEditing(m)
    setForm({ name: m.name, role: m.role, avatar: m.avatar ?? "👤", color: m.color ?? "", birthday: m.birthday ?? "" })
    setShowForm(true)
  }

  function handleSave() {
    if (!form.name.trim()) return
    const fd = new FormData()
    fd.set("name", form.name.trim())
    fd.set("role", form.role)
    fd.set("avatar", form.avatar)
    fd.set("color", form.color)
    fd.set("birthday", form.birthday)

    startTransition(async () => {
      if (editing) {
        await updateFamilyMember(editing.id, fd)
      } else {
        await addFamilyMember(fd)
      }
      setShowForm(false)
      router.refresh()
    })
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteFamilyMember(id)
      setConfirmDelete(null)
      router.refresh()
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Users className="h-6 w-6" /> Family</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your family members and their roles</p>
        </div>
        <Button onClick={openAdd} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="h-4 w-4 mr-2" /> Add Member
        </Button>
      </div>

      {members.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-16 text-center">
            <div className="text-6xl mb-4">👨‍👩‍👧‍👦</div>
            <h3 className="text-lg font-semibold mb-2">No family members yet</h3>
            <p className="text-muted-foreground mb-4 max-w-sm">
              Start by adding yourself, then add your family members.
            </p>
            <Button onClick={openAdd} className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="h-4 w-4 mr-2" /> Add First Member
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.map(m => (
            <Card key={m.id} className="relative overflow-hidden">
              {m.color && <div className="absolute top-0 left-0 right-0 h-1" style={{ background: m.color }} />}
              <CardContent className="pt-5 pb-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="text-4xl">{m.avatar || ROLE_EMOJI[m.role] || "👤"}</div>
                    <div>
                      <div className="font-semibold text-base">{m.name}</div>
                      <Badge variant="secondary" className="text-xs mt-1">{m.role}</Badge>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(m)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500 hover:text-red-700" onClick={() => setConfirmDelete(m.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                {m.birthday && (
                  <div className="text-xs text-muted-foreground">
                    🎂 {new Date(m.birthday).toLocaleDateString("en-US", { month: "long", day: "numeric" })}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Member" : "Add Family Member"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Family member name" />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={form.role} onValueChange={v => setForm(f => ({ ...f, role: v, avatar: ROLE_EMOJI[v] || f.avatar }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ROLES.map(r => <SelectItem key={r} value={r}>{ROLE_EMOJI[r]} {r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Avatar</Label>
              <div className="flex flex-wrap gap-2">
                {AVATARS.map(a => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, avatar: a }))}
                    className={`text-2xl p-1 rounded-lg transition-all ${form.avatar === a ? "bg-emerald-100 ring-2 ring-emerald-500" : "hover:bg-gray-100"}`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex gap-2 flex-wrap">
                {COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, color: c }))}
                    className="w-7 h-7 rounded-full border-2 transition-all"
                    style={{ background: c, borderColor: form.color === c ? "#000" : "transparent" }}
                  />
                ))}
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, color: "" }))}
                  className={`w-7 h-7 rounded-full border-2 bg-gray-100 text-xs flex items-center justify-center ${!form.color ? "border-black" : "border-transparent"}`}
                >✕</button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Birthday (optional)</Label>
              <Input type="date" value={form.birthday} onChange={e => setForm(f => ({ ...f, birthday: e.target.value }))} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={pending} className="bg-emerald-600 hover:bg-emerald-700">
                {pending ? "Saving..." : editing ? "Save Changes" : "Add Member"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!confirmDelete} onOpenChange={() => setConfirmDelete(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete Member?</DialogTitle></DialogHeader>
          <p className="text-muted-foreground">This will permanently delete this family member and all their associated data.</p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => handleDelete(confirmDelete!)} disabled={pending}>
              {pending ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
