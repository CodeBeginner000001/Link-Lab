package auth

import (
	"linklab-server/config"
	apperrors "linklab-server/errors"
	"linklab-server/http"
	"linklab-server/logger"
	"linklab-server/utils"
	"time"

	"github.com/gofiber/fiber/v2"
)

var authService = NewAuthService()

func AuthHealth(c *fiber.Ctx) error {
	return c.SendString("Auth route is working! 🔐")
}

func RegisterUser(c *fiber.Ctx) error {
	body, ok := c.Locals("body").(*RegisterRequest)
	if !ok {
		return http.InvalidRequestBody()
	}
	resData, err := authService.RegisterUserService(c.Context(), *body)

	if err != nil {
		logger.Error("registerUser: api failed due to: ", err)
		return apperrors.HandleError(err)
	}

	c.Cookie(&fiber.Cookie{
		Name:     "signup_session",
		Value:    resData.SessionId,
		Path:     "/v1/auth/otp/verify",
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
		logger.Debug("verifyOTP: signup session is missing")
		return http.UnAuthorized("Signup session expired")
	}

	user, err := authService.VerifyOTPService(c.Context(), sessionId, body.OTP)
	if err != nil {
		logger.Error("verifyOTP: api failed due to: ", err)
		return apperrors.HandleError(err)
	}
	accessToken, err := utils.GenerateAccessToken(user.ID.Hex())
	if err != nil {
		logger.Error("verifyOTP: access token generation failed: ", err, logger.F("userId:", user.ID.Hex()))
		return apperrors.HandleError(apperrors.ErrUtils)
	}
	refreshToken, err := utils.GenerateRefreshToken(user.ID.Hex())
	if err != nil {
		logger.Error("verifyOTP: refresh token generation failed: ", err, logger.F("userID", user.ID.Hex()))
		return apperrors.HandleError(apperrors.ErrUtils)
	}
	c.Cookie(&fiber.Cookie{
		Name:     "refresh_token",
		Value:    refreshToken,
		HTTPOnly: true,
		Secure:   config.IsProduction(),
		SameSite: fiber.CookieSameSiteStrictMode,
		Path:     "/v1/auth",
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
		logger.Debug("resendOTP: signup session missing")
		return http.UnAuthorized("Signup session expired")
	}

	if err := authService.ResendOTPService(c.Context(), sessionId); err != nil {
		logger.Error("resendOTP: api failed due to: ", err)
		return apperrors.HandleError(err)
	}

	return http.Success(c, "OTP sent successfully", nil)
}

func Login(c *fiber.Ctx) error {
	body, ok := c.Locals("body").(*LoginRequest)
	if !ok {
		return http.InvalidRequestBody()
	}
	user, err := authService.LoginService(c.Context(), *body)

	if err != nil {
		logger.Error("login: api failed due to: ", err)
		return apperrors.HandleError(err)
	}

	accessToken, err := utils.GenerateAccessToken(user.ID.Hex())
	if err != nil {
		logger.Error("login: access token generation failed: ", err, logger.F("userId:", user.ID.Hex()))
		return apperrors.HandleError(apperrors.ErrUtils)
	}
	refreshToken, err := utils.GenerateRefreshToken(user.ID.Hex())
	if err != nil {
		logger.Error("login: refresh token generation failed: ", err, logger.F("userID", user.ID.Hex()))
		return apperrors.HandleError(apperrors.ErrUtils)
	}
	c.Cookie(&fiber.Cookie{
		Name:     "refresh_token",
		Value:    refreshToken,
		HTTPOnly: true,
		Secure:   config.IsProduction(),
		SameSite: fiber.CookieSameSiteStrictMode,
		Path:     "/v1/auth",
		Expires:  time.Now().Add(config.RefreshTokenTTL),
	})
	return http.Success(
		c,
		"Login successful",
		map[string]interface{}{
			"accessToken": accessToken,
		},
	)
}

func RefreshToken(c *fiber.Ctx) error {
	refreshToken := c.Cookies("refresh_token")
	if refreshToken == "" {
		logger.Debug("refreshToken: refresh session token missing")
		return http.UnAuthorized("Session expired")
	}
	tokens, err := authService.RefreshTokenService(c.Context(), refreshToken)
	if err != nil {
		logger.Error("refreshToken: api failed due to: ", err)
		return apperrors.HandleError(err)
	}
	c.Cookie(&fiber.Cookie{
		Name:     "refresh_token",
		Value:    tokens.RefreshToken,
		HTTPOnly: true,
		Secure:   config.IsProduction(),
		SameSite: fiber.CookieSameSiteStrictMode,
		Path:     "/v1/auth",
		Expires:  time.Now().Add(config.RefreshTokenTTL),
	})
	return http.Success(c, "Token refreshed successfully", map[string]interface{}{
		"accessToken": tokens.AccessToken,
	})
}

func Logout(c *fiber.Ctx) error {
	refreshToken := c.Cookies("refresh_token")
	if refreshToken != "" {
		if err := authService.LogoutService(c.Context(), refreshToken); err != nil {
			logger.Error("logout: blacklisting refresh token failed: ", err)
		}
	}
	c.ClearCookie("refresh_token")
	return http.Success(c, "Logout successful", nil)
}
