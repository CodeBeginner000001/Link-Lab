package auth

import (
	"linklab-server/config"
	"linklab-server/http"
	"linklab-server/utils"
	"time"

	"github.com/gofiber/fiber/v2"
)

func AuthHealth(c *fiber.Ctx) error {
	return c.SendString("Auth route is working! 🔐")
}

func RegisterUser(c *fiber.Ctx) error {
	body, ok := c.Locals("body").(*RegisterRequest)
	if !ok {
		return http.InvalidRequestBody()
	}
	resData, err := RegisterUserService(c.Context(), *body)
	if err != nil {
		return HandleAuthServiceError(err)
	}
	c.Cookie(&fiber.Cookie{
		Name:     "signup_session",
		Value:    resData.SessionId,
		Path:     "v1/auth/otp/verify",
		HTTPOnly: true,
		Secure:   config.IsProduction(),
		SameSite: fiber.CookieSameSiteLaxMode,
		Expires:  time.Now().Add(config.SignupSessionTTL),
	})
	return http.Success(c, "User registeration process initiated", resData)
}
func VerifyOTP(c *fiber.Ctx) error {
	body, ok := c.Locals("body").(*VerifyOTPRequest)
	if !ok {
		return http.InvalidRequestBody()
	}

	sessionId := c.Cookies("signup_session")
	if sessionId == "" {
		return http.UnAuthorized("Signup session expired")
	}

	user, err := VerifyOTPService(c.Context(), sessionId, body.OTP)
	if err != nil {
		return HandleAuthServiceError(err)
	}
	accessToken, err := utils.GenerateAccessToken(user.ID.Hex())
	if err != nil {
		return http.Internal(err)
	}
	refreshToken, err := utils.GenerateRefreshToken(user.ID.Hex())
	if err != nil {
		return http.Internal(err)
	}
	c.Cookie(&fiber.Cookie{
		Name:     "refresh_token",
		Value:    refreshToken,
		HTTPOnly: true,
		Secure:   config.IsProduction(),
		SameSite: fiber.CookieSameSiteStrictMode,
		Path:     "v1/auth/refresh",
		Expires:  time.Now().Add(config.RefreshTokenTTL),
	})
	c.ClearCookie("signup_session")

	return http.Success(
		c,
		"Signup process completed successfully",
		map[string]interface{}{
			"accessToken": accessToken,
		},
	)
}
func ResendOTP(c *fiber.Ctx) error {
	sessionId := c.Cookies("signup_session")
	if sessionId == "" {
		return http.UnAuthorized("Signup session expired")
	}

	err := ResendOTPService(c.Context(),sessionId)
	if err != nil {
		return HandleAuthServiceError(err)
	}

	return http.Success(
		c,
		"OTP sent successfully", nil,
	)
}
