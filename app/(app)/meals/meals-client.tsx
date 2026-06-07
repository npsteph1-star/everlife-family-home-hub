"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { UtensilsCrossed, Plus, Trash2, Check } from "lucide-react"
import { useRouter } from "next/navigation"
import type { MealPlan, GroceryItem, PantryItem } from "@/types/app"

const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"] as const
const MEAL_ICONS: Record<string, string> = { breakfast: "🌄", lunch: "🥪", dinner: "🍽️", snack: "🍎" }
const PANTRY_CATS = ["Produce", "Dairy", "Meat", "Pantry", "Frozen", "Beverages", "Other"]

interface Props { plans: MealPlan[]; grocery: GroceryItem[]; pantry: PantryItem[] }

export function MealsClient({ plans, grocery, pantry }: Props) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [formType, setFormType] = useState<"plan" | "grocery" | "pantry">("plan")
  const [planForm, setPlanForm] = useState({ date: new Date().toISOString().split("T")[0], meal_type: "dinner", title: "", notes: "" })
  const [grocForm, setGrocForm] = useState({ name: "", quantity: "1", unit: "unit" })
  const [pantForm, setPantForm] = useState({ name: "", quantity: "", unit: "unit", category: "Pantry", low_alert: false })
  const [loading, setLoading] = useState(false)

  async function getHid() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    const { data } = await supabase.from("household_members").select("household_id").eq("user_id", user.id).single()
    return data?.household_id ?? null
  }

  async function savePlan() {
    if (!planForm.title.trim()) return
    setLoading(true)
    const supabase = createClient()
    const hid = await getHid()
    if (hid) await supabase.from("meal_plans").insert({ household_id: hid, ...planForm })
    setShowForm(false)
    router.refresh()
    setLoading(false)
  }

  async function saveGrocery() {
    if (!grocForm.name.trim()) return
    setLoading(true)
    const supabase = createClient()
    const hid = await getHid()
    if (hid) await supabase.from("grocery_items").insert({ household_id: hid, ...grocForm, checked: false })
    setShowForm(false)
    router.refresh()
    setLoading(false)
  }

  async function savePantry() {
    if (!pantForm.name.trim()) return
    setLoading(true)
    const supabase = createClient()
    const hid = await getHid()
    if (hid) await supabase.from("pantry_items").insert({ household_id: hid, ...pantForm })
    setShowForm(false)
    router.refresh()
    setLoading(false)
  }

  async function toggleGrocery(id: string, checked: boolean) {
    const supabase = createClient()
    await supabase.from("grocery_items").update({ checked: !checked }).eq("id", id)
    router.refresh()
  }

  async function deleteItem(table: string, id: string) {
    const supabase = createClient()
    await supabase.from(table).delete().eq("id", id)
    router.refresh()
  }

  function openAdd(type: "plan" | "grocery" | "pantry") {
    setFormType(type)
    setShowForm(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><UtensilsCrossed className="h-6 w-6" /> Meals</h1>
          <p className="text-muted-foreground text-sm mt-1">Meal planner, grocery list, and pantry</p>
        </div>
      </div>

      <Tabs defaultValue="planner">
        <TabsList>
          <TabsTrigger value="planner">🍽️ Planner</TabsTrigger>
          <TabsTrigger value="grocery">🛒 Grocery</TabsTrigger>
          <TabsTrigger value="pantry">🏪 Pantry</TabsTrigger>
        </TabsList>

        <TabsContent value="planner" className="mt-4 space-y-4">
          <div className="flex justify-end"><Button onClick={() => openAdd("plan")} className="bg-emerald-600 hover:bg-emerald-700"><Plus className="h-4 w-4 mr-2" /> Add Meal</Button></div>
          {plans.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">No meals planned yet.</CardContent></Card>
          ) : (
            <div className="space-y-3">
              {plans.map(p => (
                <Card key={p.id}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{MEAL_ICONS[p.meal_type] || "🍽️"}</span>
                      <div>
                        <div className="font-medium">{p.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(p.date + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} · {p.meal_type}
                        </div>
                      </div>
                    </div>
                    <Button size="icon" variant="ghost" className="text-red-500" onClick={() => deleteItem("meal_plans", p.id)}><Trash2 className="h-4 w-4" /></Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="grocery" className="mt-4 space-y-4">
          <div className="flex justify-end"><Button onClick={() => openAdd("grocery")} className="bg-emerald-600 hover:bg-emerald-700"><Plus className="h-4 w-4 mr-2" /> Add Item</Button></div>
          {grocery.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">Grocery list is empty.</CardContent></Card>
          ) : (
            <Card>
              <CardContent className="p-0 divide-y">
                {grocery.map(g => (
                  <div key={g.id} className={`flex items-center justify-between p-3 ${g.checked ? "bg-gray-50" : ""}`}>
                    <button onClick={() => toggleGrocery(g.id, g.checked)} className="flex items-center gap-3 flex-1 text-left">
                      <div className={`w-5 h-5 rounded border flex items-center justify-center ${g.checked ? "bg-emerald-500 border-emerald-500" : "border-gray-300"}`}>
                        {g.checked && <Check className="h-3 w-3 text-white" />}
                      </div>
                      <span className={`text-sm ${g.checked ? "line-through text-muted-foreground" : ""}`}>
                        {g.name}{g.quantity ? ` (${g.quantity} ${g.unit ?? ""})` : ""}
                      </span>
                    </button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-red-500" onClick={() => deleteItem("grocery_items", g.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="pantry" className="mt-4 space-y-4">
          <div className="flex justify-end"><Button onClick={() => openAdd("pantry")} className="bg-emerald-600 hover:bg-emerald-700"><Plus className="h-4 w-4 mr-2" /> Add Item</Button></div>
          {pantry.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">Pantry is empty.</CardContent></Card>
          ) : (
            <Card>
              <CardContent className="p-0 divide-y">
                {pantry.map(p => (
                  <div key={p.id} className="flex items-center justify-between p-3">
                    <div>
                      <span className="font-medium text-sm">{p.name}</span>
                      {p.quantity && <span className="text-xs text-muted-foreground ml-2">{p.quantity} {p.unit}</span>}
                      {p.category && <Badge variant="secondary" className="ml-2 text-xs">{p.category}</Badge>}
                      {p.low_alert && <Badge variant="destructive" className="ml-2 text-xs">Low</Badge>}
                    </div>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-red-500" onClick={() => deleteItem("pantry_items", p.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{formType === "plan" ? "Add Meal Plan" : formType === "grocery" ? "Add Grocery Item" : "Add Pantry Item"}</DialogTitle>
          </DialogHeader>
          {formType === "plan" && (
            <div className="space-y-4 py-2">
              <div className="space-y-2"><Label>Meal Name</Label><Input value={planForm.title} onChange={e => setPlanForm(f => ({...f,title:e.target.value}))} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Date</Label><Input type="date" value={planForm.date} onChange={e => setPlanForm(f => ({...f,date:e.target.value}))} /></div>
                <div className="space-y-2"><Label>Meal Type</Label>
                  <Select value={planForm.meal_type} onValueChange={v => setPlanForm(f => ({...f,meal_type:v}))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{MEAL_TYPES.map(t => <SelectItem key={t} value={t}>{MEAL_ICONS[t]} {t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button onClick={savePlan} disabled={loading} className="bg-emerald-600 hover:bg-emerald-700">Add</Button>
              </div>
            </div>
          )}
          {formType === "grocery" && (
            <div className="space-y-4 py-2">
              <div className="space-y-2"><Label>Item Name</Label><Input value={grocForm.name} onChange={e => setGrocForm(f => ({...f,name:e.target.value}))} placeholder="Milk" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Quantity</Label><Input value={grocForm.quantity} onChange={e => setGrocForm(f => ({...f,quantity:e.target.value}))} placeholder="1" /></div>
                <div className="space-y-2"><Label>Unit</Label><Input value={grocForm.unit} onChange={e => setGrocForm(f => ({...f,unit:e.target.value}))} placeholder="gallon" /></div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button onClick={saveGrocery} disabled={loading} className="bg-emerald-600 hover:bg-emerald-700">Add</Button>
              </div>
            </div>
          )}
          {formType === "pantry" && (
            <div className="space-y-4 py-2">
              <div className="space-y-2"><Label>Item Name</Label><Input value={pantForm.name} onChange={e => setPantForm(f => ({...f,name:e.target.value}))} placeholder="Rice" /></div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1"><Label className="text-xs">Qty</Label><Input value={pantForm.quantity} onChange={e => setPantForm(f => ({...f,quantity:e.target.value}))} /></div>
                <div className="space-y-1"><Label className="text-xs">Unit</Label><Input value={pantForm.unit} onChange={e => setPantForm(f => ({...f,unit:e.target.value}))} /></div>
                <div className="space-y-1"><Label className="text-xs">Category</Label>
                  <Select value={pantForm.category} onValueChange={v => setPantForm(f => ({...f,category:v}))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{PANTRY_CATS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button onClick={savePantry} disabled={loading} className="bg-emerald-600 hover:bg-emerald-700">Add</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
