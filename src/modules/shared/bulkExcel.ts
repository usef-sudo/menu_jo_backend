import ExcelJS from "exceljs";
import type { Request, Response } from "express";
import multer from "multer";

export const MAX_BULK_ROWS = 200;

export type BulkColumn = {
  key: string;
  required?: boolean;
  note: string;
  width?: number;
};

export type LookupSheet = {
  name: string;
  headers: string[];
  rows: Array<Array<string | number>>;
};

const HEADER_ALIASES: Record<string, string> = {
  nameen: "nameEn",
  namear: "nameAr",
  descriptionen: "descriptionEn",
  descriptionar: "descriptionAr",
  phone: "phone",
  websiteurl: "websiteUrl",
  instagramurl: "instagramUrl",
  facebookurl: "facebookUrl",
  talabaturl: "talabatUrl",
  careemurl: "careemUrl",
  restaurantiden: "restaurantId",
  restaurantid: "restaurantId",
  restaurantnameen: "restaurantNameEn",
  restaurantname: "restaurantNameEn",
  restaurant: "restaurantNameEn",
  areaid: "areaId",
  areanameen: "areaNameEn",
  areaname: "areaNameEn",
  area: "areaNameEn",
  address: "address",
  latitude: "latitude",
  lat: "latitude",
  longitude: "longitude",
  lng: "longitude",
  lon: "longitude",
  costlevel: "costLevel",
  isopen: "isOpen",
  opentime: "openTime",
  closetime: "closeTime",
};

function normalizeHeader(raw: string): string {
  return raw.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function canonicalHeader(raw: string): string {
  const key = normalizeHeader(raw);
  return HEADER_ALIASES[key] ?? raw.trim();
}

function cellText(value: ExcelJS.CellValue): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value).trim();
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (typeof value === "object" && "text" in value && typeof value.text === "string") {
    return value.text.trim();
  }
  if (typeof value === "object" && "richText" in value && Array.isArray(value.richText)) {
    return value.richText.map((p) => p.text ?? "").join("").trim();
  }
  if (typeof value === "object" && "result" in value) {
    return cellText(value.result as ExcelJS.CellValue);
  }
  return String(value).trim();
}

export async function buildBulkTemplate(options: {
  sheetName: string;
  columns: BulkColumn[];
  lookupSheets?: LookupSheet[];
}): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Menu admin";
  wb.created = new Date();

  const instructions = wb.addWorksheet("instructions");
  instructions.columns = [
    { width: 22 },
    { width: 12 },
    { width: 72 },
  ];
  const instructHeader = instructions.addRow(["column", "required", "description"]);
  instructHeader.font = { bold: true };
  for (const col of options.columns) {
    instructions.addRow([
      col.key,
      col.required ? "yes" : "no",
      col.note,
    ]);
  }
  instructions.addRow([]);
  instructions.addRow([
    "How to use",
    "",
    `Fill the "${options.sheetName}" sheet. Do not rename the header row. Empty rows are ignored. Max ${MAX_BULK_ROWS} rows.`,
  ]);

  const data = wb.addWorksheet(options.sheetName);
  data.columns = options.columns.map((col) => ({
    header: col.key,
    key: col.key,
    width: col.width ?? 22,
  }));
  data.getRow(1).font = { bold: true };
  data.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFE8EEF7" },
  };
  data.views = [{ state: "frozen", ySplit: 1 }];

  for (const extra of options.lookupSheets ?? []) {
    const sheet = wb.addWorksheet(extra.name);
    sheet.addRow(extra.headers).font = { bold: true };
    for (const row of extra.rows) {
      sheet.addRow(row);
    }
    sheet.views = [{ state: "frozen", ySplit: 1 }];
  }

  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf);
}

export function sendExcel(res: Response, filename: string, buffer: Buffer) {
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  );
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${filename}"`,
  );
  res.send(buffer);
}

export async function parseBulkExcel(
  buffer: Buffer,
  preferredSheet: string,
): Promise<Array<Record<string, string>>> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer as unknown as ExcelJS.Buffer);

  const skip = new Set(["instructions", "restaurants_lookup", "areas_lookup"]);
  const sheet =
    wb.getWorksheet(preferredSheet) ??
    wb.worksheets.find((s) => !skip.has(s.name.toLowerCase())) ??
    wb.worksheets[0];
  if (!sheet) {
    throw new Error("The Excel file has no worksheets");
  }

  const headerRow = sheet.getRow(1);
  const headers: string[] = [];
  headerRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
    headers[colNumber - 1] = canonicalHeader(cellText(cell.value));
  });
  if (!headers.some((h) => h.trim() !== "")) {
    throw new Error("The first row must contain column headers");
  }

  const rows: Array<Record<string, string>> = [];
  sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) return;
    const item: Record<string, string> = {};
    let any = false;
    headers.forEach((header, index) => {
      if (!header) return;
      const value = cellText(row.getCell(index + 1).value);
      if (value) any = true;
      item[header] = value;
    });
    if (any) rows.push(item);
  });

  if (rows.length === 0) {
    throw new Error("No data rows found. Fill at least one row under the header.");
  }
  if (rows.length > MAX_BULK_ROWS) {
    throw new Error(`At most ${MAX_BULK_ROWS} rows per file`);
  }
  return rows;
}

export const bulkExcelUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req: Request, file, cb) => {
    const name = (file.originalname || "").toLowerCase();
    if (name.endsWith(".xlsx")) {
      cb(null, true);
      return;
    }
    cb(new Error("Only .xlsx Excel files are allowed"));
  },
}).single("file");

export function runBulkExcelUpload(
  req: Request,
  res: Response,
): Promise<Express.Multer.File> {
  return new Promise((resolve, reject) => {
    bulkExcelUpload(req, res, (err: unknown) => {
      if (err) {
        reject(err);
        return;
      }
      if (!req.file) {
        reject(new Error("Upload an .xlsx file in the file field"));
        return;
      }
      resolve(req.file);
    });
  });
}
