/**
 * Receipt Scanning Service
 * Handles: Indomaret, Alfamart, warung, restaurant, café, minimarket, dll.
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

// ─── Image Preprocessing (web only) ─────────────────────────────────────────
async function preprocessImage(imageUri: string): Promise<string> {
  if (typeof document === "undefined") return imageUri;
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
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
        const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
        const enhanced = Math.min(255, Math.max(0, (gray - 90) * 1.7));
        data[i] = enhanced; data[i + 1] = enhanced; data[i + 2] = enhanced;
      }
      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => resolve(imageUri);
    img.src = imageUri;
  });
}

// ─── Main entry ──────────────────────────────────────────────────────────────
export async function processReceiptImage(imageUri: string): Promise<ReceiptData> {
  try {
    const processedUri = await preprocessImage(imageUri);
    const { rawText, confidence } = await requestOcrText(processedUri);
    if (!rawText?.trim()) return emptyResult("Tidak ada teks yang terdeteksi pada gambar");
    console.log("Raw OCR:\n", rawText);
    return parseReceiptText(rawText, confidence);
  } catch (error: any) {
    return emptyResult(error?.message || "Gagal memproses gambar struk");
  }
}

// ─── API Call ────────────────────────────────────────────────────────────────
async function requestOcrText(imageUri: string): Promise<{ rawText: string; confidence: number }> {
  try {
    const formData = new FormData();
    if (typeof document !== "undefined") {
      const response = await fetch(imageUri);
      const blob = await response.blob();
      formData.append("image", blob, "receipt.png");
    } else {
      const ext = imageUri.split(".").pop()?.toLowerCase() ?? "jpg";
      const mimeType = ext === "png" ? "image/png" : "image/jpeg";
      formData.append("image", { uri: imageUri, name: `receipt.${ext}`, type: mimeType } as any);
    }

    const result = await apiClient.post("/receipts/scan", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 90000,
    });

    const d = result?.data?.data;
    if (!d) return { rawText: "", confidence: 0 };
    const rawText = d.raw_text || d.rawText || "";
    const confidence = typeof d.confidence === "number" ? d.confidence : 0;
    return { rawText: String(rawText), confidence };
  } catch (error: any) {
    const status = error?.response?.status;
    const msg = error?.response?.data?.error || error?.response?.data?.message || "";
    if (status === 500) throw new Error(msg ? `OCR error: ${msg}` : "Server error saat memproses gambar");
    if (status === 400) throw new Error(msg || "Format gambar tidak valid");
    if (status === 401) throw new Error("Sesi habis, silakan login ulang");
    if (error?.code === "ECONNABORTED") throw new Error("Timeout — coba gambar lebih kecil");
    if (error?.message === "Network Error" || error?.code === "ECONNREFUSED")
      throw new Error("Tidak dapat terhubung ke server. Pastikan backend berjalan.");
    throw error;
  }
}

// ─── Normalization ───────────────────────────────────────────────────────────
function normalizeText(text: string): string {
  return text
    .replace(/\u00a0/g, " ")
    .replace(/[—–]/g, "-")
    .replace(/\|/g, "I")
    .replace(/[`~]/g, "")
    .replace(/[ \t]+/g, " ")
    .split("\n")
    .map((l) => l.trim())
    .join("\n");
}

// ─── Number Parser ───────────────────────────────────────────────────────────
function parseNum(raw: string): number | null {
  if (!raw) return null;
  let s = raw.trim()
    .replace(/^Rp\.?\s*/i, "")
    .replace(/\s/g, "")
    .replace(/[^\d.,]/g, "");
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
    s = s.replace(/\./g, "").replace(",", ".");
  } else {
    if (dots === 1 && !commas && s.slice(lastDot + 1).length === 3) {
      s = s.replace(".", "");
    } else if (dots > 1) {
      s = s.replace(/\./g, "").replace(/,/g, "");
    }
  }

  const v = parseFloat(s);
  return isNaN(v) ? null : Math.round(v);
}

interface NumToken { raw: string; val: number; start: number; end: number }

