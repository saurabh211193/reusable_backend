import Express from 'express';
import * as bodyParser from 'body-parser';
import * as http from 'http';
import * as path from 'path';
import Passport from 'passport';
import cors from 'cors';
import Mongoose from 'mongoose';
import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

import ErrorHandler from './errorhandler';
import {
    jwtStrategy,
} from './passportstrategy';

import serverSocketConnect from './mows/server/server';
import clientSocketConnect from './mows/client/client';

const app = new Express();
const root = path.normalize(`${__dirname}/../..`);

let serVer;

export default class ExpressServer {
    constructor() {
        this.configureDb = this.configureDb.bind(this);


        app.use(bodyParser.json());
        app.use(bodyParser.urlencoded({
            extended: true,
        }));

        Passport.use(jwtStrategy);

        // app.use(Express.static(`${root}/publicPm2`));
        app.use(Express.static(`${root}/views`));
        app.use('/uploads', Express.static(`${root}/uploads`));
        // app.use(Express.static(`${root}/angular`));
        app.use(Express.static(`${root}/dist`));
        app.get('/*', (request, response) => {
            response.sendFile(path.normalize(`${root}/dist/index.html`));
        });

        app.set('view engine', 'ejs');

        app.use(Passport.initialize());

        app.use(cors({
            allowedHeaders: ['Content-Type', 'token'],
            exposedHeaders: ['token'],
            origin: '*',
            methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
            preflightContinue: false,
        }));
    }

    router(routes) {
        routes(app);
        return this;
    }

    configureSwagger(swaggerDefinition) {
        const options = {
            swaggerDefinition,
            apis: [`${root}/server/api/controllers/**/*.js`, `${root}/api.yaml`],
        };
        app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerJSDoc(options)));
        return this;
    }

    handleError() {
        const errorHandler = new ErrorHandler({
            shouldLog: true,
        });
        app.use(errorHandler.build());
        app.use(errorHandler.unhandledRequest());

        return this;
    }

    listen(port) {
        serVer = http.createServer(app).listen(port, () => {
            console.log(`app is listening at port ${port}`);
        });
        return serVer;
    }

    socketServer(serVerInst) {
        clientSocketConnect.Client();
        serverSocketConnect.createServer(serVerInst);
    }

    configureDb(dbUrl) {
        return new Promise((resolve, reject) => {
            Mongoose.connect(dbUrl, err => {
                if (err) {
                    console.log(`Error in mongodb connection ${err.message}`);
                    return reject(err);
                }
                console.log('Mongodb connection established');
                return resolve(this);
            });
        });
    }
}