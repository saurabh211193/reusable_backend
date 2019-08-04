const websocket = require('./buildWebsocket');
const mqtt = require('mqtt');
const getParams = require('./params');

module.exports.createClient = function (port, host, opts) {
    const params = getParams(port, host, opts);

    if (params.opts && params.opts.clean === false && !params.opts.clientId) {
        throw new Error('Missing clientId for unclean clients');
    }

    const build = function () {
        return websocket(params.url, params.websocketOpts);
    };

    return new mqtt.MqttClient(build, params.opts);
};

module.exports.createConnection = function (port, host, opts) {
    let ws;
    let conn;

    const params = getParams(port, host, opts);

    ws = websocket(params.url, params.websocketOpts);
    conn = ws.pipe(new mqtt.MqttConnection());

    ws.on('error', conn.emit.bind(conn, 'error'));

    ws.on('close', conn.emit.bind(conn, 'close'));

    ws.on('connect', function () {
        conn.emit('connected');
    });

    return conn;
};

module.exports.MqttClient = mqtt.MqttClient;
module.exports.MqttConnection = mqtt.MqttConnection;