function findNumTokens(line: string): NumToken[] {
  const tokens: NumToken[] = [];
  const re = /(?<!\w)([\d]{1,3}(?:[.,]\d{3})*(?:[.,]\d{1,2})?|\d{4,})(?!\w)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(line)) !== null) {
    const val = parseNum(m[1]);
    if (val !== null && val > 0) {
      tokens.push({ raw: m[1], val, start: m.index, end: m.index + m[1].length });
    }
  }
  return tokens;
}

// ─── Store Name ──────────────────────────────────────────────────────────────
const KNOWN_STORES = [
  "INDOMARET", "ALFAMART", "ALFAMIDI", "CIRCLE K", "LAWSON",
  "FAMILY MART", "MINIMARKET", "SUPERMARKET", "HYPERMART",
  "TRANSMART", "CARREFOUR", "GIANT", "HERO", "SUPERINDO",
  "LOTTEMART", "MCDONALD", "KFC", "PIZZA HUT", "STARBUCKS",
  "DOMINO", "DUNKIN",
];

function extractStoreName(lines: string[]): string | null {
  const top5 = lines.slice(0, 5).map((l) => l.toUpperCase());
  for (const store of KNOWN_STORES) {
    if (top5.some((l) => l.includes(store))) return store;
  }
  const candidate = lines.slice(0, 5).find(
    (l) => !/\d{5,}/.test(l) && !/\d{1,2}[/\-]\d{1,2}/.test(l) && l.length >= 3
  );
  return candidate ?? null;
}

// ─── Date ────────────────────────────────────────────────────────────────────
function extractDate(text: string): string | null {
  const patterns = [
    /(\d{1,2}[\/\-.]\\d{1,2}[\/\-.]\d{2,4})/,
    /(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|Mei|May|Jun|Jul|Agu|Aug|Sep|Okt|Oct|Nov|Des|Dec)\w*\s+\d{2,4})/i,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) return m[1];
  }
  return null;
}

// ─── Total & Financial Extraction ─────────────────────────────────────────
function extractFinancials(text: string, lines: string[]) {
  const TOTAL_PATTERNS: RegExp[] = [
    /grand\s*total[\s:=]*([0-9][0-9.,\s]*)/i,
    /total\s+bayar[\s:=]*([0-9][0-9.,\s]*)/i,
    /total\s+belanja[\s:=]*([0-9][0-9.,\s]*)/i,
    /^total[\s:=]*([0-9][0-9.,\s]*)$/im,
    /jumlah\s+(?:yang\s+)?(?:harus\s+)?(?:di)?bayar[\s:=]*([0-9][0-9.,\s]*)/i,
    /^jumlah[\s:=]*([0-9][0-9.,\s]*)$/im,
    /tagihan[\s:=]*([0-9][0-9.,\s]*)/i,
    /amount\s+due[\s:=]*([0-9][0-9.,\s]*)/i,
  ];

  const SUBTOTAL_PATTERNS: RegExp[] = [
    /sub\s*total[\s:=]*([0-9][0-9.,\s]*)/i,
    /subtotal[\s:=]*([0-9][0-9.,\s]*)/i,
  ];

  const TAX_PATTERNS: RegExp[] = [
    /(?:ppn|pajak|tax)\s*(?:\d+\s*%?)?\s*[\s:=]*([0-9][0-9.,\s]*)/i,
  ];

  const tryPatterns = (patterns: RegExp[]): number | null => {
    for (const p of patterns) {
      const matches = [...text.matchAll(new RegExp(p.source, p.flags.includes("g") ? p.flags : p.flags + "g"))];
      for (const m of matches) {
        if (m[1]) {
          const cleaned = m[1].trim().replace(/\s+/g, "");
          const v = parseNum(cleaned);
          if (v && v >= 100) return v;
        }
      }
    }
    return null;
  };

  let totalAmount = tryPatterns(TOTAL_PATTERNS);
  const subtotal   = tryPatterns(SUBTOTAL_PATTERNS);
  const tax        = tryPatterns(TAX_PATTERNS);

  if (!totalAmount) {
    const TOTAL_KW = /\b(grand\s*total|total\s+bayar|total\s+belanja|total|jumlah\s+bayar|jumlah|tagihan)\b/i;
    for (const line of lines) {
      if (TOTAL_KW.test(line)) {
        const tokens = findNumTokens(line).filter((t) => t.val >= 1000);
        if (tokens.length > 0) {
          totalAmount = Math.max(...tokens.map((t) => t.val));
          break;
        }
      }
    }
  }

  if (!totalAmount) {
    const tunaiM = text.match(/tunai[\s:=]*([0-9][0-9.,\s]*)/i);
    const kembaliM = text.match(/kembali[\s:=]*([0-9][0-9.,\s]*)/i);
    if (tunaiM && kembaliM) {
      const tunai = parseNum(tunaiM[1].trim().replace(/\s+/g, ""));
      const kembali = parseNum(kembaliM[1].trim().replace(/\s+/g, ""));
      if (tunai && kembali && tunai > kembali) totalAmount = tunai - kembali;
    }
  }

  if (!totalAmount && subtotal && tax) {
    totalAmount = subtotal + tax;
  }

  if (!totalAmount) {
    const allNums = findNumTokens(text).filter((t) => t.val >= 1000);
    if (allNums.length > 0) totalAmount = Math.max(...allNums.map((t) => t.val));
  }

  return { totalAmount: totalAmount ?? null, subtotal: subtotal ?? null, tax: tax ?? null };
}

