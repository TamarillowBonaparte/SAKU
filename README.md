<div align="center">

![SAKU Logo](assets/images/Logo/Saku%20Logo%20HD.png)

# SAKU - Smart Accounting & Keuangan Utility

### Solusi Manajemen Keuangan Personal yang Cerdas & Terpercaya

[![Work in Progress](https://img.shields.io/badge/Status-🚧%20In%20Development-orange?style=flat-square)](https://github.com/TamarillowBonaparte/SAKU)
[![React Native](https://img.shields.io/badge/React%20Native-Expo-61DAFB?style=flat-square&logo=react)](https://reactnative.dev/)
[![Go Backend](https://img.shields.io/badge/Backend-Go-00ADD8?style=flat-square&logo=go)](https://golang.org/)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

[🌟 Fitur](#fitur-utama) • [📱 Demo](#demo) • [⚙️ Teknologi](#teknologi) • [🚀 Instalasi](#instalasi) • [📖 Dokumentasi](#dokumentasi)

</div>

---

## 📋 Tentang SAKU

**SAKU** adalah aplikasi manajemen keuangan personal yang dirancang khusus untuk membantu Anda mengelola keuangan dengan lebih efisien. Dari pencatatan transaksi harian hingga perencanaan budget dan pelacakan utang, SAKU hadir dengan teknologi terdepan untuk memberikan pengalaman pengguna terbaik.

Dibangun dengan **React Native + Expo** untuk frontend dan **Go** untuk backend, SAKU menawarkan performa tinggi, keamanan maksimal, dan skalabilitas yang luar biasa.

---

> ⚠️ **Status: Proyek Masih dalam Tahap Pengembangan (Work in Progress)**
>
> SAKU saat ini masih dalam tahap aktif development. Fitur-fitur terus ditambahkan dan disempurnakan. Beberapa API endpoint dan UI mungkin masih mengalami perubahan. Terima kasih atas kesabaran dan dukungan Anda!

---

## ✨ Fitur Utama

### 💰 Manajemen Transaksi

- **Pencatatan Real-time**: Catat setiap transaksi dengan mudah
- **Kategori Otomatis**: Transaksi otomatis dikategorisasi untuk analisis lebih baik
- **Riwayat Lengkap**: Akses riwayat transaksi kapan saja dengan filter lengkap

### 📸 Pemindai Struk Pintar

- **OCR Recognition**: Teknologi Tesseract.js untuk pengenalan teks otomatis
- **Ekstraksi Data**: Otomatis mengekstrak jumlah dan item dari struk
- **Akurasi Tinggi**: 85-95% akurasi untuk struk yang jelas
- **Offline Processing**: Semua pemrosesan dilakukan lokal di device

### 💳 Manajemen Budget

- **Set Target Budget**: Tetapkan budget per kategori dengan mudah
- **Real-time Tracking**: Pantau penggunaan budget secara real-time
- **Alert Notification**: Dapatkan notifikasi saat mencapai batas budget
- **Analytics**: Visualisasi pengeluaran dengan grafik yang informatif

### 📊 Pelacakan Utang

- **Manajemen Utang**: Catat semua utang dan cicilan
- **Reminder Otomatis**: Dapatkan pengingat untuk pembayaran cicilan
- **Laporan Utang**: Lihat status semua utang dalam satu tempat

### ✅ To-Do & Reminder

- **Calendar Integration**: Integrasi dengan kalender untuk manajemen lebih baik
- **Smart Reminders**: Notifikasi pintar untuk pengingat penting
- **Event Tracking**: Pantau event keuangan penting

### 👤 Profil & Keamanan

- **Firebase Authentication**: Login aman dengan Google OAuth
- **Session Persistence**: Token tersimpan otomatis dengan timeout 30 menit
- **Data Encryption**: Semua data dienkripsi dengan aman

---

## 🎯 Demo

| Fitur             | Screenshot                              |
| ----------------- | --------------------------------------- |
| Dashboard Utama   | Ringkasan keuangan & transaksi terbaru  |
| Manajemen Budget  | Visualisasi budget dan pengeluaran      |
| Scanner Struk     | OCR real-time untuk struk belanja       |
| Riwayat Transaksi | Daftar transaksi dengan filter & search |

---

## 🏗️ Teknologi

### Frontend

- **React Native** dengan **Expo** - Cross-platform mobile development
- **TypeScript** - Type-safe JavaScript
- **Zustand** - State management yang ringan dan efisien
- **Axios** - HTTP client untuk komunikasi API
- **React Router/Expo Router** - Navigation & routing
- **Tesseract.js** - OCR untuk pemindai struk
- **Firebase** - Authentication & services

### Backend

- **Go (Golang)** - Runtime yang cepat & efisien
- **Fiber** - Web framework minimal & cepat
- **PostgreSQL/MySQL** - Database relasional
- **Firebase Admin SDK** - OAuth & token management
- **Docker** - Containerization untuk deployment
- **Air** - Hot reload development

### Infrastructure

- **Expo** - Cloud build & deployment
- **Docker & Docker Compose** - Container orchestration
- **Firebase** - Authentication & services

---

## 📦 Struktur Proyek

```
FinancialFredom/
├── app/                          # Frontend Expo App (React Native)
│   ├── (tabs)/                  # Tab-based navigation
│   │   ├── index.tsx            # Dashboard
│   │   ├── transaction.tsx      # Transaksi
│   │   ├── budget.tsx           # Budget
│   │   ├── debt.tsx             # Utang
│   │   ├── todo.tsx             # To-Do & Calendar
│   │   ├── riwayat_transaksi.tsx # History
│   │   └── profile.tsx          # Profile
│   ├── add-transaction.tsx       # Form tambah transaksi
│   ├── add-budget.tsx            # Form tambah budget
│   ├── login.tsx                 # Login screen
│   ├── register.tsx              # Register screen
│   └── _layout.tsx               # Root layout & auth wrapper
│
├── services/                      # API Service Layer
│   ├── api.ts                    # Axios client & interceptors
│   ├── authService.ts            # Authentication API
│   ├── transactionService.ts     # Transaction CRUD
│   ├── budgetService.ts          # Budget CRUD
│   ├── debtService.ts            # Debt CRUD
│   ├── todoService.ts            # Todo CRUD
│   ├── categoryService.ts        # Category API
│   ├── receiptService.ts         # Receipt OCR
│   └── notificationService.ts    # Notification handling
│
├── store/                        # Zustand State Stores
│   ├── useBudgetStore.ts         # Budget state
│   ├── useTransactionStore.ts    # Transaction state
│   ├── useDebtStore.ts           # Debt state
│   ├── useTodoStore.ts           # Todo state
│   └── useCategoryStore.ts       # Category state
│
├── components/                   # Reusable Components
│   ├── ReceiptScannerModal.tsx   # OCR scanner UI
│   ├── ThemedText.tsx            # Text component
│   ├── ThemedView.tsx            # View component
│   └── ui/                       # UI kit
│
├── context/                      # React Context
│   └── AuthContext.tsx           # Global auth state
│
├── hooks/                        # Custom React Hooks
│   ├── useReceiptScanner.ts      # Receipt scanner hook
│   └── useColorScheme.ts         # Theme hook
│
├── backend/                      # Go Backend API
│   ├── cmd/
│   │   ├── main.go              # Entry point
│   │   ├── migrate/             # Database migrations
│   │   └── reset_db/            # DB reset utility
│   ├── config/                  # Configuration
│   │   ├── env.go               # Env variables
│   │   ├── database.go          # DB connection
│   │   └── firebase.go          # Firebase config
│   ├── controllers/             # API controllers
│   │   ├── auth_controller.go
│   │   ├── transaction_controller.go
│   │   ├── budget_controller.go
│   │   ├── debt_controller.go
│   │   ├── todo_controller.go
│   │   └── category_controller.go
│   ├── models/                  # Data models
│   ├── repositories/            # Database layer
│   ├── services/                # Business logic
│   ├── routes/                  # Route definitions
│   ├── middleware/              # Auth middleware
│   ├── docker-compose.yml       # Container setup
│   ├── Makefile                 # Build automation
│   └── go.mod                   # Go dependencies
│
├── assets/                      # Static assets
│   └── images/
│       └── Logo/                # SAKU logos
│
└── package.json                 # Frontend dependencies
```

---

## 🚀 Instalasi & Setup

### Prerequisites

- Node.js 18+ & npm/yarn
- Go 1.20+
- Docker & Docker Compose
- Expo CLI (`npm install -g expo-cli`)
- Android Studio / Xcode (untuk emulator)

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/FinancialFredom.git
cd FinancialFredom
```

### 2. Setup Frontend

```bash
# Install dependencies
npm install
# atau
yarn install

# Setup environment variables
cp .env.example .env.local

# Edit .env.local dan set API URL
EXPO_PUBLIC_API_URL=http://localhost:8080/api

# Start Expo development server
npm start
# atau
expo start
```

### 3. Setup Backend

```bash
cd backend

# Install Go dependencies
go mod download

# Setup environment variables
cp .env.example .env

# Run database migrations
go run ./cmd/migrate/main.go

# Jalankan backend dengan hot-reload (Air)
air

# Atau gunakan Docker Compose
docker-compose up -d
```

### 4. Run Application

**Frontend:**

```bash
# Di terminal Expo
# Tekan 'a' untuk Android atau 'i' untuk iOS
# Atau buka di web dengan 'w'
```

**Backend:**

```bash
# Backend akan running di http://localhost:8080
# API base: http://localhost:8080/api
```

---

## 📚 API Documentation

### Authentication Endpoints

#### Register

```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

#### Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

#### Google OAuth

```http
POST /api/auth/google
Content-Type: application/json

{
  "token": "google_id_token"
}
```

### Transaction Endpoints

#### Get All Transactions

```http
GET /api/transactions
Authorization: Bearer <token>
```

#### Create Transaction

```http
POST /api/transactions
Authorization: Bearer <token>
Content-Type: application/json

{
  "amount": 50000,
  "category_id": 1,
  "description": "Makan siang",
  "date": "2024-04-30",
  "transaction_type": "expense"
}
```

#### Update Transaction

```http
PUT /api/transactions/{id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "amount": 75000,
  "description": "Makan siang & minum"
}
```

#### Delete Transaction

```http
DELETE /api/transactions/{id}
Authorization: Bearer <token>
```

### Budget Endpoints

#### Get All Budgets

```http
GET /api/budgets
Authorization: Bearer <token>
```

#### Create Budget

```http
POST /api/budgets
Authorization: Bearer <token>
Content-Type: application/json

{
  "category_id": 1,
  "amount": 500000,
  "month": "2024-04"
}
```

### Selengkapnya

Lihat dokumentasi lengkap di [BACKEND_API.md](backend/API.md)

---

## 🔐 Keamanan

- ✅ **Firebase OAuth**: Autentikasi aman dengan Google
- ✅ **JWT Tokens**: Token-based authentication
- ✅ **Session Timeout**: Auto logout setelah 30 menit inaktif
- ✅ **Password Hashing**: Bcrypt untuk hash password
- ✅ **HTTPS Only**: Semua komunikasi terenkripsi
- ✅ **Token Persistence**: AsyncStorage dengan enkripsi

---

## 🧪 Testing

### Frontend Testing

```bash
npm test
```

### Backend Testing

```bash
cd backend
go test ./...
```

---

## 📖 Dokumentasi Lengkap

- [Setup Guide](docs/SETUP.md) - Panduan instalasi detail
- [API Reference](backend/docs/API.md) - Dokumentasi API lengkap
- [Receipt Scanner](docs/RECEIPT_SCANNER.md) - Dokumentasi OCR
- [Architecture](docs/ARCHITECTURE.md) - Arsitektur sistem
- [Contributing](CONTRIBUTING.md) - Panduan berkontribusi

---

## 🤝 Berkontribusi

Kami sangat menghargai kontribusi Anda! Silakan ikuti langkah-langkah berikut:

1. **Fork** repository ini
2. **Buat branch** untuk fitur Anda (`git checkout -b feature/AmazingFeature`)
3. **Commit** perubahan Anda (`git commit -m 'Add some AmazingFeature'`)
4. **Push** ke branch (`git push origin feature/AmazingFeature`)
5. **Buat Pull Request**

### Standar Kode

- Gunakan TypeScript untuk frontend
- Gunakan Go modules untuk backend
- Ikuti naming convention yang ada
- Tambahkan tests untuk fitur baru
- Update dokumentasi jika diperlukan

---

## 🐛 Melaporkan Bug

Temukan bug? Silakan buat issue dengan informasi berikut:

- **Deskripsi bug** - Apa yang terjadi?
- **Langkah reproduksi** - Bagaimana cara mereproduksi?
- **Expected behavior** - Apa yang seharusnya terjadi?
- **Screenshots** - Tangkapan layar jika memungkinkan
- **Environment** - OS, browser, versi app

---

## 📋 Roadmap

- ✅ Core transaction management
- ✅ Budget tracking
- ✅ Receipt scanner dengan OCR
- ✅ Debt management
- ✅ Todo & reminders
- 🔜 Advanced analytics & reports
- 🔜 Multi-currency support
- 🔜 Recurring transactions
- 🔜 Export & sharing reports
- 🔜 AI-powered insights

---

## 📊 Statistik Proyek

- **Frontend**: React Native + Expo
- **Backend**: Go + Fiber + PostgreSQL
- **Lines of Code**: 10,000+
- **API Endpoints**: 30+
- **Database Models**: 8

---

## 📄 Lisensi

Project ini dilisensikan di bawah [MIT License](LICENSE) - lihat file LICENSE untuk detail.

---

## 👥 Tim

Dikembangkan dengan ❤️ oleh tim Financial Freedom

**Kontributor:**

- [@YourName](https://github.com/yourname) - Lead Developer
- [@TeamMember](https://github.com/teammate) - Backend Engineer

---

## 📞 Kontak & Support

- **Email**: support@sakulogger.com
- **Website**: [sakulogger.com](https://sakulogger.com)
- **Twitter**: [@SAKUApp](https://twitter.com/sakuapp)
- **Issues**: [GitHub Issues](https://github.com/yourusername/FinancialFredom/issues)

---

## 🙏 Ucapan Terima Kasih

Terima kasih kepada:

- [Expo](https://expo.dev) - React Native platform
- [Fiber](https://gofiber.io) - Go web framework
- [Tesseract.js](https://tesseract.projectnaptha.com/) - OCR engine
- [Firebase](https://firebase.google.com) - Authentication

---

<div align="center">

### ⭐ Jika proyek ini bermanfaat, beri kami bintang!

**Made with ❤️ for smarter financial management**

</div>
