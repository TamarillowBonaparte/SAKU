# API Configuration System - Documentation

## 🎯 Overview

Sistem konfigurasi API yang **modular**, **otomatis**, dan **mudah di-customize** untuk semua tahap development hingga production.

**Fitur utama:**

- ✅ Auto-deteksi local IP untuk development
- ✅ Environment-based configuration (dev/staging/prod)
- ✅ Priority-based URL resolution
- ✅ Zero downtime environment switching
- ✅ Simple untuk production deployment

---

## 📁 File-File Penting

### 1. **`config/apiConfig.ts`** - Pusat konfigurasi API

Mengelola semua URL API berdasarkan environment dan priority system.

**Fungsi utama:**

- `getEnvironment()` - Membaca EXPO_PUBLIC_API_ENV
- `getApiBaseUrl()` - Menentukan URL berdasarkan priority
- `updateApiConfig()` - Mengubah URL saat runtime
- `getApiConfigInfo()` - Debug info

### 2. **`utils/ipDetection.ts`** - Auto-deteksi IP lokal

Menggunakan `expo-network` untuk deteksi IP otomatis.

**Fungsi utama:**

- `getLocalIPAddress()` - Dapatkan IP lokal device
- `getLocalAPIUrl()` - Buat URL API dengan IP lokal
- `buildDevelopmentApiConfig()` - Config lengkap untuk dev

### 3. **`services/api.ts`** - API Client

Sudah diupdate untuk menggunakan apiConfig dari config/apiConfig.ts

### 4. **`.env`** - Environment Variables

Dokumentasi lengkap untuk semua opsi konfigurasi

---

## 🚀 Quick Start Guide

### **Scenario 1: Development dengan Auto-Detect Local IP**

Paling simple! Cukup set environment ke development, sisanya otomatis.

```bash
# .env
EXPO_PUBLIC_API_ENV=development
```

**Apa yang terjadi:**

- App akan auto-detect local IP
- API URL akan menjadi `http://{LOCAL_IP}:8080/api`
- Contoh: `http://192.168.1.38:8080/api`

**✅ Keuntungan:**

- Tidak perlu ubah .env ketika pindah WiFi
- Plug & play untuk semua network

### **Scenario 2: Development dengan Fixed IP (Kantor/Rumah)**

Jika auto-detect tidak ideal, bisa set IP manual.

```bash
# .env - Kantor WiFi
EXPO_PUBLIC_API_ENV=development
EXPO_PUBLIC_API_DEV_URL=http://10.173.85.147:8080/api
```

```bash
# .env - Rumah WiFi
EXPO_PUBLIC_API_ENV=development
EXPO_PUBLIC_API_DEV_URL=http://192.168.1.38:8080/api
```

**✅ Keuntungan:**

- Stabil jika di environment yang sama
- Bisa switch dengan edit 1 baris

### **Scenario 3: Quick Testing dengan Override Langsung**

Testing cepat ke IP berbeda tanpa ubah environment.

```bash
# .env
EXPO_PUBLIC_API_URL=http://192.168.100.50:8080/api
```

**✅ Keuntungan:**

- Langsung ke URL yang dimau
- Priority tertinggi, override semua setting

**⚠️ Catatan:**

- Ini temporary untuk testing saja
- Jangan commit ke production!

### **Scenario 4: Production Deployment**

Untuk production/hosting dengan domain tetap.

```bash
# .env - Production
EXPO_PUBLIC_API_ENV=production
EXPO_PUBLIC_API_PROD_URL=https://api.financialfreedom.com/api
```

**✅ Keuntungan:**

- HTTPS untuk keamanan
- Domain stabil
- Easy scaling ke multiple servers

### **Scenario 5: Staging Environment**

Testing pre-production dengan server terpisah.

```bash
# .env - Staging
EXPO_PUBLIC_API_ENV=staging
EXPO_PUBLIC_API_STAGING_URL=http://staging-api.financialfreedom.com:8080/api
```

---

## 🔄 Priority System (Penting!)

Sistem resolusi URL dengan priority order:

```
1. EXPO_PUBLIC_API_URL (Highest)
   ↓ Jika tidak set, lanjut ke...

2. EXPO_PUBLIC_API_CUSTOM_URL
   ↓ Jika tidak set, lanjut ke...

3. Environment-based URLs
   - EXPO_PUBLIC_API_DEV_URL (untuk development)
   - EXPO_PUBLIC_API_STAGING_URL (untuk staging)
   - EXPO_PUBLIC_API_PROD_URL (untuk production)
   ↓ Jika tidak set, gunakan...

4. Default URLs
   - Dev: http://localhost:8080/api (atau auto-detect IP)
   - Staging: http://staging-api.financialfreedom.com:8080/api
   - Prod: https://api.financialfreedom.com/api
```

**Contoh:**

```bash
# Hanya EXPO_PUBLIC_API_ENV yang set
EXPO_PUBLIC_API_ENV=production
→ URL = https://api.financialfreedom.com/api

# EXPO_PUBLIC_API_PROD_URL juga set
EXPO_PUBLIC_API_ENV=production
EXPO_PUBLIC_API_PROD_URL=https://custom-api.com/api
→ URL = https://custom-api.com/api

# EXPO_PUBLIC_API_URL juga set (override semua)
EXPO_PUBLIC_API_URL=http://test-api:8080/api
EXPO_PUBLIC_API_ENV=production
EXPO_PUBLIC_API_PROD_URL=https://custom-api.com/api
→ URL = http://test-api:8080/api (EXPO_PUBLIC_API_URL menang)
```

---

## 🔍 Debugging & Info

### **Lihat Current Configuration**

Tambahkan ini di app startup (misalnya di `app/_layout.tsx`):

