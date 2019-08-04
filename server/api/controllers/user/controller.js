import Joi from 'joi';
import Async from 'async';
import Boom from 'boom';
import _ from 'lodash';
import Config from 'config';
import Path from 'path';
import json2csv from 'json2csv';
// import capture from 'capture-phantomjs';
// import fs from 'fs';

import userService from './../../services/user.services';
import feedbackService from './../../services/feedback';
import {
    encryptPass,
    encryptString,
    decryptString,
    createLoginResponse,
} from '../../../common/util';
import {
    generateJwt,
} from '../../../common/passportstrategy';
import mailNotifier from '../../../common/mailnotifier';
import Response from '../../models/response';


const emailVerify = result => {
    const hostAddress = Config.get('hostAddress');
    const encryptId = encryptString(`${result._id}&${new Date().getTime() + (60 * 60 * 1000)}`);
    const verificationLink = `${hostAddress}user/verifyuser?data=${encryptId}`;
    mailNotifier.verifyTemplate({
        to: result.email,
    }, {
            userEmail: result.email,
            userName: result.fN,
            verificationLink,
        });
};

/**
 *
 *
 * @export
 * @class UserController
 */
export class UserController {
    /**
     * @swagger
     * /user/signup:
     *   post:
     *     tags:
     *       - USER
     *     description: Sign up user
     *     consumes:
     *       - multipart/form-data
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: fN
     *         description: first name
     *         in: formData
     *         required: false
     *         schema:
     *           type: string
     *       - name: lN
     *         description: last name
     *         in: formData
     *         required: false
     *         schema:
     *            type: string
     *       - name: pwd
     *         description: password
     *         in: formData
     *         required: false
     *         schema:
     *            type: string
     *       - name: email
     *         description: email
     *         in: formData
     *         required: false
     *         schema:
     *            type: string
     *       - name: pNo
     *         description: pNo
     *         in: formData
     *         required: false
     *         schema:
     *            type: string
     *       - name: img
     *         description: image
     *         in: formData
     *         type: file
     *         required: false
     *         schema:
     *       - name: token
     *         description: token
     *         in: formData
     *         required: false
     *         schema:
     *            type: string
     *       - name: DOB
     *         description: DOB
     *         in: formData
     *         required: false
     *         schema:
     *            type: string
     *       - name: gender
     *         description: gender
     *         in: formData
     *         required: false
     *         schema:
     *            type: string
     *       - name: otp
     *         description: otp
     *         in: formData
     *         required: false
     *         schema:
     *            type: string
     *       - name: loginType
     *         description: loginType
     *         in: formData
     *         required: false
     *         schema:
     *            type: string
     *       - name: socialId
     *         description: socialId
     *         in: formData
     *         required: false
     *         schema:
     *             type: string
     *     responses:
     *       200:
     *         description: Return saved user
     *         schema:
     *           $ref: '#/definitions/SignUpUser'
     */
    signup(request, response, next) {
        const signUpSchema = {
            fN: Joi.string().required().trim(),
            lN: Joi.string().optional().trim(),
            pwd: Joi.string().required().trim(),
            email: Joi.string().email().required().trim(),
            pNo: Joi.string().length(10).regex(new RegExp("^([0|\+[0-9]{1,5})?([7-9][0-9]{9})$")).description('test'),
            socialId: Joi.string().optional(),
            loginType: Joi.string().optional().allow(''),
            token: Joi.string().optional(),
            DOB: Joi.string().optional(),
            gender: Joi.string().optional(),
            otp: Joi.string().optional(),

        };

        let validatedBody = {};

        Async.waterfall([
            cb => {
                Joi.validate(request.body, signUpSchema, {
                    convert: true,
                }, cb);
            },
            (validationResult, cb) => {
                validatedBody = validationResult;
                userService.checkDuplicateUser(request.body.email, (err, exists) => {
                    if (err) {
                        return cb(err);
                    }
                    if (exists) {
                        return cb(Boom.illegal('User already registered'));
                    }
                    return cb(null);
                });
            },
            cb => {
                let img = '';
                if (request.files && request.files.length) {
                    img = `${Config.hostAddress}uploads/${request.files[0].filename}`;
                }
                const insertObject = Object.assign({}, validatedBody, {
                    pwd: encryptPass(validatedBody.pwd),
                    isDeleted: false,
                    img,
                });

                userService.insertUser(insertObject, cb);
            },
        ], (err, result) => {
            if (err) {
                return next(err);
            }
            emailVerify(result);
            return response.json(new Response(result, 'Verification link sent to your account'));
        });
    }
    /**
     * @swagger
     * /user/login:
     *   post:
     *     tags:
     *       - USER
     *     description: user Login
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: user
     *         description: Login object
     *         in: body
     *         required: true
     *         schema:
     *           $ref: '#/definitions/LogInUser'
     *     responses:
     *       200:
     *         description: Return saved user
     *         schema:
     *           $ref: '#/definitions/LogInUser'
     */
    login(request, response, next) {
        const isEmail = _.has(request.body, 'email');
        const isPhoneNo = _.has(request.body, 'pNo');
        if (!isEmail && !isPhoneNo) {
            return next(Boom.badRequest('email or pNo is required'));
        }

        const validationSchema = {
            pwd: Joi.string().required().trim(),
        };
        if (isEmail) {
            validationSchema.email = Joi.string().required().email().trim();
        } else {
            validationSchema.pNo = Joi.string().required().length(10).trim();
        }

        Async.waterfall([
            cb => Joi.validate(request.body, validationSchema, cb),
            (validationResult, cb) => {
                const queryObject = {
                    pwd: encryptPass(validationResult.pwd),
                    isDeleted: false,
                };
                if (isEmail) {
                    queryObject.email = validationResult.email;
                } else {
                    queryObject.pNo = validationResult.pNo;
                }
                userService.logIn(queryObject, cb);
            },
            (userObject, cb) => {
                const {
                    email,
                    _id,
                    isVerified,
                } = userObject;

                if (!isVerified) {
                    return cb(Boom.unauthorized('User is not verified'));
                }

                generateJwt({
                    email,
                    id: _id,
                }, (err, token) => {
                    if (err) {
                        return cb(err);
                    }

                    const loginResponse = createLoginResponse(userObject, {});
                    loginResponse.token = token;
                    return cb(null, loginResponse);
                });
            },
        ], (err, result) => {
            if (err) {
                // if (err.isBoom && err.output.statusCode === 401) {
                //     return response.json(new Response({
                //         statusCode: 401,
                //     }, err.output.payload.message));
                // }
                return next(err);
            }
            return response.json(new Response(result, 'User successfully Logged in'));
        });
    }
    /**
     * @swagger
     * /user/forgetpassword:
     *   post:
     *     tags:
     *       - USER
     *     description: forget password api for user
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: user
     *         description: Forget object
     *         in: body
     *         required: true
     *         schema:
     *           $ref: '#/definitions/ForgetUser'
     *     responses:
     *       200:
     *         description: Returns success message
     *         schema:
     *           $ref: '#/definitions/ForgetUser'
     */
    forgetPassword(request, response, next) {
        const validationSchema = {
            email: Joi.string().email().required().trim(),
        };

        Async.waterfall([
            cb => Joi.validate(request.body, validationSchema, {
                convert: true,
            }, cb),
            (validationResult, cb) => {
                const condition = {
                    email: validationResult.email,
                    isDeleted: false,
                };
                userService.find(condition, (err, userInfo) => {
                    if (err) {
                        return cb(err);
                    }
                    const {
                        email,
                        fN,
                    } = userInfo;
                    const hostAddress = Config.get('hostAddress');
                    // const webHostAddress = Config.get('webHostAddress');
                    const encryptEmail = encryptString(`${email}&${new Date().getTime() + (60 * 60 * 1000)}`);
                    // const verificationLink = `${webHostAddress}#!/forget?data=${encryptEmail}`;
                    const verificationLink = `${hostAddress}user/verifyforget?data=${encryptEmail}`;

                    return cb(null, {
                        link: verificationLink,
                        email,
                        fN,
                    });
                });
            },
            ({
                link,
                email,
                fN,
            }, cb) => {
                mailNotifier.forgetTemplate({
                    to: email,
                }, {
                        email,
                        fN,
                        link,
                    }, cb);
            },
        ], err => {
            if (err) {
                return next(err);
            }
            return response.json(new Response({}, 'Verification link has been sent to your email'));
        });
    }
    /**
     * @swagger
     * /user/verifyforget:
     *   post:
     *     tags:
     *       - USER
     *     description: verify the user to change password
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: data
     *         description: email for verification
     *         in: query
     *         required: true
     *         schema:
     *           type: string
     *       - name: Verify
     *         description: enter password and confirm password
     *         in: body
     *         required: true
     *         schema:
     *            $ref: '#/definitions/UserVerifyForget'
     *
     *     responses:
     *       200:
     *         description: Return success message
     *         schema:
     *             $ref: '#/definitions/UserVerifyForget'
     *
     */
    verifyForgetPassword(request, response, next) {
        const {
            query,
        } = request;

        if (!query.data) {
            return next(Boom.badRequest('Empty query data'));
        }


        const validationSchema = {
            password: Joi.string().required(),
        };

        Async.waterfall([
            cb => Joi.validate(request.body, validationSchema, cb),
            (validationResult, cb) => {
                const code = decryptString(query.data);
                return cb(null, code.split('&'));
            },
            (linkInfo, cb) => {
                const email = linkInfo[0];
                const timeStamp = linkInfo[1];
                try {
                    if (new Date().getTime() > parseInt(timeStamp, 10)) {
                        return cb(Boom.unauthorized('Verification link expired'));
                    }
                } catch (error) {
                    return cb(error);
                }
                userService.updateUser({
                    condition: {
                        email,
                    },
                    updateObject: {
                        $set: {
                            pwd: encryptPass(request.body.password),
                        },
                    },
                }, cb);
            },
        ], err => {
            if (err) {
                return next(err);
            }
            return response.json(new Response({}, 'Password changes'));
        });
    }

