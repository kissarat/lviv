'use strict';

const _ = require('underscore');
const fs = require('fs');

module.exports = function (req, res) {
    var buffers = [];
    const path = req.url.split('?')[0];
    switch (path) {
        case '/ping':
            res.writeHead(200, {
                'content-type': 'application/json'
            });
            res.end(JSON.stringify({success: true}));
            break;

        case '/mirror':
            let send = function (data) {
                res.writeHead(200, {
                    'content-type': 'application/json'
                });
                res.end(JSON.stringify({
                    path: req.url,
                    method: req.method,
                    headers: req.headers,
                    data: data
                }));
            };
            if ('content-type' in req.headers) {
                req.on('data', function (chunk) {
                    buffers.push(chunk);
                });
                req.on('end', function () {
                    var data = 1 == buffers.length ? buffers[0] : Buffer.concat(buffers);
                    if (req.headers['content-type'].indexOf('json') >= 0) {
                        data = JSON.parse(data.toString());
                        data.success = true;
                    }
                    send(data);
                });
            }
            else {
                send({success: true});
            }
            break;

        case '/raw':
            req.on('data', function (chunk) {
                buffers.push(chunk);
            });
            req.on('end', function () {
                res.end(1 == buffers.length ? buffers[0] : Buffer.concat(buffers));
            });
            break;

        case '/upload':
            const filename = '/tmp/' + _.random(1, Number.MAX_SAFE_INTEGER).toString(36);
            const writer = fs.createWriteStream(filename);
            req.pipe(writer);
            const reader = fs.createReadStream(filename);
            req.on('end', function () {
                reader.pipe(res);
                reader.on('end', function () {
                    fs.unlinkSync(filename);
                });
            });
            break;

        default:
            res.writeHead(404, {
                'content-type': 'application/json'
            });
            res.end(JSON.stringify({success: false}));
            break;
    }
};

if (require.main === module) {
    require('http')
        .createServer(module.exports)
        .listen(9000);
}

