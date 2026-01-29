package utils

import "github.com/golang-jwt/jwt/v5"

type AccessTokenClaims struct {
	UserID string `json:"uid"`
	jwt.RegisteredClaims
}

type RefreshTokenClaims struct {
	UserID string `json:"uid"`
	jwt.RegisteredClaims
}
