package controllers

import (
	"financial-freedom/services"
	"financial-freedom/utils"
	"net/http"

	"github.com/gin-gonic/gin"
)

type NotificationController struct {
	notificationService services.NotificationService
}

func NewNotificationController(notificationService services.NotificationService) *NotificationController {
	return &NotificationController{notificationService: notificationService}
}

type RegisterPushTokenRequest struct {
	Token    string `json:"token" binding:"required"`
	Platform string `json:"platform"`
}

func (nc *NotificationController) RegisterPushToken(c *gin.Context) {
	var req RegisterPushTokenRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, "Invalid request", err.Error())
		return
	}

	userID, exists := c.Get("userID")
	if !exists {
		utils.RespondWithError(c, http.StatusUnauthorized, "User not authenticated", "")
		return
	}

	if err := nc.notificationService.RegisterPushToken(userID.(uint), req.Token, req.Platform); err != nil {
		utils.RespondWithError(c, http.StatusInternalServerError, "Failed to register push token", err.Error())
		return
	}

	utils.RespondWithSuccess(c, http.StatusOK, "Push token registered", nil)
}
