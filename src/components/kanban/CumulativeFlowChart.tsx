import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { BarChart3 } from "lucide-react";

const STAGES = ["scoping", "business_case", "funded", "in_delivery", "commissioned", "verified"];
const STAGE_LABELS: Record<string, string> = {
  scoping: "Scoping", business_case: "Business Case", funded: "Funded",
  in_delivery: "In Delivery", commissioned: "Commissioned", verified: "Verified",
};
const STAGE_COLORS: Record<string, string> = {
  scoping: "#94a3b8", business_case: "#3b82f6", funded: "#8b5cf6",
  in_delivery: "#f59e0b", commissioned: "#22c55e", verified: "#16a34a",
};

interface Props {
  clientId: string;
  interventions: any[];
}

const CumulativeFlowChart = ({ clientId, interventions }: Props) => {
  const [transitions, setTransitions] = useState<any[]>([]);
  const [open, setOpen] = useState(false);

  const fetchTransitions = useCallback(async () => {
    const ninetyDaysAgo = new Date(Date.now() - 90 * 86400000).toISOString();
    const { data } = await supabase
      .from("kanban_stage_transitions")
      .select("intervention_id, to_stage, changed_at")
      .gte("changed_at", ninetyDaysAgo)
      .order("changed_at", { ascending: true });
    setTransitions(data || []);
  }, [clientId]);

  useEffect(() => { if (open) fetchTransitions(); }, [open, fetchTransitions]);

  const chartData = useMemo(() => {
    const now = new Date();
    const weeks: Date[] = [];
    for (let i = 12; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 7 * 86400000);
      d.setHours(0, 0, 0, 0);
      weeks.push(d);
    }

    // Build snapshot: for each week, figure out what stage each intervention was in
    return weeks.map((weekDate) => {
      const stageCounts: Record<string, number> = {};
      STAGES.forEach((s) => { stageCounts[s] = 0; });

      interventions.forEach((intv) => {
        // Find the last transition before this week date
        const relevant = transitions
          .filter((t) => t.intervention_id === intv.id && new Date(t.changed_at) <= weekDate)
          .sort((a, b) => new Date(b.changed_at).getTime() - new Date(a.changed_at).getTime());

        const stage = relevant.length > 0 ? relevant[0].to_stage : intv.stage;
        if (stageCounts[stage] !== undefined) stageCounts[stage]++;
      });

      return {
        date: weekDate.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        ...stageCounts,
      };
    });
  }, [transitions, interventions]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm"><BarChart3 className="h-4 w-4 mr-1" />Flow Chart</Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader><DialogTitle>Cumulative Flow Diagram (90 days)</DialogTitle></DialogHeader>
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={chartData}>
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Legend />
            {STAGES.map((stage) => (
              <Area
                key={stage}
                type="monotone"
                dataKey={stage}
                name={STAGE_LABELS[stage]}
                stackId="1"
                fill={STAGE_COLORS[stage]}
                stroke={STAGE_COLORS[stage]}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </DialogContent>
    </Dialog>
  );
};

export default CumulativeFlowChart;