// ─── Non-item line filter ─────────────────────────────────────────────────────
const NON_ITEM_STARTS: RegExp[] = [
  /^grand\s*total/i,
  /^total\s*(bayar|belanja)?$/i,
  /^sub\s*total/i,
  /^subtotal/i,
  /^jumlah(\s+(bayar|yang|harus|dibayar))?/i,
  /^tagihan/i,
  /^bayar/i,
  /^tunai/i,
  /^cash/i,
  /^kembali/i,
  /^kembalian/i,
  /^debit/i,
  /^kredit/i,
  /^kartu/i,
  /^ppn/i,
  /^pajak/i,
  /^tax/i,
  /^diskon/i,
  /^discount/i,
  /^kasir/i,
  /^operator/i,
  /^pelayan/i,
  /^no\s*[\.:]/i,
  /^nomor/i,
  /^struk/i,
  /^tanggal/i,
  /^tgl/i,
  /^jam\s/i,
  /^waktu/i,
  /^date/i,
  /^time/i,
  /^terima\s+kasih/i,
  /^thank\s+you/i,
  /^member/i,
  /^poin/i,
  /^point/i,
  /^saldo/i,
  /^kode/i,
  /^void/i,
  /^refund/i,
  /^jl[.\s]/i,
  /^jalan/i,
  /^telp/i,
  /^hp[\s:]/i,
  /^alamat/i,
  /^cabang/i,
  /^toko/i,
  /^npwp/i,
  /^www\./i,
  /^http/i,
];

function isNonItemLine(line: string): boolean {
  const l = line.toLowerCase().trim();
  if (l.length < 3 || /^[-=*_\s]+$/.test(l)) return true;
  if (/^\d+$/.test(l)) return true;
  return NON_ITEM_STARTS.some((re) => re.test(l));
}

