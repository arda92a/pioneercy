import ExcelJS from "exceljs";

export function addSheet(wb: ExcelJS.Workbook, name: string, headers: string[], rows: unknown[][]) {
  const ws = wb.addWorksheet(name, { views: [{ state: "frozen", ySplit: 1 }] });
  ws.addRow(headers);
  for (const row of rows) ws.addRow(row);
  const head = ws.getRow(1);
  head.font = { bold: true, color: { argb: "FFFFFFFF" } };
  head.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1A1A1A" } };
  head.height = 22;
  ws.columns.forEach((col, i) => {
    let width = headers[i].length + 3;
    col.eachCell?.({ includeEmpty: false }, (c) => { width = Math.max(width, String(c.value ?? "").length + 2); });
    col.width = Math.min(Math.max(width, 10), 40);
  });
  if (rows.length) ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: headers.length } };
  return ws;
}

export async function excelResponse(wb: ExcelJS.Workbook, fileName: string) {
  const buffer = await wb.xlsx.writeBuffer();
  return new Response(buffer as ArrayBuffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${fileName}"`,
    },
  });
}

/** Kuruş → Excel'de sayı olarak görünen tutar. */
export const money = (cents: number | null | undefined) => (cents === null || cents === undefined ? null : cents / 100);
