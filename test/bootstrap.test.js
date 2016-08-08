"use strict";

const assert = require('assert');
const bandom = require('bandom');
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
            path: '/mirror',
            headers: {
                'content-type': 'application/json'
            }
        };
        _.defaults(options, defaults);
        const rand = _.uniqueId('server');
        const req = http.request(options, function (res) {
            const chunks = [];
            res.on('data', function (chunk) {
                chunks.push(chunk)
            });
            res.on('end', function () {
                const string = Buffer.concat(chunks).toString('utf8');
                const data = JSON.parse(string);
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
    });

    it('post', function (done) {
        const rand = _.uniqueId('server');
        lviv.post('/mirror', {rand: rand}).catch(done).then(function (res) {
            assert(_.isObject(res.data), 'Has no response data');
            assert(_.isObject(res.data.headers), 'Has no headers');
            assert('content-type' in res.data.headers, 'Has no content-type header');
            assert('application/json' === res.data.headers['content-type'], 'content-type');
            assert(_.isObject(res.data.data), 'Has no response data.data');
            assert(true === res.data.data.success, 'success');
            assert(rand === res.data.data.rand, 'rand');
            done();
        });
    });

    it('binary string', function (done) {
        const length = _.random(1, 12);
        const input = {};
        for (let i = 0; i < length; i++) {
            let size = _.random(1, 512 * 1024);
            input[size] = bandom.read(size).toString('binary');
        }
        lviv.post('/mirror', input).catch(done).then(function (res) {
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
        });
    });
});
