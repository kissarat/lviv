'use strict';

const assert = require('assert');
const bandom = require('bandom');
const fs = require('fs');
const qs = require('querystring');
require('colors');
const http = require('http');
const _ = require('underscore');
const Lviv = require('..');
const serverRequestHandler = require('./server');

const defaults = {
    host: 'localhost',
    port: 8001
};
const lviv = new Lviv(defaults);
var server;

function generateParams() {
    const params = {};
    const length = _.random(1, 12);
    for (let i = 0; i < length; i++) {
        params[_.random(1, 512 * 1024)] = _.random(1, 512 * 1024);
    }
    return params;
}

describe('request', function () {
    before(function (done) {
        server = http.createServer();
        server.on('checkContinue', function (err) {
            console.error('server checkContinue'.red, err);
        });
        server.on('clientError', function (err) {
            console.error('server clientError'.ref, err);
        });
        server.on('close', function () {
            console.log('server close'.cyan);
        });
        server.on('connect', function () {
            console.log('server connect'.cyan);
        });
        // server.on('connection', function () {
        //     console.log('server connection'.cyan);
        // });
        server.on('request', function (req, res) {
            // console.log('server request'.cyan);
            serverRequestHandler(req, res);
        });
        server.on('upgrade', function (err) {
            console.error('server upgrade'.red, err);
        });
        server.listen(defaults.port, defaults.host, done);
    });

    it('server', function (done) {
        const options = {
            method: 'POST',
            path: '/mirror?' + qs.stringify(generateParams()),
            headers: {
                'content-type': 'application/json'
            }
        };
        _.defaults(options, defaults);
        const rand = _.uniqueId('server');
        const req = http.request(options, function (res) {
            const chunks = [];
            res.on('data', function (chunk) {
                chunks.push(chunk);
            });
            res.on('end', function () {
                const string = Buffer.concat(chunks).toString('utf8');
                const data = JSON.parse(string);
                assert('POST' === data.method, 'invalid method');
                assert('content-type' in data.headers, 'Has no content-type header');
                assert('application/json' === data.headers['content-type'], 'content-type');
                assert(true === data.data.success, 'success');
                assert(rand === data.data.rand, 'rand');
                done();
            });
        });
        req.on('abort', function () {
            console.error('client abort'.red);
        });
        req.on('aborted', function () {
            console.error('client aborted'.red);
        });
        req.on('checkExpectation', function (err) {
            console.error('client checkExpectation'.red, err);
        });
        req.on('connect', function () {
            console.log('client connect'.cyan);
        });
        req.on('continue', function () {
            console.log('client continue'.cyan);
        });
        // req.on('response', function () {
        //     console.log('client response'.cyan);
        // });
        // req.on('socket', function () {
        //     console.log('client socket'.cyan);
        // });
        req.on('upgrade', function () {
            console.log('client upgrade'.cyan);
        });
        req.end(JSON.stringify({rand: rand}));
    });

    it('ping', function (done) {
        lviv.get('/ping').catch(done).then(function (res) {
            assert(_.isObject(res.data), 'Has no response data');
            assert(true === res.data.success);
            done();
        })
            .catch(done);
    });

    it('post', function (done) {
        const rand = _.uniqueId('server');
        lviv.post('/mirror', {rand: rand}).then(function (res) {
            assert(_.isObject(res.data), 'Has no response data');
            assert('POST' === res.data.method, 'invalid method');
            assert(_.isObject(res.data.headers), 'Has no headers');
            assert('content-type' in res.data.headers, 'Has no content-type header');
            assert('application/json' === res.data.headers['content-type'], 'content-type');
            assert(_.isObject(res.data.data), 'Has no response data.data');
            assert(true === res.data.data.success, 'success');
            assert(rand === res.data.data.rand, 'rand');
            done();
        })
            .catch(done);
    });

    it('binary string', function (done) {
        const length = _.random(1, 6);
        const input = {};
        for (let i = 0; i < length; i++) {
            let size = _.random(1, 128 * 1024);
            input[size] = bandom.read(size).toString('binary');
        }
        lviv.post('/mirror', input).then(function (res) {
            assert('POST' === res.req.method, 'invalid method');
            assert(_.isObject(res.data), 'Has no response data');
            assert(_.isObject(res.data.headers), 'Has no headers');
            assert('content-type' in res.data.headers, 'Has no content-type header');
            assert('application/json' === res.data.headers['content-type'], 'content-type');
            assert(_.isObject(res.data.data), 'Has no response data.data');
            assert(true === res.data.data.success, 'success');
            _.each(input, function (value, key) {
                assert(input[key] === res.data.data[key], key);
            });
            done();
        })
            .catch(done);
    });

    it('put raw', function (done) {
        const buffer = bandom.read(_.random(1, 512 * 1024));
        const params = generateParams();
        lviv.put('/raw', params, buffer).then(function (res) {
            const url = '/raw?' + qs.stringify(params);
            assert(url === res.req.path, 'invalid url');
            assert('PUT' === res.req.method, 'invalid method');
            assert(buffer.equals(res.data), 'buffer');
            done();
        })
            .catch(done);
    });

    it('update', function (done) {
        function generateBinaryObject() {
            const params = {};
            const length = _.random(0, 16);
            for (let i = 0; i < length; i++) {
                let key = bandom.read(_.random(0, 256)).toString('binary');
                params[key] = bandom.read(_.random(0, 256)).toString('binary');
            }
            return params;
        }

        const params = generateBinaryObject();
        const data = generateBinaryObject();
        lviv.patch('/mirror', params, data).then(function (res) {
            assert(200 === res.statusCode, 'Status ' + res.statusCode);
            const url = '/mirror?' + Lviv.params(params);
            assert(url === res.req.path, 'invalid url');
            assert('PATCH' === res.req.method, 'invalid method');
            assert(_.isObject(res.data), 'Has no response data');
            assert(_.isObject(res.data.headers), 'Has no headers');
            assert('content-type' in res.data.headers, 'Has no content-type header');
            assert('application/json' === res.data.headers['content-type'], 'content-type');
            assert(_.isObject(res.data.data), 'Has no response data.data');
            assert(true === res.data.data.success, 'success');
            delete res.data.data.success;
            assert.deepStrictEqual(res.data.data, data);
            done();
        })
            .catch(done);
    });

    it('upload', function (done) {
        const filename = '/tmp/' + bandom.nano('upload_');
        fs.writeFileSync(filename, bandom.read(bandom.uint32BE(12 * 1024 * 1024)));
        lviv.upload('/upload', filename).then(function (res) {
            const buffer = fs.readFileSync(filename);
            assert(buffer.equals(res.data), 'buffer');
            fs.unlinkSync(filename);
            done();
        })
            .catch(done);
    });
});