    /**
     * @swagger
     * /user/feedback:
     *   post:
     *     tags:
     *       - USER
     *     description: displays users feedback
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: token
     *         description: token for authorization
     *         in: header
     *         required: true
     *         schema:
     *           type: string
     *       - name: Feedback
     *         description: enter email, title, description and rating
     *         in: body
     *         required: true
     *         schema:
     *            $ref: '#/definitions/UserFeedback'
     *
     *     responses:
     *       200:
     *         description: Return success message
     *         schema:
     *            $ref: '#/definitions/UserFeedback'
     *
     */

    submitFeedback(request, response, next) {
        const {
            user,
        } = request.session.passport;

        const feedbackSchema = {
            title: Joi.string().required().trim(),
            description: Joi.string().optional().trim(),
            rating: Joi.number().optional(),
        };
        let validatedBody = {};
        Async.waterfall([
            cb => Joi.validate(request.body, feedbackSchema, cb),
            (validationResult, cb) => {
                validatedBody = validationResult;
                feedbackService.saveFeed({
                    condition: {
                        email: user.email,
                    },
                    validatedBody,
                }, (err, data) => {
                    if (err) {
                        return cb(err);
                    }

                    return cb(null, data);
                });
            },
        ], (error, result) => {
            if (error) {
                return next(error);
            }
            return response.json(new Response(result));
        });
    }


