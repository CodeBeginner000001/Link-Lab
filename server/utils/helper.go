package utils

import (
	utilserror "linklab-server/errors/utilsError"
	"linklab-server/logger"
	"math/rand"
	"strconv"
	"strings"

	"golang.org/x/crypto/bcrypt"
)

func GenerateOTP(length int) string {
	if length <= 0 {
		return ""
	}

	var otp strings.Builder
	for i := 0; i < length; i++ {
		otp.WriteString(strconv.Itoa(rand.Intn(10)))
	}
	return otp.String()
}

func HashPassword(password string, cost int) (string, error) {
	if cost < bcrypt.MinCost || cost > bcrypt.MaxCost {
		return "", utilserror.ErrInvalidCost
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(password), cost)
	if err != nil {
		logger.Error("Error in utils hashpassword function: ", err)
		return "", utilserror.ErrHashFailed
	}
	return string(hash), nil
}

func ComparePassword(hashedPassword, plainPassword string) error {
	err := bcrypt.CompareHashAndPassword(
		[]byte(hashedPassword),
		[]byte(plainPassword),
	)

	if err != nil {
		if err == bcrypt.ErrMismatchedHashAndPassword {
			return utilserror.ErrCompareFailed
		}
		logger.Error("utils ComparePassword failed", err)
		return utilserror.ErrCompareFailed
	}

	return nil
}
