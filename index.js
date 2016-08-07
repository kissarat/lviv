"use strict";

const http = require('http');
const qs = require('querystring');
const _ = require('underscore');
const Lviv = require('./lviv');

Lviv.params = qs.stringify;

Lviv.promise = function (request) {
    return new Promise(function (resolve, reject) {
        request.on('response', function (response) {
            if (response.statusCode >= 400) {
                reject(response);
            }
            else {
                resolve(response)
            }
        });
        request.on('abort', reject);
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
    return http.request(options);
};

Lviv.prototype.query = function (options) {
    const request = this.createRequest(options);
    var data;
    if (options.data) {
        data = 'json' === options.type ? JSON.stringify(options.data) : options.data;
    }
    request.end(data);
    return Lviv.promise(request);
};

module.exports = Lviv;
