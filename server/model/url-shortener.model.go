package model

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type URLShortener struct {
	ID          primitive.ObjectID `json:"id" bson:"_id, omitempty"`
	Alais       string             `json:"alias" bson:"alias"`
	LongURL     string             `json:"long_url" bson:"long_url"`
	ShortURL    string             `json:"short_url,omitempty" bson:"short_url,omitempty"`
	CreatedAt   time.Time          `json:"created_at" bson:"createdAt"`
	UpdatedAt   time.Time          `json:"updated_at" bson:"updatedAt"`
	ClickCount  int64              `json:"click_count" bson:"click_count"`
	LastClicked *time.Time         `json:"last_clicked,omitempty" bson:"last_clicked,omitempty"`
	IsActive    bool               `json:"is_active,omitempty" bson:"is_active"`
	CreatedBy   string             `json:"created_by,omitempty" bson:"created_by,omitempty"`
}
