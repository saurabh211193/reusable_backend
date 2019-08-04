import {
    CognitoUserPool,
} from 'amazon-cognito-identity-js';
import config from 'config';

const AWSConfig = config.get('awsConfig');

export default new CognitoUserPool(AWSConfig.poolData);