import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import SlideOverPanel from "@/components/SlideOverPanel";
import ConfirmDialog from "@/components/ConfirmDialog";
import { Plus, Pencil } from "lucide-react";
import { toast } from "sonner";

interface Props { clientId: string }

const statusColor: Record<string, string> = {
  planning: "bg-muted text-muted-foreground",
  active: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200",
  closed: "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200",
};

const SprintsTab = ({ clientId }: Props) => {
  const [sprints, setSprints] = useState<any[]>([]);
  const [slideOpen, setSlideOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [form, setForm] = useState<Record<string, any>>({});
  const [closeId, setCloseId] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    const { data } = await supabase.from("sprints").select("*").eq("client_id", clientId).order("start_date", { ascending: true });
    setSprints(data || []);
  }, [clientId]);

  useEffect(() => { fetch(); }, [fetch]);

  const openAdd = () => { setEditItem(null); setForm({ status: "planning" }); setSlideOpen(true); };
  const openEdit = (s: any) => { setEditItem(s); setForm({ ...s }); setSlideOpen(true); };
  const update = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    if (editItem) await supabase.from("sprints").update(form).eq("id", editItem.id);
    else await supabase.from("sprints").insert({ ...form, client_id: clientId });
    setSlideOpen(false); fetch();
  };

  const closeSprint = async () => {
    if (!closeId) return;
    await supabase.from("sprints").update({ status: "closed" }).eq("id", closeId);
    // Find next open sprint
    const nextSprint = sprints.find((s) => s.id !== closeId && s.status !== "closed");
    // Move incomplete cards
    const { data: cards } = await supabase.from("interventions").select("id, stage").eq("sprint_id", closeId);
    const incomplete = (cards || []).filter((c) => c.stage !== "verified");
    if (incomplete.length > 0) {
      const ids = incomplete.map((c) => c.id);
      await supabase.from("interventions").update({ sprint_id: nextSprint?.id || null }).in("id", ids);
      toast.info(`${incomplete.length} cards moved to ${nextSprint?.name || "unassigned"}`);
    }
    setCloseId(null);
    toast.success("Sprint closed");
    fetch();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={openAdd}><Plus className="h-4 w-4 mr-1" />Add Sprint</Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead><TableHead>Start Date</TableHead><TableHead>End Date</TableHead>
            <TableHead>Status</TableHead><TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sprints.map((s) => (
            <TableRow key={s.id}>
              <TableCell className="font-medium">{s.name}</TableCell>
              <TableCell>{s.start_date || "—"}</TableCell>
              <TableCell>{s.end_date || "—"}</TableCell>
              <TableCell><Badge className={statusColor[s.status] || "bg-muted"}>{s.status || "planning"}</Badge></TableCell>
              <TableCell className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={() => openEdit(s)}><Pencil className="h-4 w-4" /></Button>
                {s.status !== "closed" && (
                  <Button variant="outline" size="sm" onClick={() => setCloseId(s.id)}>Close Sprint</Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <SlideOverPanel open={slideOpen} onClose={() => setSlideOpen(false)} title={editItem ? "Edit Sprint" : "Add Sprint"}>
        <div><Label>Name</Label><Input value={form.name || ""} onChange={(e) => update("name", e.target.value)} /></div>
        <div><Label>Start Date</Label><Input type="date" value={form.start_date || ""} onChange={(e) => update("start_date", e.target.value)} /></div>
        <div><Label>End Date</Label><Input type="date" value={form.end_date || ""} onChange={(e) => update("end_date", e.target.value)} /></div>
        <Button className="w-full mt-4" onClick={save}>Save</Button>
      </SlideOverPanel>

      <ConfirmDialog open={!!closeId} onConfirm={closeSprint} onCancel={() => setCloseId(null)} />
    </div>
  );
};

export default SprintsTab;
