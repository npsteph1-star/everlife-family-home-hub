"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileText } from "lucide-react"
import type { AuditLog } from "@/types/app"

const ACTION_ICONS: Record<string, string> = {
  chore_approved: "✅", chore_denied: "❌", chore_created: "➕", chore_edited: "✏️",
  chore_deleted: "🗑️", chore_completed: "🔄",
  reward_approved: "🎁", reward_denied: "❌", reward_created: "➕", reward_deleted: "🗑️",
  reward_requested: "📬",
  economy_adjusted: "💰", settings_changed: "⚙️", pin_changed: "🔑",
  data_exported: "📤", data_imported: "📥", data_reset: "🗑️",
  member_added: "👤", member_edited: "✏️", member_deleted: "🗑️",
  calendar_created: "📅", calendar_edited: "✏️", calendar_deleted: "🗑️",
  communication_posted: "💬", routine_created: "🌅", routine_edited: "✏️",
}

const CATEGORIES: Record<string, string[]> = {
  chore: ["chore_approved","chore_denied","chore_created","chore_edited","chore_deleted","chore_completed"],
  reward: ["reward_approved","reward_denied","reward_created","reward_deleted","reward_requested"],
  economy: ["economy_adjusted"],
  settings: ["settings_changed","pin_changed","data_exported","data_imported","data_reset"],
  members: ["member_added","member_edited","member_deleted"],
}

export function AuditClient({ logs }: { logs: AuditLog[] }) {
  const [category, setCategory] = useState("all")
  const [search, setSearch] = useState("")

  const filtered = logs.filter(l => {
    if (category !== "all" && !CATEGORIES[category]?.includes(l.action)) return false
    if (search.trim()) {
      const s = search.toLowerCase()
      return l.action.includes(s) || l.detail?.toLowerCase().includes(s) || l.performed_by?.toLowerCase().includes(s)
    }
    return true
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><FileText className="h-6 w-6" /> Audit Log</h1>
        <p className="text-muted-foreground text-sm mt-1">All approvals, changes, and system events ({logs.length} total)</p>
      </div>

      <div className="space-y-3">
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Search audit log..." />
        <Tabs value={category} onValueChange={setCategory}>
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="chore">Chores</TabsTrigger>
            <TabsTrigger value="reward">Rewards</TabsTrigger>
            <TabsTrigger value="economy">Economy</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">No audit entries found.</div>
          ) : (
            <div className="divide-y">
              {filtered.map(l => (
                <div key={l.id} className="flex items-start gap-3 p-4">
                  <span className="text-lg flex-shrink-0">{ACTION_ICONS[l.action] || "📋"}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">{l.action.replace(/_/g, " ")}</span>
                      {l.performed_by && <span className="text-xs text-muted-foreground">by {l.performed_by}</span>}
                    </div>
                    {l.detail && <p className="text-sm text-muted-foreground mt-0.5 truncate">{l.detail}</p>}
                  </div>
                  <div className="text-xs text-muted-foreground flex-shrink-0">
                    {new Date(l.created_at).toLocaleDateString()} {new Date(l.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
