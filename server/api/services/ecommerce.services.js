import Boom from 'boom';
import Product from '../models/productList';
import Transaction from '../models/transaction';

export class ProductServices {
    findAll(query, done) {
        const _product = new Product();
        _product.model.find(query, (err, result) => {
            if (err) {
                return done(err);
            }
            return done(null, result);
        });
    }

    saveTransactionData(data, done) {
        const _transaction = new Transaction();
        _transaction.model.insertMany(data, (err, result) => {
            if (err) {
                return done(err);
            }
            return done(null, result);
        });
    }

    getTransactionData(query, done) {
        const _transaction = new Transaction();
        _transaction.model.find(query, (err, result) => {
            if (err) {
                return done(err);
            }
            if (!result) {
                return done(Boom.notFound('User not registered'));
            }
            return done(null, result);
        });
    }
}

export default new ProductServices();