    verifyForgetHtml(request, response) {
        const root = Path.normalize(`${__dirname}/../../../..`);
        response.sendFile(Path.resolve(`${root}/views/forgot.html`));
    }

    /**
     * @swagger
     * /user/verifyuser:
     *   get:
     *     tags:
     *       - USER
     *     description: verify the user before sign in
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: data
     *         description: _id for verification
     *         in: query
     *         required: true
     *
     *     responses:
     *       200:
     *         description: Return success message
     *
     */
    verifyUser(request, response, next) {
        const {
            query,
        } = request;

        if (!query.data) {
            return next(Boom.badRequest('Empty query data'));
        }

        Async.waterfall([
            cb => {
                const code = decryptString(query.data);
                return cb(null, code.split('&'));
            },
            (linkInfo, cb) => {
                const id = linkInfo[0];
                const timeStamp = linkInfo[1];
                try {
                    if (new Date().getTime() > parseInt(timeStamp, 10)) {
                        return cb(Boom.unauthorized('Verification link expired'));
                    }
                } catch (error) {
                    return cb(error);
                }
                userService.updateUser({
                    condition: {
                        _id: id,
                    },
                    updateObject: {
                        $set: {
                            isVerified: true,
                        },
                    },
                }, cb);
            },
        ], err => {
            if (err) {
                return next(err);
            }
            return response.json(new Response({}, 'User Verified Successfully'));
        });
    }
    /**
     * @swagger
     * /user/generatecsv:
     *   post:
     *     tags:
     *       - USER
     *     description: generate csv
     *     produces:
     *       - application/octet-stream
     *     parameters:
     *       - name: token
     *         description: token for authorization
     *         in: header
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Return saved user
     *         schema:
     *           $ref: '#/definitions/CSV'
     */

