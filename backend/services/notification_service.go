package services

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"
	"time"

	"financial-freedom/models"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type NotificationService interface {
	RegisterPushToken(userID uint, token string, platform string) error
	StartReminderWorker(ctx context.Context)
}

type notificationService struct {
	db       *gorm.DB
	location *time.Location
}

type expoPushMessage struct {
	To       string                 `json:"to"`
	Title    string                 `json:"title"`
	Body     string                 `json:"body"`
	Sound    string                 `json:"sound,omitempty"`
	Priority string                 `json:"priority,omitempty"`
	Data     map[string]interface{} `json:"data,omitempty"`
}

func NewNotificationService(db *gorm.DB) NotificationService {
	location, err := time.LoadLocation("Asia/Jakarta")
	if err != nil {
		location = time.Local
	}

	return &notificationService{db: db, location: location}
}

func (s *notificationService) RegisterPushToken(userID uint, token string, platform string) error {
	token = strings.TrimSpace(token)
	if token == "" {
		return fmt.Errorf("push token kosong")
	}

	pushToken := models.PushToken{
		UserID:   userID,
		Token:    token,
		Platform: platform,
	}

	return s.db.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "token"}},
		DoUpdates: clause.AssignmentColumns([]string{"user_id", "platform", "updated_at"}),
	}).Create(&pushToken).Error
}

func (s *notificationService) StartReminderWorker(ctx context.Context) {
	ticker := time.NewTicker(time.Minute)
	defer ticker.Stop()

	log.Println("Notification reminder worker started")
	s.sendDueReminders()

	for {
		select {
		case <-ctx.Done():
			log.Println("Notification reminder worker stopped")
			return
		case <-ticker.C:
			s.sendDueReminders()
		}
	}
}

func (s *notificationService) sendDueReminders() {
	now := time.Now().In(s.location)
	windowStart := now.Add(-2 * time.Minute)
	windowEnd := now.Add(time.Minute)

	s.sendTodoReminders(windowStart, windowEnd)
	s.sendDebtReminders(windowStart, windowEnd)
}

func (s *notificationService) sendTodoReminders(windowStart time.Time, windowEnd time.Time) {
	var todos []models.Todo
	if err := s.db.Where("notify_enabled = ? AND is_done = ?", true, false).Find(&todos).Error; err != nil {
		log.Printf("failed to fetch todo reminders: %v", err)
		return
	}

	for _, todo := range todos {
		offset := todo.ReminderOffsetMinutes
		if offset < 0 {
			offset = 0
		}

		triggerAt := todo.Time.In(s.location).Add(-time.Duration(offset) * time.Minute)
		if triggerAt.Before(windowStart) || triggerAt.After(windowEnd) {
			continue
		}

		eventKey := fmt.Sprintf("todo:%d:%d", todo.ID, triggerAt.Unix())
		title := "Reminder"
		body := todo.Title
		s.sendOnce(todo.UserID, eventKey, title, body, map[string]interface{}{
			"type":    "todo",
			"todo_id": todo.ID,
		})
	}
}

func (s *notificationService) sendDebtReminders(windowStart time.Time, windowEnd time.Time) {
	var debts []models.Debt
	if err := s.db.Where("notify_enabled = ? AND status NOT IN ?", true, []string{"lunas", "paid"}).Find(&debts).Error; err != nil {
		log.Printf("failed to fetch debt reminders: %v", err)
		return
	}

	for _, debt := range debts {
		days := debt.ReminderDays
		if days < 0 {
			days = 0
		}

		due := debt.DueDate.In(s.location)
		triggerAt := time.Date(due.Year(), due.Month(), due.Day(), 9, 0, 0, 0, s.location).
			AddDate(0, 0, -days)
		if triggerAt.Before(windowStart) || triggerAt.After(windowEnd) {
			continue
		}

		eventKey := fmt.Sprintf("debt:%d:%d", debt.ID, triggerAt.Unix())
		title := "Pengingat Pembayaran"
		body := fmt.Sprintf("%s jatuh tempo pada %s", debt.Name, due.Format("02 Jan 2006"))
		s.sendOnce(debt.UserID, eventKey, title, body, map[string]interface{}{
			"type":    "debt",
			"debt_id": debt.ID,
		})
	}
}

func (s *notificationService) sendOnce(userID uint, eventKey string, title string, body string, data map[string]interface{}) {
	var tokens []models.PushToken
	if err := s.db.Where("user_id = ?", userID).Find(&tokens).Error; err != nil {
		log.Printf("failed to fetch push tokens: %v", err)
		return
	}

	if len(tokens) == 0 {
		return
	}

	delivery := models.NotificationDelivery{
		UserID:   userID,
		EventKey: eventKey,
		Title:    title,
		Body:     body,
		SentAt:   time.Now(),
	}

	if err := s.db.Create(&delivery).Error; err != nil {
		return
	}

	for _, token := range tokens {
		if err := sendExpoPush(token.Token, title, body, data); err != nil {
			log.Printf("failed to send push to token %d: %v", token.ID, err)
		}
	}
}

func sendExpoPush(token string, title string, body string, data map[string]interface{}) error {
	message := expoPushMessage{
		To:       token,
		Title:    title,
		Body:     body,
		Sound:    "default",
		Priority: "high",
		Data:     data,
	}

	payload, err := json.Marshal(message)
	if err != nil {
		return err
	}

	resp, err := http.Post("https://exp.host/--/api/v2/push/send", "application/json", bytes.NewReader(payload))
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return fmt.Errorf("expo push api returned status %d", resp.StatusCode)
	}

	return nil
}
