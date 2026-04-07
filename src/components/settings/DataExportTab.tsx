import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download } from "lucide-react";
import { toast } from "sonner";

const exportTables = [
  { label: "Interventions", table: "interventions", filename: "Interventions" },
  { label: "Emissions", table: "emissions", filename: "Emissions" },
  { label: "Energy Consumption", table: "energy_consumption", filename: "EnergyConsumption" },
  { label: "Assets", table: "assets", filename: "Assets" },
];

interface Props { clientId: string; clientSlug: string }

const DataExportTab = ({ clientId, clientSlug }: Props) => {

  const downloadCSV = async (table: string, filename: string) => {
    let query;
    if (table === "emissions" || table === "energy_consumption") {
      // These link via asset_id, not client_id directly
      const { data: assets } = await supabase.from("assets").select("id").eq("client_id", clientId);
      const ids = (assets || []).map((a) => a.id);
      if (ids.length === 0) { toast.info("No data to export"); return; }
      const { data, error } = await supabase.from(table).select("*").in("asset_id", ids);
      if (error) { toast.error(error.message); return; }
      generateCSV(data || [], filename);
    } else {
      const { data, error } = await supabase.from(table).select("*").eq("client_id", clientId);
      if (error) { toast.error(error.message); return; }
      generateCSV(data || [], filename);
    }
  };

  const generateCSV = (rows: any[], filename: string) => {
    if (rows.length === 0) { toast.info("No data to export"); return; }
    const headers = Object.keys(rows[0]);
    const csv = [
      headers.join(","),
      ...rows.map((r) =>
        headers.map((h) => {
          const val = r[h];
          if (val === null || val === undefined) return "";
          const str = String(val);
          return str.includes(",") || str.includes('"') || str.includes("\n")
            ? `"${str.replace(/"/g, '""')}"`
            : str;
        }).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `PHOENIX_${filename}_${clientSlug}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${filename} exported`);
  };

  return (
    <Card>
      <CardHeader><CardTitle className="text-lg">Data Export</CardTitle></CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {exportTables.map((t) => (
            <Button key={t.table} variant="outline" className="justify-start" onClick={() => downloadCSV(t.table, t.filename)}>
              <Download className="h-4 w-4 mr-2" />Export {t.label}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default DataExportTab;
