import Joi from 'joi';
import Async from 'async';
import _ from 'lodash';
import ProductServices from '../../services/ecommerce.services';
import userService from './../../services/user.services';
import Response from '../../models/response';


/**
 *
 *
 * @export
 * @class Ecommerce
 */
export class Ecommerce {
    /**
     * @swagger
     * /ecommerce/productlist:
     *   get:
     *     tags:
     *       - ECOMMERCE
     *     description: All Product List
     *     produces:
     *       - application/json
     *     responses:
     *       200:
     *         description: Return All Product
     */
    productList(request, response, next) {
        Async.waterfall([
            cb => {
                const query = {};
                ProductServices.findAll(query, (err, res) => {
                    if (err) {
                        return cb(err);
                    }
                    return cb(null, res);
                });
            },
        ], (error, result) => {
            if (error) {
                return next(error);
            }
            return response.json(new Response(result, 'All Product List'));
        });
    }


    /**
     * @swagger
     * /ecommerce/addtocart:
     *   post:
     *     tags:
     *       - ECOMMERCE
     *     description: Add item into cart
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: product detail
     *         description: product detail
     *         in: body
     *         required: true
     *         schema:
     *           $ref: '#/definitions/AddToCart'
     *     responses:
     *       200:
     *         description: Return saved cart
     *         schema:
     *           $ref: '#/definitions/AddToCart'
     */
    addtocart(request, response, next) {
        const cartSchema = {
            email: Joi.string().email().required().trim(),
            productId: Joi.string().required().trim(),
            type: Joi.string().required().trim(),
            name: Joi.string().required().trim(),
            price: Joi.number().integer().required(),
            size: Joi.string().required().trim(),
            quantity: Joi.string().required().trim(),
        };
        let validateCart = {};
        Async.waterfall([
            cb => {
                Joi.validate(request.body, cartSchema, {
                    convert: true,
                }, cb);
            },
            (validateSchema, cb) => {
                validateCart = validateSchema;
                const email = validateCart.email;
                const validCart = _.omit(validateCart, 'email');
                userService.updateUser({
                    condition: {
                        email,
                    },
                    updateObject: {
                        $push: {
                            cartInfo: validCart,
                        },
                    },
                }, cb);
            },
        ], (error, result) => {
            if (error) {
                return next(error);
            }
            return response.json(new Response(result, 'Item saved in cart successfully'));
        });
    }


    /**
     * @swagger
     * /ecommerce/cartitem:
     *   get:
     *     tags:
     *       - ECOMMERCE
     *     description: Get item in user cart
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: email
     *         description: email
     *         in: query
     *         required: true
     *
     *     responses:
     *       200:
     *         description: Return success message
     *
     */
    cartitem(request, response, next) {
        if (!request.query.email) {
            return response.json(new Response(null, 'Email is not present'));
        }
        const { email } = request.query;
        Async.waterfall([
            cb => {
                const query = { email };
                userService.find(query, cb);
            },
        ], (error, result) => {
            if (error) {
                return next(error);
            }
            const cartItem = result.cartInfo;
            return response.json(new Response(cartItem, 'All cart item'));
        });
    }


    /**
     * @swagger
     * /ecommerce/savetransaction:
     *   post:
     *     tags:
     *       - ECOMMERCE
     *     description: Saved transaction
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: transaction
     *         description: save transaction
     *         in: body
     *         required: true
     *         schema:
     *           $ref: '#/definitions/SaveTransaction'
     *     responses:
     *       200:
     *         description: Return saved cart
     *         schema:
     *           $ref: '#/definitions/SaveTransaction'
     */
    savetransaction(request, response, next) {
        const validateSchema = {
            id: Joi.string().required().trim(),
            productId: Joi.string().required().trim(),
            email: Joi.string().email().required().trim(),
            cardNo: Joi.number().integer().required(),
            name: Joi.string().required().trim(),
        };

        let validSchema = {};
        Async.waterfall([
            cb => {
                Joi.validate(request.body, validateSchema, {
                    convert: true,
                }, cb);
            },
            (valid, cb) => {
                validSchema = valid;
                ProductServices.saveTransactionData(validSchema, cb);
            },
            (saveResult, cb) => {
                const { email, productId } = validSchema;
                userService.updateUser({
                    condition: {
                        email,
                    },
                    updateObject: {
                        $pull: {
                            cartInfo: {
                                productId,
                            },
                        },
                    },
                }, cb);
            },
        ], (error, result) => {
            if (error) {
                return next(error);
            }
            return response.json(new Response(result, 'Transaction saved successfully'));
        });
    }


    /**
     * @swagger
     * /ecommerce/gettransaction:
     *   get:
     *     tags:
     *       - ECOMMERCE
     *     description: Get transaction history of user
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: email
     *         description: email
     *         in: query
     *         required: true
     *
     *     responses:
     *       200:
     *         description: Return success message
     *
     */
    gettransaction(request, response, next) {
        if (!request.query.email) {
            return response.json(new Response(null, 'Email is not present'));
        }
        const { email } = request.query;
        Async.waterfall([
            cb => {
                const query = { email };
                ProductServices.getTransactionData(query, cb);
            },
        ], (error, result) => {
            if (error) {
                return next(error);
            }
            return response.json(new Response(result, 'Transaction history'));
        });
    }
}

export default new Ecommerce();