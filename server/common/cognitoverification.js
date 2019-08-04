import jwkToBuffer from 'jwk-to-pem';
import Jwt from 'jsonwebtoken';
import Request from 'request';
import _ from 'lodash';
import Boom from 'boom';

/**
 *
 *
 * @class VerifyCognito
 */
class VerifyCognito {
    /**
     * Creates an instance of VerifyCognito.
     * @param {any} {
     *         cognitoUserPoolId,
     *         tokenUse = 'id',
     *         region = 'us-east-1',
     *         tokenExpiration = 3600000,
     *     }
     * @memberof VerifyCognito
     */
    constructor({
        cognitoUserPoolId,
        tokenUse = 'id',
        region = 'us-east-1',
        tokenExpiration = 3600000,
    }) {
        this.cognitoUserPoolId = cognitoUserPoolId;
        this.tokenUse = tokenUse;
        this.region = region;
        this.tokenExpiration = tokenExpiration;
        this.iss = `https://cognito-idp.${this.region}.amazonaws.com/${this.cognitoUserPoolId}`;
        this.pem = {};
    }


    /**
     */
    init() {
        return new Promise((resolve, reject) => {
            Request.get(`${this.iss}/.well-known/jwks.json`, (error, response, body) => {
                if (!error && response.statusCode === 200) {
                    try {
                        const {
                            keys,
                        } = JSON.parse(body);

                        if (_.isArray(keys)) {
                            _.forEach(keys, key => {
                                const {
                                    kty,
                                    n,
                                    e,
                                    kid,
                                } = key;
                                this.pem[kid] = jwkToBuffer({
                                    kty,
                                    n,
                                    e,
                                });
                            });
                            return resolve(true);
                        }
                        throw new Error('invalid token');
                    } catch (parsingError) {
                        return reject(Boom.badImplementation('Error parsing token'));
                    }
                } else {
                    return reject(Boom.badGateway('Unable to download AWS cognito certificate'));
                }
            });
        });
    }
    /**
     * @param  {} token
     * @param  {} done
     */
    verify(token, done) {
        const decodedToken = Jwt.decode(token, {
            complete: true,
            json: true,
        });

        if (!decodedToken) {
            return done(Boom.badRequest('This is not a valid token'));
        }

        const {
            payload,
            header,
        } = decodedToken;

        if (payload.iss !== this.iss) {
            return done(Boom.unauthorized('This token is from different userpool'));
        }
        if (payload.token_use !== this.tokenUse) {
            return done(Boom.unauthorized(`This token is not for ${this.tokenUse}`));
        }

        const {
            kid,
        } = header;

        const pem = this.pem[kid];

        if (!pem) {
            return done(Boom.unauthorized(`This token is not for ${this.tokenUse}`));
        }
        Jwt.verify(token, pem, {
            issuer: this.iss,
            maxAge: this.maxAge,
        }, done);
    }
}

export default VerifyCognito;