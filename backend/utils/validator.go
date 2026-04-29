package utils

import (
	"regexp"
	"strings"
	"unicode"
)

func ValidateEmail(email string) bool {
	const emailRegex = `^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`
	re := regexp.MustCompile(emailRegex)
	return re.MatchString(email)
}

func ValidatePassword(password string) (bool, []string) {
	var errors []string

	if len(password) < 6 {
		errors = append(errors, "Password must be at least 6 characters")
	}
	if len(password) > 50 {
		errors = append(errors, "Password must be less than 50 characters")
	}

	hasUpper := false
	hasLower := false
	hasNumber := false

	for _, char := range password {
		if unicode.IsUpper(char) {
			hasUpper = true
		} else if unicode.IsLower(char) {
			hasLower = true
		} else if unicode.IsDigit(char) {
			hasNumber = true
		}
	}

	if !hasUpper {
		errors = append(errors, "Password must contain at least one uppercase letter")
	}
	if !hasLower {
		errors = append(errors, "Password must contain at least one lowercase letter")
	}
	if !hasNumber {
		errors = append(errors, "Password must contain at least one number")
	}

	return len(errors) == 0, errors
}

func SanitizeInput(input string) string {
	// Remove leading and trailing whitespace
	return strings.TrimSpace(input)
}
