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
import { Card, CardContent } from "@/components/ui/card";
import SlideOverPanel from "@/components/SlideOverPanel";
import ConfirmDialog from "@/components/ConfirmDialog";
import CorrelationGrid from "@/components/xmatrix/CorrelationGrid";
import OwnerForm from "@/components/xmatrix/OwnerForm";
import { exportXMatrix } from "@/components/xmatrix/exportXMatrix";
import { Plus, Pencil, Trash2, Download, User } from "lucide-react";

type XMatrixTab = "goals" | "objectives" | "priorities" | "kpis" | "owners";

const statusOptions = ["draft", "active", "completed", "on_hold"];

const tableMap: Record<string, string> = {
  goals: "xmatrix_long_term_goals",
  objectives: "xmatrix_annual_objectives",
  priorities: "xmatrix_improvement_priorities",
  kpis: "xmatrix_kpis",
  owners: "xmatrix_owners",
};

const XMatrix = () => {
  const { clientId, canEdit, canDelete, client } = useAuth();
  const [tab, setTab] = useState<XMatrixTab>("goals");
  const [data, setData] = useState<Record<string, any[]>>({ goals: [], objectives: [], priorities: [], kpis: [], owners: [] });
  const [profiles, setProfiles] = useState<any[]>([]);
  const [slideOpen, setSlideOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, any>>({});

  const fetchData = useCallback(async () => {
    if (!clientId) return;
    const results: Record<string, any[]> = {};

    // Fetch all entity types with simple select
    for (const key of ["goals", "objectives", "owners"] as const) {
      const { data: rows } = await supabase.from(tableMap[key]).select("*").eq("client_id", clientId);
      results[key] = rows || [];
    }

    // Fetch priorities and KPIs (no join — resolve owner name client-side)
    const { data: priorities } = await supabase
      .from("xmatrix_improvement_priorities")
      .select("*")
      .eq("client_id", clientId)
      .order("sort_order");
    results.priorities = priorities || [];

    const { data: kpis } = await supabase
      .from("xmatrix_kpis")
      .select("*")
      .eq("client_id", clientId)
      .order("sort_order");
    results.kpis = kpis || [];

    const { data: p } = await supabase.from("profiles").select("id, full_name, role, email").eq("client_id", clientId);
    setProfiles(p || []);
    setData(results);
  }, [clientId]);

  const getOwnerName = (ownerId: string | null) => {
    if (!ownerId) return "Unassigned";
    const owner = data.owners.find((o: any) => o.id === ownerId);
    return owner?.name || "Unassigned";
  };

  useEffect(() => { fetchData(); }, [fetchData]);

  const openAdd = () => { setEditItem(null); setForm({}); setSlideOpen(true); };
  const openEdit = (item: any) => { setEditItem(item); setForm({ ...item }); setSlideOpen(true); };
  const updateForm = (key: string, value: any) => setForm((f) => ({ ...f, [key]: value }));

  const handleSave = async () => {
    const table = tableMap[tab];
    const payload = { ...form };
    
    // Remove fields that should not be sent to Supabase
    delete payload.id;
    delete payload.created_at;
    delete payload.updated_at;
    delete payload.client_id;
    delete payload.owner;
    
    // Only null-coerce owner_id for tabs that have this field
    if (tab === "priorities" || tab === "kpis") {
      if (payload.owner_id === "__unassigned__" || !payload.owner_id) {
        payload.owner_id = null;
      }
    }
    
    if (editItem) {
      await supabase.from(table).update(payload).eq("id", editItem.id);
    } else {
      await supabase.from(table).insert({ ...payload, client_id: clientId });
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

  const handleExport = () => exportXMatrix({ data, clientName: client?.name || "export", clientId: clientId || "" });

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
          <Select value={form.owner_id || "__unassigned__"} onValueChange={(v) => updateForm("owner_id", v === "__unassigned__" ? null : v)}>
            <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__unassigned__">Unassigned</SelectItem>
              {data.owners.map((o: any) => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}
            </SelectContent>
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
          <Select value={form.owner_id || "__unassigned__"} onValueChange={(v) => updateForm("owner_id", v === "__unassigned__" ? null : v)}>
            <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__unassigned__">Unassigned</SelectItem>
              {data.owners.map((o: any) => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </>
    );
    if (tab === "owners") return <OwnerForm form={form} updateForm={updateForm} profiles={profiles} />;
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
              <TableCell>{getOwnerName(r.owner_id)}</TableCell>
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
              <TableCell>{getOwnerName(r.owner_id)}</TableCell>
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
              <TableCell className="font-medium flex items-center gap-2">
                {r.profile_id && <User className="h-4 w-4 text-primary" />}
                {r.name}
              </TableCell>
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-primary">X-Matrix</h1>
        <Button onClick={handleExport} variant="outline" size="sm"><Download className="h-4 w-4 mr-2" />Export X-Matrix</Button>
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

      <CorrelationGrid data={data} canEdit={canEdit} clientId={clientId} />

      <SlideOverPanel open={slideOpen} onClose={() => setSlideOpen(false)} title={editItem ? "Edit Record" : "Add Record"}>
        {renderForm()}
        <Button className="w-full mt-4" onClick={handleSave}>Save</Button>
      </SlideOverPanel>

      <ConfirmDialog open={!!deleteId} onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />
    </div>
  );
};

export default XMatrix;
