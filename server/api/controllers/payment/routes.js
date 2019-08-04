import Express from 'express';
import controller from './controller';

export default Express
    .Router()
    .get('/generateToken', controller.generateToken)
    .post('/paymenthistory', controller.paymenthistory);