# Setup Guide - API Configuration System

## 🎯 Tujuan

Sistem ini memungkinkan IP backend terdeteksi otomatis saat development, namun tetap mudah dikustomisasi untuk production hosting.

---

## 📋 Requirements

- Expo SDK >= 50
- `expo-network` (untuk auto-detect IP)

Check installation:

```bash
npm list expo-network
```

Jika belum terinstall:

```bash
npx expo install expo-network
```

---

## 🚀 Setup untuk Pertama Kali

### **Step 1: Pastikan backend sudah jalan**

Backend server harus berjalan di port 8080:

**Windows (Command Prompt/PowerShell):**

```bash
cd backend
go run ./cmd
# atau dengan Air (hot-reload):
air
```

**Cek apakah backend jalan:**

```bash
# Buka di browser (atau gunakan curl):
http://localhost:8080/api/health
```

Jika berhasil, Anda akan lihat response (atau error 404 jika endpoint tidak ada - itu OK, berarti server jalan).

### **Step 2: Tentukan local IP Anda**

**Metode 1: Otomatis (Recommended)**

```bash
# Biarkan sistem auto-detect
EXPO_PUBLIC_API_ENV=development
# Tidak perlu set EXPO_PUBLIC_API_DEV_URL
```

**Metode 2: Manual**

**Windows:**

1. Buka Command Prompt
2. Ketik: `ipconfig`
3. Cari "IPv4 Address" (biasanya 192.168.x.x atau 10.x.x.x)
4. Catat IP tersebut

Contoh output:

```
Ethernet adapter Ethernet:
   IPv4 Address. . . . . . . . . . : 192.168.1.38
```

**Mac/Linux:**

```bash
ifconfig
# atau
hostname -I
```

### **Step 3: Setup `.env` file**

Copy `.env.example` ke `.env`:

```bash
cp .env.example .env
```

Edit `.env` sesuai pilihan Anda:

**Option A: Auto-detect (paling simple):**

```bash
EXPO_PUBLIC_API_ENV=development
# Biarkan sisanya kosong atau default
```

**Option B: Fixed IP (jika auto-detect bermasalah):**

```bash
EXPO_PUBLIC_API_ENV=development
EXPO_PUBLIC_API_DEV_URL=http://192.168.1.38:8080/api
```

Ganti `192.168.1.38` dengan IP Anda dari Step 2.

### **Step 4: Test koneksi**

1. **Restart Expo bundler:**

   ```bash
   npx expo start --clear
   ```

2. **Lihat logs di console:**

   ```
   ✅ API Config: {
     environment: 'development',
     baseURL: 'http://192.168.1.38:8080/api',
     isDevelopment: true
   }
   ```

3. **Coba login atau operasi API apapun**

Jika berhasil, selesai! ✅

---

## 🔄 Scenario-Specific Setup

### **Scenario A: Kantor WiFi → Rumah WiFi**

Ketika Anda pindah dari kantor ke rumah (atau sebaliknya):

1. **Cari IP baru:**

   ```bash
   ipconfig
   ```

2. **Update `.env`:**

   ```bash
   EXPO_PUBLIC_API_DEV_URL=http://192.168.x.x:8080/api  # IP baru
   ```

3. **Restart Expo:**
   ```bash
   npx expo start --clear
   ```

**Alternatif (lebih simple):**
Gunakan auto-detect saja, IP akan terdeteksi otomatis:

```bash
EXPO_PUBLIC_API_ENV=development
# Tanpa EXPO_PUBLIC_API_DEV_URL
```

### **Scenario B: Testing dengan IP Berbeda**

Ingin test ke backend server yang berbeda tanpa edit `.env`?

**Metode 1: Edit `.env` sementara**

```bash
EXPO_PUBLIC_API_URL=http://192.168.100.50:8080/api
```

**Metode 2: Runtime (di code)**

```typescript
import { updateApiConfig } from "./config/apiConfig";

// Di mana saja dalam app:
updateApiConfig("http://new-backend:8080/api");
```

Restart app, URL akan berubah.

### **Scenario C: Production Deployment**

Build untuk production:

1. **Update `.env`:**

   ```bash
   EXPO_PUBLIC_API_ENV=production
   EXPO_PUBLIC_API_PROD_URL=https://api.financialfreedom.com/api
   ```

2. **Build APK/IPA:**

   ```bash
   eas build --platform android --profile production
   eas build --platform ios --profile production
   ```

3. **Deploy:**
   Ikuti Expo documentation untuk submitting ke Google Play / App Store.

---

## 🐛 Troubleshooting

### **Problem 1: "Unable to connect to backend"**

**Checklist:**

1. ✅ Backend running di port 8080?

   ```bash
   netstat -an | grep 8080  # Windows
   # atau
   lsof -i :8080  # Mac/Linux
   ```

2. ✅ IP address benar di `.env`?

   ```bash
   cat .env | grep EXPO_PUBLIC_API
   ```

