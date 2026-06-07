"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { MessageSquare, Plus, Trash2, Pin } from "lucide-react"
import { useRouter } from "next/navigation"
import type { Announcement, BrainDumpEntry, FamilyProfile } from "@/types/app"

interface Props { announcements: Announcement[]; brainDump: BrainDumpEntry[]; members: FamilyProfile[] }

export function CommunicationClient({ announcements, brainDump, members }: Props) {
  const router = useRouter()
  const [showAnnForm, setShowAnnForm] = useState(false)
  const [showBdForm, setShowBdForm] = useState(false)
  const [annForm, setAnnForm] = useState({ title: "", body: "", pinned: false })
  const [bdForm, setBdForm] = useState({ content: "" })
  const [loading, setLoading] = useState(false)

  async function getHid() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    const { data } = await supabase.from("household_members").select("household_id").eq("user_id", user.id).single()
    return data?.household_id ?? null
  }

  async function saveAnn() {
    if (!annForm.title.trim()) return
    setLoading(true)
    const supabase = createClient()
    const hid = await getHid()
    if (hid) await supabase.from("announcements").insert({ household_id: hid, ...annForm, title: annForm.title.trim() })
    setShowAnnForm(false)
    setAnnForm({ title: "", body: "", pinned: false })
    router.refresh()
    setLoading(false)
  }

  async function saveBd() {
    if (!bdForm.content.trim()) return
    setLoading(true)
    const supabase = createClient()
    const hid = await getHid()
    if (hid) await supabase.from("brain_dump").insert({ household_id: hid, content: bdForm.content.trim() })
    setShowBdForm(false)
    setBdForm({ content: "" })
    router.refresh()
    setLoading(false)
  }

  async function togglePin(id: string, pinned: boolean) {
    const supabase = createClient()
    await supabase.from("announcements").update({ pinned: !pinned }).eq("id", id)
    router.refresh()
  }

  async function deleteAnn(id: string) {
    const supabase = createClient()
    await supabase.from("announcements").delete().eq("id", id)
    router.refresh()
  }

  async function deleteBd(id: string) {
    const supabase = createClient()
    await supabase.from("brain_dump").delete().eq("id", id)
    router.refresh()
  }

  const sorted = [...announcements].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><MessageSquare className="h-6 w-6" /> Communication</h1>
        <p className="text-muted-foreground text-sm mt-1">Announcements and family brain dump</p>
      </div>

      <Tabs defaultValue="announcements">
        <TabsList>
          <TabsTrigger value="announcements">📢 Announcements</TabsTrigger>
          <TabsTrigger value="braindump">🧠 Brain Dump</TabsTrigger>
        </TabsList>

        <TabsContent value="announcements" className="mt-4 space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setShowAnnForm(true)} className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="h-4 w-4 mr-2" /> Add Announcement
            </Button>
          </div>
          {sorted.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">No announcements yet.</CardContent></Card>
          ) : (
            <div className="space-y-3">
              {sorted.map(a => (
                <Card key={a.id} className={a.pinned ? "border-amber-300 bg-amber-50" : ""}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {a.pinned && <span className="text-amber-600">📌</span>}
                          <h3 className="font-semibold">{a.title}</h3>
                        </div>
                        {a.body && <p className="text-sm text-muted-foreground">{a.body}</p>}
                        <div className="text-xs text-muted-foreground mt-2">{new Date(a.created_at).toLocaleDateString()}</div>
                      </div>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" className={`h-7 w-7 ${a.pinned ? "text-amber-600" : ""}`} onClick={() => togglePin(a.id, a.pinned)}>
                          <Pin className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-red-500" onClick={() => deleteAnn(a.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="braindump" className="mt-4 space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setShowBdForm(true)} className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="h-4 w-4 mr-2" /> Add Note
            </Button>
          </div>
          {brainDump.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">Brain dump is empty. Dump your thoughts here!</CardContent></Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {brainDump.map(b => (
                <Card key={b.id} className="bg-yellow-50 border-yellow-200">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm flex-1 whitespace-pre-wrap">{b.content}</p>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-red-500 flex-shrink-0" onClick={() => deleteBd(b.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                    <div className="text-xs text-muted-foreground mt-2">{new Date(b.created_at).toLocaleDateString()}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={showAnnForm} onOpenChange={setShowAnnForm}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Announcement</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2"><Label>Title</Label><Input value={annForm.title} onChange={e => setAnnForm(f => ({...f,title:e.target.value}))} /></div>
            <div className="space-y-2"><Label>Body (optional)</Label>
              <textarea className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[80px] resize-none" value={annForm.body} onChange={e => setAnnForm(f => ({...f,body:e.target.value}))} />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={annForm.pinned} onChange={e => setAnnForm(f => ({...f,pinned:e.target.checked}))} className="rounded" />
              <span className="text-sm">📌 Pin announcement</span>
            </label>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAnnForm(false)}>Cancel</Button>
              <Button onClick={saveAnn} disabled={loading} className="bg-emerald-600 hover:bg-emerald-700">Post</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showBdForm} onOpenChange={setShowBdForm}>
        <DialogContent>
          <DialogHeader><DialogTitle>Brain Dump</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2"><Label>What's on your mind?</Label>
              <textarea className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[100px] resize-none" value={bdForm.content} onChange={e => setBdForm({ content: e.target.value })} placeholder="Dump it all here..." />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowBdForm(false)}>Cancel</Button>
              <Button onClick={saveBd} disabled={loading} className="bg-emerald-600 hover:bg-emerald-700">Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
