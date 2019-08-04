import PDFDocument from 'pdfkit';
import Joi from 'joi';
import Async from 'async';

import Response from '../../models/response';

import userService from './../../services/user.services';

/**
 *
 *
 * @export
 * @class pdfGenerator
 */

export class pdfGenerator {
    /**
     * @swagger
     * /pdf/generatepdf:
     *   post:
     *     tags:
     *       - PDF
     *     description: Generate PDF
     *     produces:
     *       - PDF
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
     *         description: Generate PDF
     *
     */

    generatePdf(request, response, next) {
        const {
            user,
        } = request.session.passport;

        Async.waterfall([
            cb => cb(null, user),
            (userInfo, cb) => {
                const queryObject = {
                    email: userInfo.email,
                };
                userService.find(queryObject, cb);
            },
            (userObject, cb) => {
                const {
                    email,
                } = userObject;

                const doc = new PDFDocument();
                const content = JSON.stringify(userObject);
                doc.y = 300;
                doc.text(content, 50, 50);

                return cb(null, doc);
            }
        ], (err, result) => {
            if (err) {
                return next(err);
            }
            response.setHeader('Content-Type', 'application/pdf');
            response.setHeader("Content-Disposition", 'attachment; filename=userInfo.pdf;');
            result.pipe(response);
            result.end(result)
        });
    }

}

export default new pdfGenerator();