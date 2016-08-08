"use strict";

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
                    buffers.push(chunk)
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
                buffers.push(chunk)
            });
            req.on('end', function () {
                res.end(1 == buffers.length ? buffers[0] : Buffer.concat(buffers));
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