function cleanDesc(s: string): string {
  return s
    .replace(/[*_=|\\^]+/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .substring(0, 60);
}

// ─── Item Extraction (IMPROVED — more lenient) ───────────────────────────────
function extractItems(lines: string[], totalAmount: number | null): ReceiptItem[] {
  const items: ReceiptItem[] = [];
  const maxAmt = totalAmount ? totalAmount * 1.1 : Infinity; // lebih longgar 110%

  for (const line of lines) {
    if (line.length < 3) continue;
    if (isNonItemLine(line)) continue;

    const tokens = findNumTokens(line);

    // CASE 1: Baris dengan angka — coba deteksi sebagai item
    if (tokens.length > 0) {
      const lastTok = tokens[tokens.length - 1];
      const amount = lastTok.val;

      // Skip barcode murni atau angka terlalu besar
      if (/^\d{6,}$/.test(lastTok.raw)) continue;
      // Minimal Rp 100 (longgar untuk item murah)
      if (amount < 100 || amount > maxAmt) continue;

      const descRaw = line.substring(0, tokens[0].start).trim();
      const desc = cleanDesc(descRaw);

      if (desc.length < 2 || /^\d+$/.test(desc)) continue;

      // Pattern A: NAME  QTY x UNIT  TOTAL
      const pA = /^(.+?)\s+(\d{1,3})\s*[xX@]\s*([\d.,]+)\s+([\d.,]+)\s*$/.exec(line);
      if (pA) {
        const d = cleanDesc(pA[1]);
        const qty = parseInt(pA[2]);
        const unit = parseNum(pA[3]);
        const amt  = parseNum(pA[4]);
        if (d.length >= 2 && amt && amt >= 100 && amt <= maxAmt) {
          items.push({ description: d, qty, unitPrice: unit, amount: amt });
          continue;
        }
      }

      // Pattern B: NAME  QTY  UNIT  TOTAL (tanpa 'x')
      if (tokens.length >= 3) {
        const potQty  = tokens[tokens.length - 3].val;
        const potUnit = tokens[tokens.length - 2].val;
        if (Number.isInteger(potQty) && potQty >= 1 && potQty <= 99 && potUnit >= 100) {
          const expected = potQty * potUnit;
          if (Math.abs(expected - amount) / Math.max(amount, 1) <= 0.06) {
            items.push({ description: desc, qty: potQty, unitPrice: potUnit, amount });
            continue;
          }
        }
      }

      // Pattern C: NAME  QTY  TOTAL
      if (tokens.length >= 2) {
        const potQty = tokens[tokens.length - 2].val;
        if (Number.isInteger(potQty) && potQty >= 1 && potQty <= 99) {
          const unit = Math.round(amount / potQty);
          if (unit >= 100) {
            items.push({ description: desc, qty: potQty, unitPrice: unit, amount });
            continue;
          }
        }
      }

      // Pattern D: NAME  TOTAL (restaurant/warung — paling sering)
      if (amount >= 100) {
        items.push({ description: desc, qty: null, unitPrice: null, amount });
        continue;
      }
    } else {
      // CASE 2: Baris tanpa angka, tapi baris berikutnya mungkin harganya
      // (format struk dua baris: nama di atas, harga di bawah)
      // Ditangani di pass kedua di bawah
    }
  }

  // ─── Pass 2: Tangani format 2-baris (nama di atas, harga di baris bawah) ───
  for (let i = 0; i < lines.length - 1; i++) {
    const line = lines[i];
    const nextLine = lines[i + 1];

    if (line.length < 2) continue;
    if (isNonItemLine(line)) continue;

    const curTokens = findNumTokens(line);
    const nextTokens = findNumTokens(nextLine);

    // Baris sekarang: hanya teks (nama item), baris berikut: hanya angka
    if (curTokens.length === 0 && nextTokens.length > 0) {
      const desc = cleanDesc(line);
      if (desc.length < 2) continue;

      const amount = nextTokens[nextTokens.length - 1].val;
      if (amount < 100 || amount > maxAmt) continue;

      // Cek apakah sudah ada item dengan deskripsi sama
      const alreadyExists = items.some(
        (it) => it.description.toLowerCase() === desc.toLowerCase()
      );
      if (!alreadyExists) {
        items.push({ description: desc, qty: null, unitPrice: null, amount });
      }
    }
  }

  // Dedup by description (case-insensitive)
  const seen = new Set<string>();
  return items
    .filter((item) => {
      const key = item.description.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 50); // naikkan limit ke 50
}

// ─── Main Parser ─────────────────────────────────────────────────────────────
function parseReceiptText(rawText: string, confidence: number): ReceiptData {
  const text  = normalizeText(rawText);
  const lines = text.split("\n").filter((l) => l.length > 1);

  const storeName = extractStoreName(lines);
  const date      = extractDate(text);
  const { totalAmount, subtotal, tax } = extractFinancials(text, lines);
  const items = extractItems(lines, totalAmount);

  console.log(`Parsed: total=${totalAmount}, subtotal=${subtotal}, tax=${tax}, items=${items.length}`);
  return { items, totalAmount, subtotal, tax, date, storeName, rawText, confidence };
}

function emptyResult(error?: string): ReceiptData {
  return {
    items: [], totalAmount: null, subtotal: null, tax: null,
    date: null, storeName: null, rawText: "", confidence: 0, error,
  };
}
