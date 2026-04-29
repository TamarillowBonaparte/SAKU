import React from "react";

type Props = {
  otp: string;
  expiredIn?: string;
};

const OtpEmailTemplate: React.FC<Props> = ({
  otp,
  expiredIn = "5 menit",
}) => {
  return (
    <div className="bg-[#f7f9fb] text-[#191c1e] font-sans p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        
        {/* Header */}
        <header className="flex justify-center items-center w-full px-6 py-8">
          <div className="flex flex-col items-center gap-2">
            <img
              src="https://lh3.googleusercontent.com/aida/ADBb0uhY6j000WFvEGWa-_LNCwtgPPDr9pFJ8WHVX1cwjGKOZ-BCZpkrlDosKx7slh2PAA_FqcFdgXKPT151CJkKTSOUvlH_4kqsx0KSQ5N4k1H25Q4fEkNYz2zrZp1LhUZTzIq96Lpj7b4v2aqNEqBOnpDmSORl1oda4_3u7ExYoL2lecSD4-M5OAw0-wT3fDSPCLYKPwgeb8CpOCbv5Fi9IxWmrMY2wmFnZn0XkE5FXBqzRy5syAjjTEoktGQ1k8GGr9tKIBBEa9345Q"
              alt="SAKU Logo"
              className="h-12 w-auto mb-2 object-contain"
            />
            <span className="text-2xl font-black text-blue-700 tracking-tight">
              SAKU
            </span>
          </div>
        </header>

        {/* Main */}
        <main className="bg-white rounded-xl p-8 md:p-12 shadow-sm">
          <div className="space-y-8 text-center">
            
            {/* Icon & Title */}
            <div className="space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 text-blue-700">
                <span className="text-3xl">✔</span>
              </div>

              <h1 className="text-3xl font-extrabold tracking-tight">
                Verifikasi Kode OTP Anda
              </h1>

              <p className="text-gray-600 text-base leading-relaxed max-w-md mx-auto">
                Gunakan kode di bawah ini untuk memverifikasi akun SAKU Anda.
              </p>
            </div>

            {/* OTP Box */}
            <div className="bg-gray-100 rounded-xl p-6 md:p-8 flex flex-col items-center gap-4">
              <div className="flex justify-center">
                <span className="text-4xl md:text-5xl font-black tracking-widest px-8 py-4 bg-white rounded-lg border-2 border-blue-200 text-blue-700">
                  {otp}
                </span>
              </div>

              <div className="flex items-center gap-2 text-blue-600 font-semibold text-sm">
                <span>⏱</span>
                <span>Berlaku selama {expiredIn}</span>
              </div>
            </div>

            {/* Security Note */}
            <div className="bg-red-100 rounded-xl p-4 flex items-start gap-4 text-left border-l-4 border-red-500">
              <span className="text-red-600 font-bold">!</span>
              <div>
                <p className="font-bold text-sm text-red-700">
                  Catatan Keamanan
                </p>
                <p className="text-xs text-red-600">
                  Jangan berikan kode ini kepada siapapun. Tim kami tidak akan
                  pernah meminta kode OTP Anda.
                </p>
              </div>
            </div>

            {/* Info */}
            <p className="text-gray-500 text-xs italic">
              Jika Anda tidak merasa melakukan permintaan ini, abaikan email ini.
            </p>
          </div>
        </main>

        {/* Footer */}
        <footer className="text-center space-y-6 px-6 py-8">
          <div className="h-px bg-gray-200 w-full"></div>

          <div>
            <span className="text-lg font-bold">
              SAKU (Smart Accounting & Keuangan Utility)
            </span>
            <p className="text-xs text-gray-500 mt-1">
              © 2026 SAKU by DKS. Solusi finansial cerdas.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-4 text-xs text-gray-500">
            <a href="#">Kebijakan Privasi</a>
            <a href="#">Syarat & Ketentuan</a>
            <a href="#">Bantuan</a>
          </div>

          <p className="text-[10px] text-gray-400 max-w-xs mx-auto">
            Email ini dikirim otomatis. Jangan membalas email ini.
          </p>
        </footer>
      </div>
    </div>
  );
};

export default OtpEmailTemplate;