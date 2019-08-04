import {
    Strategy,
    ExtractJwt,
} from 'passport-jwt';
import Config from 'config';
import Jwt from 'jsonwebtoken';
import Passport from 'passport';
import Boom from 'boom';

import
userService from '../api/services/user.services';


const jwtStrategy = new Strategy({
    secretOrKey: Config.get('jwtSecret'),
    jwtFromRequest: ExtractJwt.fromHeader('token'),
}, (jwtPayload, done) => {
    const {
        id,
        isSocial,
    } = jwtPayload;

    if (!isSocial) {
        userService.find({
            _id: id,
            isDeleted: false,
        }, (err, user) => {
            if (err) {
                return done(err, false);
            }
            const {
                email,
                _id,
                fN,
                lN,
            } = user;
            return done(null, {
                email,
                id: _id,
                fN,
                lN,
            });
        });
    } else {
        return done(null, jwtPayload);
    }
});

Passport.serializeUser(function (user, done) {
    done(null, user);
});

Passport.deserializeUser(function (user, done) {
    done(null, user);
});


const generateJwt = (payload, done) => {
    Jwt.sign(
        payload, Config.get('jwtSecret'),
        Config.get('jwtOptions'),
        (tokenError, token) => {
            if (tokenError) {
                return done(Boom.badImplementation(tokenError.message, tokenError));
            }
            return done(null, token);
        },
    );
};


const authenticate = () =>
    Passport.authenticate('jwt', {
        failWithError: true,
    });

module.exports = {
    jwtStrategy,
    generateJwt,
    authenticate,
};