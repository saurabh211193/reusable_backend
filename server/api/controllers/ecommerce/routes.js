import Express from 'express';
import controller from './controller';

export default Express
    .Router()
    .get('/productlist', controller.productList)
    .post('/addtocart', controller.addtocart)
    .get('/cartitem', controller.cartitem)
    .post('/savetransaction', controller.savetransaction)
    .get('/gettransaction', controller.gettransaction);