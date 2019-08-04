const URL = require('url');

module.exports = function getParams(port, host, opts) {
    const url = {};
    let parsed = null;
    let result = '';
    let same = false;

    if (typeof port === 'object') {
        opts = port;
        host = null;
        port = null;
    } else if (typeof port === 'string') {
        opts = host;
        host = port;
        port = null;
    }

    if (typeof host === 'object') {
        opts = host;
        host = null;
    }

    if (!host && !port && process.title === 'browser') {
        host = document.URL;
        same = true;
    }

    url.host = host || 'localhost';
    url.port = port;
    url.protocol = 'ws://';

    try {
        parsed = URL.parse(host);
        if (parsed.host) {
            url.host = parsed.hostname;
            url.port = parsed.port || port;
            url.pathname = !same && parsed.pathname || '/mqtt';
            url.protocol = (parsed.protocol === 'https:') ? 'wss://' : 'ws://';
            url.protocol = (parsed.protocol === 'wss:') ? 'wss://' : 'ws://';
        }
    } catch (e) {
        console.log('e', e);
    }

    if (typeof opts !== 'object') {
        opts = {};
    }

    const websocketOpts = {
        type: Uint8Array,
    };

    if (opts.protocol) {
        websocketOpts.protocol = opts.protocol;
    }

    result = url.protocol + url.host;

    if (url.port) {
        result += `:${  url.port}`;
    }

    if (url.pathname) {
        result += url.pathname;
    }

    return {
        url: result,
        opts,
        websocketOpts,
    };
};
