import Joi from 'joi';
import Async from 'async';
import Config from 'config';
import Path from 'path';
import Boom from 'boom';

import AWS from 'aws-sdk';

import {
    encryptString,
    decryptString,
} from './../../../common/util';

import cognitoService from './../../services/awscognito.services';

AWS.config.update({
    accessKeyId: 'AKIAIOUNPIKVUT4QHFPQ',
    secretAccessKey: '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',
    region: 'ap-south-1',
});

export const s3 = new AWS.S3();


export class AwsController {
    /**
     * @swagger
     * tags:
     *   name: AWS
     *   description: AWS Cognito login
     */


    /**
     * @swagger
     * /awsuser/signup:
     *   post:
     *     tags:
     *       - AWS
     *     description: Sign Up user
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: user
     *         description: Signup object
     *         in: body
     *         required: true
     *         schema:
     *           $ref: '#/definitions/Signup'
     *     responses:
     *       200:
     *         description: Return saved user
     *         schema:
     *           $ref: '#/definitions/Signup'
     */

    signUp(request, response, next) {
        const signUpSchema = {
            name: Joi.string().required(),
            email: Joi.string().email().required(),
            phone_number: Joi.string().required(),
            password: Joi.string().required(),
            socialId: Joi.string().optional(),
            loginType: Joi.string().optional(),
            DOB: Joi.string().optional(),
            gender: Joi.string().optional(),
            picture: Joi.string().uri().optional(),
        };

        Async.waterfall([
            function (cb) {
                Joi.validate(request.body, signUpSchema, cb);
            },
            function (validationResult, cb) {
                const signUpData = Object.assign({}, request.body);
                cognitoService.signUp(signUpData, cb);
            },
        ], (err, result) => {
            if (err) {
                return next(err);
            }
            return response.json(result);
        });
    }

    /**
     * @swagger
     * /awsuser/login:
     *   post:
     *     tags:
     *       - AWS
     *     description: Login user
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: Login
     *         description: Login object
     *         in: body
     *         required: true
     *         schema:
     *           $ref: '#/definitions/Login'
     *     responses:
     *       200:
     *         description: Return saved user
     *         schema:
     *           $ref: '#/definitions/Login'
     */

    login(request, response, next) {
        const loginSchema = {
            email: Joi.string().email().required(),
            password: Joi.string().required(),
        };

        Async.waterfall([
            function (cb) {
                Joi.validate(request.body, loginSchema, cb);
            },
            function (validationResult, cb) {
                const loginData = Object.assign({}, request.body);
                cognitoService.login(loginData, cb);
            },
        ], (err, result) => {
            if (err) {
                return next(err);
            }
            const {
                token,
            } = result;

            response.set({
                token,
            });

            const message = 'loggged in successfully';
            return response.json({
                message,
            });
        });
    }

    /**
     * @swagger
     * /awsuser/forget:
     *   post:
     *     tags:
     *       - AWS
     *     description: send mail for forget password
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: Forget
     *         description: forget object
     *         in: body
     *         required: true
     *         schema:
     *           $ref: '#/definitions/Forget'
     *     responses:
     *       200:
     *         description: Return success message
     *         schema:
     *           $ref: '#/definitions/Forget'
     */
    forget(request, response, next) {
        const hostAddress = Config.get('hostAddress');


        const forgetSchema = {
            email: Joi.string().email().required(),
        };

        Async.waterfall([
            function (cb) {
                Joi.validate(request.body, forgetSchema, cb);
            },
            function (validationResult, cb) {
                cognitoService.forgetPassword(request.body.email, cb);
            },
        ], err => {
            if (err) {
                return next(err);
            }
            const encryptEmail = encryptString(request.body.email);
            const verificationLink = `${hostAddress}awsUser/verifyforget?data=${encryptEmail}`;

            return response.json({
                verificationLink,
            });
        });
    }

    /**
     * @swagger
     * /awsuser/verifyForget:
     *   post:
     *     tags:
     *       - AWS
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
     *         description: verification code & password
     *         in: body
     *         required: true
     *         schema: '#/definitions/VerifyForget'
     *
     *     responses:
     *       200:
     *         description: Return success message
     *         schema: '#/definitions/VerifyForget'
     *
     */

