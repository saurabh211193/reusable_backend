import Express from 'express';
import controller from './controller';
import {
    authenticate,
} from '../../../common/passportstrategy';

export default Express
    .Router()
    .post('/search', authenticate(), controller.search);