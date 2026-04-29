/**
 * Receipt Scanning Service
 * Supports: Indomaret, Alfamart, warung, restaurant, etc.
 *
 * Key format handled:
 *   "NAMA BARANG    QTY  HARGA/PCS   JUMLAH"   ← Indomaret (no 'x')
 *   "NAMA BARANG  QTY x HARGA   TOTAL"          ← Mini-market / warung
 *   "NAMA BARANG              HARGA"             ← Restaurant / simple
 */

import apiClient from "./api";

export interface ReceiptData {
  items: ReceiptItem[];
  totalAmount: number | null;
  subtotal: number | null;
  tax: number | null;
  date: string | null;
  storeName: string | null;
  rawText: string;
  confidence: number;
  error?: string;
}

export interface ReceiptItem {
  description: string;
  qty: number | null;
  unitPrice: number | null;
  amount: number | null;
}

export async function initializeOCR() {
  return;
}

// ─── Image Preprocessing (web only) ──────────────────────────────────────────
async function preprocessImage(imageUri: string): Promise<string> {
  if (typeof document === "undefined") return imageUri;

  return new Promise((resolve) => {
    const img = new Image();

    img.onload = () => {
      const canvas = document.createElement("canvas");
      // Increase to 2400px so Tesseract gets more detail
      const maxSide = Math.max(img.width, img.height);
      const scale = Math.min(1, 2400 / maxSide);

      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);

      const ctx = canvas.getContext("2d");
      if (!ctx) { resolve(imageUri); return; }

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        // Grayscale
        const gray = Math.round(
          0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2],
        );
        // Increase contrast (stretch histogram) instead of hard binarize
        // This preserves detail that Tesseract uses for LSTM training
        const enhanced = Math.min(255, Math.max(0, (gray - 100) * 1.6));
        data[i] = enhanced;
        data[i + 1] = enhanced;
        data[i + 2] = enhanced;
      }

      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };

    img.onerror = () => resolve(imageUri);
    img.src = imageUri;
  });
}

// ─── Main entry ───────────────────────────────────────────────────────────────
export async function processReceiptImage(
  imageUri: string,
): Promise<ReceiptData> {
  try {
    console.log("Processing receipt image...");
    const processedUri = await preprocessImage(imageUri);
    const { rawText, confidence } = await requestOcrText(processedUri);
    if (!rawText?.trim()) {
      return emptyResult("Tidak ada teks yang terdeteksi pada gambar");
    }
    console.log("Raw OCR text:\n", rawText);
    return parseReceiptText(rawText, confidence);
  } catch (error: any) {
    const msg = error?.message || "Gagal memproses gambar struk";
    return emptyResult(msg);
  }
}

// ─── API call ─────────────────────────────────────────────────────────────────
async function requestOcrText(
  imageUri: string,
): Promise<{ rawText: string; confidence: number }> {
  try {
    const formData = new FormData();

    if (typeof document !== "undefined") {
      const response = await fetch(imageUri);
      const blob = await response.blob();
      formData.append("image", blob, "receipt.png");
    } else {
      const ext = imageUri.split(".").pop()?.toLowerCase() ?? "jpg";
      const mimeType = ext === "png" ? "image/png" : "image/jpeg";
      const fileName = ext === "png" ? "receipt.png" : "receipt.jpg";
      formData.append("image", { uri: imageUri, name: fileName, type: mimeType } as any);
    }

    const result = await apiClient.post("/receipts/scan", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 90000,
    });

    const d = result?.data?.data;
    if (!d) return { rawText: "", confidence: 0 };

    const rawText = d.raw_text || d.rawText || "";
    const confidence = typeof d.confidence === "number" ? d.confidence : 0;
    console.log(`OCR: ${rawText.length} chars, confidence: ${confidence}%`);
    return { rawText: String(rawText), confidence };
  } catch (error: any) {
    const status = error?.response?.status;
    const msg = error?.response?.data?.error || error?.response?.data?.message || "";

    if (status === 500) throw new Error(msg ? `OCR error: ${msg}` : "Server error saat memproses gambar");
    if (status === 400) throw new Error(msg || "Format gambar tidak valid");
    if (status === 401) throw new Error("Sesi habis, silakan login ulang");
    if (error?.code === "ECONNABORTED") throw new Error("Timeout — coba gambar lebih kecil / cahaya lebih terang");
    if (error?.message === "Network Error" || error?.code === "ECONNREFUSED")
      throw new Error("Tidak dapat terhubung ke server. Pastikan backend berjalan.");
    throw error;
  }
}

