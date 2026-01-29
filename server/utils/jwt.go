package utils

import (
	"time"

	"linklab-server/config"
	utilserror "linklab-server/errors/utilsError"

	"github.com/golang-jwt/jwt/v5"
)

func GenerateAccessToken(userID string) (string, error) {
	if userID == "" {
		return "", utilserror.ErrGeneratingAccessToken
	}

	claims := AccessTokenClaims{
		UserID: userID,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(config.AccessTokenTTL)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, err := token.SignedString([]byte(config.JWTAccessSecret))
	if err != nil {
		return "", utilserror.ErrGeneratingAccessToken
	}

	return signed, nil
}

func GenerateRefreshToken(userID string) (string, error) {
	if userID == "" {
		return "", utilserror.ErrGeneratingRefreshToken
	}
	claims := RefreshTokenClaims{
		UserID: userID,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(config.RefreshTokenTTL)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, err := token.SignedString([]byte(config.JWTRefreshSecret))
	if err != nil {
		return "", utilserror.ErrGeneratingRefreshToken
	}

	return signed, nil
}

func ValidateRefreshToken(tokenString string) (*RefreshTokenClaims, error) {
	if tokenString == "" {
		return nil, utilserror.ErrValidatingToken
	}
	token, err := jwt.ParseWithClaims(
		tokenString,
		&RefreshTokenClaims{},
		func(token *jwt.Token) (interface{}, error) {
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, utilserror.ErrValidatingToken
			}
			return []byte(config.JWTRefreshSecret), nil
		},
	)
	if err != nil {
		return nil, utilserror.ErrValidatingToken
	}

	claims, ok := token.Claims.(*RefreshTokenClaims)
	if !ok || !token.Valid {
		return nil, utilserror.ErrValidatingToken
	}

	if claims.UserID == "" {
		return nil, utilserror.ErrValidatingToken
	}

	return claims, nil
}
