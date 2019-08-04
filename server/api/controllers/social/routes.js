import Express from 'express';
import controller from './controller';


export default Express
    .Router()
    .post('/google', controller.googleLogin)
    .post('/fb', controller.fbLogin)
    .post('/twitter', controller.twitterLogin);