// ─── OCR text normalisation ───────────────────────────────────────────────────
/**
 * Clean up common Tesseract (eng) mis-reads on Indonesian receipts.
 */
function normalizeText(text: string): string {
  return text
    // Hard spaces → normal spaces
    .replace(/\u00a0/g, " ")
    // Various dash chars → hyphen
    .replace(/[—–]/g, "-")
    // Vertical bar misread as I
    .replace(/\|/g, "I")
    // OCR sometimes adds stray ~ or ` around numbers
    .replace(/[`~]/g, "")
    // Collapse multiple spaces to single (preserve line breaks)
    .replace(/[ \t]+/g, " ")
    // Trim each line
    .split("\n")
    .map((l) => l.trim())
    .join("\n");
}

// ─── Number helpers ───────────────────────────────────────────────────────────

/**
 * Parse an Indonesian-format number string to a JS number.
 * Handles: "3.500", "25.000", "1.000.000", "25,50", "1.000.000,50"
 * Also handles OCR artifact: "3 500" (space as thousands sep)
 */
function parseNum(raw: string): number | null {
  if (!raw) return null;
  let s = raw.trim().replace(/^Rp\.?\s*/i, "").replace(/\s/g, "");
  if (!s || !/\d/.test(s)) return null;

  const dots = (s.match(/\./g) ?? []).length;
  const commas = (s.match(/,/g) ?? []).length;
  const lastDot = s.lastIndexOf(".");
  const lastComma = s.lastIndexOf(",");

  if (!dots && !commas) {
    const n = parseInt(s, 10);
    return isNaN(n) ? null : n;
  }
  if (lastComma > lastDot) {
    // 1.000,50 → decimal comma
    s = s.replace(/\./g, "").replace(",", ".");
  } else {
    if (dots === 1 && !commas && s.slice(lastDot + 1).length === 3) {
      // 25.000 → thousands dot
      s = s.replace(".", "");
    } else if (dots > 1) {
      // 1.000.000 → strip all dots
      s = s.replace(/\./g, "").replace(/,/g, "");
    }
    // else single dot with 1-2 decimals → real decimal, leave it
  }

  const v = parseFloat(s);
  return isNaN(v) ? null : Math.round(v);
}

/** Find all number-like tokens in a line and return their parsed values + positions. */
interface Token { raw: string; val: number; start: number }

function findNumTokens(line: string): Token[] {
  const tokens: Token[] = [];
  // Match: 1.000.000 / 25.000 / 3,500 / 25000 — at least 3 digits total
  const re = /(?<!\w)([\d]{1,3}(?:[.,]\d{3})*(?:[.,]\d{1,2})?|\d+)(?!\w)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(line)) !== null) {
    const val = parseNum(m[1]);
    if (val !== null && val > 0) tokens.push({ raw: m[1], val, start: m.index });
  }
  return tokens;
}

// ─── Store name ───────────────────────────────────────────────────────────────
const KNOWN_STORES = [
  "INDOMARET", "ALFAMART", "ALFAMIDI", "CIRCLE K",
  "LAWSON", "FAMILY MART", "MINIMARKET", "SUPERMARKET",
  "HYPERMART", "TRANSMART", "CARREFOUR", "GIANT",
  "HERO", "SUPERINDO", "LOTTEMART", "MCDONALD",
  "KFC", "PIZZA HUT", "STARBUCKS", "DOMINO",
];

function extractStoreName(lines: string[]): string | null {
  // First check top 5 lines for known brands
  const top5 = lines.slice(0, 5).map((l) => l.toUpperCase());
  for (const store of KNOWN_STORES) {
    if (top5.some((l) => l.includes(store))) return store;
  }
  // Fallback: first line that is all-caps text without long numbers
  const candidate = lines
    .slice(0, 5)
    .find((l) => !/\d{5,}/.test(l) && !/\d{1,2}[/\-]\d{1,2}/.test(l) && l.length >= 3);
  return candidate ?? null;
}

// ─── Date ─────────────────────────────────────────────────────────────────────
function extractDate(text: string): string | null {
  const patterns = [
    /(\d{1,2}[/\-.]\d{1,2}[/\-.]\d{2,4})/,
    /(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|Mei|May|Jun|Jul|Agu|Aug|Sep|Okt|Oct|Nov|Des|Dec)\w*\s+\d{2,4})/i,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) return m[1];
  }
  return null;
}

// ─── Financials ───────────────────────────────────────────────────────────────
function extractFinancials(text: string, lines: string[]) {
  const textLow = text.toLowerCase();

  const totalPatterns: RegExp[] = [
    /grand\s*total\s*[:\s]*([\d.,]+)/i,
    /total\s+bayar\s*[:\s]*([\d.,]+)/i,
    /total\s+belanja\s*[:\s]*([\d.,]+)/i,
    /(?<!\w)total\s*[:\s]*([\d.,]+)/i,
    /jumlah\s*(?:yang\s+)?(?:harus\s+)?dibayar\s*[:\s]*([\d.,]+)/i,
    /(?<!\w)jumlah\s*[:\s]*([\d.,]+)/i,
    /tagihan\s*[:\s]*([\d.,]+)/i,
    /bayar\s*[:\s]*([\d.,]+)/i,
    /amount\s+due\s*[:\s]*([\d.,]+)/i,
  ];

  const subtotalPatterns: RegExp[] = [
    /sub\s*total\s*[:\s]*([\d.,]+)/i,
    /subtotal\s*[:\s]*([\d.,]+)/i,
  ];

  const taxPatterns: RegExp[] = [
    /(?:ppn|pajak|tax)\s*(?:\d+\s*%?)?\s*[:\s]*([\d.,]+)/i,
  ];

  const tryPatterns = (patterns: RegExp[]): number | null => {
    for (const p of patterns) {
      const m = text.match(p);
      if (m?.[1]) {
        const v = parseNum(m[1]);
        if (v && v >= 100) return v;
      }
    }
    return null;
  };

  let totalAmount = tryPatterns(totalPatterns);
  const subtotal   = tryPatterns(subtotalPatterns);
  const tax        = tryPatterns(taxPatterns);

  // Fallback 1: scan lines that contain "total/jumlah/bayar" keyword
  if (!totalAmount) {
    for (const line of lines) {
      if (/\b(total|jumlah|bayar|tagihan)\b/i.test(line)) {
        const tokens = findNumTokens(line);
        const big = tokens.filter((t) => t.val >= 1000);
        if (big.length > 0) {
          totalAmount = Math.max(...big.map((t) => t.val));
          break;
        }
      }
    }
  }

  // Fallback 2: TUNAI (cash) can tell us total (total = tunai - kembali)
  if (!totalAmount) {
    const tunaiMatch = text.match(/tunai\s*[:\s]*([\d.,]+)/i);
    const kembaliMatch = text.match(/kembali\s*[:\s]*([\d.,]+)/i);
    if (tunaiMatch && kembaliMatch) {
      const tunai = parseNum(tunaiMatch[1]);
      const kembali = parseNum(kembaliMatch[1]);
      if (tunai && kembali) totalAmount = tunai - kembali;
    }
  }

  // Fallback 3: largest number in the whole text
  if (!totalAmount) {
    const allNums = findNumTokens(text).filter((t) => t.val >= 1000);
    if (allNums.length > 0) totalAmount = Math.max(...allNums.map((t) => t.val));
  }

  return { totalAmount, subtotal, tax };
}

// ─── Item extraction ──────────────────────────────────────────────────────────

/** Keywords that appear on non-item lines — use exact-word matching */
const NON_ITEM_EXACT: string[] = [
  "total", "grand total", "sub total", "subtotal",
  "jumlah", "jumlah bayar", "total bayar", "tagihan",
  "pembayaran", "bayar", "kembali", "kembalian",
  "tunai", "cash", "debit", "kredit", "kartu",
  "ppn", "pajak", "tax", "diskon", "discount",
  "kasir", "operator", "pelayan", "pegawai",
  "toko", "cabang", "alamat", "jl", "jalan", "telp", "telepon", "hp",
  "no struk", "no.", "nomor", "struk",
  "tanggal", "tgl", "jam", "waktu", "date", "time",
  "terima kasih", "thank you", "selamat", "terimakasih",
  "member", "poin", "point", "saldo",
  "kode", "void", "refund", "exchange",
];

function isNonItemLine(line: string): boolean {
  const l = line.toLowerCase().trim();
  return NON_ITEM_EXACT.some((kw) => {
    // Exact match or starts-with (e.g. "total bayar 25.000" starts with "total")
    return l === kw || l.startsWith(kw + " ") || l.startsWith(kw + ":") || l === kw;
  });
}

function cleanDesc(s: string): string {
  return s
    .replace(/[*_=|\\^]/g, "")  // Remove OCR artifacts
    .replace(/\s+/g, " ")
    .trim()
    .substring(0, 60);
}

function extractItems(lines: string[], totalAmount: number | null): ReceiptItem[] {
  const items: ReceiptItem[] = [];
  const maxAmt = totalAmount ? totalAmount * 1.05 : Infinity;

  for (const line of lines) {
    if (line.length < 3) continue;
    if (isNonItemLine(line)) continue;

    const tokens = findNumTokens(line);
    if (tokens.length === 0) continue;

    // The last token is the line amount (total price for this item)
    const lastTok = tokens[tokens.length - 1];
    const amount = lastTok.val;

    // Skip if amount looks like a date/code or is unreasonably large
    if (amount < 100 || amount >= maxAmt) continue;

    // Description = text before the first numeric token
    const descRaw = line.substring(0, tokens[0].start).trim();
    const desc = cleanDesc(descRaw);

    // Must have at least 2 chars and not be purely numeric
    if (desc.length < 2 || /^\d+$/.test(desc)) continue;

    // ── Pattern A: NAME  QTY x UNIT  TOTAL ──────────────────────────────────
    // e.g. "AQUA 600ML 2 x 3.500 7.000"
    const pA = /^(.+?)\s+(\d{1,3})\s*[xX@]\s*([\d.,]+)\s+([\d.,]+)\s*$/.exec(line);
    if (pA) {
      const d = cleanDesc(pA[1]);
      const qty = parseInt(pA[2]);
      const unit = parseNum(pA[3]);
      const amt = parseNum(pA[4]);
      if (d.length >= 2 && amt && amt < maxAmt) {
        items.push({ description: d, qty, unitPrice: unit, amount: amt });
        continue;
      }
    }

    // ── Pattern B: NAME  QTY  UNIT  TOTAL (Indomaret style, no 'x') ─────────
    // e.g. "INDOMIE GRG 2 2.800 5.600"
    // Validate by checking qty*unit ≈ total
    if (tokens.length >= 3) {
      const potQty  = tokens[tokens.length - 3].val;
      const potUnit = tokens[tokens.length - 2].val;

      if (
        Number.isInteger(potQty) && potQty >= 1 && potQty <= 99 &&
        potUnit >= 100
      ) {
        const expected = potQty * potUnit;
        if (Math.abs(expected - amount) / Math.max(amount, 1) <= 0.06) {
          items.push({ description: desc, qty: potQty, unitPrice: potUnit, amount });
          continue;
        }
      }
    }

    // ── Pattern C: NAME  QTY  TOTAL (unit price = total / qty) ──────────────
    if (tokens.length >= 2) {
      const potQty = tokens[tokens.length - 2].val;
      if (Number.isInteger(potQty) && potQty >= 1 && potQty <= 99) {
        const unit = Math.round(amount / potQty);
        items.push({ description: desc, qty: potQty, unitPrice: unit, amount });
        continue;
      }
    }

    // ── Pattern D: NAME  TOTAL (simple / restaurant) ─────────────────────────
    // Accept if amount is reasonable
    if (amount >= 500) {
      items.push({ description: desc, qty: null, unitPrice: null, amount });
    }
  }

  // Deduplicate on description
  const seen = new Set<string>();
  return items
    .filter((item) => {
      if (seen.has(item.description)) return false;
      seen.add(item.description);
      return true;
    })
    .slice(0, 25);
}

// ─── Main parser ──────────────────────────────────────────────────────────────
function parseReceiptText(rawText: string, confidence: number): ReceiptData {
  const text = normalizeText(rawText);
  const lines = text.split("\n").filter((l) => l.length > 1);

  const storeName = extractStoreName(lines);
  const date = extractDate(text);
  const { totalAmount, subtotal, tax } = extractFinancials(text, lines);
  const items = extractItems(lines, totalAmount);

  return { items, totalAmount, subtotal, tax, date, storeName, rawText, confidence };
}

function emptyResult(error?: string): ReceiptData {
  return { items: [], totalAmount: null, subtotal: null, tax: null, date: null, storeName: null, rawText: "", confidence: 0, error };
}
