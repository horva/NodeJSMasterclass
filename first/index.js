const http = require('http');
const url = require('url');
const StringDecoder = require('string_decoder').StringDecoder;


const serverPort = 3000;

const serverHandler = (req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const path = parsedUrl.pathname;
    const normalizedPath = path.replace(/^\/+|\/+$/g, '');
    const method = req.method.toLowerCase();
    const headers = req.headers;

    const requestHandler = routes[normalizedPath] || requestHandlers.notFound;

    const decoder = new StringDecoder('utf-8');
    let payload = '';

    req.on('data', (data) => {
        payload += decoder.write(data);
    });

    req.on('end', () => {
        payload += decoder.end();

        const data = {
            path: normalizedPath,
            method: method,
            headers: headers,
            payload: payload
        }

        requestHandler(data, (statusCode, payload) => {
            statusCode = typeof(statusCode) === 'number' ? statusCode : 200;
            payload = typeof(payload) === 'object' ? payload : {};

            const payloadString = JSON.stringify(payload);

            res.setHeader('Content-Type', 'application/json');
            res.writeHead(statusCode);
            res.end(payloadString);
        });
    });
}

const toJSON = (data) => {
    try {
        return JSON.parse(data);
    } catch (e) {
        return {};
    }
}

const requestHandlers = {
    'hello': (data, callback) => {
        const jsonPayload = toJSON(data.payload);
        const name = jsonPayload.name || 'user';

        callback(200, {'message': `Hello, ${ name }`});
    },
    'notFound': (data, callback) => {
        callback(404);
    }
};

const routes = {
    'hello': requestHandlers.hello
}

const httpServer = http.createServer(serverHandler);
httpServer.listen(serverPort, () => {
    console.log(`The server is listening on port ${ serverPort }.`);
});
