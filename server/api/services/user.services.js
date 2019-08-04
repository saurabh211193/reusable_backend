import Boom from 'boom';
import qr from 'qr-image';
import User from '../models/user';


export class UserService {
    checkDuplicateUser(email, done) {
        const _user = new User();
        _user.model.find({
            email,
            isDeleted: false,
        }, (err, result) => {
            if (err) {
                return done(err);
            }
            if (result.length) {
                return done(null, true);
            }

            return done(null);
        });
    }

    insertUser(userInfo, done) {
        const {
            email,
        } = userInfo;

        const insertOptions = {
            upsert: true,
            new: true,
            setDefaultsOnInsert: true,
        };


        const _user = new User();

        _user.model.findOneAndUpdate({
            email,
            isDeleted: true,
        }, userInfo, insertOptions, (err, doc) => {
            if (err) {
                return done(err);
            }

            return done(null, doc.toJSON());
        });
    }

    logIn(loginInfo, done) {
        const _user = new User();
        _user.model.findOne(loginInfo, (err, result) => {
            if (err) {
                return done(err);
            }
            if (!result) {
                return done(Boom.unauthorized('Incorrect login credential provided'));
            }
            return done(null, result.toJSON());
        });
    }

    find(query, done) {
        const _user = new User();
        _user.model.findOne(query, (err, result) => {
            if (err) {
                return done(err);
            }
            if (!result) {
                return done(Boom.notFound('User not registered'));
            }

            return done(null, result.toJSON());
        });
    }

    findAll(query, done) {
        const _user = new User();
        _user.model.find(query, (err, result) => {
            if (err) {
                return done(err);
            }
            
            return done(null, result);
        });
    }


    updateUser({
        condition,
        updateObject,
    }, done) {
        const _user = new User();
        _user.model.findOneAndUpdate(condition, updateObject, (err, info) => {
            if (err) {
                return done(err);
            }
            if (!info) {
                return done(Boom.notFound('User not registered'));
            }

            return done(null, info ? info.toJSON() : null);
        });
    }
    qrCode(data, done) {
        const code = qr.image(data, { type: 'svg' });
        return done(null, code);
    }

    addToCart(condition, updateObject, done) {
        console.log('condition', condition);
        console.log('updateObject', updateObject);
        const _user = new User();
        _user.model.findOneAndUpdate(condition, { $push: { cartInfo: updateObject } }, (err, result) => {
            if (err) {
                return done(err);
            }
            console.log('result', result);
            // return done(null, result.toJSON());
        });
    }
}

export default new UserService();