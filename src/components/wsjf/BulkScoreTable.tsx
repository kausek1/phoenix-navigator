import { useRef, useCallback } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

const FIBONACCI = ["1", "2", "3", "5", "8", "10", "13"];
const SCORE_FIELDS = ["business_roi", "planet_impact", "people_impact", "time_to_deploy"] as const;
const SCORE_LABELS = ["Biz ROI", "Planet", "People", "TTD"];

const calcWSJF = (r: any) => {
  const cost = (Number(r.business_roi) || 0) + (Number(r.planet_impact) || 0) + (Number(r.people_impact) || 0);
  return cost / (Number(r.time_to_deploy) || 1);
};

interface Props {
  interventions: any[];
  onScoreChange: (id: string, field: string, value: string) => void;
}

const BulkScoreTable = ({ interventions, onScoreChange }: Props) => {
  const sorted = [...interventions].sort((a, b) => calcWSJF(b) - calcWSJF(a));

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>#</TableHead>
          <TableHead>Title</TableHead>
          {SCORE_LABELS.map((l) => <TableHead key={l}>{l}</TableHead>)}
          <TableHead>WSJF</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sorted.map((r, i) => (
          <TableRow key={r.id}>
            <TableCell className="font-bold text-primary">{i + 1}</TableCell>
            <TableCell className="font-medium max-w-[200px] truncate">{r.title}</TableCell>
            {SCORE_FIELDS.map((field) => (
              <TableCell key={field}>
                <Select
                  value={String(r[field] || 1)}
                  onValueChange={(v) => onScoreChange(r.id, field, v)}
                >
                  <SelectTrigger className="w-16 h-8"><SelectValue /></SelectTrigger>
                  <SelectContent>{FIBONACCI.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                </Select>
              </TableCell>
            ))}
            <TableCell>
              <Badge className="bg-primary text-primary-foreground">{calcWSJF(r).toFixed(2)}</Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default BulkScoreTable;
