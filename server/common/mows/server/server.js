const mows = require('../server');

// const clientHandler = function (client) {
//     const self = this;

//     if (!self.clients) self.clients = {};

//     client.on('connect', function (packet) {
//         client.connack({
//             returnCode: 0
//         });
//         client.id = packet.clientId;
//         self.clients[client.id] = client;
//     });

//     client.on('publish', function (packet) {
//         for (const k in self.clients) {
//             self.clients[k].publish({
//                 topic: packet.topic,
//                 payload: packet.payload
//             });
//         }
//     });

//     client.on('subscribe', function (packet) {
//         const granted = [];
//         for (let i = 0; i < packet.subscriptions.length; i++) {
//             granted.push(packet.subscriptions[i].qos);
//         }

//         client.suback({
//             granted,
//             messageId: packet.messageId
//         });
//     });

//     client.on('pingreq', function (packet) {
//         client.pingresp();
//     });

//     client.on('disconnect', function (packet) {
//         console.log('disconnect', packet);
//         client.stream.end();
//     });

//     client.on('close', function () {
//         delete self.clients[client.id];
//     });

//     client.on('error', function (err) {
//         client.stream.end();
//         console.log('error!', err);
//     });
// };
const createServer = function (server) {
    const that = this;
    mows.createServer(server, function (client) {
        const self = that;

        if (!self.clients) self.clients = {};

        client.on('connect', function (packet) {
            console.log('packet', packet);
            client.connack({
                returnCode: 0
            });
            client.id = packet.clientId;
            self.clients[client.id] = client;
        });

        client.on('publish', function (packet) {
            for (const k in self.clients) {
                self.clients[k].publish({
                    topic: packet.topic,
                    payload: packet.payload
                });
            }
        });

        client.on('subscribe', function (packet) {
            const granted = [];
            for (let i = 0; i < packet.subscriptions.length; i++) {
                granted.push(packet.subscriptions[i].qos);
            }

            client.suback({
                granted,
                messageId: packet.messageId
            });
        });

        client.on('pingreq', function (packet) {
            client.pingresp();
        });

        client.on('disconnect', function (packet) {
            console.log('disconnect', packet);
            client.stream.end();
        });

        client.on('close', function () {
            delete self.clients[client.id];
        });

        client.on('error', function (err) {
            client.stream.end();
            console.log('error!', err);
        });
    });
    // }).listen(3001);
};

module.exports = {
    createServer,
};