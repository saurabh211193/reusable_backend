import _ from 'lodash';
import {
    CognitoUserAttribute,
    AuthenticationDetails,
    CognitoUser,

} from 'amazon-cognito-identity-js';


import AWS from 'aws-sdk';

import Config from 'config';


import userPool from '../../common/userpool';

const AWSConfig = Config.get('awsConfig');


/**
 * Provides methods to access AWS Cognito Services
 *
 * @export
 * @class AwsCognitoServices
 */
export class AwsCognitoServices {
    /**
     * @param  {} signUpData
     * @param  {} done
     */
    signUp(signUpData, done) {
        const attributeList = [];
        _.forOwn(signUpData, (value, key) => {
            if (key !== 'password') {
                attributeList.push(new CognitoUserAttribute({
                    Name: key,
                    Value: value,
                }));
            }
        });
        userPool.signUp(signUpData.email, signUpData.password, attributeList, null, done);
    }

    /**
     * @param  {} logInData
     * @param  {} done
     */
    login(logInData, done) {
        const authenticationDetails = new AuthenticationDetails({
            Username: logInData.email,
            Password: logInData.password,
        });

        const cognitoUser = new CognitoUser({
            Pool: userPool,
            Username: logInData.email,
        });

        cognitoUser.authenticateUser(authenticationDetails, {
            onSuccess: result => {
                const token = result.getIdToken().getJwtToken();
                console.log(token);
                return done(null, {
                    token,
                });
            },
            onFailure: error => done(error),
        });
    }
    /**
     * @param  {} email
     * @param  {} done
     */
    forgetPassword(email, done) {
        const cognitoUser = new CognitoUser({
            Pool: userPool,
            Username: email,
        });

        cognitoUser.forgotPassword({
            onSuccess: result => done(null, result),
            onFailure: error => done(error),
        });
    }
    /**
     * @param  {} email
     * @param  {} verificationData
     * @param  {} done
     */
    verifyCode(email, verificationData, done) {
        const cognitoUser = new CognitoUser({
            Pool: userPool,
            Username: email,
        });

        cognitoUser.confirmPassword(verificationData.code, verificationData.password, {
            onSuccess: data => done(null, data),
            onFailure: error => done(error),
        });
    }
    /**
     * @param  {} {id_token}
     * @param  {} done
     */
    facebookAuthentication({
        id_token,
    }, done) {
        AWS.config.region = AWSConfig.region;


        AWS.config.credentials = new AWS.CognitoIdentityCredentials({
            IdentityPoolId: AWSConfig.identityPoolId,
            Logins: {
                [AWSConfig.authProviders.facebook]: id_token,
            },
        });
        AWS.config.credentials.get(err => {
            if (err) {
                return done(err);
            }
            return done(null);
        });
    }
    /**
     * @param  {} {id_token}
     * @param  {} done
     */
    googleAuthentication({
        id_token,
    }, done) {
        AWS.config.region = AWSConfig.region;


        AWS.config.credentials = new AWS.CognitoIdentityCredentials({
            IdentityPoolId: AWSConfig.identityPoolId,
            Logins: {
                [AWSConfig.authProviders.google]: id_token,
            },
        });

        AWS.config.credentials.get(done);
    }
}


export default new AwsCognitoServices();