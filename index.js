"use strict";

const http = require('http');
const qs = require('querystring');
const _ = require('underscore');
const Lviv = require('./lviv');

Lviv.params = qs.stringify;

Lviv.promise = function (request) {
    return new Promise(function (resolve, reject) {
        request.on('response', function (res) {
            function receive() {
                if (res.statusCode >= 400) {
                    reject(res);
                }
                else {
                    resolve(res)
                }
            }

            const data = [];
            res.on('data', function (chunk) {
                data.push(chunk)
            });
            res.on('end', function () {
                res.data = 1 == data.length ? data[0] : Buffer.concat(data);
                if ('content-type' in res.headers && res.headers['content-type'].indexOf('json') >= 0) {
                    res.data = JSON.parse(res.data.toString('utf8'));
                }
                receive();
            });
        });
        request.on('abort', reject);
        // request.on('aborted', reject);
        // request.on('checkException', reject);
        // request.on('connect', reject);
        // request.on('continue', reject);
        // request.on('socket', reject);
        // request.on('upgrade', reject);
    })
};

Lviv.prototype.initialize = function (options) {
    this.agent = new http.Agent(options);
};

Lviv.prototype.createRequest = function (options) {
    if (!options) {
        options = {};
    }
    _.defaults(options, this.defaults);
    options.agent = this.agent;
    if (_.isObject(options.params)) {
        options.path += '?' + Lviv.params(options.params);
        // options.query = options.params;
    }
    // console.log(options.path);
    return http.request(options);
};

Lviv.prototype.query = function (options) {
    if ('json' === options.type) {
        if (!options.headers) {
            options.headers = {};
        }
        options.headers['content-type'] = 'application/json';
    }
    const request = this.createRequest(options);
    var data;
    if (options.data) {
        data = 'json' === options.type ? JSON.stringify(options.data) : options.data;
    }
    const promise = Lviv.promise(request);
    request.end(data);
    return promise;
};

module.exports = Lviv;
