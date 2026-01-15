package utils

import (
	"math/rand"
	"strconv"
	"strings"
	"time"

	"golang.org/x/crypto/bcrypt"
)

func GenerateOTP(length int) string {
	rand.Seed(time.Now().UnixNano())
	var otp strings.Builder
	for range length {
		otp.WriteString(strconv.Itoa(rand.Intn(10)))
	}
	return otp.String()
}

func HashPassword(password string, cost int) (string,error){
	hash, err := bcrypt.GenerateFromPassword([]byte(password), cost)
	if err != nil {
		return "", err
	}
	return string(hash), nil
}
