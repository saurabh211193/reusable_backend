import config from 'config';
import Boom from 'boom';

import VerifyCognito from '../../common/cognitoverification';

const awsConfig = config.get('awsConfig');


class CognitoAuth {
    constructor() {
        this._verifyCognito = new VerifyCognito({
            cognitoUserPoolId: awsConfig.poolData.UserPoolId,
            region: awsConfig.region,
        });


        this._verifyCognito.init();
        this.cognitoAuthentication = this.cognitoAuthentication.bind(this);
        this.token = '';
    }


    cognitoAuthentication() {
        return (req, res, next) => {
            this.token = req.get('token');
            if (!this.token) {
                return next(Boom.badRequest('Header is not prasent'));
            }
            this._verifyCognito.verify(this.token, (tokenverificationError, userInfo) => {
                if (tokenverificationError) {
                    if (tokenverificationError.name === 'TokenExpiredError') {
                        return next(Boom.unauthorized('Token expired', tokenverificationError));
                    }
                    return next(tokenverificationError);
                }
                res.locals.userInfo = userInfo;
                return next();
            });
        };
    }
}

export default new CognitoAuth();