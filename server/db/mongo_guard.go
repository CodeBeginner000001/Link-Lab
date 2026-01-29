package db
import "linklab-server/errors/mongoerror"

func EnsureMongo() error {
	if !IsMongoHealthy() || MongoClient == nil {
		return mongoerror.ErrMongoUnavailable
	}
	return nil
}
