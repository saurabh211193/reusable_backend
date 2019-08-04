import Joi from 'joi';
import Async from 'async';
import Boom from 'boom';
import _ from 'lodash';
import Request from 'request';
import Config from 'config';

import Response from '../../models/response';

/**
 *
 *
 * @export
 * @class YoutubeController
 */
export class YoutubeController {
    /**
     * @swagger
     * /youtube/search:
     *   post:
     *     tags:
     *       - YOUTUBE
     *     description: Search content on youtube
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: token
     *         description: token for authorization
     *         in: header
     *         required: true
     *         schema:
     *           type: string
     *       - name: name
     *         description: name which you want to search
     *         in: body
     *         required: true
     *         schema:
     *            $ref: '#/definitions/YoutubeSearch'
     *
     *     responses:
     *       200:
     *         description: Return success message
     *         schema:
     *             $ref: '#/definitions/YoutubeSearch'
     *
     */
    search(request, response, next) {
        const youtubeSchema = {
            name: Joi.string().optional().trim().default(''),
            pageToken: Joi.string().optional().trim().default(''),
        };
        Async.waterfall([
            cb => Joi.validate(request.body, youtubeSchema,{
                convert: true,
            }, cb),
            (validationResult, cb) => {
                const opts = {
                    maxResults: 3,
                    key: Config.get('googleCredential.apiKey'),
                    search: validationResult.name,
                    token: validationResult.pageToken,
                };
                Request(`https://www.googleapis.com/youtube/v3/search?part=snippet&key=${opts.key}&maxResults=${opts.maxResults}&q=${opts.search}&pageToken=${opts.token}`, (err, responseBody, result) => {
                    if (err) {
                        return cb(err);
                    }
                    if (responseBody.statusCode !== 200) {
                        console.log(responseBody);
                        return cb(Boom.unauthorized(responseBody.statusMessage, responseBody.body));
                    }
                    const searchResult = JSON.parse(result);
                    const responseResult = {
                        kind: searchResult.kind,
                        nextPageToken: searchResult.nextPageToken,
                        prevPageToken: searchResult.prevPageToken,
                        regionCode: searchResult.regionCode,
                        pageInfo: searchResult.pageInfo,
                    };
                    const resArray = [];
                    searchResult.items.forEach(function (item) {
                        const obj = item;
                        if (item.id && item.id.videoId) {
                            obj.link = `https://www.youtube.com/watch?v=${item.id.videoId}`;
                            resArray.push(obj);
                        }
                    });
                    responseResult.items = resArray;
                    return cb(null, responseResult);
                });
            },
        ], (err, result) => {
            if (err) {
                return next(err);
            }
            return response.json(new Response(result));
        });
    }
}

export default new YoutubeController();