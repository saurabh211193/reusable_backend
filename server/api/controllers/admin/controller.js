import Async from 'async';

import Response from '../../models/response';

import userService from './../../services/user.services';

/**
 *
 *
 * @export
 * @class allUsers
 */

 export class Users {


    /**
     * @swagger
     * /admin/allusers:
     *   get:
     *     tags:
     *       - Admin
     *     description: Get all users
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: token
     *         description: token for authorization
     *         in: header
     *         required: true
     *         schema:
     *           type: string
     * 
     *     responses:
     *       200:
     *         description: Get all users
     *
     */

    allUsers(request, response, next) {
        const {
            user,
        } = request.session.passport;

        Async.waterfall([
            cb => cb(null, user),
            (userInfo, cb) => {
                const queryObject = {
                    
                };
                userService.findAll(queryObject, cb);
            },
            (userObject, cb) => {
                const {
                   email, 
                } = userObject;

                console.log(userObject);

                return cb(null, userObject);
            }
        ], (error, result) => {
            if (error) {
                return next(error);
            }
            return response.json(new Response(result));
        });
    }
 }

 export default new Users();