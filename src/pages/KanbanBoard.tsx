import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import SlideOverPanel from "@/components/SlideOverPanel";
import { X, Calendar } from "lucide-react";

const STAGES = ["scoping", "business_case", "funded", "in_delivery", "commissioned", "verified"];
const STAGE_LABELS: Record<string, string> = {
  scoping: "Scoping",
  business_case: "Business Case",
  funded: "Funded",
  in_delivery: "In Delivery",
  commissioned: "Commissioned",
  verified: "Verified",
};
const FIBONACCI = ["1", "2", "3", "5", "8", "10", "13"];

const KanbanBoard = () => {
  const { clientId, canEdit, user } = useAuth();
  const [interventions, setInterventions] = useState<any[]>([]);
  const [wipLimits, setWipLimits] = useState<Record<string, number>>({});
  const [profiles, setProfiles] = useState<any[]>([]);
  const [sprints, setSprints] = useState<any[]>([]);
  const [priorities, setPriorities] = useState<any[]>([]);
  const [filterSprint, setFilterSprint] = useState<string>("");
  const [filterOwner, setFilterOwner] = useState<string>("");
  const [slideOpen, setSlideOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [form, setForm] = useState<Record<string, any>>({});

  const fetchAll = useCallback(async () => {
    if (!clientId) return;
    const [{ data: intv }, { data: wip }, { data: prof }, { data: spr }, { data: pri }] = await Promise.all([
      supabase.from("interventions").select("*").eq("client_id", clientId),
      supabase.from("kanban_wip_limits").select("*").eq("client_id", clientId),
      supabase.from("profiles").select("id, full_name").eq("client_id", clientId),
      supabase.from("sprints").select("id, name").eq("client_id", clientId),
      supabase.from("xmatrix_improvement_priorities").select("id, title").eq("client_id", clientId),
    ]);
    setInterventions(intv || []);
    const wipMap: Record<string, number> = {};
    (wip || []).forEach((w: any) => { wipMap[w.stage] = w.wip_limit; });
    setWipLimits(wipMap);
    setProfiles(prof || []);
    setSprints(spr || []);
    setPriorities(pri || []);
  }, [clientId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const filtered = interventions.filter((i) => {
    if (filterSprint && i.sprint_id !== filterSprint) return false;
    if (filterOwner && i.owner_id !== filterOwner) return false;
    return true;
  });

  const getByStage = (stage: string) => filtered.filter((i) => i.stage === stage);

  const calcWSJF = (r: any) => {
    const cost = (Number(r.business_roi) || 0) + (Number(r.planet_impact) || 0) + (Number(r.people_impact) || 0);
    return cost / (Number(r.time_to_deploy) || 1);
  };

  const isOverdue = (date: string) => date && new Date(date) < new Date();

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination || !canEdit) return;
    const toStage = result.destination.droppableId;
    const fromStage = result.source.droppableId;
    const id = result.draggableId;
    if (fromStage === toStage) return;

    setInterventions((prev) => prev.map((i) => i.id === id ? { ...i, stage: toStage } : i));
    await supabase.from("interventions").update({ stage: toStage }).eq("id", id);
    await supabase.from("kanban_stage_transitions").insert({
      intervention_id: id,
      from_stage: fromStage,
      to_stage: toStage,
      changed_by: user?.id,
      changed_at: new Date().toISOString(),
    });
  };

  const openDetail = (item: any) => { setEditItem(item); setForm({ ...item }); setSlideOpen(true); };

  const handleSave = async () => {
    if (!editItem) return;
    await supabase.from("interventions").update(form).eq("id", editItem.id);
    setSlideOpen(false);
    fetchAll();
  };

  const updateForm = (key: string, value: any) => setForm((f) => ({ ...f, [key]: value }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-primary">Kanban Board</h1>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <Select value={filterSprint} onValueChange={setFilterSprint}>
          <SelectTrigger className="w-40"><SelectValue placeholder="All Sprints" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sprints</SelectItem>
            {sprints.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterOwner} onValueChange={setFilterOwner}>
          <SelectTrigger className="w-40"><SelectValue placeholder="All Owners" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Owners</SelectItem>
            {profiles.map((p) => <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>)}
          </SelectContent>
        </Select>
        {(filterSprint || filterOwner) && (
          <Button variant="ghost" size="sm" onClick={() => { setFilterSprint(""); setFilterOwner(""); }}>
            <X className="h-4 w-4 mr-1" />Clear
          </Button>
        )}
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {STAGES.map((stage) => {
            const cards = getByStage(stage);
            const limit = wipLimits[stage] || Infinity;
            const exceeded = cards.length > limit;
            const atWarning = limit !== Infinity && cards.length >= limit * 0.8 && !exceeded;

            return (
              <Droppable key={stage} droppableId={stage}>
                {(provided) => (
                  <div ref={provided.innerRef} {...provided.droppableProps} className="flex flex-col min-h-[400px]">
                    <div className={`rounded-t-md px-3 py-2 font-semibold text-sm flex items-center justify-between ${exceeded ? "bg-destructive text-destructive-foreground" : "bg-primary text-primary-foreground"}`}>
                      <span>{STAGE_LABELS[stage]}</span>
                      <span className="text-xs">{cards.length}{limit !== Infinity ? ` / ${limit}` : ""}</span>
                    </div>
                    {atWarning && <div className="bg-warning/20 text-warning text-xs px-2 py-1 text-center">Approaching WIP limit</div>}
                    <div className="flex-1 bg-muted/30 rounded-b-md p-2 space-y-2">
                      {cards.map((card, idx) => (
                        <Draggable key={card.id} draggableId={card.id} index={idx} isDragDisabled={!canEdit}>
                          {(prov) => (
                            <div
                              ref={prov.innerRef}
                              {...prov.draggableProps}
                              {...prov.dragHandleProps}
                              onClick={() => openDetail(card)}
                              className="bg-card rounded-md p-3 shadow-sm border border-border cursor-pointer hover:shadow-md transition-shadow space-y-2"
                            >
                              <p className="text-sm font-medium text-foreground leading-tight">{card.title}</p>
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge className="bg-primary text-primary-foreground text-xs">{calcWSJF(card).toFixed(1)}</Badge>
                                {card.owner_id && (
                                  <div className="h-6 w-6 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-xs font-bold">
                                    {(profiles.find((p) => p.id === card.owner_id)?.full_name || "?").slice(0, 2).toUpperCase()}
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-xs">
                                {card.due_date && (
                                  <span className={`flex items-center gap-1 ${isOverdue(card.due_date) ? "text-destructive" : "text-muted-foreground"}`}>
                                    <Calendar className="h-3 w-3" />{card.due_date}
                                  </span>
                                )}
                                {card.sprint_id && sprints.find((s) => s.id === card.sprint_id) && (
                                  <Badge variant="outline" className="text-xs">{sprints.find((s) => s.id === card.sprint_id)?.name}</Badge>
                                )}
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  </div>
                )}
              </Droppable>
            );
          })}
        </div>
      </DragDropContext>

      <SlideOverPanel open={slideOpen} onClose={() => setSlideOpen(false)} title="Intervention Details">
        {editItem && (
          <>
            <div><Label>Title</Label><Input value={form.title || ""} onChange={(e) => updateForm("title", e.target.value)} disabled={!canEdit} /></div>
            <div><Label>Description</Label><Textarea value={form.description || ""} onChange={(e) => updateForm("description", e.target.value)} disabled={!canEdit} /></div>
            <div><Label>Stage</Label>
              <Select value={form.stage || "scoping"} onValueChange={(v) => updateForm("stage", v)} disabled={!canEdit}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STAGES.map((s) => <SelectItem key={s} value={s}>{STAGE_LABELS[s]}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Owner</Label>
              <Select value={form.owner_id || ""} onValueChange={(v) => updateForm("owner_id", v)} disabled={!canEdit}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{profiles.map((p) => <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Priority</Label>
              <Select value={form.priority_id || ""} onValueChange={(v) => updateForm("priority_id", v)} disabled={!canEdit}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{priorities.map((p) => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Business ROI</Label>
                <Select value={String(form.business_roi || 1)} onValueChange={(v) => updateForm("business_roi", parseInt(v))} disabled={!canEdit}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{FIBONACCI.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Planet Impact</Label>
                <Select value={String(form.planet_impact || 1)} onValueChange={(v) => updateForm("planet_impact", parseInt(v))} disabled={!canEdit}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{FIBONACCI.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Due Date</Label><Input type="date" value={form.due_date || ""} onChange={(e) => updateForm("due_date", e.target.value)} disabled={!canEdit} /></div>
            <div><Label>Notes</Label><Textarea value={form.notes || ""} onChange={(e) => updateForm("notes", e.target.value)} disabled={!canEdit} /></div>
            {canEdit && <Button className="w-full mt-4" onClick={handleSave}>Save Changes</Button>}
          </>
        )}
      </SlideOverPanel>
    </div>
  );
};

export default KanbanBoard;
