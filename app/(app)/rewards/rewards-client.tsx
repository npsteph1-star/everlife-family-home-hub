"use client"

import { useState, useTransition } from "react"
import { createReward, deleteReward, requestReward, approveRewardRequest, denyRewardRequest } from "@/lib/actions/rewards"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Gift, Plus, Trash2, Check, X } from "lucide-react"
import { PinModal } from "@/components/pin-modal"
import { useRouter } from "next/navigation"
import type { Reward, RewardRequest, FamilyProfile } from "@/types/app"

interface Props { rewards: Reward[]; requests: RewardRequest[]; members: FamilyProfile[] }

const blank = () => ({ title: "", description: "", cost_points: 0, cost_money: 0, cost_screen_minutes: 0, cost_tokens: 0 })

export function RewardsClient({ rewards, requests, members }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [showForm, setShowForm] = useState(false)
  const [showRequest, setShowRequest] = useState(false)
  const [form, setForm] = useState(blank())
  const [reqForm, setReqForm] = useState({ rewardId: "", memberId: "" })
  const [pinAction, setPinAction] = useState<{ type: string; id: string } | null>(null)

  const memberMap = Object.fromEntries(members.map(m => [m.id, m]))
  const rewardMap = Object.fromEntries(rewards.map(r => [r.id, r]))
  const pendingRequests = requests.filter(r => r.status === "pending")

  function handleSave() {
    if (!form.title.trim()) return
    startTransition(async () => {
      await createReward({ ...form, title: form.title.trim() })
      setShowForm(false)
      setForm(blank())
      router.refresh()
    })
  }

  function handleRequest() {
    if (!reqForm.rewardId || !reqForm.memberId) return
    startTransition(async () => {
      await requestReward(reqForm.rewardId, reqForm.memberId)
      setShowRequest(false)
      router.refresh()
    })
  }

  function pinProtected(type: string, id: string) { setPinAction({ type, id }) }

  function handlePinSuccess() {
    if (!pinAction) return
    const { type, id } = pinAction
    setPinAction(null)
    startTransition(async () => {
      if (type === "approve") await approveRewardRequest(id)
      else if (type === "deny") await denyRewardRequest(id)
      else if (type === "delete") await deleteReward(id)
      router.refresh()
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Gift className="h-6 w-6" /> Rewards</h1>
          <p className="text-muted-foreground text-sm mt-1">Create and manage family rewards</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowRequest(true)}>Request Reward</Button>
          <Button onClick={() => setShowForm(true)} className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="h-4 w-4 mr-2" /> Add Reward
          </Button>
        </div>
      </div>

      {pendingRequests.length > 0 && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h3 className="font-semibold text-purple-800 mb-3">🔔 Pending Requests ({pendingRequests.length})</h3>
          <div className="space-y-2">
            {pendingRequests.map(req => {
              const reward = rewardMap[req.reward_id]
              const member = memberMap[req.requested_by]
              return (
                <div key={req.id} className="flex items-center justify-between bg-white rounded-lg p-3 border">
                  <div>
                    <span className="font-medium text-sm">{reward?.title}</span>
                    <span className="text-muted-foreground text-xs ml-2">by {member?.name}</span>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => pinProtected("approve", req.id)}>
                      <Check className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="sm" variant="outline" className="text-red-600" onClick={() => pinProtected("deny", req.id)}>
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <Tabs defaultValue="catalog">
        <TabsList>
          <TabsTrigger value="catalog">Reward Catalog</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>
        <TabsContent value="catalog" className="mt-4">
          {rewards.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">No rewards yet. Create your first reward!</CardContent></Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {rewards.map(r => (
                <Card key={r.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold">{r.title}</h3>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-red-500" onClick={() => pinProtected("delete", r.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    {r.description && <p className="text-xs text-muted-foreground mb-3">{r.description}</p>}
                    <div className="flex flex-wrap gap-1.5">
                      {r.cost_points > 0 && <Badge variant="outline" className="text-xs">⭐ {r.cost_points}</Badge>}
                      {r.cost_money > 0 && <Badge variant="outline" className="text-xs">💰 ${r.cost_money}</Badge>}
                      {r.cost_screen_minutes > 0 && <Badge variant="outline" className="text-xs">📺 {r.cost_screen_minutes}min</Badge>}
                      {r.cost_tokens > 0 && <Badge variant="outline" className="text-xs">🪙 {r.cost_tokens}</Badge>}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        <TabsContent value="history" className="mt-4">
          <Card>
            <CardContent className="p-0">
              {requests.filter(r => r.status !== "pending").length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">No reward history yet.</div>
              ) : (
                <div className="divide-y">
                  {requests.filter(r => r.status !== "pending").map(req => (
                    <div key={req.id} className="flex items-center justify-between p-4">
                      <div>
                        <span className="font-medium text-sm">{rewardMap[req.reward_id]?.title}</span>
                        <span className="text-xs text-muted-foreground ml-2">by {memberMap[req.requested_by]?.name}</span>
                      </div>
                      <Badge variant={req.status === "approved" ? "default" : "destructive"} className="text-xs">
                        {req.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create Reward</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2"><Label>Title</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Movie night" /></div>
            <div className="space-y-2"><Label>Description (optional)</Label><Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              {[{k:"cost_points",l:"Points ⭐"},{k:"cost_money",l:"Money $ 💰"},{k:"cost_screen_minutes",l:"Screen Min 📺"},{k:"cost_tokens",l:"Tokens 🪙"}].map(({k,l})=>(
                <div key={k} className="space-y-1"><Label className="text-xs">{l}</Label>
                  <Input type="number" min={0} value={form[k as keyof typeof form]} onChange={e => setForm(f => ({...f,[k]:Number(e.target.value)}))} /></div>
              ))}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={pending} className="bg-emerald-600 hover:bg-emerald-700">Create</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showRequest} onOpenChange={setShowRequest}>
        <DialogContent>
          <DialogHeader><DialogTitle>Request a Reward</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2"><Label>Family Member</Label>
              <Select value={reqForm.memberId} onValueChange={v => setReqForm(f => ({...f,memberId:v}))}>
                <SelectTrigger><SelectValue placeholder="Select member" /></SelectTrigger>
                <SelectContent>{members.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Reward</Label>
              <Select value={reqForm.rewardId} onValueChange={v => setReqForm(f => ({...f,rewardId:v}))}>
                <SelectTrigger><SelectValue placeholder="Select reward" /></SelectTrigger>
                <SelectContent>{rewards.map(r => <SelectItem key={r.id} value={r.id}>{r.title}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowRequest(false)}>Cancel</Button>
              <Button onClick={handleRequest} disabled={pending} className="bg-emerald-600 hover:bg-emerald-700">Submit Request</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <PinModal open={!!pinAction} onClose={() => setPinAction(null)} onSuccess={handlePinSuccess} title="Parent Approval Required" />
    </div>
  )
}