    verifyForget(request, response, next) {
        const {
            query,
        } = request;
        if (!query.data) {
            return next(Boom.badRequest('Empty query data'));
        }


        const loginSchema = {
            code: Joi.string().required(),
            password: Joi.string().required(),
        };

        Async.waterfall([
            function (cb) {
                Joi.validate(request.body, loginSchema, cb);
            },
            function (validationResult, cb) {
                const userEmail = decryptString(query.data);
                const verificationData = Object.assign({}, request.body);
                cognitoService.verifyCode(userEmail, verificationData, cb);
            },
        ], (err, result) => {
            if (err) {
                return next(err);
            }
            return response.json(result);
        });
    }

    /**
     * @swagger
     * /awsuser/verifyForget:
     *   get:
     *     tags:
     *       - AWS
     *     description: opens html for verify forget
     *     produces:
     *       - text/html
     *     parameters:
     *
     *       - name: verifyForget
     *         description: opens new password screen
     *         required: false
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Return screen
     *         schema: '#/definitions/VerifyForeget'
     *
     */

    verifyForgetHtml(request, response, next) {
        const root = Path.normalize(`${__dirname}/../../../..`);
        response.sendFile(Path.resolve(`${root}/views/forget.html`));
    }

    /**
     * @swagger
     * /awsuser/fblogin:
     *   post:
     *     tags:
     *       - AWS
     *     description: authenticate fb user
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: FbLogin
     *         description: enter id_token and values you want as response
     *         in: body
     *         required: true
     *         schema:
     *          $ref: '#/definitions/FbLogin'
     *
     *     responses:
     *       200:
     *         description: Return success message
     *         schema:
     *          $ref: '#/definitions/FbLogin'
     *
     */

    facebookAuthenticate(request, response, next) {
        const authSchema = {
            id_token: Joi.string().required(),
            resVal: Joi.string().optional(),
        };

        Async.waterfall([
            function (cb) {
                Joi.validate(request.body, authSchema, cb);
            },
            function (validationResult, cb) {
                const loginData = Object.assign({}, request.body);
                cognitoService.facebookAuthentication(loginData, cb);
            },
        ], (err, result) => {
            if (err) {
                return next(err);
            }
            return response.json({
                message: 'login successful',
            });
        });
    }

    /**
     * @swagger
     * /awsuser/googlelogin:
     *   post:
     *     tags:
     *       - AWS
     *     description: authenticate google user
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: GoogleLogin
     *         description: enter id_token and values you want as response
     *         in: body
     *         required: true
     *         schema:
     *          $ref: '#/definitions/GoogleLogin'
     *     responses:
     *       200:
     *         description: Return success message
     *         schema:
     *          $ref: '#/definitions/GoogleLogin'
     *
     */
    googleAuthenticate(request, response, next) {
        const authSchema = {
            id_token: Joi.string().required(),
            resVal: Joi.string().optional(),
        };

        Async.waterfall([
            function (cb) {
                Joi.validate(request.body, authSchema, cb);
            },
            function (validationResult, cb) {
                const loginData = Object.assign({}, request.body);
                cognitoService.googleAuthentication(loginData, cb);
            },
        ], (err, result) => {
            if (err) {
                return next(err);
            }
            return response.json({
                message: 'login successful',
            });
        });
    }


    getObject(request, response, next) {
        const schema = {
            key: Joi.string().optional(),
        };

        Async.waterfall([
            function (cb) {
                Joi.validate(request.body, schema, cb);
            },
            function (validationResult, cb) {
                const params = {
                    Bucket: 'idex-backend',
                    Key: 'idex/' + validationResult.key
                };

                s3.headObject(params, (err, data) => {
                    if (err) {
                        console.log(err);
                        cb(err);
                    } else {
                        console.log(data);
                        cb(data);
                    }
                });
            },
        ], (result, err) => {
            if (err) {
                return next(err);
            }
            return response.json({
                data: result,
            });
        });
    }
}

export default new AwsController();