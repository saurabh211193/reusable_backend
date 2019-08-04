import Express from 'express';
import controller from './controller';
// import cognitoAuth from '../../middlewares/congnitoauth';

export default Express
    .Router()
    .post('/signup', controller.signUp)
    .post('/login', controller.login)
    .post('/forget', controller.forget)
    .post('/verifyforget', controller.verifyForget)
    .post('/fblogin', controller.facebookAuthenticate)
    .post('/googlelogin', controller.googleAuthenticate)
    .get('/verifyforget', controller.verifyForgetHtml)
    .post('/getObject', controller.getObject)
// .get('/secure', cognitoAuth.cognitoAuthentication(), (req, res) => {
//     return res.json({
//         userInfo: res.locals.userInfo,
//     });
// });