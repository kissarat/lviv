'use strict';

var isServer = ('undefined' !== typeof module) && module.exports;
if (isServer) {
    var _ = require('underscore');
}

function Lviv(options) {
    this.defaults = {};
    _.defaults(this.defaults, Lviv.defaults);
    this.initialize(options);
}

Lviv.defaults = {
    method: 'GET',
    type: 'json'
};

Lviv.promise = function (xhr) {
    return new Promise(function (resolve, reject) {
        xhr.addEventListener('load', function () {
            (xhr.status < 400 ? resolve : reject)(xhr);
        });
        xhr.addEventListener('error', function () {
            reject(xhr);
        });
    });
};

Lviv.params = function (object) {
    var array = [];
    for (var i in object) {
        array.push(i + '=' + object[i]);
    }
    return array.join('&');
};

Lviv.trace = function (promise) {
    promise
        .then(function (data, xhr) {
            console.log(data, xhr);
        })
        .catch(function (data, xhr) {
            console.error(xhr.status, data);
        });
};

Lviv.prototype = {
    initialize: function () {},

    createURL: function (options) {
        var url = options.path ? options.path : '/';
        if (!isServer) {
            if (options.port) {
                url = ':' + options.port + url;
            }
            if (options.host) {
                url = '//' + options.host + url;
            }
            if (options.protocol) {
                url = options.protocol + url;
            }
        }
        if (!_.isEmpty(options.params)) {
            var params = options.params;
            if ('object' == typeof params) {
                params = Lviv.params(params);
            }
            url += '?' + params;
        }
        return url;
    },

    createRequest: function (options) {
        if (!options) {
            options = {};
        }
        var xhr = new XMLHttpRequest();
        _.defaults(options, this.defaults);
        xhr.open(options.method, this.createURL(options));
        return xhr;
    },

    query: function (options) {
        var xhr = this.createRequest(options);
        _.each(options.headers, function (value, key) {
            xhr.setRequestHeader(key, value);    
        });
        if (options.data) {
            xhr.send('json' == options.type ? JSON.stringify(options.data) : options.data);
        }
        else {
            xhr.send(null);
        }
        return Lviv.promise(xhr);
    },

    get: function (path, params) {
        return this.query({
            method: 'GET',
            path: path,
            params: params
        });
    },

    update: function (method, path, params, data) {
        var options = {
            method: method,
            path: path
        };
        if (data) {
            options.params = params;
            options.data = data;
        }
        else {
            options.data = params;
        }
        if ('Object' === options.data.constructor.name) {
            options.type = 'json';
        }
        return this.query(options);
    },

    post: function (path, params, data) {
        return this.update('POST', path, params, data);
    },

    put: function (path, params, data) {
        return this.update('PUT', path, params, data);
    },

    patch: function (path, params, data) {
        return this.update('PATCH', path, params, data);
    },

    delete: function (path, params) {
        return this.query({
            method: 'DELETE',
            path: path,
            params: params
        });
    },

    upload: function (path, data) {
        return this.query({
            method: 'POST',
            type: 'blob',
            path: path,
            data: data
        });
    }
};

if (isServer) {
    module.exports = Lviv;
}
