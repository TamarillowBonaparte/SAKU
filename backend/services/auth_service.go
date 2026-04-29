package services

import (
	"encoding/json"
	"errors"
	"financial-freedom/models"
	"financial-freedom/repositories"
	"financial-freedom/utils"
	"net/http"
	"strings"
)

type AuthService interface {
	RegisterWithEmail(email string, password string, name string, otp string) (*models.User, error)
	LoginWithEmail(email string, password string) (*models.User, error)
	VerifyGoogleToken(idToken string, firebaseAuth interface{}) (*models.User, error)
	RequestOTP(userID uint, otpType string) error
	VerifyOTP(userID uint, otp string, otpType string) error
	ResetPassword(userID uint, password string) error
	RegisterSendOTPByEmail(email string) error
	// Reset password by email (no user_id needed)
	ResetSendOTPByEmail(email string) error
	VerifyResetOTPByEmail(email string, code string) error
	ResetPasswordByEmail(email string, password string) error
}

type authService struct {
	userRepository    repositories.UserRepository
	otpCodeRepository repositories.OtpCodeRepository
}

func NewAuthService(userRepository repositories.UserRepository, otpCodeRepository repositories.OtpCodeRepository) AuthService {
	return &authService{userRepository, otpCodeRepository}
}

func (s *authService) RegisterWithEmail(email string, password string, name string, otp string) (*models.User, error) {
	// First, verify the OTP
	otpModel, err := s.otpCodeRepository.FindValidByEmail(email, "verification")
	if err != nil {
		return nil, errors.New("kode OTP tidak valid atau sudah kadaluarsa")
	}

	if otpModel.Code != otp {
		return nil, errors.New("kode OTP salah")
	}

	// Check if user already exists
	existingUser, err := s.userRepository.FindByEmail(email)
	if err == nil && existingUser != nil {
		return nil, errors.New("email already exists")
	}

	// Hash password
	hashedPassword, err := utils.HashPassword(password)
	if err != nil {
		return nil, err
	}

	user := &models.User{
		Email:        email,
		PasswordHash: hashedPassword,
		Name:         name,
		IsVerified:   true, // Automatically verified since OTP was checked
	}

	err = s.userRepository.Create(user)
	if err != nil {
		return nil, err
	}

	// Mark OTP as used
	s.otpCodeRepository.MarkAsUsed(otpModel.ID)

	return user, nil
}

func (s *authService) LoginWithEmail(email string, password string) (*models.User, error) {
	user, err := s.userRepository.FindByEmail(email)
	if err != nil {
		return nil, errors.New("invalid email or password")
	}

	if !utils.VerifyPassword(user.PasswordHash, password) {
		return nil, errors.New("invalid email or password")
	}

	return user, nil
}

func (s *authService) VerifyGoogleToken(token string, firebaseAuthInterface interface{}) (*models.User, error) {
	var userInfo struct {
		Sub     string `json:"sub"`
		Email   string `json:"email"`
		Name    string `json:"name"`
		Picture string `json:"picture"`
	}

	if strings.Count(token, ".") == 2 {
		resp, err := http.Get("https://oauth2.googleapis.com/tokeninfo?id_token=" + token)
		if err != nil {
			return nil, errors.New("gagal menghubungi Google tokeninfo")
		}
		defer resp.Body.Close()

		if resp.StatusCode != 200 {
			return nil, errors.New("ID token Google tidak valid")
		}

		if err := json.NewDecoder(resp.Body).Decode(&userInfo); err != nil {
			return nil, errors.New("gagal membaca data user dari Google")
		}
	} else {
		// Fallback untuk flow lama yang masih mengirim access token.
		resp, err := http.Get("https://www.googleapis.com/oauth2/v3/userinfo?access_token=" + token)
		if err != nil {
			return nil, errors.New("gagal menghubungi Google API")
		}
		defer resp.Body.Close()

		if resp.StatusCode != 200 {
			return nil, errors.New("access token Google tidak valid")
		}

		if err := json.NewDecoder(resp.Body).Decode(&userInfo); err != nil {
			return nil, errors.New("gagal membaca data user dari Google")
		}
	}

	if userInfo.Email == "" {
		return nil, errors.New("email tidak ditemukan dari akun Google")
	}

	googleUID := "google_" + userInfo.Sub

	// Cek apakah user sudah ada berdasarkan Google UID
	user, err := s.userRepository.FindByFirebaseUID(googleUID)
	if err == nil && user != nil {
		// Update foto jika berubah
		if userInfo.Picture != "" && user.PhotoUrl != userInfo.Picture {
			user.PhotoUrl = userInfo.Picture
			_ = s.userRepository.Update(user)
		}
		return user, nil
	}

	// Cek berdasarkan email untuk sinkronisasi akun yang sudah ada
	user, err = s.userRepository.FindByEmail(userInfo.Email)
	if err == nil && user != nil {
		user.FirebaseUID = googleUID
		if userInfo.Picture != "" {
			user.PhotoUrl = userInfo.Picture
		}
		if err := s.userRepository.Update(user); err != nil {
			return nil, err
		}
		return user, nil
	}

	// Buat akun baru untuk user Google yang belum pernah daftar
	newUser := &models.User{
		Email:       userInfo.Email,
		FirebaseUID: googleUID,
		Name:        userInfo.Name,
		PhotoUrl:    userInfo.Picture,
		IsVerified:  true, // sudah terverifikasi oleh Google
	}

	err = s.userRepository.Create(newUser)
	if err != nil {
		return nil, err
	}

	return newUser, nil
}

