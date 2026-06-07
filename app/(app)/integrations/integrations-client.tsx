"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Zap, ExternalLink } from "lucide-react"

interface Integration { id: string; provider: string; status: string; config: unknown }
interface Props { integrations: Integration[]; householdId: string }

const INTEGRATIONS = [
  {
    provider: "google_calendar",
    name: "Google Calendar",
    icon: "📅",
    description: "Sync family events with Google Calendar. Supports two-way sync, import, and export.",
    features: ["Export Only", "Import Only", "Two-Way Sync"],
    status: "available",
    setupUrl: "/integrations/google-calendar",
  },
  {
    provider: "alexa",
    name: "Amazon Alexa",
    icon: "🔊",
    description: "Control Family Home Hub with voice commands via Alexa. Add chores, check calendars, and more.",
    features: ["Add chore", "Mark chore complete", "Check today's calendar", "Screen time balance"],
    status: "coming_soon",
  },
]

export function IntegrationsClient({ integrations, householdId }: Props) {
  const integrationMap = Object.fromEntries(integrations.map(i => [i.provider, i]))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Zap className="h-6 w-6" /> Integrations</h1>
        <p className="text-muted-foreground text-sm mt-1">Connect external services to Family Home Hub</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {INTEGRATIONS.map(i => {
          const connected = integrationMap[i.provider]
          return (
            <Card key={i.provider}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{i.icon}</span>
                    <div>
                      <CardTitle className="text-base">{i.name}</CardTitle>
                      {i.status === "coming_soon" && <Badge variant="secondary" className="text-xs mt-1">Coming Soon</Badge>}
                      {connected?.status === "active" && <Badge className="text-xs mt-1 bg-green-100 text-green-800">Connected</Badge>}
                      {!connected && i.status === "available" && <Badge variant="outline" className="text-xs mt-1">Not Connected</Badge>}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">{i.description}</p>
                <div className="flex flex-wrap gap-1.5">
                  {i.features.map(f => <Badge key={f} variant="outline" className="text-xs">{f}</Badge>)}
                </div>
                {i.status === "available" && (
                  <div className="pt-2">
                    {connected?.status === "active" ? (
                      <Button variant="outline" size="sm" asChild><a href={i.setupUrl}><ExternalLink className="h-3.5 w-3.5 mr-1" /> Manage</a></Button>
                    ) : (
                      <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" asChild><a href={i.setupUrl}>Connect {i.name}</a></Button>
                    )}
                  </div>
                )}
                {i.status === "coming_soon" && (
                  <p className="text-xs text-muted-foreground bg-gray-50 rounded-lg p-3">Alexa intent registry and household permission architecture are in place. Full Alexa skill deployment is on the roadmap.</p>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
