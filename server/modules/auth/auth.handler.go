package auth

import (
	"context"
	"errors"
	"linklab-server/config"
	apperrors "linklab-server/errors"
	"linklab-server/errors/autherror"
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

func clearCookie(c *fiber.Ctx, name string) {
	c.Cookie(&fiber.Cookie{
		Name:     name,
		Value:    "",
		Path:     "/",
		HTTPOnly: true,
		Secure:   config.IsProduction(),
		SameSite: fiber.CookieSameSiteLaxMode,
		Expires:  time.Unix(0, 0),
	})
}

func RegisterUser(c *fiber.Ctx) error {
	body, ok := c.Locals("body").(*RegisterRequest)
	if !ok {
		return http.InvalidRequestBody()
	}
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	resData, err := authService.RegisterUserService(ctx, *body)

	if err != nil {
		logger.Error("registerUser: api failed due to: ", err)
		return apperrors.HandleError(err)
	}

	c.Cookie(&fiber.Cookie{
		Name:     "signup_session",
		Value:    resData.SessionId,
		Path:     "/",
		HTTPOnly: true,
		Secure:   config.IsProduction(),
		SameSite: fiber.CookieSameSiteLaxMode,
		Expires:  time.Now().Add(config.SignupSessionTTL),
	})
	return http.Success(c, "User registeration process initiated", fiber.Map{
		"email":   resData.Email,
		"message": resData.Message,
	})
}

func GetSignupSession(c *fiber.Ctx) error {
	sessionId := c.Cookies("signup_session")
	if sessionId == "" {
		logger.Debug("resendOTP: signup session missing")
		return http.UnAuthorized("Signup session expired")
	}
	sessionData, err := authService.GetSignupSessionDataService(c.Context(), sessionId)
	if err != nil {
		if errors.Is(err, autherror.ErrSessionExpired) ||
			errors.Is(err, autherror.ErrSessionCorrupted) {
			clearCookie(c, "signup_session")
		}
		return apperrors.HandleError(err)
	}
	return http.Success(c, "Signup session active", sessionData)
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
		if errors.Is(err, autherror.ErrSessionExpired) ||
			errors.Is(err, autherror.ErrSessionCorrupted) {
			clearCookie(c, "signup_session")
		}
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
		Path:     "/",
		Expires:  time.Now().Add(config.RefreshTokenTTL),
	})
	c.Cookie(&fiber.Cookie{
		Name:     "access_token",
		Value:    accessToken,
		HTTPOnly: true,
		Secure:   config.IsProduction(),
		SameSite: fiber.CookieSameSiteStrictMode,
		Path:     "/",
		Expires:  time.Now().Add(config.AccessTokenTTL),
	})
	clearCookie(c, "signup_session")

	return http.Success(
		c,
		"Signup process completed successfully", nil,
	)
}

func ResendOTP(c *fiber.Ctx) error {
	sessionId := c.Cookies("signup_session")
	if sessionId == "" {
		logger.Error("resendOTP: signup session missing", nil)
		return http.UnAuthorized("Signup session expired")
	}

	resendOTPData, err := authService.ResendOTPService(c.Context(), sessionId)
	if err != nil {
		logger.Error("resendOTP: api failed due to: ", err)
		if errors.Is(err, autherror.ErrSessionExpired) ||
			errors.Is(err, autherror.ErrSessionCorrupted) {
			clearCookie(c, "signup_session")
		}
		return apperrors.HandleError(err)
	}

	return http.Success(c, "OTP sent successfully", resendOTPData)
}

func Me(c *fiber.Ctx) error {
	accessToken := c.Cookies("access_token")
	refreshToken := c.Cookies("refresh_token")

	if accessToken == "" && refreshToken == "" {
		return http.UnAuthorized("Unauthorized")
	}

	user, newAccessToken, err := authService.MeService(
		c.Context(),
		accessToken,
		refreshToken,
	)

	if err != nil {
		logger.Error("me: failed", err)
		if errors.Is(err, autherror.ErrUnauthorized) ||
			errors.Is(err, autherror.ErrSessionExpired) {

			clearCookie(c, "access_token")
		}

		return apperrors.HandleError(err)
	}

	if newAccessToken != "" {
		c.Cookie(&fiber.Cookie{
			Name:     "access_token",
			Value:    newAccessToken,
			HTTPOnly: true,
			Secure:   config.IsProduction(),
			SameSite: fiber.CookieSameSiteStrictMode,
			Path:     "/",
			Expires:  time.Now().Add(config.AccessTokenTTL),
		})
	}

	return http.Success(c, "User fetched", user)
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
		Path:     "/",
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
		Name:     "access_token",
		Value:    tokens.AccessToken,
		HTTPOnly: true,
		Secure:   config.IsProduction(),
		SameSite: fiber.CookieSameSiteStrictMode,
		Path:     "/",
		Expires:  time.Now().Add(config.AccessTokenTTL),
	})
	return http.Success(c, "Token refreshed successfully", nil)
}

func Logout(c *fiber.Ctx) error {
	refreshToken := c.Cookies("refresh_token")
	if refreshToken != "" {
		if err := authService.LogoutService(c.Context(), refreshToken); err != nil {
			logger.Error("logout: blacklisting refresh token failed: ", err)
		}
	}
	clearCookie(c, "refresh_token")
	return http.Success(c, "Logout successful", nil)
}
