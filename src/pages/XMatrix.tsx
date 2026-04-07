import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SlideOverPanel from "@/components/SlideOverPanel";
import ConfirmDialog from "@/components/ConfirmDialog";
import { Plus, Pencil, Trash2, Download } from "lucide-react";
import ExcelJS from "exceljs";

type XMatrixTab = "goals" | "objectives" | "priorities" | "kpis" | "owners";

const statusOptions = ["draft", "active", "completed", "on_hold"];

const XMatrix = () => {
  const { clientId, canEdit, canDelete, client } = useAuth();
  const [tab, setTab] = useState<XMatrixTab>("goals");
  const [data, setData] = useState<Record<string, any[]>>({ goals: [], objectives: [], priorities: [], kpis: [], owners: [] });
  const [profiles, setProfiles] = useState<any[]>([]);
  const [slideOpen, setSlideOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, any>>({});

  // Correlation state
  const [corrLayerA, setCorrLayerA] = useState("goals");
  const [corrLayerB, setCorrLayerB] = useState("objectives");
  const [corrA, setCorrA] = useState("");
  const [corrB, setCorrB] = useState("");
  const [corrStrength, setCorrStrength] = useState("strong");
  const [correlations, setCorrelations] = useState<any[]>([]);

  const tableMap: Record<string, string> = {
    goals: "xmatrix_long_term_goals",
    objectives: "xmatrix_annual_objectives",
    priorities: "xmatrix_improvement_priorities",
    kpis: "xmatrix_kpis",
    owners: "xmatrix_owners",
  };

  const corrTableMap: Record<string, string> = {
    "goals-objectives": "xmatrix_goal_objective_links",
    "objectives-priorities": "xmatrix_objective_priority_links",
    "priorities-kpis": "xmatrix_priority_kpi_links",
  };

  const fetchData = useCallback(async () => {
    if (!clientId) return;
    const results: Record<string, any[]> = {};
    for (const [key, table] of Object.entries(tableMap)) {
      const { data: rows } = await supabase.from(table).select("*").eq("client_id", clientId);
      results[key] = rows || [];
    }
    const { data: p } = await supabase.from("profiles").select("id, full_name, role").eq("client_id", clientId);
    setProfiles(p || []);
    setData(results);
  }, [clientId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const fetchCorrelations = useCallback(async () => {
    const key = `${corrLayerA}-${corrLayerB}`;
    const table = corrTableMap[key] || corrTableMap[`${corrLayerB}-${corrLayerA}`];
    if (!table || !clientId) return;
    const { data: rows } = await supabase.from(table).select("*");
    setCorrelations(rows || []);
  }, [corrLayerA, corrLayerB, clientId]);

  useEffect(() => { fetchCorrelations(); }, [fetchCorrelations]);

  const openAdd = () => { setEditItem(null); setForm({}); setSlideOpen(true); };
  const openEdit = (item: any) => { setEditItem(item); setForm({ ...item }); setSlideOpen(true); };

  const handleSave = async () => {
    const table = tableMap[tab];
    if (editItem) {
      await supabase.from(table).update(form).eq("id", editItem.id);
    } else {
      await supabase.from(table).insert({ ...form, client_id: clientId });
    }
    setSlideOpen(false);
    fetchData();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await supabase.from(tableMap[tab]).delete().eq("id", deleteId);
    setDeleteId(null);
    fetchData();
  };

  const handleSaveCorrelation = async () => {
    const key = `${corrLayerA}-${corrLayerB}`;
    const table = corrTableMap[key] || corrTableMap[`${corrLayerB}-${corrLayerA}`];
    if (!table || !corrA || !corrB) return;
    const colA = corrLayerA === "goals" ? "goal_id" : corrLayerA === "objectives" ? "objective_id" : "priority_id";
    const colB = corrLayerB === "objectives" ? "objective_id" : corrLayerB === "priorities" ? "priority_id" : "kpi_id";
    // Upsert
    const existing = correlations.find((c: any) => c[colA] === corrA && c[colB] === corrB);
    if (existing) {
      await supabase.from(table).update({ strength: corrStrength }).eq("id", existing.id);
    } else {
      await supabase.from(table).insert({ [colA]: corrA, [colB]: corrB, strength: corrStrength });
    }
    fetchCorrelations();
  };

  const exportXMatrix = async () => {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("X-Matrix");
    ws.getCell("A1").value = `PHOENIX X-Matrix — ${client?.name || ""}`;
    ws.getCell("A1").font = { bold: true, size: 14 };

    // Goals
    ws.getCell("A3").value = "Long-term Goals";
    ws.getCell("A3").font = { bold: true };
    data.goals.forEach((g, i) => { ws.getCell(`A${4 + i}`).value = g.title; });

    // Objectives
    const objStart = 4 + data.goals.length + 1;
    ws.getCell(`A${objStart}`).value = "Annual Objectives";
    ws.getCell(`A${objStart}`).font = { bold: true };
    data.objectives.forEach((o, i) => { ws.getCell(`A${objStart + 1 + i}`).value = o.title; });

    // Priorities
    const priStart = objStart + 1 + data.objectives.length + 1;
    ws.getCell(`A${priStart}`).value = "Improvement Priorities";
    ws.getCell(`A${priStart}`).font = { bold: true };
    data.priorities.forEach((p, i) => { ws.getCell(`A${priStart + 1 + i}`).value = p.title; });

    // KPIs
    const kpiStart = priStart + 1 + data.priorities.length + 1;
    ws.getCell(`A${kpiStart}`).value = "KPIs";
    ws.getCell(`A${kpiStart}`).font = { bold: true };
    data.kpis.forEach((k, i) => { ws.getCell(`A${kpiStart + 1 + i}`).value = k.name; });

    // Correlation matrix
    const matStart = kpiStart + 1 + data.kpis.length + 2;
    ws.getCell(`A${matStart}`).value = "Correlation Matrix (Goal → Objective)";
    ws.getCell(`A${matStart}`).font = { bold: true };
    data.objectives.forEach((o, ci) => {
      ws.getCell(matStart + 1, ci + 2).value = o.title;
      ws.getCell(matStart + 1, ci + 2).alignment = { textRotation: 90 };
    });
    data.goals.forEach((g, ri) => {
      ws.getCell(matStart + 2 + ri, 1).value = g.title;
      data.objectives.forEach((o, ci) => {
        const corr = correlations.find((c: any) => c.goal_id === g.id && c.objective_id === o.id);
        const symbol = corr?.strength === "strong" ? "●" : corr?.strength === "medium" ? "◑" : corr?.strength === "weak" ? "○" : "";
        ws.getCell(matStart + 2 + ri, ci + 2).value = symbol;
        ws.getCell(matStart + 2 + ri, ci + 2).alignment = { horizontal: "center" };
      });
    });

    const buf = await wb.xlsx.writeBuffer();
    const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `PHOENIX_XMatrix_${client?.name || "export"}_${new Date().toISOString().slice(0, 10)}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const updateForm = (key: string, value: any) => setForm((f) => ({ ...f, [key]: value }));

  const strengthIcon = (s: string) => {
    if (s === "strong") return <span className="text-success">●</span>;
    if (s === "medium") return <span className="text-warning">◑</span>;
    if (s === "weak") return <span className="text-muted-foreground">○</span>;
    return null;
  };

  const renderForm = () => {
    if (tab === "goals") return (
      <>
        <div><Label>Title</Label><Input value={form.title || ""} onChange={(e) => updateForm("title", e.target.value)} /></div>
        <div><Label>Target Year</Label><Input type="number" value={form.target_year || ""} onChange={(e) => updateForm("target_year", parseInt(e.target.value))} /></div>
        <div><Label>Status</Label>
          <Select value={form.status || "draft"} onValueChange={(v) => updateForm("status", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{statusOptions.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </>
    );
    if (tab === "objectives") return (
      <>
        <div><Label>Title</Label><Input value={form.title || ""} onChange={(e) => updateForm("title", e.target.value)} /></div>
        <div><Label>Fiscal Year</Label><Input type="number" value={form.fiscal_year || ""} onChange={(e) => updateForm("fiscal_year", parseInt(e.target.value))} /></div>
        <div><Label>Status</Label>
          <Select value={form.status || "draft"} onValueChange={(v) => updateForm("status", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{statusOptions.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </>
    );
    if (tab === "priorities") return (
      <>
        <div><Label>Title</Label><Input value={form.title || ""} onChange={(e) => updateForm("title", e.target.value)} /></div>
        <div><Label>Owner</Label>
          <Select value={form.owner_id || ""} onValueChange={(v) => updateForm("owner_id", v)}>
            <SelectTrigger><SelectValue placeholder="Select owner" /></SelectTrigger>
            <SelectContent>{profiles.map((p) => <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div><Label>Status</Label>
          <Select value={form.status || "draft"} onValueChange={(v) => updateForm("status", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{statusOptions.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </>
    );
    if (tab === "kpis") return (
      <>
        <div><Label>Name</Label><Input value={form.name || ""} onChange={(e) => updateForm("name", e.target.value)} /></div>
        <div><Label>Unit</Label><Input value={form.unit || ""} onChange={(e) => updateForm("unit", e.target.value)} /></div>
        <div><Label>Target Value</Label><Input type="number" value={form.target_value || ""} onChange={(e) => updateForm("target_value", parseFloat(e.target.value))} /></div>
        <div><Label>Current Value</Label><Input type="number" value={form.current_value || ""} onChange={(e) => updateForm("current_value", parseFloat(e.target.value))} /></div>
        <div><Label>Owner</Label>
          <Select value={form.owner_id || ""} onValueChange={(v) => updateForm("owner_id", v)}>
            <SelectTrigger><SelectValue placeholder="Select owner" /></SelectTrigger>
            <SelectContent>{profiles.map((p) => <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </>
    );
    if (tab === "owners") return (
      <>
        <div><Label>Linked Profile</Label>
          <Select value={form.profile_id || ""} onValueChange={(v) => {
            const p = profiles.find((pr) => pr.id === v);
            updateForm("profile_id", v);
            if (p) { updateForm("name", p.full_name); updateForm("role_title", p.role); }
          }}>
            <SelectTrigger><SelectValue placeholder="Search profile" /></SelectTrigger>
            <SelectContent>{profiles.map((p) => <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div><Label>Name</Label><Input value={form.name || ""} onChange={(e) => updateForm("name", e.target.value)} /></div>
        <div><Label>Role Title</Label><Input value={form.role_title || ""} onChange={(e) => updateForm("role_title", e.target.value)} /></div>
      </>
    );
    return null;
  };

  const renderTable = () => {
    const items = data[tab] || [];
    if (tab === "goals") return (
      <Table>
        <TableHeader><TableRow><TableHead>Title</TableHead><TableHead>Target Year</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
        <TableBody>
          {items.map((r) => (
            <TableRow key={r.id}>
              <TableCell className="font-medium">{r.title}</TableCell>
              <TableCell>{r.target_year}</TableCell>
              <TableCell><Badge variant="secondary">{r.status}</Badge></TableCell>
              <TableCell className="flex gap-1">
                {canEdit && <Button variant="ghost" size="icon" onClick={() => openEdit(r)}><Pencil className="h-4 w-4" /></Button>}
                {canDelete && <Button variant="ghost" size="icon" onClick={() => setDeleteId(r.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
    if (tab === "objectives") return (
      <Table>
        <TableHeader><TableRow><TableHead>Title</TableHead><TableHead>Fiscal Year</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
        <TableBody>
          {items.map((r) => (
            <TableRow key={r.id}>
              <TableCell className="font-medium">{r.title}</TableCell>
              <TableCell>{r.fiscal_year}</TableCell>
              <TableCell><Badge variant="secondary">{r.status}</Badge></TableCell>
              <TableCell className="flex gap-1">
                {canEdit && <Button variant="ghost" size="icon" onClick={() => openEdit(r)}><Pencil className="h-4 w-4" /></Button>}
                {canDelete && <Button variant="ghost" size="icon" onClick={() => setDeleteId(r.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
    if (tab === "priorities") return (
      <Table>
        <TableHeader><TableRow><TableHead>Title</TableHead><TableHead>Owner</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
        <TableBody>
          {items.map((r) => (
            <TableRow key={r.id}>
              <TableCell className="font-medium">{r.title}</TableCell>
              <TableCell>{profiles.find((p) => p.id === r.owner_id)?.full_name || "—"}</TableCell>
              <TableCell><Badge variant="secondary">{r.status}</Badge></TableCell>
              <TableCell className="flex gap-1">
                {canEdit && <Button variant="ghost" size="icon" onClick={() => openEdit(r)}><Pencil className="h-4 w-4" /></Button>}
                {canDelete && <Button variant="ghost" size="icon" onClick={() => setDeleteId(r.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
    if (tab === "kpis") return (
      <Table>
        <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Unit</TableHead><TableHead>Target</TableHead><TableHead>Current</TableHead><TableHead>Owner</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
        <TableBody>
          {items.map((r) => (
            <TableRow key={r.id}>
              <TableCell className="font-medium">{r.name}</TableCell>
              <TableCell>{r.unit}</TableCell>
              <TableCell>{r.target_value}</TableCell>
              <TableCell>{r.current_value}</TableCell>
              <TableCell>{profiles.find((p) => p.id === r.owner_id)?.full_name || "—"}</TableCell>
              <TableCell className="flex gap-1">
                {canEdit && <Button variant="ghost" size="icon" onClick={() => openEdit(r)}><Pencil className="h-4 w-4" /></Button>}
                {canDelete && <Button variant="ghost" size="icon" onClick={() => setDeleteId(r.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
    if (tab === "owners") return (
      <Table>
        <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Role Title</TableHead><TableHead>Linked Profile</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
        <TableBody>
          {items.map((r) => (
            <TableRow key={r.id}>
              <TableCell className="font-medium">{r.name}</TableCell>
              <TableCell>{r.role_title}</TableCell>
              <TableCell>{profiles.find((p) => p.id === r.profile_id)?.full_name || "—"}</TableCell>
              <TableCell className="flex gap-1">
                {canEdit && <Button variant="ghost" size="icon" onClick={() => openEdit(r)}><Pencil className="h-4 w-4" /></Button>}
                {canDelete && <Button variant="ghost" size="icon" onClick={() => setDeleteId(r.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
    return null;
  };

  const layerOptions = [
    { value: "goals", label: "Long-term Goals" },
    { value: "objectives", label: "Annual Objectives" },
    { value: "priorities", label: "Improvement Priorities" },
    { value: "kpis", label: "KPIs" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-primary">X-Matrix</h1>
        <Button onClick={exportXMatrix} variant="outline" size="sm"><Download className="h-4 w-4 mr-2" />Export X-Matrix</Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Tabs value={tab} onValueChange={(v) => setTab(v as XMatrixTab)}>
            <div className="flex items-center justify-between mb-4">
              <TabsList>
                <TabsTrigger value="goals">Long-term Goals</TabsTrigger>
                <TabsTrigger value="objectives">Annual Objectives</TabsTrigger>
                <TabsTrigger value="priorities">Improvement Priorities</TabsTrigger>
                <TabsTrigger value="kpis">KPIs</TabsTrigger>
                <TabsTrigger value="owners">Owners</TabsTrigger>
              </TabsList>
              {canEdit && <Button size="sm" onClick={openAdd}><Plus className="h-4 w-4 mr-1" />Add</Button>}
            </div>
            <TabsContent value={tab}>{renderTable()}</TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Correlation Editor */}
      <Card>
        <CardHeader><CardTitle className="text-lg">Correlation Editor</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Layer A</Label>
              <Select value={corrLayerA} onValueChange={setCorrLayerA}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{layerOptions.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Record A</Label>
              <Select value={corrA} onValueChange={setCorrA}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{(data[corrLayerA] || []).map((r: any) => <SelectItem key={r.id} value={r.id}>{r.title || r.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Layer B</Label>
              <Select value={corrLayerB} onValueChange={setCorrLayerB}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{layerOptions.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Record B</Label>
              <Select value={corrB} onValueChange={setCorrB}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{(data[corrLayerB] || []).map((r: any) => <SelectItem key={r.id} value={r.id}>{r.title || r.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-end gap-4">
            <div>
              <Label>Strength</Label>
              <Select value={corrStrength} onValueChange={setCorrStrength}>
                <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="strong">Strong</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="weak">Weak</SelectItem>
                  <SelectItem value="none">None</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleSaveCorrelation} disabled={!canEdit}>Save Correlation</Button>
          </div>
          {/* Correlation grid */}
          {correlations.length > 0 && (
            <div className="overflow-x-auto mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead />
                    {(data[corrLayerB] || []).map((b: any) => <TableHead key={b.id} className="text-center text-xs">{b.title || b.name}</TableHead>)}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(data[corrLayerA] || []).map((a: any) => (
                    <TableRow key={a.id}>
                      <TableCell className="text-xs font-medium">{a.title || a.name}</TableCell>
                      {(data[corrLayerB] || []).map((b: any) => {
                        const colA = corrLayerA === "goals" ? "goal_id" : corrLayerA === "objectives" ? "objective_id" : "priority_id";
                        const colB = corrLayerB === "objectives" ? "objective_id" : corrLayerB === "priorities" ? "priority_id" : "kpi_id";
                        const c = correlations.find((cr: any) => cr[colA] === a.id && cr[colB] === b.id);
                        return <TableCell key={b.id} className="text-center">{c ? strengthIcon(c.strength) : null}</TableCell>;
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <SlideOverPanel open={slideOpen} onClose={() => setSlideOpen(false)} title={editItem ? "Edit Record" : "Add Record"}>
        {renderForm()}
        <Button className="w-full mt-4" onClick={handleSave}>Save</Button>
      </SlideOverPanel>

      <ConfirmDialog open={!!deleteId} onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />
    </div>
  );
};

export default XMatrix;
