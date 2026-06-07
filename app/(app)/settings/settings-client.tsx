"use client"

import { useState, useTransition } from "react"
import { updateHouseholdSettings, changePinAction } from "@/lib/actions/household"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PinModal } from "@/components/pin-modal"
import { Settings, Lock, Download, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"

interface Props { household: { id: string; name: string; settings: unknown } | null; userEmail: string }

export function SettingsClient({ household, userEmail }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [unlocked, setUnlocked] = useState(false)
  const [pinOpen, setPinOpen] = useState(false)
  const [changePinOpen, setChangePinOpen] = useState(false)
  const [newPin, setNewPin] = useState("")
  const [toast, setToast] = useState("")
  const [pinError, setPinError] = useState("")

  const settings = (household?.settings ?? {}) as Record<string, unknown>
  const [form, setForm] = useState({
    workspaceName: (settings.workspaceName as string) || household?.name || "My Family",
    productName: (settings.productName as string) || "Family Home Hub",
    internalBranding: (settings.internalBranding as string) || "",
    faithEnabled: !!(settings.faithEnabled),
    babyModeEnabled: !!(settings.babyModeEnabled),
    pregnancyModeEnabled: !!(settings.pregnancyModeEnabled),
    petsEnabled: !!(settings.petsEnabled),
    allowanceMode: (settings.allowanceMode as string) || "both",
    toddlerMode: !!(settings.toddlerMode),
    aiProvider: (settings.aiProvider as string) || "none",
  })

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(""), 3000) }

  async function saveSettings() {
    startTransition(async () => {
      await updateHouseholdSettings(form)
      showToast("✅ Settings saved!")
      router.refresh()
    })
  }

  async function handleChangePin() {
    if (newPin.length < 4) { setPinError("PIN must be at least 4 digits"); return }
    setPinError("")
    const result = await changePinAction(newPin)
    if (result.error) setPinError(result.error)
    else { showToast("✅ PIN changed!"); setChangePinOpen(false); setNewPin("") }
  }

  async function handleExport() {
    const { createClient } = await import("@/lib/supabase/client")
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: member } = await supabase.from("household_members").select("household_id").eq("user_id", user.id).single()
    if (!member) return
    const hid = member.household_id

    const [{ data: fam }, { data: chores }, { data: calendar }, { data: rewards }] = await Promise.all([
      supabase.from("family_profiles").select("*").eq("household_id", hid),
      supabase.from("chores").select("*").eq("household_id", hid),
      supabase.from("calendar_events").select("*").eq("household_id", hid),
      supabase.from("rewards").select("*").eq("household_id", hid),
    ])

    const exportData = { household: household?.name, exportedAt: new Date().toISOString(), family: fam, chores, calendar, rewards }
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `family-home-hub-${new Date().toISOString().split("T")[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    showToast("✅ Data exported!")
  }

  if (!unlocked) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Settings className="h-6 w-6" /> Settings</h1>
          <p className="text-muted-foreground text-sm mt-1">Parent-protected settings</p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center py-16 gap-4">
            <div className="text-6xl">🔒</div>
            <h3 className="text-lg font-semibold">Settings are PIN-protected</h3>
            <p className="text-muted-foreground text-sm text-center max-w-sm">Enter your parent PIN to access settings.</p>
            <Button onClick={() => setPinOpen(true)} className="bg-emerald-600 hover:bg-emerald-700">
              <Lock className="h-4 w-4 mr-2" /> Enter PIN
            </Button>
          </CardContent>
        </Card>
        <PinModal open={pinOpen} onClose={() => setPinOpen(false)} onSuccess={() => { setPinOpen(false); setUnlocked(true) }} title="Enter Parent PIN" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Settings className="h-6 w-6" /> Settings</h1>
          <p className="text-muted-foreground text-sm mt-1">Workspace and household configuration</p>
        </div>
        <div className="flex items-center gap-2">
          {toast && <span className="text-sm text-emerald-600">{toast}</span>}
          <Button onClick={saveSettings} disabled={pending} className="bg-emerald-600 hover:bg-emerald-700">
            {pending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="general">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="modes">Modes</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="data">Data</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-6 space-y-4">
          <Card>
            <CardHeader><CardTitle>Workspace</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Family Name</Label>
                <Input value={form.workspaceName} onChange={e => setForm(f => ({...f,workspaceName:e.target.value}))} placeholder="The Smith Family" />
              </div>
              <div className="space-y-2">
                <Label>Product Name</Label>
                <Input value={form.productName} onChange={e => setForm(f => ({...f,productName:e.target.value}))} placeholder="Family Home Hub" />
                <p className="text-xs text-muted-foreground">Shown in the dashboard header. Default: "Family Home Hub"</p>
              </div>
              <div className="space-y-2">
                <Label>Internal Branding (optional)</Label>
                <Input value={form.internalBranding} onChange={e => setForm(f => ({...f,internalBranding:e.target.value}))} placeholder="EverLife Family Workspace" />
                <p className="text-xs text-muted-foreground">Optional internal workspace name visible only to your family.</p>
              </div>
              <div className="space-y-2">
                <Label>Allowance Mode</Label>
                <Select value={form.allowanceMode} onValueChange={v => setForm(f => ({...f,allowanceMode:v}))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="real">💵 Real Money Only</SelectItem>
                    <SelectItem value="points">⭐ Points Only</SelectItem>
                    <SelectItem value="both">💰 Both (Real + Points)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="modes" className="mt-6 space-y-4">
          <Card>
            <CardHeader><CardTitle>Feature Modes</CardTitle></CardHeader>
            <CardContent className="space-y-5">
              {[
                { key: "faithEnabled", label: "Faith Mode", desc: "Enables faith-based routine tasks (Prayer, Bible Reading, etc.)", icon: "✝️" },
                { key: "babyModeEnabled", label: "Baby Mode", desc: "Track feedings, sleep, diapers, and baby milestones", icon: "👶" },
                { key: "pregnancyModeEnabled", label: "Pregnancy Mode", desc: "Track pregnancy milestones and appointments", icon: "🤰" },
                { key: "petsEnabled", label: "Pet Mode", desc: "Track pet care, feeding schedules, and vet visits", icon: "🐾" },
                { key: "toddlerMode", label: "Toddler Mode", desc: "Simplified tap-only UI for toddler profiles", icon: "🌈" },
              ].map(({ key, label, desc, icon }) => (
                <div key={key} className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{icon} {label}</div>
                    <div className="text-sm text-muted-foreground">{desc}</div>
                  </div>
                  <Switch
                    checked={form[key as keyof typeof form] as boolean}
                    onCheckedChange={v => setForm(f => ({...f,[key]:v}))}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="mt-6 space-y-4">
          <Card>
            <CardHeader><CardTitle>PIN Management</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">The parent PIN protects settings, reward approvals, chore approvals, and economy adjustments.</p>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
                🔒 Default PIN is <strong>1234</strong>. Change it to something secure.
              </div>
              {changePinOpen ? (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>New PIN (4-6 digits)</Label>
                    <Input
                      type="number"
                      value={newPin}
                      onChange={e => setNewPin(e.target.value)}
                      maxLength={6}
                      placeholder="Enter new PIN"
                    />
                  </div>
                  {pinError && <p className="text-red-500 text-sm">{pinError}</p>}
                  <div className="flex gap-2">
                    <Button onClick={handleChangePin} className="bg-emerald-600 hover:bg-emerald-700">Change PIN</Button>
                    <Button variant="outline" onClick={() => { setChangePinOpen(false); setNewPin(""); setPinError("") }}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <Button onClick={() => setChangePinOpen(true)} variant="outline">
                  <Lock className="h-4 w-4 mr-2" /> Change Parent PIN
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Account</CardTitle></CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">Signed in as <strong>{userEmail}</strong></div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data" className="mt-6 space-y-4">
          <Card>
            <CardHeader><CardTitle>Export & Import</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Button variant="outline" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" /> Export Household Data
              </Button>
              <p className="text-xs text-muted-foreground">Downloads all your family data as a JSON backup file.</p>
            </CardContent>
          </Card>
          <Card className="border-red-200">
            <CardHeader><CardTitle className="text-red-700">⚠️ Danger Zone</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">Resetting household data is permanent and cannot be undone.</p>
              <Button variant="destructive" disabled>
                <Trash2 className="h-4 w-4 mr-2" /> Reset All Data
              </Button>
              <p className="text-xs text-muted-foreground mt-2">Contact support to reset all household data.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
