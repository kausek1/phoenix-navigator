import ExcelJS from "exceljs";
import { supabase } from "@/integrations/supabase/client";
import { CORR_TABLE_MAP } from "./CorrelationGrid";

interface ExportParams {
  data: Record<string, any[]>;
  clientName: string;
  clientId: string;
}

export const exportXMatrix = async ({ data, clientName, clientId }: ExportParams) => {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("X-Matrix");

  const dateStr = new Date().toISOString().slice(0, 10);

  // Header
  ws.mergeCells("A1:F1");
  const header = ws.getCell("A1");
  header.value = `PHOENIX X-Matrix — ${clientName}`;
  header.font = { bold: true, size: 14 };
  ws.getCell("A2").value = `Export Date: ${dateStr}`;
  ws.getCell("A2").font = { italic: true, size: 10, color: { argb: "FF666666" } };

  // Helper to write a section
  const writeSection = (label: string, items: any[], startRow: number, nameKey: string) => {
    ws.mergeCells(startRow, 1, startRow, 3);
    const cell = ws.getCell(startRow, 1);
    cell.value = label;
    cell.font = { bold: true, size: 12 };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE2E8F0" } };
    items.forEach((item, i) => {
      ws.getCell(startRow + 1 + i, 1).value = item[nameKey];
    });
    return startRow + 1 + items.length + 1;
  };

  let row = 4;
  row = writeSection("Long-term Goals", data.goals, row, "title");
  row = writeSection("Annual Objectives", data.objectives, row, "title");
  row = writeSection("Improvement Priorities", data.priorities, row, "title");
  row = writeSection("KPIs", data.kpis, row, "name");

  // Fetch all correlations for export
  const corrPairs = [
    { key: "goals-objectives", rowData: data.goals, colData: data.objectives, rowKey: "goal_id", colKey: "objective_id", label: "Goals → Objectives" },
    { key: "objectives-priorities", rowData: data.objectives, colData: data.priorities, rowKey: "objective_id", colKey: "priority_id", label: "Objectives → Priorities" },
    { key: "priorities-kpis", rowData: data.priorities, colData: data.kpis, rowKey: "priority_id", colKey: "kpi_id", label: "Priorities → KPIs" },
  ];

  for (const pair of corrPairs) {
    const table = CORR_TABLE_MAP[pair.key];
    if (!table) continue;
    const { data: corrs } = await supabase.from(table).select("*");
    if (!corrs) continue;

    row += 1;
    ws.mergeCells(row, 1, row, pair.colData.length + 1);
    const titleCell = ws.getCell(row, 1);
    titleCell.value = `Correlation Matrix: ${pair.label}`;
    titleCell.font = { bold: true, size: 11 };
    titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFDBEAFE" } };

    // Column headers (rotated)
    row += 1;
    pair.colData.forEach((col, ci) => {
      const c = ws.getCell(row, ci + 2);
      c.value = col.title || col.name;
      c.alignment = { textRotation: 90, horizontal: "center", vertical: "bottom" };
      c.font = { bold: true, size: 9 };
    });

    // Data rows
    pair.rowData.forEach((r, ri) => {
      ws.getCell(row + 1 + ri, 1).value = r.title || r.name;
      ws.getCell(row + 1 + ri, 1).font = { size: 9 };
      pair.colData.forEach((col, ci) => {
        const corr = corrs.find((c: any) => c[pair.rowKey] === r.id && c[pair.colKey] === col.id);
        const cell = ws.getCell(row + 1 + ri, ci + 2);
        if (corr) {
          const symbol = corr.strength === "strong" ? "●" : corr.strength === "medium" ? "◑" : "○";
          cell.value = symbol;
          const fillColor = corr.strength === "strong" ? "FFC6F6D5" : corr.strength === "medium" ? "FFFFFBCC" : "FFE2E8F0";
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: fillColor } };
        } else {
          cell.value = "–";
        }
        cell.alignment = { horizontal: "center" };
      });
    });

    row += 1 + pair.rowData.length + 1;
  }

  // Auto-fit columns
  ws.columns.forEach((col) => {
    let maxLen = 10;
    col.eachCell?.({ includeEmpty: false }, (cell) => {
      const len = String(cell.value || "").length;
      if (len > maxLen) maxLen = len;
    });
    col.width = Math.min(maxLen + 2, 40);
  });
  // First column wider for labels
  ws.getColumn(1).width = 30;

  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `PHOENIX_XMatrix_${clientName || "export"}_${dateStr}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
};