func (s *authService) RequestOTP(userID uint, otpType string) error {
	otp := utils.GenerateOTP(6)
	otpModel := &models.OtpCode{
		UserID:    &userID,
		Code:      otp,
		Type:      otpType,
		ExpiresAt: utils.GetOTPExpiry(10),
		IsUsed:    false,
	}

	err := s.otpCodeRepository.Create(otpModel)
	if err != nil {
		return err
	}

	// Get user email to send OTP
	user, err := s.userRepository.FindByID(userID)
	if err != nil {
		return err
	}

	// Send OTP via email
	err = utils.SendOTPEmail(user.Email, otp, otpType)
	if err != nil {
		return err
	}

	return nil
}

// RegisterSendOTPByEmail invalidates all previous OTPs for this email then sends a new one (valid 1 minute)
func (s *authService) RegisterSendOTPByEmail(email string) error {
	// Check if user already exists
	existingUser, err := s.userRepository.FindByEmail(email)
	if err == nil && existingUser != nil {
		return errors.New("email already registered")
	}

	// Invalidate / delete all previous OTPs for this email + type
	s.otpCodeRepository.DeleteByEmailAndType(email, "verification")

	otpCode := utils.GenerateOTP(6)
	otpModel := &models.OtpCode{
		Email:     email,
		Code:      otpCode,
		Type:      "verification",
		ExpiresAt: utils.GetOTPExpiry(1), // 1 menit
		IsUsed:    false,
	}

	err = s.otpCodeRepository.Create(otpModel)
	if err != nil {
		return err
	}

	return utils.SendOTPEmail(email, otpCode, "verification")
}

func (s *authService) VerifyOTP(userID uint, otp string, otpType string) error {
	otpModel, err := s.otpCodeRepository.FindValid(userID, otpType)
	if err != nil {
		return errors.New("otp not found or expired")
	}

	if otpModel.Code != otp {
		return errors.New("invalid otp")
	}

	err = s.otpCodeRepository.MarkAsUsed(otpModel.ID)
	if err != nil {
		return err
	}

	return nil
}

func (s *authService) ResetPassword(userID uint, password string) error {
	user, err := s.userRepository.FindByID(userID)
	if err != nil {
		return errors.New("user not found")
	}

	hashedPassword, err := utils.HashPassword(password)
	if err != nil {
		return err
	}

	user.PasswordHash = hashedPassword
	err = s.userRepository.Update(user)
	if err != nil {
		return err
	}

	return nil
}

// ResetSendOTPByEmail mengirim OTP reset password ke email yang terdaftar (aktif 2 menit)
func (s *authService) ResetSendOTPByEmail(email string) error {
	// Pastikan user dengan email tersebut terdaftar
	_, err := s.userRepository.FindByEmail(email)
	if err != nil {
		return errors.New("email tidak terdaftar")
	}

	// Hanguskan semua OTP reset_password lama untuk email ini
	s.otpCodeRepository.DeleteByEmailAndType(email, "reset_password")

	otpCode := utils.GenerateOTP(6)
	otpModel := &models.OtpCode{
		Email:     email,
		Code:      otpCode,
		Type:      "reset_password",
		ExpiresAt: utils.GetOTPExpiry(2), // 2 menit
		IsUsed:    false,
	}

	err = s.otpCodeRepository.Create(otpModel)
	if err != nil {
		return err
	}

	return utils.SendOTPEmail(email, otpCode, "reset_password")
}

// VerifyResetOTPByEmail memverifikasi token reset password berdasarkan email
func (s *authService) VerifyResetOTPByEmail(email string, code string) error {
	otpModel, err := s.otpCodeRepository.FindValidByEmail(email, "reset_password")
	if err != nil {
		return errors.New("kode OTP tidak valid atau sudah kadaluarsa")
	}

	if otpModel.Code != code {
		return errors.New("kode OTP salah")
	}

	return nil
}

// ResetPasswordByEmail mengganti password setelah OTP terverifikasi
func (s *authService) ResetPasswordByEmail(email string, password string) error {
	// Pastikan masih ada OTP valid untuk email ini (keamanan tambahan)
	otpModel, err := s.otpCodeRepository.FindValidByEmail(email, "reset_password")
	if err != nil {
		return errors.New("sesi reset password sudah kadaluarsa, silakan kirim token ulang")
	}

	user, err := s.userRepository.FindByEmail(email)
	if err != nil {
		return errors.New("user tidak ditemukan")
	}

	hashedPassword, err := utils.HashPassword(password)
	if err != nil {
		return err
	}

	user.PasswordHash = hashedPassword
	err = s.userRepository.Update(user)
	if err != nil {
		return err
	}

	// Hanguskan OTP setelah password berhasil diganti
	s.otpCodeRepository.MarkAsUsed(otpModel.ID)
	s.otpCodeRepository.DeleteByEmailAndType(email, "reset_password")

	return nil
}
