"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ExternalLink, RefreshCw, CheckCircle, AlertCircle } from "lucide-react"

interface Integration { id: string; provider: string; status: string; config: unknown }
interface Props { integration: Integration | null; isConfigured: boolean }

export function GoogleCalendarClient({ integration, isConfigured }: Props) {
  const [syncMode, setSyncMode] = useState("export_only")
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<string | null>(null)

  const isConnected = integration?.status === "active"

  async function handleConnect() {
    const res = await fetch("/api/google/auth-url")
    const { url } = await res.json()
    window.location.href = url
  }

  async function handleDisconnect() {
    await fetch("/api/google/disconnect", { method: "POST" })
    window.location.reload()
  }

  async function handleSync() {
    setSyncing(true)
    setSyncResult(null)
    try {
      const res = await fetch("/api/google/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ syncMode }),
      })
      const data = await res.json()
      setSyncResult(data.message || "Sync complete!")
    } catch {
      setSyncResult("Sync failed. Please try again.")
    } finally {
      setSyncing(false)
    }
  }

  if (!isConfigured) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">📅 Google Calendar Integration</h1>
        </div>
        <Alert className="border-amber-200 bg-amber-50">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            <strong>Configuration Required</strong><br />
            Add <code>GOOGLE_CLIENT_ID</code> and <code>GOOGLE_CLIENT_SECRET</code> to your environment.
          </AlertDescription>
        </Alert>
        <Card>
          <CardHeader><CardTitle>Setup Instructions</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
              <li>Go to <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Google Cloud Console <ExternalLink className="h-3 w-3 inline" /></a></li>
              <li>Create or select a project and enable the Google Calendar API</li>
              <li>Create OAuth 2.0 credentials (Web application)</li>
              <li>Add redirect URI: <code className="bg-gray-100 px-1 rounded">{typeof window !== "undefined" ? window.location.origin : "https://yourdomain.com"}/api/google/callback</code></li>
              <li>Add env vars to Vercel: <code className="bg-gray-100 px-1 rounded">GOOGLE_CLIENT_ID</code> and <code className="bg-gray-100 px-1 rounded">GOOGLE_CLIENT_SECRET</code></li>
            </ol>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">📅 Google Calendar Integration</h1>
        <p className="text-muted-foreground text-sm mt-1">Sync your family calendar with Google Calendar</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            Connection Status
            {isConnected ? (
              <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3.5 w-3.5 mr-1" /> Connected</Badge>
            ) : (
              <Badge variant="secondary">Not Connected</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isConnected ? (
            <>
              <p className="text-sm text-muted-foreground">Google Calendar is connected to your household.</p>
              <div className="space-y-2">
                <Label>Sync Mode</Label>
                <Select value={syncMode} onValueChange={setSyncMode}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="export_only">📤 Export Only (FHH → Google)</SelectItem>
                    <SelectItem value="import_only">📥 Import Only (Google → FHH)</SelectItem>
                    <SelectItem value="two_way">🔄 Two-Way Sync</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {syncResult && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-sm text-emerald-800">
                  ✅ {syncResult}
                </div>
              )}
              <div className="flex gap-2">
                <Button onClick={handleSync} disabled={syncing} className="bg-emerald-600 hover:bg-emerald-700">
                  <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? "animate-spin" : ""}`} />
                  {syncing ? "Syncing..." : "Sync Now"}
                </Button>
                <Button variant="outline" onClick={handleDisconnect} className="text-red-600 border-red-200 hover:bg-red-50">
                  Disconnect
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">Connect your Google account to sync family events with Google Calendar.</p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                🔒 OAuth tokens are stored securely server-side and never exposed to the browser.
              </div>
              <Button onClick={handleConnect} className="bg-blue-600 hover:bg-blue-700">
                Connect Google Calendar
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Security Notes</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>✅ OAuth tokens are encrypted and stored server-side only</p>
          <p>✅ Tokens are never exposed to the browser or localStorage</p>
          <p>✅ Each household has isolated calendar access</p>
          <p>✅ You can disconnect at any time</p>
        </CardContent>
      </Card>
    </div>
  )
}
