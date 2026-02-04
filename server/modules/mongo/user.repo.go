package mongo

import (
	"context"
	"linklab-server/db"
	"linklab-server/errors/mongoerror"
	"linklab-server/model"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type UserRepo struct {
	col *mongo.Collection
}

func NewUserRepo(db *mongo.Database) *UserRepo {
	col := db.Collection("users")

	indexes := []mongo.IndexModel{
		{
			Keys: bson.D{
				{Key: "email", Value: 1},
			},
			Options: options.Index().
				SetUnique(true).
				SetName("unique_email"),
		},
		{
			Keys: bson.D{
				{Key: "email", Value: 1},
				{Key: "is_active", Value: 1},
			},
			Options: options.Index().
				SetName("email_active"),
		},
	}

	_, err := col.Indexes().CreateMany(
		context.Background(),
		indexes,
	)

	if err != nil {
	}

	return &UserRepo{col: col}
}

func (r *UserRepo) preInsert(u *model.User) {
	now := time.Now().UTC()

	if u.ID.IsZero() {
		u.ID = primitive.NewObjectID()
	}
	u.IsActive = true
	u.CreatedAt = now
	u.UpdatedAt = now
}

func (r *UserRepo) preUpdate(update bson.M) bson.M {
	update["updated_at"] = time.Now().UTC()
	return update
}

func (r *UserRepo) Create(ctx context.Context, u *model.User) (error) {
	if err := db.EnsureMongo(); err != nil {
		return mongoerror.ErrMongoUnavailable
	}
	r.preInsert(u)
	if u.Avatar == "" {
		return mongoerror.ErrAvatarMissing
	}
	_, err := r.col.InsertOne(ctx, u)
	return err
}

func (r *UserRepo) FindOne(
	ctx context.Context,
	filter bson.M,
) (*model.User, error) {
	if err := db.EnsureMongo(); err != nil {
		return nil, mongoerror.ErrMongoUnavailable
	}
	var user model.User
	err := r.col.FindOne(ctx, filter).Decode(&user)
	if err != nil {
		return nil, err
	}

	return &user, nil
}

func (r *UserRepo) FindByID(
	ctx context.Context,
	id primitive.ObjectID,
) (*model.User, error) {
	if err := db.EnsureMongo(); err != nil {
		return nil, mongoerror.ErrMongoUnavailable
	}
	return r.FindOne(ctx, bson.M{"_id": id})
}

func (r *UserRepo) FindOneAndUpdate(
	ctx context.Context,
	filter bson.M,
	update bson.M,
) (*model.User, error) {
	if err := db.EnsureMongo(); err != nil {
		return nil, mongoerror.ErrMongoUnavailable
	}
	update = r.preUpdate(update)

	opts := options.FindOneAndUpdate().
		SetReturnDocument(options.After)

	var user model.User
	err := r.col.FindOneAndUpdate(
		ctx,
		filter,
		bson.M{"$set": update},
		opts,
	).Decode(&user)

	if err != nil {
		return nil, err
	}

	return &user, nil
}

func (r *UserRepo) UpdateByID(
	ctx context.Context,
	id primitive.ObjectID,
	update bson.M,
) error {
	if err := db.EnsureMongo(); err != nil {
		return mongoerror.ErrMongoUnavailable
	}
	update = r.preUpdate(update)

	_, err := r.col.UpdateByID(
		ctx,
		id,
		bson.M{"$set": update},
	)

	return err
}