```typescript
import { getApiConfigInfo } from "./config/apiConfig";

export default function RootLayout() {
  useEffect(() => {
    console.log("🔍 API Config:", getApiConfigInfo());
    // Output: {
    //   environment: 'development',
    //   baseURL: 'http://192.168.1.38:8080/api',
    //   timeout: 30000,
    //   isDevelopment: true,
    //   isProduction: false
    // }
  }, []);
}
```

### **Change URL saat Runtime**

```typescript
import { updateApiConfig } from "./config/apiConfig";

// Ubah API URL saat app sedang berjalan (tanpa restart)
updateApiConfig("http://new-api-host:8080/api");
```

---

## 📋 Environment Variables Cheatsheet

| Variabel                      | Tujuan            | Priority    | Contoh                                   |
| ----------------------------- | ----------------- | ----------- | ---------------------------------------- |
| `EXPO_PUBLIC_API_URL`         | Direct override   | **Highest** | `http://192.168.1.38:8080/api`           |
| `EXPO_PUBLIC_API_CUSTOM_URL`  | Custom URL        | High        | `http://custom:8080/api`                 |
| `EXPO_PUBLIC_API_ENV`         | Pilih environment | Medium      | `development` / `staging` / `production` |
| `EXPO_PUBLIC_API_DEV_URL`     | Dev URL manual    | Medium      | `http://10.173.85.147:8080/api`          |
| `EXPO_PUBLIC_API_STAGING_URL` | Staging URL       | Medium      | `http://staging:8080/api`                |
| `EXPO_PUBLIC_API_PROD_URL`    | Production URL    | Medium      | `https://api.financialfreedom.com/api`   |

---

## 🛠️ Use Cases

### **Use Case 1: Developer 1 (Home WiFi)**

```bash
# .env
EXPO_PUBLIC_API_ENV=development
EXPO_PUBLIC_API_DEV_URL=http://192.168.1.38:8080/api
```

### **Use Case 2: Developer 2 (Office WiFi)**

```bash
# .env
EXPO_PUBLIC_API_ENV=development
EXPO_PUBLIC_API_DEV_URL=http://10.173.85.147:8080/api
```

### **Use Case 3: CI/CD Pipeline (Auto-detect)**

```bash
# .env (same untuk semua machines)
EXPO_PUBLIC_API_ENV=development
# Auto-detect akan handle berbagai network
```

### **Use Case 4: Deployment ke Production**

```bash
# .env (production build)
EXPO_PUBLIC_API_ENV=production
EXPO_PUBLIC_API_PROD_URL=https://api.financialfreedom.com/api
```

### **Use Case 5: Load Balancer / Multiple Backends**

```bash
# .env
EXPO_PUBLIC_API_URL=http://load-balancer.example.com:8080/api
```

---

## ✅ Best Practices

1. **Untuk Development:**
   - ✅ Gunakan `EXPO_PUBLIC_API_ENV=development` (auto-detect)
   - ✅ Atau set `EXPO_PUBLIC_API_DEV_URL` jika network fixed
   - ❌ Jangan gunakan hardcoded IP di code

2. **Untuk Production:**
   - ✅ Set `EXPO_PUBLIC_API_ENV=production`
   - ✅ Gunakan HTTPS domain
   - ✅ Jangan commit `.env` dengan production keys
   - ❌ Jangan expose internal IPs di production

3. **Untuk Testing:**
   - ✅ Gunakan `EXPO_PUBLIC_API_URL` untuk quick override
   - ✅ Gunakan `updateApiConfig()` untuk runtime changes
   - ❌ Jangan hardcode test URLs

4. **Untuk Team Collaboration:**
   - ✅ Share `.env.example` dengan dokumentasi
   - ✅ Setiap dev buat `.env` lokal sesuai network mereka
   - ✅ Gunakan auto-detect agar flexible

---

## 🐛 Troubleshooting

### **Problem: API tidak connect**

**Solusi:**

1. Cek `.env` setting: `EXPO_PUBLIC_API_ENV`, `EXPO_PUBLIC_API_DEV_URL`
2. Cek backend server sedang jalan di port 8080
3. Cek device dan backend di network yang sama
4. Cek API URL di console: `console.log(getApiConfigInfo())`

### **Problem: IP address berubah setelah WiFi disconnect**

**Solusi:**

- Gunakan auto-detect (cukup set `EXPO_PUBLIC_API_ENV=development`)
- Atau update `.env` dengan IP baru

### **Problem: Production URL conflict dengan development**

**Solusi:**

- Pastikan `EXPO_PUBLIC_API_ENV=production` saat build production
- Gunakan separate `.env` files atau CI/CD env injection

---

## 📚 File References

- **Config:** [`config/apiConfig.ts`](../config/apiConfig.ts)
- **IP Detection:** [`utils/ipDetection.ts`](../utils/ipDetection.ts)
- **API Client:** [`services/api.ts`](../services/api.ts)
- **Environment:** [`.env`](../.env)

---

## 📞 Quick Help

**"Saya ganti WiFi IP baru, bagaimana?"**

- Kalau pakai auto-detect: restart app
- Kalau manual: update `EXPO_PUBLIC_API_DEV_URL` di `.env`

**"Gimana test ke server berbeda?"**

- Quick way: set `EXPO_PUBLIC_API_URL=http://new-server:8080/api`
- Or: `updateApiConfig('http://new-server:8080/api')` di code

**"Production URL mana?"**

- Lihat `.env` dengan `EXPO_PUBLIC_API_ENV=production`
- Atau `EXPO_PUBLIC_API_PROD_URL` jika di-set custom

---

**Happy Coding! 🚀**
