import Express from 'express';
import {
    authenticate,
} from '../../../common/passportstrategy';
import controller from './controller';
import upload from '../../../common/uploadhandler';

export default Express
    .Router()
    .post('/signup', upload.uploadFile, controller.signup)
    .post('/login', controller.login)
    .post('/forgetpassword', controller.forgetPassword)
    .post('/verifyforget', controller.verifyForgetPassword)
    .post('/feedback', authenticate(), controller.submitFeedback)
    .get('/verifyuser', controller.verifyUser)
    .post('/generatecsv', authenticate(), controller.generateCsv)
    .post('/generateQR', authenticate(), controller.generateQR)
    .post('/upload', authenticate(), upload.uploadFile, controller.uploadFile)
    .get('/verifyforget', controller.verifyForgetHtml)
    .post('/sendmail', controller.sendMail);

