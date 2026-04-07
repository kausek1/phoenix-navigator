import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import SlideOverPanel from "@/components/SlideOverPanel";
import ConfirmDialog from "@/components/ConfirmDialog";
import ScoreBar from "@/components/wsjf/ScoreBar";
import WSJFScatterChart from "@/components/wsjf/WSJFScatterChart";
import BulkScoreTable from "@/components/wsjf/BulkScoreTable";
import LinkedAssets from "@/components/wsjf/LinkedAssets";
import { Plus, Pencil, Trash2, ChevronDown, ChevronUp, BarChart3, TableIcon, Zap, X } from "lucide-react";

const FIBONACCI = ["1", "2", "3", "5", "8", "10", "13"];

const stageBadgeColors: Record<string, string> = {
  scoping: "bg-muted text-muted-foreground",
  business_case: "bg-primary/10 text-primary",
  funded: "bg-accent/10 text-accent",
  in_delivery: "bg-warning/10 text-warning",
  commissioned: "bg-success/10 text-success",
  verified: "bg-success text-success-foreground",
};

type ViewMode = "table" | "chart" | "bulk";

const WSJFScoring = () => {
  const { clientId, canEdit, canDelete } = useAuth();
  const [interventions, setInterventions] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [priorities, setPriorities] = useState<any[]>([]);
  const [sprints, setSprints] = useState<any[]>([]);
  const [slideOpen, setSlideOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, any>>({});
  const [viewMode, setViewMode] = useState<ViewMode>("table");

  const fetchAll = useCallback(async () => {
    if (!clientId) return;
    const [{ data: intv }, { data: prof }, { data: pri }, { data: spr }] = await Promise.all([
      supabase.from("interventions").select("*").eq("client_id", clientId),
      supabase.from("profiles").select("id, full_name").eq("client_id", clientId),
      supabase.from("xmatrix_improvement_priorities").select("id, title").eq("client_id", clientId),
      supabase.from("sprints").select("id, name").eq("client_id", clientId),
    ]);
    setInterventions(intv || []);
    setProfiles(prof || []);
    setPriorities(pri || []);
    setSprints(spr || []);
  }, [clientId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const calcWSJF = (r: any) => {
    const cost = (Number(r.business_roi) || 0) + (Number(r.planet_impact) || 0) + (Number(r.people_impact) || 0);
    return cost / (Number(r.time_to_deploy) || 1);
  };

  const sorted = [...interventions].sort((a, b) => calcWSJF(b) - calcWSJF(a));
  const maxWSJF = sorted.length > 0 ? calcWSJF(sorted[0]) : 1;

  const handleScoreChange = async (id: string, field: string, value: string) => {
    const numVal = parseInt(value);
    setInterventions((prev) => prev.map((r) => r.id === id ? { ...r, [field]: numVal } : r));
    await supabase.from("interventions").update({ [field]: numVal }).eq("id", id);
  };

  const openAdd = () => { setEditItem(null); setForm({}); setSlideOpen(true); };
  const openEdit = (item: any) => { setEditItem(item); setForm({ ...item }); setSlideOpen(true); };

  const handleSave = async () => {
    const payload = { ...form, client_id: clientId };
    if (editItem) {
      await supabase.from("interventions").update(payload).eq("id", editItem.id);
    } else {
      await supabase.from("interventions").insert(payload);
    }
    setSlideOpen(false);
    fetchAll();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await supabase.from("interventions").delete().eq("id", deleteId);
    setDeleteId(null);
    fetchAll();
  };

  const updateForm = (key: string, value: any) => setForm((f) => ({ ...f, [key]: value }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-primary">WSJF Scoring</h1>
        <div className="flex gap-2">
          {canEdit && viewMode !== "bulk" && (
            <Button size="sm" variant="outline" onClick={() => setViewMode("bulk")}>
              <Zap className="h-4 w-4 mr-1" />Quick Score
            </Button>
          )}
          {viewMode === "bulk" && (
            <Button size="sm" variant="outline" onClick={() => setViewMode("table")}>
              <X className="h-4 w-4 mr-1" />Exit Quick Score
            </Button>
          )}
          {viewMode !== "bulk" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setViewMode(viewMode === "table" ? "chart" : "table")}
            >
              {viewMode === "table" ? <><BarChart3 className="h-4 w-4 mr-1" />Chart View</> : <><TableIcon className="h-4 w-4 mr-1" />Table View</>}
            </Button>
          )}
          {canEdit && <Button size="sm" onClick={openAdd}><Plus className="h-4 w-4 mr-1" />Add Intervention</Button>}
        </div>
      </div>

      <Card>
        <CardContent className="pt-6 overflow-x-auto">
          {viewMode === "chart" && <WSJFScatterChart data={interventions} />}
          {viewMode === "bulk" && <BulkScoreTable interventions={interventions} onScoreChange={handleScoreChange} />}
          {viewMode === "table" && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Rank</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Business ROI</TableHead>
                  <TableHead>Planet Impact</TableHead>
                  <TableHead>People Impact</TableHead>
                  <TableHead>Time to Deploy</TableHead>
                  <TableHead>WSJF Score</TableHead>
                  <TableHead className="w-28">Score Bar</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map((r, i) => (
                  <>
                    <TableRow key={r.id} className="cursor-pointer" onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}>
                      <TableCell className="font-bold text-primary">{i + 1}</TableCell>
                      <TableCell className="font-medium flex items-center gap-1">
                        {r.title}
                        {expandedId === r.id ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Select value={String(r.business_roi || 1)} onValueChange={(v) => handleScoreChange(r.id, "business_roi", v)}>
                          <SelectTrigger className="w-16 h-8"><SelectValue /></SelectTrigger>
                          <SelectContent>{FIBONACCI.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Select value={String(r.planet_impact || 1)} onValueChange={(v) => handleScoreChange(r.id, "planet_impact", v)}>
                          <SelectTrigger className="w-16 h-8"><SelectValue /></SelectTrigger>
                          <SelectContent>{FIBONACCI.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Select value={String(r.people_impact || 1)} onValueChange={(v) => handleScoreChange(r.id, "people_impact", v)}>
                          <SelectTrigger className="w-16 h-8"><SelectValue /></SelectTrigger>
                          <SelectContent>{FIBONACCI.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Select value={String(r.time_to_deploy || 1)} onValueChange={(v) => handleScoreChange(r.id, "time_to_deploy", v)}>
                          <SelectTrigger className="w-16 h-8"><SelectValue /></SelectTrigger>
                          <SelectContent>{FIBONACCI.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-primary text-primary-foreground">{calcWSJF(r).toFixed(2)}</Badge>
                      </TableCell>
                      <TableCell>
                        <ScoreBar score={calcWSJF(r)} maxScore={maxWSJF} />
                      </TableCell>
                      <TableCell>
                        <Badge className={stageBadgeColors[r.stage] || "bg-muted"}>{r.stage?.replace("_", " ") || "—"}</Badge>
                      </TableCell>
                      <TableCell>{profiles.find((p) => p.id === r.owner_id)?.full_name || "—"}</TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()} className="flex gap-1">
                        {canEdit && <Button variant="ghost" size="icon" onClick={() => openEdit(r)}><Pencil className="h-4 w-4" /></Button>}
                        {canDelete && <Button variant="ghost" size="icon" onClick={() => setDeleteId(r.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>}
                      </TableCell>
                    </TableRow>
                    {expandedId === r.id && (
                      <TableRow key={`${r.id}-detail`}>
                        <TableCell colSpan={11}>
                          <div className="p-4 bg-muted/30 rounded-md space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                              <div><strong>Description:</strong> {r.description || "—"}</div>
                              <div><strong>Linked Priority:</strong> {priorities.find((p) => p.id === r.priority_id)?.title || "—"}</div>
                              <div><strong>Sprint:</strong> {sprints.find((s) => s.id === r.sprint_id)?.name || "—"}</div>
                              <div><strong>Due Date:</strong> {r.due_date || "—"}</div>
                              <div><strong>Est. Cost:</strong> {r.estimated_cost ? `$${Number(r.estimated_cost).toLocaleString()}` : "—"}</div>
                              <div><strong>Est. Annual Savings:</strong> {r.estimated_annual_savings ? `$${Number(r.estimated_annual_savings).toLocaleString()}` : "—"}</div>
                              <div><strong>Est. CO₂ Reduction:</strong> {r.estimated_co2_reduction ? `${r.estimated_co2_reduction} tCO₂e` : "—"}</div>
                              <div><strong>Notes:</strong> {r.notes || "—"}</div>
                            </div>
                            {clientId && <LinkedAssets interventionId={r.id} clientId={clientId} canEdit={canEdit} />}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <SlideOverPanel open={slideOpen} onClose={() => setSlideOpen(false)} title={editItem ? "Edit Intervention" : "Add Intervention"}>
        <div><Label>Title *</Label><Input value={form.title || ""} onChange={(e) => updateForm("title", e.target.value)} /></div>
        <div><Label>Description</Label><Textarea value={form.description || ""} onChange={(e) => updateForm("description", e.target.value)} /></div>
        <div><Label>Improvement Priority</Label>
          <Select value={form.priority_id || ""} onValueChange={(v) => updateForm("priority_id", v)}>
            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>{priorities.map((p) => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><Label>Business ROI</Label>
            <Select value={String(form.business_roi || 1)} onValueChange={(v) => updateForm("business_roi", parseInt(v))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{FIBONACCI.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Planet Impact</Label>
            <Select value={String(form.planet_impact || 1)} onValueChange={(v) => updateForm("planet_impact", parseInt(v))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{FIBONACCI.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>People Impact</Label>
            <Select value={String(form.people_impact || 1)} onValueChange={(v) => updateForm("people_impact", parseInt(v))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{FIBONACCI.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Time to Deploy</Label>
            <Select value={String(form.time_to_deploy || 1)} onValueChange={(v) => updateForm("time_to_deploy", parseInt(v))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{FIBONACCI.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
        <div><Label>Owner</Label>
          <Select value={form.owner_id || ""} onValueChange={(v) => updateForm("owner_id", v)}>
            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>{profiles.map((p) => <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div><Label>Sprint</Label>
          <Select value={form.sprint_id || ""} onValueChange={(v) => updateForm("sprint_id", v)}>
            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>{sprints.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div><Label>Due Date</Label><Input type="date" value={form.due_date || ""} onChange={(e) => updateForm("due_date", e.target.value)} /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><Label>Est. Cost ($)</Label><Input type="number" value={form.estimated_cost || ""} onChange={(e) => updateForm("estimated_cost", parseFloat(e.target.value))} /></div>
          <div><Label>Est. Annual Savings ($)</Label><Input type="number" value={form.estimated_annual_savings || ""} onChange={(e) => updateForm("estimated_annual_savings", parseFloat(e.target.value))} /></div>
        </div>
        <div><Label>Est. CO₂ Reduction (tCO₂e)</Label><Input type="number" value={form.estimated_co2_reduction || ""} onChange={(e) => updateForm("estimated_co2_reduction", parseFloat(e.target.value))} /></div>
        <div><Label>Notes</Label><Textarea value={form.notes || ""} onChange={(e) => updateForm("notes", e.target.value)} /></div>
        <Button className="w-full mt-4" onClick={handleSave}>Save</Button>
      </SlideOverPanel>

      <ConfirmDialog open={!!deleteId} onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />
    </div>
  );
};

export default WSJFScoring;
