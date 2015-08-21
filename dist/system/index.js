System.register(['aurelia-http-client'], function (_export) {
  'use strict';

  var HttpClient, RequestBuilder;

  _export('rest', rest);

  function rest(url, config) {
    var paramKeys = (url.match(/\/(:\w+)+/g) || []).map(function (key) {
      return key.replace('/:', '');
    });
    var extraParams = Object.keys(config.params).filter(function (key) {
      return config.params[key].indexOf('@') === -1;
    }).reduce(function (obj, key) {
      obj[key] = config.params[key];
      return obj;
    }, {});
    var defaultMethods = {
      'GET': { withParams: true },
      'POST': { withContent: true },
      'PUT': { withContent: true, withUrl: true },
      'PATCH': { withContent: true, withUrl: true },
      'DELETE': { withUrl: true }
    };

    function createRequest() {
      var baseUrl = url.replace(/(\/:\w+\/?)/g, '') + '/';
      var client = new HttpClient().createRequest().withBaseUrl(baseUrl).withParams(extraParams);

      if (config.headers) {
        Object.keys(config.headers).forEach(function (header) {
          client.withHeader(header, config.headers[header]);
        });
      }

      if (config.interceptors) {
        config.interceptors.forEach(function (interceptor) {
          client.withInterceptor(interceptor);
        });
      }

      return client;
    }

    function $resource(Target, data) {
      var resource = new Target();
      Object.assign(resource, data);
      return resource;
    }

    $resource.get = function (params) {
      var appendUrl = arguments.length <= 1 || arguments[1] === undefined ? false : arguments[1];

      return doRequest('GET', params, appendUrl);
    };

    function extractParams(src, params) {
      return Object.keys(params).reduce(function (obj, key) {
        obj[key] = params[key].indexOf('@') === 0 ? src[params[key].substr(1)] : params[key];
        return obj;
      }, {});
    }

    function clone(o) {
      return Object.assign({}, o);
    }

    function toMethodFn(method) {
      return 'as' + method[0].toUpperCase() + method.substr(1).toLowerCase();
    }

    function doRequest(method, obj) {
      var appendUrl = arguments.length <= 2 || arguments[2] === undefined ? false : arguments[2];

      var client = createRequest();
      var urlApp = undefined;

      return new Promise(function (resolve, reject) {
        if (defaultMethods[method].withUrl) {
          (function () {
            var keyVal = extractParams(obj, config.params);
            urlApp = paramKeys.map(function (key) {
              return keyVal[key];
            }).join('/');

            client.withUrl(urlApp);
          })();
        }

        if (defaultMethods[method].withContent) {
          client.withContent(clone(obj));
        }

        if (defaultMethods[method].withParams) {
          if (appendUrl) {
            urlApp = Object.keys(obj).filter(function (key) {
              return paramKeys.indexOf(key) !== -1;
            }).map(function (key) {
              return obj[key];
            }).join('/');

            client.withUrl(urlApp);
          } else {
            client.withParams(obj);
          }
        }

        client[toMethodFn(method)].call(client).send().then(function (response) {
          if (defaultMethods[method].withParams) {
            resolve(response.content);
          } else if (defaultMethods[method].withContent) {
            Object.assign(obj, response.content);
            resolve(obj);
          } else {
            Object.keys(obj).forEach(function (key) {
              return delete obj[key];
            });
            resolve(response.content);
          }
        })['catch'](function (err) {
          reject(err);
        });
      });
    }

    return function restDecorator(target) {
      Object.defineProperties(target.prototype, {
        'create': {
          value: function create() {
            return doRequest('POST', this);
          }
        },

        'update': {
          value: function update() {
            return doRequest('PUT', this);
          }
        },

        'destroy': {
          value: function destroy() {
            return doRequest('DELETE', this);
          }
        },

        'save': {
          value: function save() {
            return this.id ? this.update() : this.create();
          }
        }
      });

      target.get = function (params) {
        return new Promise(function (resolve, reject) {
          $resource.get(params, true).then(function (data) {
            if (!Array.isArray(data)) {
              var resource = $resource(target, data);
              resolve(resource);
            } else {
              reject('Expects Object got Array.');
            }
          }, function (err) {
            reject(err);
          })['catch'](function (err) {
            reject(err);
          });
        });
      };

      target.query = function (params) {
        return new Promise(function (resolve, reject) {
          $resource.get(params).then(function (data) {
            if (Array.isArray(data)) {
              var resources = data.map(function (obj) {
                var resource = $resource(target, obj);
                return resource;
              });

              resolve(resources);
            } else {
              reject('Expects Array got ' + (data ? data.constructor.name : 'null') + '.');
            }
          }, function (err) {
            reject(err);
          })['catch'](function (err) {
            reject(err);
          });
        });
      };
    };
  }

  return {
    setters: [function (_aureliaHttpClient) {
      HttpClient = _aureliaHttpClient.HttpClient;
      RequestBuilder = _aureliaHttpClient.RequestBuilder;
    }],
    execute: function () {
      RequestBuilder.addHelper('withParams', function (params) {
        return function (client, processor, message) {
          message.params = Object.assign({}, params, message.params);
        };
      });
    }
  };
});