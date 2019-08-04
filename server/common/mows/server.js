const websocket = require('websocket-stream');
const WebSocketServer = require('ws').Server;
const http = require('http');

module.exports = Object.create(require('./client'));

module.exports.attachServer = function (server, handler) {
    const wss = new WebSocketServer({
        server,
    });

    wss.on('connection', function (ws) {
        const stream = websocket(ws);
        const connection = stream.pipe(new module.exports.MqttConnection());

        stream.on('error', connection.emit.bind(connection, 'error'));
        stream.on('close', connection.emit.bind(connection, 'close'));

        if (handler) {
            handler(connection);
        }

        server.emit('client', connection);
    });

    return server;
};

module.exports.createServer = function (server, handler) {
    // const server = http.createServer();
    module.exports.attachServer(server, handler);
    return server;
};