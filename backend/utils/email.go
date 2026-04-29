package utils

import (
	"fmt"
	"net/smtp"
	"os"
)

type EmailConfig struct {
	SMTPHost string
	SMTPPort string
	Username string
	From     string
	Password string
}

func SendOTPEmail(email string, otp string, emailType string) error {
	config := EmailConfig{
		SMTPHost: os.Getenv("SMTP_HOST"),
		SMTPPort: os.Getenv("SMTP_PORT"),
		Username: os.Getenv("SMTP_USER"),
		From:     os.Getenv("SMTP_FROM"),
		Password: os.Getenv("SMTP_PASSWORD"),
	}

	subject := ""
	body := ""

	if emailType == "verification" {
		subject = "Verifikasi Akun SAKU Anda"
		// Using the template provided by the user (OtpEmailDaftar), converted to plain HTML
		body = fmt.Sprintf(`
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { margin: 0; padding: 0; background-color: #f7f9fb; color: #191c1e; font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; }
        .container { max-width: 600px; margin: 0 auto; padding: 32px 16px; }
        .header { text-align: center; margin-bottom: 24px; }
        .header img { height: 48px; margin-bottom: 8px; }
        .header .title { font-size: 24px; font-weight: 900; color: #1d4ed8; letter-spacing: -0.025em; }
        .main { background-color: #ffffff; border-radius: 12px; padding: 48px 32px; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); text-align: center; }
        .icon { display: inline-flex; align-items: center; justify-content: center; width: 64px; height: 64px; border-radius: 50px; background-color: #dbeafe; color: #1d4ed8; font-size: 24px; margin-bottom: 16px; }
        .main h1 { font-size: 28px; font-weight: 800; margin: 0 0 16px 0; }
        .main p.desc { color: #4b5563; line-height: 1.6; margin-bottom: 32px; max-width: 400px; margin-left: auto; margin-right: auto; }
        .otp-box { background-color: #f3f4f6; border-radius: 12px; padding: 32px; margin-bottom: 24px; }
        .otp-code { display: inline-block; font-size: 40px; font-weight: 900; letter-spacing: 0.1em; padding: 16px 32px; background-color: #ffffff; border: 2px solid #bfdbfe; border-radius: 8px; color: #1d4ed8; margin-bottom: 16px; }
        .otp-info { color: #2563eb; font-weight: 600; font-size: 14px; }
        .security-note { background-color: #fee2e2; border-radius: 12px; padding: 16px; border-left: 4px solid #ef4444; text-align: left; margin-bottom: 24px; }
        .security-note p { margin: 0; }
        .security-title { font-weight: bold; font-size: 14px; color: #b91c1c; margin-bottom: 4px !important; }
        .security-desc { font-size: 12px; color: #b91c1c; }
        .ignore-info { color: #6b7280; font-size: 12px; font-style: italic; margin-top: 32px; }
        .footer { text-align: center; padding: 32px 24px; padding-top: 32px; }
        .divider { height: 1px; background-color: #e5e7eb; margin-bottom: 24px; }
        .footer-brand { font-size: 16px; font-weight: bold; margin-bottom: 4px; }
        .footer-copy { font-size: 12px; color: #6b7280; margin-bottom: 16px; margin-top: 0; }
        .footer-links { margin-bottom: 16px; font-size: 12px; }
        .footer-links a { color: #6b7280; text-decoration: none; margin: 0 8px; }
        .footer-auto { font-size: 10px; color: #9ca3af; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="https://lh3.googleusercontent.com/aida/ADBb0uhY6j000WFvEGWa-_LNCwtgPPDr9pFJ8WHVX1cwjGKOZ-BCZpkrlDosKx7slh2PAA_FqcFdgXKPT151CJkKTSOUvlH_4kqsx0KSQ5N4k1H25Q4fEkNYz2zrZp1LhUZTzIq96Lpj7b4v2aqNEqBOnpDmSORl1oda4_3u7ExYoL2lecSD4-M5OAw0-wT3fDSPCLYKPwgeb8CpOCbv5Fi9IxWmrMY2wmFnZn0XkE5FXBqzRy5syAjjTEoktGQ1k8GGr9tKIBBEa9345Q" alt="SAKU Logo" />
            <div class="title">SAKU</div>
        </div>
        
        <div class="main">
            <div class="icon">✔</div>
            <h1>Verifikasi Kode OTP Anda</h1>
            <p class="desc">Gunakan kode di bawah ini untuk memverifikasi akun SAKU Anda.</p>
            
            <div class="otp-box">
                <div class="otp-code">%s</div>
                <div class="otp-info">⏱ Berlaku selama 1 menit</div>
            </div>
            
            <div class="security-note">
                <p class="security-title">Catatan Keamanan</p>
                <p class="security-desc">Jangan berikan kode ini kepada siapapun. Tim kami tidak akan pernah meminta kode OTP Anda.</p>
            </div>
            
            <p class="ignore-info">Jika Anda tidak merasa melakukan permintaan ini, abaikan email ini.</p>
        </div>
        
        <div class="footer">
            <div class="divider"></div>
            <div class="footer-brand">SAKU (Smart Accounting & Keuangan Utility)</div>
            <p class="footer-copy">© 2026 SAKU by DKS. Solusi finansial cerdas.</p>
            <div class="footer-links">
                <a href="#">Kebijakan Privasi</a>
                <a href="#">Syarat & Ketentuan</a>
                <a href="#">Bantuan</a>
            </div>
            <p class="footer-auto">Email ini dikirim otomatis. Jangan membalas email ini.</p>
        </div>
    </div>
</body>
</html>`, otp)
	} else if emailType == "reset_password" {
		subject = "Reset Kata Sandi SAKU Anda"
		body = fmt.Sprintf(`
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { margin: 0; padding: 0; background-color: #f7f9fb; color: #191c1e; font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; }
        .container { max-width: 600px; margin: 0 auto; padding: 32px 16px; }
        .header { text-align: center; margin-bottom: 24px; }
        .header img { height: 48px; margin-bottom: 8px; }
        .header .title { font-size: 24px; font-weight: 900; color: #1d4ed8; letter-spacing: -0.025em; }
        .main { background-color: #ffffff; border-radius: 12px; padding: 48px 32px; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); text-align: center; }
        .icon { display: inline-flex; align-items: center; justify-content: center; width: 64px; height: 64px; border-radius: 50px; background-color: #dbeafe; color: #1d4ed8; font-size: 24px; margin-bottom: 16px; }
        .main h1 { font-size: 28px; font-weight: 800; margin: 0 0 16px 0; }
        .main p.desc { color: #4b5563; line-height: 1.6; margin-bottom: 32px; max-width: 400px; margin-left: auto; margin-right: auto; }
        .otp-box { background-color: #f3f4f6; border-radius: 12px; padding: 32px; margin-bottom: 24px; }
        .otp-code { display: inline-block; font-size: 40px; font-weight: 900; letter-spacing: 0.1em; padding: 16px 32px; background-color: #ffffff; border: 2px solid #bfdbfe; border-radius: 8px; color: #1d4ed8; margin-bottom: 16px; }
        .otp-info { color: #2563eb; font-weight: 600; font-size: 14px; }
        .security-note { background-color: #fee2e2; border-radius: 12px; padding: 16px; border-left: 4px solid #ef4444; text-align: left; margin-bottom: 24px; }
        .security-note p { margin: 0; }
        .security-title { font-weight: bold; font-size: 14px; color: #b91c1c; margin-bottom: 4px !important; }
        .security-desc { font-size: 12px; color: #b91c1c; }
        .ignore-info { color: #6b7280; font-size: 12px; font-style: italic; margin-top: 32px; }
        .footer { text-align: center; padding: 32px 24px; }
        .divider { height: 1px; background-color: #e5e7eb; margin-bottom: 24px; }
        .footer-brand { font-size: 16px; font-weight: bold; margin-bottom: 4px; }
        .footer-copy { font-size: 12px; color: #6b7280; margin-bottom: 16px; margin-top: 0; }
        .footer-links { margin-bottom: 16px; font-size: 12px; }
        .footer-links a { color: #6b7280; text-decoration: none; margin: 0 8px; }
        .footer-auto { font-size: 10px; color: #9ca3af; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="https://lh3.googleusercontent.com/aida/ADBb0uhY6j000WFvEGWa-_LNCwtgPPDr9pFJ8WHVX1cwjGKOZ-BCZpkrlDosKx7slh2PAA_FqcFdgXKPT151CJkKTSOUvlH_4kqsx0KSQ5N4k1H25Q4fEkNYz2zrZp1LhUZTzIq96Lpj7b4v2aqNEqBOnpDmSORl1oda4_3u7ExYoL2lecSD4-M5OAw0-wT3fDSPCLYKPwgeb8CpOCbv5Fi9IxWmrMY2wmFnZn0XkE5FXBqzRy5syAjjTEoktGQ1k8GGr9tKIBBEa9345Q" alt="SAKU Logo" />
            <div class="title">SAKU</div>
        </div>
        
        <div class="main">
            <div class="icon">🔐</div>
            <h1>Verifikasi Reset Kata Sandi</h1>
            <p class="desc">Gunakan kode di bawah ini untuk memverifikasi permintaan reset kata sandi akun SAKU Anda.</p>
            
            <div class="otp-box">
                <div class="otp-code">%s</div>
                <div class="otp-info">⏱ Berlaku selama 2 menit</div>
            </div>
            
            <div class="security-note">
                <p class="security-title">Catatan Keamanan</p>
                <p class="security-desc">Jangan berikan kode ini kepada siapapun, termasuk pihak yang mengaku dari SAKU. Tim kami tidak akan pernah meminta kode ini.</p>
            </div>
            
            <p class="ignore-info">Jika Anda tidak meminta reset password, abaikan email ini atau segera amankan akun Anda.</p>
        </div>
        
        <div class="footer">
            <div class="divider"></div>
            <div class="footer-brand">SAKU (Smart Accounting &amp; Keuangan Utility)</div>
            <p class="footer-copy">© 2026 SAKU by DKS. Solusi finansial cerdas.</p>
            <div class="footer-links">
                <a href="#">Kebijakan Privasi</a>
                <a href="#">Syarat &amp; Ketentuan</a>
                <a href="#">Bantuan</a>
            </div>
            <p class="footer-auto">Email ini dikirim otomatis. Jangan membalas email ini.</p>
        </div>
    </div>
</body>
</html>`, otp)
	}

	header := fmt.Sprintf("From: %s\r\nTo: %s\r\nMIME-Version: 1.0\r\nContent-Type: text/html; charset=\"UTF-8\"\r\n", config.From, email)
	message := fmt.Sprintf("%sSubject: %s\r\n\r\n%s", header, subject, body)

	auth := smtp.PlainAuth("", config.Username, config.Password, config.SMTPHost)
	err := smtp.SendMail(config.SMTPHost+":"+config.SMTPPort, auth, config.From, []string{email}, []byte(message))

	return err
}
