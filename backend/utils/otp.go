package utils

import (
	"math/rand"
	"time"
)

func GenerateOTP(length int) string {
	const digits = "0123456789"
	seededRand := rand.New(rand.NewSource(time.Now().UnixNano()))

	otp := make([]byte, length)
	for i := range otp {
		otp[i] = digits[seededRand.Intn(len(digits))]
	}
	return string(otp)
}

func GetOTPExpiry(minutes int) time.Time {
	return time.Now().Add(time.Duration(minutes) * time.Minute)
}
