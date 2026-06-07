"use client"

import { useState, useTransition } from "react"
import { createCalendarEvent, updateCalendarEvent, deleteCalendarEvent } from "@/lib/actions/calendar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Plus, Pencil, Trash2, ChevronLeft, ChevronRight } from "lucide-react"
import { useRouter } from "next/navigation"
import type { CalendarEvent, FamilyProfile } from "@/types/app"

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"]
const TYPE_ICON: Record<string, string> = { event: "📅", appointment: "🏥", reminder: "🔔" }

const blank = () => ({ title: "", date: new Date().toISOString().split("T")[0], time: "", type: "event", assigned_to: "", notes: "" })

interface Props { events: CalendarEvent[]; members: FamilyProfile[] }

export function CalendarClient({ events, members }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const today = new Date()
  const [vm, setVm] = useState({ year: today.getFullYear(), month: today.getMonth() })
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<CalendarEvent | null>(null)
  const [form, setForm] = useState(blank())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const firstDay = new Date(vm.year, vm.month, 1).getDay()
  const daysInMonth = new Date(vm.year, vm.month + 1, 0).getDate()
  const todayStr = today.toISOString().split("T")[0]
  const dayStr = (d: number) => `${vm.year}-${String(vm.month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`

  function openAdd(date?: string) {
    setEditing(null)
    setForm({ ...blank(), date: date || todayStr })
    setShowForm(true)
  }
  function openEdit(e: CalendarEvent) {
    setEditing(e)
    setForm({ title: e.title, date: e.date, time: e.time ?? "", type: e.type, assigned_to: e.assigned_to ?? "", notes: e.notes ?? "" })
    setShowForm(true)
  }

  function handleSave() {
    if (!form.title.trim() || !form.date) return
    startTransition(async () => {
      const data = { ...form, title: form.title.trim(), time: form.time || undefined, assigned_to: form.assigned_to || undefined, notes: form.notes || undefined }
      if (editing) await updateCalendarEvent(editing.id, data)
      else await createCalendarEvent(data)
      setShowForm(false)
      router.refresh()
    })
  }

  const dayEvents = selectedDate ? events.filter(e => e.date === selectedDate) : []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Calendar className="h-6 w-6" /> Calendar</h1>
          <p className="text-muted-foreground text-sm mt-1">Family events, appointments, and reminders</p>
        </div>
        <Button onClick={() => openAdd()} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="h-4 w-4 mr-2" /> Add Event
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" size="icon" onClick={() => setVm(v => v.month === 0 ? { year: v.year - 1, month: 11 } : { ...v, month: v.month - 1 })}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <h2 className="font-bold text-lg">{MONTHS[vm.month]} {vm.year}</h2>
            <Button variant="ghost" size="icon" onClick={() => setVm(v => v.month === 11 ? { year: v.year + 1, month: 0 } : { ...v, month: v.month + 1 })}>
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>

          <div className="grid grid-cols-7 mb-2">
            {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => (
              <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const d = i + 1
              const ds = dayStr(d)
              const dayEvts = events.filter(e => e.date === ds)
              const isToday = ds === todayStr
              const isSelected = ds === selectedDate
              return (
                <button
                  key={d}
                  onClick={() => setSelectedDate(ds === selectedDate ? null : ds)}
                  className={`relative min-h-[2.5rem] rounded-lg p-1 text-sm transition-colors border ${
                    isToday ? "bg-emerald-500 text-white font-bold border-emerald-500" :
                    isSelected ? "bg-emerald-50 border-emerald-300" :
                    "hover:bg-gray-50 border-transparent"
                  }`}
                >
                  <span className="block text-center">{d}</span>
                  {dayEvts.length > 0 && (
                    <div className="flex justify-center gap-0.5 mt-0.5 flex-wrap">
                      {dayEvts.slice(0, 3).map(e => (
                        <div key={e.id} className={`w-1.5 h-1.5 rounded-full ${isToday ? "bg-white" : "bg-emerald-500"}`} />
                      ))}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {selectedDate && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">{new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</h3>
              <Button size="sm" onClick={() => openAdd(selectedDate)} className="bg-emerald-600 hover:bg-emerald-700">
                <Plus className="h-3.5 w-3.5 mr-1" /> Add
              </Button>
            </div>
            {dayEvents.length === 0 ? (
              <p className="text-muted-foreground text-sm">No events on this day.</p>
            ) : (
              <div className="space-y-2">
                {dayEvents.map(e => (
                  <div key={e.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span>{TYPE_ICON[e.type] || "📅"}</span>
                      <div>
                        <div className="font-medium text-sm">{e.title}</div>
                        {e.time && <div className="text-xs text-muted-foreground">{e.time}</div>}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(e)}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-red-500" onClick={() => startTransition(async () => { await deleteCalendarEvent(e.id); router.refresh() })}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-4">
          <h3 className="font-semibold mb-3">Upcoming Events</h3>
          {events.filter(e => e.date >= todayStr).slice(0, 10).length === 0 ? (
            <p className="text-muted-foreground text-sm">No upcoming events.</p>
          ) : (
            <div className="space-y-2">
              {events.filter(e => e.date >= todayStr).slice(0, 10).map(e => (
                <div key={e.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer" onClick={() => setSelectedDate(e.date)}>
                  <span>{TYPE_ICON[e.type] || "📅"}</span>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{e.title}</div>
                    <div className="text-xs text-muted-foreground">{new Date(e.date + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}{e.time ? ` at ${e.time}` : ""}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit Event" : "Add Event"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2"><Label>Title</Label><Input value={form.title} onChange={e => setForm(f => ({...f,title:e.target.value}))} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Date</Label><Input type="date" value={form.date} onChange={e => setForm(f => ({...f,date:e.target.value}))} /></div>
              <div className="space-y-2"><Label>Time (optional)</Label><Input type="time" value={form.time} onChange={e => setForm(f => ({...f,time:e.target.value}))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Type</Label>
                <Select value={form.type} onValueChange={v => setForm(f => ({...f,type:v}))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="event">📅 Event</SelectItem>
                    <SelectItem value="appointment">🏥 Appointment</SelectItem>
                    <SelectItem value="reminder">🔔 Reminder</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Assign To</Label>
                <Select value={form.assigned_to} onValueChange={v => setForm(f => ({...f,assigned_to:v === "none" ? "" : v}))}>
                  <SelectTrigger><SelectValue placeholder="Anyone" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Anyone</SelectItem>
                    {members.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2"><Label>Notes (optional)</Label><Input value={form.notes} onChange={e => setForm(f => ({...f,notes:e.target.value}))} /></div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={pending} className="bg-emerald-600 hover:bg-emerald-700">
                {editing ? "Save" : "Add Event"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
