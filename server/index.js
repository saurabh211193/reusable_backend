import Config from 'config';
import Server from './common/server';
import Routes from './routes';

export default new Server()
    .router(Routes)
    .configureSwagger(Config.get('swaggerDefinition'))
    .handleError()
    .configureDb(Config.get('mongoDbUrl'))
    .then(_server => {
        const serVer = _server.listen(Config.get('port'));
        _server.socketServer(serVer);
    });
// .then(_server => _server.listen(Config.get('port'))).