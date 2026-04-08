import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

const STRENGTHS = ["none", "weak", "medium", "strong"] as const;
type Strength = (typeof STRENGTHS)[number];

const nextStrength = (s: Strength): Strength => {
  const idx = STRENGTHS.indexOf(s);
  return STRENGTHS[(idx + 1) % STRENGTHS.length];
};

const strengthSymbol = (s: Strength) => {
  if (s === "strong") return "●";
  if (s === "medium") return "◑";
  if (s === "weak") return "○";
  return "–";
};

const strengthColor = (s: Strength) => {
  if (s === "strong") return "bg-green-100 dark:bg-green-900/30";
  if (s === "medium") return "bg-yellow-100 dark:bg-yellow-900/30";
  if (s === "weak") return "bg-gray-100 dark:bg-gray-800/30";
  return "";
};

const strengthTextColor = (s: Strength) => {
  if (s === "strong") return "text-green-700 dark:text-green-400";
  if (s === "medium") return "text-yellow-700 dark:text-yellow-400";
  if (s === "weak") return "text-muted-foreground";
  return "text-muted-foreground/50";
};

const LAYER_OPTIONS = [
  { value: "goals", label: "Long-term Goals" },
  { value: "objectives", label: "Annual Objectives" },
  { value: "priorities", label: "Improvement Priorities" },
  { value: "kpis", label: "KPIs" },
];

const CORR_TABLE_MAP: Record<string, string> = {
  "goals-objectives": "xmatrix_goal_objective_links",
  "objectives-priorities": "xmatrix_objective_priority_links",
  "priorities-kpis": "xmatrix_priority_kpi_links",
};

const getColKey = (layer: string) => {
  if (layer === "goals") return "goal_id";
  if (layer === "objectives") return "objective_id";
  if (layer === "priorities") return "priority_id";
  return "kpi_id";
};

interface CorrelationGridProps {
  data: Record<string, any[]>;
  canEdit: boolean;
  clientId: string | null;
}

const CorrelationGrid = ({ data, canEdit, clientId }: CorrelationGridProps) => {
  const [layerA, setLayerA] = useState("goals");
  const [layerB, setLayerB] = useState("objectives");
  const [correlations, setCorrelations] = useState<any[]>([]);

  const isReversed = !CORR_TABLE_MAP[`${layerA}-${layerB}`] && !!CORR_TABLE_MAP[`${layerB}-${layerA}`];
  const tableName = CORR_TABLE_MAP[`${layerA}-${layerB}`] || CORR_TABLE_MAP[`${layerB}-${layerA}`];
  // When reversed, the table columns are named for layerB-layerA order
  const colA = isReversed ? getColKey(layerB) : getColKey(layerA);
  const colB = isReversed ? getColKey(layerA) : getColKey(layerB);

  const fetchCorrelations = useCallback(async () => {
    if (!tableName || !clientId) return;
    const { data: rows } = await supabase.from(tableName).select("*");
    setCorrelations(rows || []);
  }, [tableName, clientId]);

  useEffect(() => { fetchCorrelations(); }, [fetchCorrelations]);

  const getStrength = (rowId: string, colId: string): Strength => {
    const aVal = isReversed ? colId : rowId;
    const bVal = isReversed ? rowId : colId;
    const c = correlations.find((cr: any) => cr[colA] === aVal && cr[colB] === bVal);
    return (c?.strength as Strength) || "none";
  };

  const handleCellClick = async (rowId: string, colId: string) => {
    if (!canEdit || !tableName) return;
    const aVal = isReversed ? colId : rowId;
    const bVal = isReversed ? rowId : colId;
    const current = getStrength(rowId, colId);
    const next = nextStrength(current);
    const existing = correlations.find((cr: any) => cr[colA] === aVal && cr[colB] === bVal);

    let result;
    if (next === "none" && existing) {
      result = await supabase.from(tableName).delete().eq("id", existing.id);
    } else if (existing) {
      result = await supabase.from(tableName).update({ strength: next }).eq("id", existing.id);
    } else if (next !== "none") {
      result = await supabase.from(tableName).insert({ [colA]: aVal, [colB]: bVal, strength: next });
    }
    if (result?.error) {
      console.error("Correlation update failed:", result.error);
    }
    fetchCorrelations();
  };

  const rowItems = data[layerA] || [];
  const colItems = data[layerB] || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Correlation Matrix</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 max-w-md">
          <div>
            <Label>Rows</Label>
            <Select value={layerA} onValueChange={setLayerA}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{LAYER_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Columns</Label>
            <Select value={layerB} onValueChange={setLayerB}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{LAYER_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>

        {!tableName ? (
          <p className="text-sm text-muted-foreground">No correlation table exists for this layer combination. Supported: Goals↔Objectives, Objectives↔Priorities, Priorities↔KPIs.</p>
        ) : rowItems.length === 0 || colItems.length === 0 ? (
          <p className="text-sm text-muted-foreground">Add items to both layers to see the correlation grid.</p>
        ) : (
          <>
            <div className="flex gap-4 text-xs text-muted-foreground mb-2">
              <span>● Strong</span><span>◑ Medium</span><span>○ Weak</span><span>– None</span>
              {canEdit && <span className="italic">Click cells to cycle</span>}
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[140px]" />
                    {colItems.map((b: any) => (
                      <TableHead key={b.id} className="text-center text-xs min-w-[80px] max-w-[120px]">
                        <div className="[writing-mode:vertical-rl] rotate-180 mx-auto whitespace-nowrap">
                          {b.title || b.name}
                        </div>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rowItems.map((a: any) => (
                    <TableRow key={a.id}>
                      <TableCell className="text-xs font-medium">{a.title || a.name}</TableCell>
                      {colItems.map((b: any) => {
                        const s = getStrength(a.id, b.id);
                        return (
                          <TableCell
                            key={b.id}
                            className={cn(
                              "text-center text-lg cursor-pointer select-none transition-colors border",
                              strengthColor(s),
                              strengthTextColor(s),
                              canEdit && "hover:ring-2 hover:ring-primary/30"
                            )}
                            onClick={() => handleCellClick(a.id, b.id)}
                          >
                            {strengthSymbol(s)}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default CorrelationGrid;
export { CORR_TABLE_MAP, getColKey, STRENGTHS };
