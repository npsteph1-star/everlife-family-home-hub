"use client"

import { useState, useTransition } from "react"
import { adjustBalance } from "@/lib/actions/economy"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { PinModal } from "@/components/pin-modal"
import { DollarSign, Plus, Minus } from "lucide-react"
import { useRouter } from "next/navigation"
import type { FamilyProfile, EconomyBalance, EconomyTransaction } from "@/types/app"

const CURRENCIES = [
  { key: "points", label: "Points", icon: "⭐", color: "bg-yellow-50 text-yellow-800 border-yellow-200" },
  { key: "money", label: "Money ($)", icon: "💰", color: "bg-green-50 text-green-800 border-green-200" },
  { key: "screen_minutes", label: "Screen Min", icon: "📺", color: "bg-blue-50 text-blue-800 border-blue-200" },
  { key: "tokens", label: "Tokens", icon: "🪙", color: "bg-purple-50 text-purple-800 border-purple-200" },
]

interface Props {
  members: FamilyProfile[]
  balances: EconomyBalance[]
  transactions: EconomyTransaction[]
}

export function EconomyClient({ members, balances, transactions }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [showAdjust, setShowAdjust] = useState(false)
  const [pinOpen, setPinOpen] = useState(false)
  const [adjustForm, setAdjustForm] = useState({ memberId: "", currency: "points", amount: "", reason: "", isAdd: true })
  const [pendingAdjust, setPendingAdjust] = useState<typeof adjustForm | null>(null)

  const balanceMap = Object.fromEntries(balances.map(b => [b.member_id, b]))
  const memberMap = Object.fromEntries(members.map(m => [m.id, m]))

  function openAdjust(memberId: string, isAdd: boolean) {
    setAdjustForm({ memberId, currency: "points", amount: "", reason: "", isAdd })
    setShowAdjust(true)
  }

  function submitAdjust() {
    if (!adjustForm.amount || isNaN(Number(adjustForm.amount))) return
    setPendingAdjust(adjustForm)
    setShowAdjust(false)
    setPinOpen(true)
  }

  function confirmAdjust() {
    if (!pendingAdjust) return
    const amount = pendingAdjust.isAdd ? Math.abs(Number(pendingAdjust.amount)) : -Math.abs(Number(pendingAdjust.amount))
    startTransition(async () => {
      await adjustBalance(pendingAdjust.memberId, pendingAdjust.currency, amount, pendingAdjust.reason || (pendingAdjust.isAdd ? "Manual add" : "Manual deduction"))
      setPendingAdjust(null)
      router.refresh()
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><DollarSign className="h-6 w-6" /> Economy</h1>
        <p className="text-muted-foreground text-sm mt-1">Family balances, allowance tracking, and transaction history</p>
      </div>

      <Tabs defaultValue="balances">
        <TabsList>
          <TabsTrigger value="balances">Balances</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="balances" className="space-y-4 mt-4">
          {members.map(m => {
            const bal = balanceMap[m.id]
            return (
              <Card key={m.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{m.avatar || "👤"}</span>
                      <div>
                        <div className="font-semibold">{m.name}</div>
                        <div className="text-xs text-muted-foreground">{m.role}</div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => openAdjust(m.id, true)}>
                        <Plus className="h-3.5 w-3.5 mr-1" /> Add
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => openAdjust(m.id, false)}>
                        <Minus className="h-3.5 w-3.5 mr-1" /> Deduct
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {CURRENCIES.map(({ key, label, icon, color }) => (
                      <div key={key} className={`rounded-lg border p-3 text-center ${color}`}>
                        <div className="text-xl mb-1">{icon}</div>
                        <div className="font-bold text-lg">{key === "money" ? `$${bal?.[key as keyof typeof bal] ?? 0}` : (bal?.[key as keyof typeof bal] ?? 0)}</div>
                        <div className="text-xs">{label}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <Card>
            <CardContent className="p-0">
              {transactions.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">No transactions yet.</div>
              ) : (
                <div className="divide-y">
                  {transactions.map(t => (
                    <div key={t.id} className="flex items-center justify-between p-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span>{t.type === "add" ? "➕" : "➖"}</span>
                          <span className="font-medium text-sm">{t.type === "add" ? "+" : "-"}{Math.abs(t.amount)} {t.currency}</span>
                          <span className="text-xs text-muted-foreground">{memberMap[t.member_id]?.name}</span>
                        </div>
                        {t.reason && <div className="text-xs text-muted-foreground mt-0.5 ml-6">{t.reason}</div>}
                      </div>
                      <div className="text-xs text-muted-foreground">{new Date(t.created_at).toLocaleDateString()}</div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showAdjust} onOpenChange={setShowAdjust}>
        <DialogContent>
          <DialogHeader><DialogTitle>{adjustForm.isAdd ? "➕ Add Balance" : "➖ Deduct Balance"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Currency</Label>
              <Select value={adjustForm.currency} onValueChange={v => setAdjustForm(f => ({ ...f, currency: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CURRENCIES.map(c => <SelectItem key={c.key} value={c.key}>{c.icon} {c.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Amount</Label><Input type="number" min={0} value={adjustForm.amount} onChange={e => setAdjustForm(f => ({ ...f, amount: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Reason (optional)</Label><Input value={adjustForm.reason} onChange={e => setAdjustForm(f => ({ ...f, reason: e.target.value }))} /></div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAdjust(false)}>Cancel</Button>
              <Button onClick={submitAdjust} className={adjustForm.isAdd ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700"}>Continue (PIN required)</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <PinModal open={pinOpen} onClose={() => { setPinOpen(false); setPendingAdjust(null) }} onSuccess={() => { setPinOpen(false); confirmAdjust() }} title="Confirm Balance Adjustment" />
    </div>
  )
}
