package auth

import (
	"context"
	"errors"
	"time"

	"linklab-server/config"
	apperrors "linklab-server/errors"
	"linklab-server/errors/autherror"
	"linklab-server/http"
	"linklab-server/logger"
	"linklab-server/utils"

	"github.com/gofiber/fiber/v2"
)

type AuthHandler struct {
	authService *AuthService
	appConfig config.AppConfig
}

func NewAuthHandler(authService *AuthService) *AuthHandler {
	if authService == nil {
		panic("auth handler service must not be nil")
	}
	return &AuthHandler{
		authService: authService,
		appConfig: config.LoadAppConfig(),
	}
}

func clearCookie(c *fiber.Ctx, name string) {
	c.Cookie(&fiber.Cookie{
		Name:     name,
		Value:    "",
		Path:     "/",
		HTTPOnly: true,
		Secure:   config.IsProd(),
		SameSite: fiber.CookieSameSiteLaxMode,
		Expires:  time.Unix(0, 0),
	})
}

func (h *AuthHandler) RegisterUser(c *fiber.Ctx) error {
	body, ok := c.Locals("body").(*RegisterRequest)
	if !ok {
		return http.InvalidRequestBody()
	}
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	resData, err := h.authService.RegisterUserService(ctx, *body)

	if err != nil {
		logger.Error("registerUser: api failed due to: ", err)
		return apperrors.HandleError(err)
	}

	c.Cookie(&fiber.Cookie{
		Name:     "signup_session",
		Value:    resData.SessionId,
		Path:     "/",
		HTTPOnly: true,
		Secure:   config.IsProd(),
		SameSite: fiber.CookieSameSiteLaxMode,
		Expires:  time.Now().Add(h.appConfig.SignupSessionTTL),
	})
	return http.Success(c, resData.Message, fiber.Map{
		"email": resData.Email,
	})
}

func (h *AuthHandler) GetSignupSession(c *fiber.Ctx) error {
	sessionId := c.Cookies("signup_session")
	if sessionId == "" {
		logger.Debug("resendOTP: signup session missing")
		return http.UnAuthorized("Signup session expired")
	}
	sessionData, err := h.authService.GetSignupSessionDataService(c.Context(), sessionId)
	if err != nil {
		if errors.Is(err, autherror.ErrSessionExpired) ||
			errors.Is(err, autherror.ErrSessionCorrupted) {
			clearCookie(c, "signup_session")
		}
		return apperrors.HandleError(err)
	}
	return http.Success(c, "Signup session active", sessionData)
}

func (h *AuthHandler) VerifyOTP(c *fiber.Ctx) error {
	body, ok := c.Locals("body").(*VerifyOTPRequest)
	if !ok {
		return http.InvalidRequestBody()
	}

	sessionId := c.Cookies("signup_session")
	if sessionId == "" {
		logger.Debug("verifyOTP: signup session is missing")
		return http.UnAuthorized("Signup session expired")
	}

	user, err := h.authService.VerifyOTPService(c.Context(), sessionId, body.OTP)
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
		Secure:   config.IsProd(),
		SameSite: fiber.CookieSameSiteStrictMode,
		Path:     "/",
		Expires:  time.Now().Add(h.appConfig.RefreshTokenTTL),
	})
	c.Cookie(&fiber.Cookie{
		Name:     "access_token",
		Value:    accessToken,
		HTTPOnly: true,
		Secure:   config.IsProd(),
		SameSite: fiber.CookieSameSiteStrictMode,
		Path:     "/",
		Expires:  time.Now().Add(h.appConfig.AccessTokenTTL),
	})
	clearCookie(c, "signup_session")

	return http.Success(
		c,
		"Signup process completed successfully", nil,
	)
}

func (h *AuthHandler) ResendOTP(c *fiber.Ctx) error {
	sessionId := c.Cookies("signup_session")
	if sessionId == "" {
		logger.Error("resendOTP: signup session missing", nil)
		return http.UnAuthorized("Signup session expired")
	}

	resendOTPData, err := h.authService.ResendOTPService(c.Context(), sessionId)
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

func (h *AuthHandler) Me(c *fiber.Ctx) error {
	accessToken := c.Cookies("access_token")

	if accessToken == "" {
		return http.UnAuthorized("Access token is expired")
	}

	user, err := h.authService.MeService(
		c.Context(),
		accessToken,
	)

	if err != nil {
		logger.Error("me: failed", err)
		return apperrors.HandleError(err)
	}

	return http.Success(c, "User fetched", user)
}

func (h *AuthHandler) Login(c *fiber.Ctx) error {
	body, ok := c.Locals("body").(*LoginRequest)
	if !ok {
		return http.InvalidRequestBody()
	}
	user, err := h.authService.LoginService(c.Context(), *body)

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
		Secure:   config.IsProd(),
		SameSite: fiber.CookieSameSiteStrictMode,
		Path:     "/",
		Expires:  time.Now().Add(h.appConfig.RefreshTokenTTL),
	})
	c.Cookie(&fiber.Cookie{
		Name:     "access_token",
		Value:    accessToken,
		HTTPOnly: true,
		Secure:   config.IsProd(),
		SameSite: fiber.CookieSameSiteStrictMode,
		Path:     "/",
		Expires:  time.Now().Add(h.appConfig.AccessTokenTTL),
	})
	return http.Success(
		c,
		"Login successful",
		nil,
	)
}

func (h *AuthHandler) RefreshToken(c *fiber.Ctx) error {
	refreshToken := c.Cookies("refresh_token")
	if refreshToken == "" {
		logger.Debug("refreshToken: refresh session token missing")
		return http.UnAuthorized("Session expired")
	}
	tokens, err := h.authService.RefreshTokenService(c.Context(), refreshToken)
	if err != nil {
		logger.Error("refreshToken: api failed due to: ", err)
		return apperrors.HandleError(err)
	}
	c.Cookie(&fiber.Cookie{
		Name:     "access_token",
		Value:    tokens.AccessToken,
		HTTPOnly: true,
		Secure:   config.IsProd(),
		SameSite: fiber.CookieSameSiteStrictMode,
		Path:     "/",
		Expires:  time.Now().Add(h.appConfig.AccessTokenTTL),
	})
	c.Cookie(&fiber.Cookie{
		Name:     "refresh_token",
		Value:    tokens.RefreshToken,
		HTTPOnly: true,
		Secure:   config.IsProd(),
		SameSite: fiber.CookieSameSiteStrictMode,
		Path:     "/",
		Expires:  time.Now().Add(h.appConfig.RefreshTokenTTL),
	})
	return http.Success(c, "Token refreshed successfully", nil)
}

func (h *AuthHandler) Logout(c *fiber.Ctx) error {
	refreshToken := c.Cookies("refresh_token")
	if refreshToken != "" {
		if err := h.authService.LogoutService(c.Context(), refreshToken); err != nil {
			logger.Error("logout: blacklisting refresh token failed: ", err)
		}
	}
	clearCookie(c, "refresh_token")
	clearCookie(c, "access_token")
	return http.Success(c, "Logout successful", nil)
}
