import Async, { retry } from 'async';
import Joi from 'joi';
import gateway from '../../services/payment.service';
import Response from '../../models/response';
/**
 *
 *
 * @export
 * @class PaymentGateway
 */
export class PaymentGateway {
    /**
     * @swagger
     * /payment/generateToken:
     *   get:
     *     tags:
     *       - PAYMENT GATEWAY
     *     description: generate token for paymnt gateway.
     *     produces:
     *       - application/json
     *
     *     responses:
     *       200:
     *         description: Return success message
     *
     */
    generateToken(request, response, next) {
        Async.waterfall([
            cb => {
                gateway.clientToken.generate({}, (err, res) => {
                    if (err) {
                        return cb(err);
                    }
                    const token = res.clientToken;
                    return cb(null, token);
                });
            },
        ], (error, result) => {
            if (error) {
                return next(error);
            }
            return response.json(new Response(result, 'user token'));
        });
    }


    /**
     * @swagger
     * /payment/paymenthistory:
     *   post:
     *     tags:
     *       - PAYMENT GATEWAY
     *     description: Payment History
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: payment
     *         description: get payment history
     *         in: body
     *         required: true
     *         schema:
     *           $ref: '#/definitions/GetPaymentHistory'
     *     responses:
     *       200:
     *         description: Return saved cart
     *         schema:
     *           $ref: '#/definitions/GetPaymentHistory'
     */
    paymenthistory(request, response, next) {
        const validationSchema = {
            token: Joi.string().required().trim(),
            amount: Joi.string().required().trim(),
        };

        let validSchema = {};

        Async.waterfall([
            cb => Joi.validate(request.body, validationSchema, cb),
            (valid, cb) => {
                validSchema = valid;
                gateway.transaction.sale({
                    amount: validSchema.amount,
                    paymentMethodNonce: validSchema.token,
                    options: {
                        submitForSettlement: true,
                    },
                }, (err, paymentMethod) => {
                    if (err) {
                        return cb(err);
                    }
                    
                    return cb(null, paymentMethod);
                });
            },
        ], (error, result) => {
            if (error) {
                return next(error);
            }
            return response.json(new Response(result, 'payment method'));
        });
    }
}
export default new PaymentGateway();