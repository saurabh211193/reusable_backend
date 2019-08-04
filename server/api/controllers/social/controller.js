import Joi from 'joi';
import Async from 'async';
import Request from 'request';
import Twitter from 'node-twitter-api';
import Boom from 'boom';
import Config from 'config';
import {
    generateJwt,
} from '../../../common/passportstrategy';
import userServices from '../../services/user.services';
import Response from '../../models/response';
import {
    createLoginResponse,
} from '../../../common/util';


/**
 *
 *
 * @export
 * @class SocialController
 */
export class SocialController {
    /**
     * @swagger
     * /social/fb:
     *   post:
     *     tags:
     *       - SOCIAL
     *     description: FB user login
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: FbSocial
     *         description: enter id_token for fb
     *         in: body
     *         required: true
     *         schema:
     *          $ref: '#/definitions/FbSocial'
     *
     *     responses:
     *       200:
     *         description: Return user information and token
     *         schema:
     *          $ref: '#/definitions/FbSocial'
     *
     */
    fbLogin(request, response, next) {
        const fbLoginSchema = {
            id_token: Joi.string().required().trim(),
        };

        const resVal = 'name,email,birthday,first_name,gender,last_name,cover,picture';

        Async.waterfall([
            cb => {
                Joi.validate(request.body, fbLoginSchema, cb);
            },
            (validationResult, cb) => {
                Request(`https://graph.facebook.com/v2.10/me?fields=${resVal}&access_token=${request.body.id_token}`, (err, respoBody, body) => {  
                    if (err) {
                        return cb(err);
                    }
                    if (respoBody.statusCode !== 200) {
                        return cb(Boom.unauthorized(respoBody.statusMessage, respoBody.body));
                    }
                    const responseBody = JSON.parse(body);
                    return cb(null, responseBody);
                });
            },
            (fbResult, cb) => {
                const {
                    email,
                    first_name,
                    cover,
                    last_name,
                    id,
                    gender,
                    picture,
                } = fbResult;
                userServices.updateUser({
                    condition: {
                        email,
                    },
                    updateObject: {
                        $set: {
                            fbInfo: {
                                fN: first_name,
                                lN: last_name,
                                img: picture ? picture.data.url : '',
                                id,
                                gender,
                            },
                        },
                    },
                }, (err, doc) => {
                    if (err) {
                        return cb(err);
                    }
                    return cb(null, fbResult, doc);
                });
            },
            (fbResult, userObject, cb) => {
                const {
                    email,
                    name,
                } = fbResult;
                generateJwt({
                    email,
                    name,
                    isSocial: true,
                }, (err, token) => {
                    if (err) {
                        return cb(err);
                    }
                    const loginData = createLoginResponse(userObject || {}, fbResult);
                    loginData.token = token;
                    return cb(null, loginData);
                });
            },
        ], (err, result) => {
            if (err) {
                return next(err);
            }
            return response.json(new Response(result, 'User successfully Logged in'));
        });
    }
    /**
     * @swagger
     * /social/google:
     *   post:
     *     tags:
     *       - SOCIAL
     *     description: Google user login
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: GoogleSocial
     *         description: enter id_token for google
     *         in: body
     *         required: true
     *         schema:
     *          $ref: '#/definitions/GoogleSocial'
     *
     *     responses:
     *       200:
     *         description: Return user information and token
     *         schema:
     *          $ref: '#/definitions/GoogleSocial'
     *
     */
    googleLogin(request, response, next) {
        const googleLoginSchema = {
            id_token: Joi.string().required().trim(),
        };
        Async.waterfall([
            cb => Joi.validate(request.body, googleLoginSchema, cb),
            (validationResult, cb) => {
                Request(`https://www.googleapis.com/oauth2/v3/tokeninfo?id_token=${request.body.id_token}`, (err, responseBody, body) => {
                    if (err) {
                        return cb(err);
                    }
                    if (responseBody.statusCode !== 200) {
                        return cb(Boom.unauthorized(responseBody.statusMessage, responseBody.body));
                    }
                    const googleInfo = JSON.parse(body);
                    return cb(null, googleInfo);
                });
            },
            (googleInfo, cb) => {
                const {
                    email,
                    given_name,
                    picture,
                    family_name,
                } = googleInfo;
                userServices.updateUser({
                    condition: {
                        email,
                    },
                    updateObject: {
                        $set: {
                            googleInfo: {
                                fN: given_name,
                                lN: family_name,
                                img: picture,
                            },
                        },
                    },
                }, (err, doc) => {
                    if (err) {
                        return cb(err);
                    }
                    return cb(null, googleInfo, doc);
                });
            },

            (googleInfo, userObject, cb) => {
                const {
                    email,
                    name,
                } = googleInfo;
                generateJwt({
                    email,
                    name,
                    isSocial: true,
                }, (err, token) => {
                    if (err) {
                        return cb(err);
                    }
                    const loginData = createLoginResponse(userObject || {}, googleInfo);
                    loginData.token = token;
                    return cb(null, loginData);
                });
            },
        ], (error, result) => {
            if (error) {
                return next(error);
            }
            return response.json(new Response(result, 'User successfully Logged in'));
        });
    }

    /**
     * @swagger
     * /social/twitter:
     *   post:
     *     tags:
     *       - SOCIAL
     *     description: Twitter user login
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: TwitterSocial
     *         description: enter id_token and secret for twitter
     *         in: body
     *         required: true
     *         schema:
     *          $ref: '#/definitions/TwitterSocial'
     *
     *     responses:
     *       200:
     *         description: Return user information and token
     *         schema:
     *          $ref: '#/definitions/TwitterSocial'
     *
     */
    twitterLogin(request, response, next) {
        const twitter = new Twitter(Config.get('twitterCredential'));
        const twitterLoginSchema = {
            id_token: Joi.string().required().trim(),
            secret: Joi.string().required().trim(),
        };

        Async.waterfall([
            cb => Joi.validate(request.body, twitterLoginSchema, cb),
            (validationResult, cb) => {
                twitter.verifyCredentials(
                    request.body.id_token,
                    request.body.secret, {
                        include_email: true,
                    }, (err, body) => {
                        if (err) {
                            return cb(err);
                        }
                        return cb(null, body);
                    },
                );
            },
            (twitterInfo, cb) => {
                const {
                    name,
                    profile_image_url,
                    email,
                    id,
                } = twitterInfo;

                if (email) {
                    userServices.updateUser({
                        condition: {
                            email,
                        },
                        updateObject: {
                            $set: {
                                twitterInfo: {
                                    name,
                                    img: profile_image_url,
                                    id,
                                },
                            },
                        },
                    }, (err, doc) => {
                        if (err) {
                            return cb(err);
                        }
                        return cb(null, {
                            name,
                            img: profile_image_url,
                            id,
                        }, doc);
                    });
                } else {
                    return cb(null, {
                        name,
                        img: profile_image_url,
                        id,
                    }, null);
                }
            },
            (twitterInfo, userObject, cb) => {
                const {
                    email,
                    name,
                } = twitterInfo;
                generateJwt({
                    email,
                    name,
                    isSocial: true,
                }, (err, token) => {
                    if (err) {
                        return cb(err);
                    }
                    const loginData = createLoginResponse(userObject || {}, twitterInfo);
                    loginData.token = token;
                    return cb(null, loginData);
                });
            },
        ], (error, result) => {
            if (error) {
                return next(error);
            }
            return response.json(new Response(result, 'User successfully Logged in'));
        });
    }
}

export default new SocialController();