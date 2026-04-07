import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Upload, AlertTriangle, Check } from "lucide-react";
import { toast } from "sonner";

interface Asset {
  id: string;
  name: string;
}

interface Props {
  assets: Asset[];
  onImported: () => void;
}

interface ParsedRow {
  asset_name: string;
  fuel_type: string;
  period_start: string;
  period_end: string;
  quantity: string;
  unit: string;
  cost: string;
  asset_id?: string;
  valid: boolean;
  error?: string;
}

const CSV_TEMPLATE = "asset_name,fuel_type,period_start,period_end,quantity,unit,cost";

const CsvImport = ({ assets, onImported }: Props) => {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const parseCSV = (text: string) => {
    const lines = text.trim().split("\n");
    if (lines.length < 2) return [];
    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
    return lines.slice(1).map((line) => {
      const vals = line.split(",").map((v) => v.trim());
      const obj: any = {};
      headers.forEach((h, i) => { obj[h] = vals[i] || ""; });

      const asset = assets.find((a) => a.name.toLowerCase() === (obj.asset_name || "").toLowerCase());
      const valid = !!asset && !!obj.fuel_type && !!obj.quantity;
      return {
        ...obj,
        asset_id: asset?.id,
        valid,
        error: !asset ? "Unknown asset" : !obj.fuel_type ? "Missing fuel type" : !obj.quantity ? "Missing quantity" : undefined,
      } as ParsedRow;
    });
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setRows(parseCSV(text));
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    const validRows = rows.filter((r) => r.valid);
    if (validRows.length === 0) return;
    setImporting(true);
    const records = validRows.map((r) => ({
      asset_id: r.asset_id!,
      fuel_type: r.fuel_type,
      period_start: r.period_start || null,
      period_end: r.period_end || null,
      quantity: parseFloat(r.quantity),
      unit: r.unit || null,
      cost: r.cost ? parseFloat(r.cost) : null,
    }));
    const { error } = await supabase.from("energy_consumption").insert(records);
    setImporting(false);
    if (error) {
      toast.error("Import failed: " + error.message);
    } else {
      toast.success(`Imported ${validRows.length} records`);
      setRows([]);
      setOpen(false);
      onImported();
    }
  };

  const downloadTemplate = () => {
    const blob = new Blob([CSV_TEMPLATE + "\nBuilding A,electricity,2025-01-01,2025-03-31,15000,kWh,2400"], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "energy_import_template.csv";
    a.click();
  };

  const validCount = rows.filter((r) => r.valid).length;
  const invalidCount = rows.length - validCount;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm"><Upload className="h-4 w-4 mr-1" />Import Energy Data</Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Import Energy Data (CSV)</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="flex gap-2">
            <input ref={fileRef} type="file" accept=".csv" onChange={handleFile} className="text-sm" />
            <Button variant="ghost" size="sm" onClick={downloadTemplate}>Download Template</Button>
          </div>

          {rows.length > 0 && (
            <>
              <div className="flex gap-3 text-sm">
                <span className="text-green-600 flex items-center gap-1"><Check className="h-4 w-4" />{validCount} valid</span>
                {invalidCount > 0 && <span className="text-destructive flex items-center gap-1"><AlertTriangle className="h-4 w-4" />{invalidCount} errors</span>}
              </div>
              <div className="max-h-64 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Status</TableHead><TableHead>Asset</TableHead><TableHead>Fuel Type</TableHead>
                      <TableHead>Start</TableHead><TableHead>End</TableHead><TableHead>Qty</TableHead>
                      <TableHead>Unit</TableHead><TableHead>Cost</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((r, i) => (
                      <TableRow key={i} className={r.valid ? "" : "bg-destructive/5"}>
                        <TableCell>
                          {r.valid ? <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">OK</Badge>
                            : <Badge variant="destructive">{r.error}</Badge>}
                        </TableCell>
                        <TableCell>{r.asset_name}</TableCell><TableCell>{r.fuel_type}</TableCell>
                        <TableCell>{r.period_start}</TableCell><TableCell>{r.period_end}</TableCell>
                        <TableCell>{r.quantity}</TableCell><TableCell>{r.unit}</TableCell><TableCell>{r.cost}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <Button onClick={handleImport} disabled={validCount === 0 || importing}>
                {importing ? "Importing…" : `Import ${validCount} Records`}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CsvImport;
