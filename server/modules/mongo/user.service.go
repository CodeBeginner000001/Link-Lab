package mongo

import (
	"context"
	"errors"
	"fmt"

	"linklab-server/errors/mongoerror"
	"linklab-server/logger"
	"linklab-server/model"
	"linklab-server/utils"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type UserService struct {
	repo *UserRepo
}

func NewUserService(repo *UserRepo) *UserService {
	return &UserService{repo}
}

func (s *UserService) CreateUser(
	ctx context.Context,
	name string,
	email string,
	hashedPassword string,
) (*model.User, error) {
	if name == "" {
		return nil, mongoerror.ErrNameRequired
	}
	if email == "" {
		return nil,mongoerror.ErrEmailRequired
	}
	if hashedPassword == "" {
		return nil,mongoerror.ErrPasswordRequired
	}

	_, err := s.repo.FindOne(ctx, bson.M{"email": email})
	if err == nil {
		logger.Error("userService: FinOne repo failed: ", err)
		return nil,mongoerror.ErrUserExists
	}

	if err != mongo.ErrNoDocuments {
		logger.Error(fmt.Sprintf("userService: CreateUser failed email=%s : ", email), err)
		return nil, mongoerror.ErrVerifingUserExistence
	}

	avatar, err := utils.GenerateAvatar(name, email)
	if err != nil {
		logger.Error(fmt.Sprintf("userService: CreateUser failed to generate for name=%s : ", name), err)
	}

	user := &model.User{
		Name:     name,
		Email:    email,
		Password: hashedPassword,
		Avatar:   avatar,
	}

	err = s.repo.Create(ctx, user)
	if err != nil {

		if errors.Is(err, mongoerror.ErrAvatarMissing) {
			logger.Error(fmt.Sprintf("userService: CreateUser avatar missing for email=%s : ", email), err)
			return nil, mongoerror.ErrGeneratingUserAvatar
		}

		if mongo.IsDuplicateKeyError(err) {
			logger.Error(fmt.Sprintf("userService: CreateUser duplicate email=%s : ", email), err)
			return nil, mongoerror.ErrUserExists
		}

		logger.Error(fmt.Sprintf("UserService: Create repo failed for email=%s : ", email), err)
		return nil, mongoerror.ErrUserCreation
	}

	return user, nil
}

func (s *UserService) Find(
	ctx context.Context,
	filter bson.M,
) (*model.User, error) {
	if len(filter) == 0 {
		logger.Error("userService: FindOneAndUpdate missing filter", nil)
		return nil, mongoerror.ErrMissingFilter
	}

	user, err := s.repo.FindOne(ctx, filter)
	if err != nil {

		if err == mongo.ErrNoDocuments {
			return nil, mongoerror.ErrNotFound
		}

		logger.Error("userService: findOne repo failed : ", err)
		return nil, mongoerror.ErrFetch
	}

	return user, nil
}

func (s *UserService) FindByID(
	ctx context.Context,
	id primitive.ObjectID,
) (*model.User, error) {
	if id.IsZero() {
		logger.Error("userService: FindByID missing id", nil)
		return nil, mongoerror.ErrInvalidID
	}
	user, err := s.repo.FindByID(ctx, id)
	if err != nil {

		if err == mongo.ErrNoDocuments {
			logger.Error("userService: FindByID user not found : ", err)
			return nil, mongoerror.ErrNotFound
		}

		logger.Error(
			fmt.Sprintf("userService: FindByID repo failed id=%s : ", id.Hex()),
			err,
		)
		return nil, mongoerror.ErrFetch
	}

	return user, nil
}

func (s *UserService) FindOneAndUpdate(
	ctx context.Context,
	filter bson.M,
	update bson.M,
) (*model.User, error) {
	if len(filter) == 0 {
		logger.Error("userService: FindOneAndUpdate missing filter", nil)
		return nil, mongoerror.ErrMissingFilter
	}

	if len(update) == 0 {
		logger.Error("userService: FindOneAndUpdate missing update", nil)
		return nil, mongoerror.ErrMissingUpdate
	}
	user, err := s.repo.FindOneAndUpdate(ctx, filter, update)
	if err != nil {

		if err == mongo.ErrNoDocuments {
			logger.Error("userService: FindOneAndUpdate not found : ", err)
			return nil, mongoerror.ErrNotFound
		}

		if mongo.IsDuplicateKeyError(err) {
			logger.Error("userService: FindOneAndUpdate duplicate key : ", err)
			return nil, mongoerror.ErrUserExists
		}

		logger.Error(
			fmt.Sprintf("userService: FindOneAndUpdate repo failed filter=%v : ", filter),
			err,
		)
		return nil, mongoerror.ErrUpdate
	}

	return user, nil
}

func (s *UserService) UpdateByID(
	ctx context.Context,
	id primitive.ObjectID,
	update bson.M,
) error {
	if id.IsZero() {
		logger.Error("userService: FindByID missing id", nil)
		return mongoerror.ErrInvalidID
	}

	if len(update) == 0 {
		logger.Error("userService: FindOneAndUpdate missing update", nil)
		return mongoerror.ErrMissingUpdate
	}

	err := s.repo.UpdateByID(ctx, id, update)
	if err != nil {

		if mongo.IsDuplicateKeyError(err) {
			logger.Error(
				fmt.Sprintf("userService: UpdateByID duplicate key id=%s : ", id.Hex()),
				err,
			)
			return mongoerror.ErrUserExists
		}

		logger.Error(
			fmt.Sprintf("userService: UpdateByID repo failed id=%s : ", id.Hex()),
			err,
		)
		return mongoerror.ErrUpdate
	}

	return nil
}