3. ✅ Device dan backend di network yang sama?
   Ping dari device ke backend IP:

   ```bash
   ping 192.168.1.38  # ganti dengan IP Anda
   ```

4. ✅ Firewall blocking?
   - Windows: Check Windows Firewall
   - Mac: Check System Preferences → Security & Privacy

**Solusi:**

```bash
# Clear cache dan restart
rm -rf .expo/
npx expo start --clear
```

### **Problem 2: Auto-detect tidak bekerja**

**Jika `getLocalIPAddress()` return null:**

Fallback ke manual IP:

```bash
EXPO_PUBLIC_API_ENV=development
EXPO_PUBLIC_API_DEV_URL=http://192.168.1.38:8080/api
```

### **Problem 3: Pindah WiFi, IP berubah**

**Solusi 1: Update `.env`**

```bash
ipconfig  # Cari IP baru
# Edit .env dengan IP baru
EXPO_PUBLIC_API_DEV_URL=http://192.168.x.x:8080/api
```

**Solusi 2: Gunakan hostname/mDNS**
Jika backend support mDNS:

```bash
EXPO_PUBLIC_API_URL=http://backend-laptop.local:8080/api
```

### **Problem 4: Console tidak tampil logging**

Enable logging di `app/_layout.tsx`:

```typescript
import { getApiConfigInfo } from "./config/apiConfig";

export default function RootLayout() {
  useEffect(() => {
    console.log("🔍 Current API Config:", getApiConfigInfo());
  }, []);

  // ... rest of code
}
```

---

## 📝 Step-by-Step untuk Dev Baru

1. **Clone repo**

   ```bash
   git clone <repo>
   cd FinancialFredom
   ```

2. **Install dependencies**

   ```bash
   npm install
   npm install expo-network  # jika belum ada
   ```

3. **Cari local IP Anda**

   ```bash
   ipconfig  # Windows: cari "IPv4 Address"
   ```

4. **Copy dan setup `.env`**

   ```bash
   cp .env.example .env
   ```

5. **Edit `.env` dengan IP Anda**

   ```bash
   # .env
   EXPO_PUBLIC_API_ENV=development
   EXPO_PUBLIC_API_DEV_URL=http://192.168.1.100:8080/api  # IP Anda
   ```

6. **Pastikan backend jalan**

   ```bash
   cd backend
   go run ./cmd  # atau air untuk hot-reload
   ```

7. **Start Expo**

   ```bash
   cd ..
   npx expo start
   ```

8. **Test login / API call**
   Buka app di emulator atau device, coba login

**Done! ✅**

---

## 📚 File Referensi

- **Config system:** `config/apiConfig.ts`
- **IP detection:** `utils/ipDetection.ts`
- **API client:** `services/api.ts`
- **Full documentation:** `API_CONFIG_GUIDE.md`
- **Environment template:** `.env.example`

---

## 💡 Tips & Tricks

### **Tip 1: Set static hostname di backend**

Jika backend bisa diakses via hostname, gunakan:

```bash
EXPO_PUBLIC_API_URL=http://192-168-1-100.local:8080/api
```

### **Tip 2: Monitor API requests**

Di `services/api.ts`, uncomment logging untuk debug:

```typescript
apiClient.interceptors.request.use((config) => {
  console.log("📤 API Request:", config.url);
  return config;
});

apiClient.interceptors.response.use((response) => {
  console.log("📥 API Response:", response.status);
  return response;
});
```

### **Tip 3: Different configs per developer**

Share template `.env.example` di git, tapi **jangan share `.env`**:

```bash
# .gitignore
.env
.env.local
```

Setiap dev buat `.env` sendiri sesuai network mereka.

### **Tip 4: Docker untuk backend**

Gunakan Docker untuk backend supaya semua dev pakai config yang sama:

```bash
cd backend
docker-compose up
# Backend akan di http://localhost:8080/api (di container)
```

---

## ✅ Verification Checklist

Setelah setup selesai, pastikan:

- [ ] Backend running di http://localhost:8080 (atau custom port)
- [ ] `.env` file sudah dibuat dan dikustomisasi
- [ ] `EXPO_PUBLIC_API_DEV_URL` atau `EXPO_PUBLIC_API_ENV` sudah set
- [ ] App bisa connect ke backend (check console logs)
- [ ] Login/register berhasil tanpa error
- [ ] API calls berhasil (check Network tab atau logs)
- [ ] Device dan backend di WiFi yang sama (untuk manual IP)

---

## 🆘 Perlu Bantuan?

1. **Check logs:**

   ```bash
   npx expo start
   # Lihat console untuk error messages
   ```

2. **Check config:**

   ```typescript
   import { getApiConfigInfo } from "./config/apiConfig";
   console.log(getApiConfigInfo());
   ```

3. **Read documentation:**
   - `API_CONFIG_GUIDE.md` - Lengkap
   - `.env.example` - Environment variables
   - Skript di atas - Quick setup

4. **Ask team:**
   Hubungi team lead atau senior dev untuk help troubleshooting

---

**Happy Development! 🚀**
