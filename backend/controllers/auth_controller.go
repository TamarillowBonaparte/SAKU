package controllers

import (
	"financial-freedom/config"
	"financial-freedom/services"
	"financial-freedom/utils"
	"net/http"

	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

type AuthController struct {
	authService     services.AuthService
	categoryService services.CategoryService
}

func NewAuthController(authService services.AuthService, categoryService services.CategoryService) *AuthController {
	return &AuthController{authService, categoryService}
}

type RegisterRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
	Name     string `json:"name" binding:"required"`
	OTP      string `json:"otp" binding:"required"`
}

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

type GoogleLoginRequest struct {
	IDToken string `json:"id_token" binding:"required"`
}

type OTPRequest struct {
	UserID uint   `json:"user_id" binding:"required"`
	Type   string `json:"type" binding:"required,oneof=verification reset_password"`
}

type VerifyOTPRequest struct {
	UserID uint   `json:"user_id" binding:"required"`
	Code   string `json:"code" binding:"required"`
	Type   string `json:"type" binding:"required"`
}

type ResetPasswordRequest struct {
	UserID   uint   `json:"user_id" binding:"required"`
	Password string `json:"password" binding:"required,min=6"`
}

type RegisterSendOTPRequest struct {
	Email string `json:"email" binding:"required,email"`
}

// Email-based reset password requests
type ResetSendOTPRequest struct {
	Email string `json:"email" binding:"required,email"`
}

type VerifyResetOTPRequest struct {
	Email string `json:"email" binding:"required,email"`
	Code  string `json:"code" binding:"required"`
}

type ResetPasswordByEmailRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
}

type AuthResponse struct {
	User  interface{} `json:"user"`
	Token string      `json:"token"`
}

func (ac *AuthController) Register(c *gin.Context) {
	var req RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, "Invalid request", err.Error())
		return
	}

	user, err := ac.authService.RegisterWithEmail(req.Email, req.Password, req.Name, req.OTP)
	if err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, "Registration failed", err.Error())
		return
	}

	// Create default categories for the new user
	if err := ac.categoryService.CreateDefaultCategories(user.ID); err != nil {
		// Log the error but don't fail the registration
		utils.RespondWithError(c, http.StatusInternalServerError, "Failed to create default categories", err.Error())
		return
	}

	// Generate JWT token
	token := generateJWT(user.ID, user.Email, user.Name)

	utils.RespondWithSuccess(c, http.StatusCreated, "User registered successfully", AuthResponse{
		User:  user,
		Token: token,
	})
}

func (ac *AuthController) Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, "Invalid request", err.Error())
		return
	}

	user, err := ac.authService.LoginWithEmail(req.Email, req.Password)
	if err != nil {
		utils.RespondWithError(c, http.StatusUnauthorized, "Login failed", err.Error())
		return
	}

	// Generate JWT token
	token := generateJWT(user.ID, user.Email, user.Name)

	utils.RespondWithSuccess(c, http.StatusOK, "Login successful", AuthResponse{
		User:  user,
		Token: token,
	})
}

func (ac *AuthController) GoogleLogin(c *gin.Context) {
	var req GoogleLoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, "Invalid request", err.Error())
		return
	}

	// Get Firebase Auth client from context
	firebaseAuth, exists := c.Get("firebaseAuth")
	if !exists {
		utils.RespondWithError(c, http.StatusInternalServerError, "Firebase not initialized", "")
		return
	}

	user, err := ac.authService.VerifyGoogleToken(req.IDToken, firebaseAuth.(interface{}))
	if err != nil {
		utils.RespondWithError(c, http.StatusUnauthorized, "Google login failed", err.Error())
		return
	}

	// Try to create default categories (for new users)
	// If categories already exist, this will fail gracefully
	_ = ac.categoryService.CreateDefaultCategories(user.ID)

	// Generate JWT token
	token := generateJWT(user.ID, user.Email, user.Name)

	utils.RespondWithSuccess(c, http.StatusOK, "Google login successful", AuthResponse{
		User:  user,
		Token: token,
	})
}

func (ac *AuthController) RequestOTP(c *gin.Context) {
	var req OTPRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, "Invalid request", err.Error())
		return
	}

	err := ac.authService.RequestOTP(req.UserID, req.Type)
	if err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, "Failed to request OTP", err.Error())
		return
	}

	utils.RespondWithSuccess(c, http.StatusOK, "OTP sent to email", nil)
}

func (ac *AuthController) VerifyOTP(c *gin.Context) {
	var req VerifyOTPRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, "Invalid request", err.Error())
		return
	}

	err := ac.authService.VerifyOTP(req.UserID, req.Code, req.Type)
	if err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, "Failed to verify OTP", err.Error())
		return
	}

	utils.RespondWithSuccess(c, http.StatusOK, "OTP verified successfully", nil)
}

func (ac *AuthController) ResetPassword(c *gin.Context) {
	var req ResetPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, "Invalid request", err.Error())
		return
	}

	err := ac.authService.ResetPassword(req.UserID, req.Password)
	if err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, "Failed to reset password", err.Error())
		return
	}

	utils.RespondWithSuccess(c, http.StatusOK, "Password reset successfully", nil)
}

func (ac *AuthController) RegisterSendOTP(c *gin.Context) {
	var req RegisterSendOTPRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, "Invalid request", err.Error())
		return
	}

	err := ac.authService.RegisterSendOTPByEmail(req.Email)
	if err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, "Gagal mengirim OTP", err.Error())
		return
	}

	utils.RespondWithSuccess(c, http.StatusOK, "OTP berhasil dikirim ke email", nil)
}

// ResetSendOTP - kirim token OTP reset password ke email (aktif 2 menit, token lama hangus)
func (ac *AuthController) ResetSendOTP(c *gin.Context) {
	var req ResetSendOTPRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, "Invalid request", err.Error())
		return
	}

	err := ac.authService.ResetSendOTPByEmail(req.Email)
	if err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, "Gagal mengirim OTP", err.Error())
		return
	}

	utils.RespondWithSuccess(c, http.StatusOK, "Token reset password berhasil dikirim ke email", nil)
}

// VerifyResetOTP - periksa apakah token OTP reset password valid
func (ac *AuthController) VerifyResetOTP(c *gin.Context) {
	var req VerifyResetOTPRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, "Invalid request", err.Error())
		return
	}

	err := ac.authService.VerifyResetOTPByEmail(req.Email, req.Code)
	if err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, "Token tidak valid", err.Error())
		return
	}

	utils.RespondWithSuccess(c, http.StatusOK, "Token valid", nil)
}

// ResetPasswordByEmail - simpan password baru setelah token terverifikasi
func (ac *AuthController) ResetPasswordByEmail(c *gin.Context) {
	var req ResetPasswordByEmailRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, "Invalid request", err.Error())
		return
	}

	err := ac.authService.ResetPasswordByEmail(req.Email, req.Password)
	if err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, "Gagal menyimpan kata sandi baru", err.Error())
		return
	}

	utils.RespondWithSuccess(c, http.StatusOK, "Kata sandi berhasil diperbarui", nil)
}

func generateJWT(userID uint, email string, name string) string {
	jwtSecret := config.GetEnv("JWT_SECRET", "financial-freedom-secret-key")

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id": userID,
		"email":   email,
		"name":    name,
		"exp":     time.Now().Add(time.Hour * 24 * 7).Unix(),
	})

	tokenString, err := token.SignedString([]byte(jwtSecret))
	if err != nil {
		return ""
	}

	return tokenString
}
