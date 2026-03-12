package utils

import (
	"errors"
	"time"

	"linklab-server/config"
	utilserror "linklab-server/errors/utilsError"

	"github.com/golang-jwt/jwt/v5"
)

var appConfig = config.LoadAppConfig()

func GenerateAccessToken(userID string) (string, error) {
	
	if userID == "" {
		return "", utilserror.ErrGeneratingAccessToken
	}

	claims := AccessTokenClaims{
		UserID: userID,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(appConfig.AccessTokenTTL)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, err := token.SignedString([]byte(appConfig.JWTAccessSecret))
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
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(appConfig.RefreshTokenTTL)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, err := token.SignedString([]byte(appConfig.JWTRefreshSecret))
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
			return []byte(appConfig.JWTRefreshSecret), nil
		},
	)
	if err != nil {
		if errors.Is(err, jwt.ErrTokenExpired) {
			return nil, utilserror.ErrTokenExpired
		}
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

func ValidateAccessToken(tokenString string) (*AccessTokenClaims, error) {
	if tokenString == "" {
		return nil, utilserror.ErrTokenExpired
	}
	token, err := jwt.ParseWithClaims(
		tokenString,
		&AccessTokenClaims{},
		func(token *jwt.Token) (interface{}, error) {
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, utilserror.ErrValidatingToken
			}
			return []byte(appConfig.JWTAccessSecret), nil
		},
	)
	if err != nil {
		if errors.Is(err, jwt.ErrTokenExpired) {
			return nil, utilserror.ErrTokenExpired
		}
		return nil, utilserror.ErrValidatingToken
	}

	claims, ok := token.Claims.(*AccessTokenClaims)
	if !ok || !token.Valid {
		return nil, utilserror.ErrValidatingToken
	}

	if claims.UserID == "" {
		return nil, utilserror.ErrValidatingToken
	}

	return claims, nil
}
