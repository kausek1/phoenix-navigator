import { ScatterChart, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Label as ReLabel } from "recharts";

const STAGE_COLORS: Record<string, string> = {
  scoping: "#94a3b8",
  business_case: "#3b82f6",
  funded: "#8b5cf6",
  in_delivery: "#f59e0b",
  commissioned: "#22c55e",
  verified: "#16a34a",
};

const formatCost = (v: number) => {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v}`;
};

const calcWSJF = (r: any) => {
  const cost = (Number(r.business_roi) || 0) + (Number(r.planet_impact) || 0) + (Number(r.people_impact) || 0);
  return cost / (Number(r.time_to_deploy) || 1);
};

interface Props {
  data: any[];
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.[0]) return null;
  const r = payload[0].payload;
  return (
    <div className="rounded-lg border bg-popover p-3 shadow-md text-sm space-y-1">
      <p className="font-semibold">{r.title}</p>
      <p>WSJF: {r.wsjf.toFixed(2)}</p>
      <p>Business ROI: {r.business_roi || 1} | Planet: {r.planet_impact || 1} | People: {r.people_impact || 1}</p>
      <p>Time to Deploy: {r.time_to_deploy || 1}</p>
      <p>Est. Cost: {r.estimated_cost ? formatCost(r.estimated_cost) : "—"}</p>
      <p>CO₂ Reduction: {r.estimated_co2_reduction ? `${r.estimated_co2_reduction} tCO₂e` : "—"}</p>
    </div>
  );
};

const WSJFScatterChart = ({ data }: Props) => {
  const chartData = data.map((r) => ({
    ...r,
    wsjf: calcWSJF(r),
    cost: Number(r.estimated_cost) || 0,
    co2: Number(r.estimated_co2_reduction) || 1,
    label: (r.title || "").slice(0, 20),
  }));

  const maxCo2 = Math.max(...chartData.map((d) => d.co2), 1);

  return (
    <ResponsiveContainer width="100%" height={450}>
      <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 20 }}>
        <XAxis type="number" dataKey="wsjf" name="WSJF Score">
          <ReLabel value="WSJF Score" offset={-10} position="insideBottom" />
        </XAxis>
        <YAxis type="number" dataKey="cost" name="Est. Cost" tickFormatter={formatCost}>
          <ReLabel value="Estimated Cost" angle={-90} position="insideLeft" style={{ textAnchor: "middle" }} />
        </YAxis>
        <Tooltip content={<CustomTooltip />} />
        <Scatter data={chartData} nameKey="label">
          {chartData.map((entry, idx) => (
            <Cell
              key={idx}
              fill={STAGE_COLORS[entry.stage] || "#94a3b8"}
              r={Math.max(6, (entry.co2 / maxCo2) * 24)}
            />
          ))}
        </Scatter>
      </ScatterChart>
    </ResponsiveContainer>
  );
};

export default WSJFScatterChart;