    generateCsv(request, response, next) {
        const {
            user,
        } = request.session.passport;

        Async.waterfall([
            cb => cb(null, user),
            (userInfo, cb) => {
                const queryObject = {
                    email: userInfo.email,
                };
                userService.find(queryObject, cb);
            },
            (userObject, cb) => {
                const {
                    email,
                } = userObject;

                const fields = ['email', 'isDeleted', 'updatedAt', 'fN', 'pNo', 'pwd', 'img', 'createdAt'];

                const csv = json2csv({
                    data: userObject,
                    fields,
                });
                return cb(null, csv);
            },
        ], (err, result) => {
            if (err) {
                return next(err);
            }
            response.setHeader('Content-Type', 'application/octet-stream');
            response.setHeader('Content-Disposition', 'attachment; filename=userInfo.csv;');
            response.status(200);
            response.end(result, 'binary');
        });
    }

    /**
     * @swagger
     * /user/generateQR:
     *   post:
     *     tags:
     *       - USER
     *     description: generate QRcode of given data
     *     produces:
     *       - image/svg+xml
     *     parameters:
     *       - name: token
     *         description: token for authorization
     *         in: header
     *         required: false
     *         schema:
     *           type: string
     *       - name: data
     *         description: input data
     *         in: body
     *         required: false
     *         schema:
     *           $ref: '#/definitions/QRCode'
     *     responses:
     *       200:
     *         description: Return saved user
     *         schema:
     *           $ref: '#/definitions/QRCode'
     */

    generateQR(request, response, next) {
        const {
            body,
        } = request;

        if (!body.data) {
            return next(Boom.badRequest('data required in body'));
        }

        Async.waterfall([
            cb => cb(null, body.data),
            (data, cb) => {
                userService.qrCode(data, cb);
            },
        ], (err, result) => {
            if (err) {
                return next(err);
            }
            response.type('svg');
            return result.pipe(response);
        });
    }

    /**
     * @swagger
     * /user/upload:
     *   post:
     *     tags:
     *       - USER
     *     description: uploads file
     *     consumes:
     *       - multipart/form-data
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: token
     *         description: token for authorization
     *         in: header
     *         required: false
     *         schema:
     *           type: string
     *       - name: file
     *         description: enter file to upload
     *         in: formData
     *         type: file
     *         required: false
     *         schema:
     *            $ref: '#/definitions/UploadFile'
     *
     *
     *     responses:
     *       200:
     *         description: Return response json
     *
     */
    uploadFile(request, response, next) {
        const files = [];
        _.forEach(request.files, file => {
            files.push(`${Config.get('hostAddress')}uploads/${file.filename}`);
        });

        return response.json(new Response(files));
    }

    sendMail(request, response, next) {
        const mailopts = {
            from: 'afflemailer@gmail.com',
            to: request.body.emailToSend,
            subject: request.body.subject,
            text: `${request.body.content}\nfullname: ${request.body.fullname}\ncompany: ${request.body.company
                }\nemail: ${request.body.email}\nphone: ${request.body.phone}\ncountry: ${request.body.country
                }\nmessage: ${request.body.message}`,
        };

        mailNotifier.sendNormalMail(mailopts, (err, result) => {
            if (err) {
                return next(err);
            }
            return response.json(new Response(result));
        });
    }
}

export default new UserController();