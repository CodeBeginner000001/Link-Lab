package logger

import (
	"linklab-server/config"

	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
)

var log *zap.Logger
type Field = zap.Field

func Init() {
	var cfg zap.Config
	var appConfig = config.LoadAppConfig()

	if appConfig.Env == "prod" {
		cfg = zap.NewProductionConfig()
	} else {
		cfg = zap.NewDevelopmentConfig()
		cfg.Encoding = "console"
		cfg.EncoderConfig.EncodeLevel = zapcore.CapitalColorLevelEncoder
	}

	cfg.Level = zap.NewAtomicLevelAt(parseLevel(appConfig.LogLevel))
	cfg.EncoderConfig.EncodeTime = zapcore.ISO8601TimeEncoder

	l, err := cfg.Build(zap.AddCallerSkip(1))
	if err != nil {
		panic(err)
	}

	log = l
}

func parseLevel(level string) zapcore.Level {
	switch level {
	case "debug":
		return zapcore.DebugLevel
	case "warn":
		return zapcore.WarnLevel
	case "error":
		return zapcore.ErrorLevel
	default:
		return zapcore.InfoLevel
	}
}

func F(key string, value any) Field {
	return zap.Any(key, value)
}


func Sync() {
	if log != nil {
		_ = log.Sync()
	}
}

func Debug(msg string, fields ...Field) {
	log.Debug(msg, fields...)
}

func Info(msg string, fields ...Field) {
	log.Info(msg, fields...)
}

func Warn(msg string, fields ...Field) {
	log.Warn(msg, fields...)
}

func Error(msg string, err error, fields ...Field) {
	if err != nil {
		fields = append(fields, F("error", err.Error()))
	}
	log.Error(msg, fields...)
}
