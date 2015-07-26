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

      return new Promise(function (resolve, reject) {
        var client = createRequest();
        var urlApp = Object.keys(params).filter(function (key) {
          return paramKeys.indexOf(key) !== -1;
        }).map(function (key) {
          return params[key];
        }).join('/');

        if (appendUrl) {
          client.withUrl(urlApp);
        } else {
          client.withParams(params);
        }

        client.asGet().send().then(function (response) {
          resolve(response.content);
        }, function (err) {
          reject(err);
        })['catch'](function (err) {
          reject(err);
        });
      });
    };

    function extractParams(src, params) {
      return [{}].concat(Object.keys(params)).reduce(function (obj, key) {
        obj[key] = params[key].indexOf('@') === 0 ? src[params[key].substr(1)] : params[key];
        return obj;
      });
    }

    function clone(o) {
      return Object.assign({}, o);
    }

    return function restDecorator(target) {
      Object.defineProperties(target.prototype, {
        'create': {
          value: function create() {
            var content = clone(this);
            var client = createRequest();
            var self = this;

            return new Promise(function (resolve, reject) {
              client.withContent(content).asPost().send().then(function (data) {
                Object.assign(self, data.content);
                resolve(self);
              })['catch'](function (err) {
                reject(err);
              });
            });
          }
        },

        'update': {
          value: function update() {
            var keyVal = extractParams(this, config.params);
            var content = clone(this);
            var client = createRequest();
            var urlApp = paramKeys.map(function (key) {
              return keyVal[key];
            }).join('/');
            var self = this;

            return new Promise(function (resolve, reject) {
              client.withUrl(urlApp).withContent(content).asPut().send().then(function (data) {
                Object.assign(self, data.content);
                resolve(self);
              }, function (err) {
                reject(err);
              })['catch'](function (err) {
                reject(err);
              });
            });
          }
        },

        'destroy': {
          value: function destroy() {
            var keyVal = extractParams(this, config.params);
            var client = createRequest();
            var urlApp = paramKeys.map(function (key) {
              return keyVal[key];
            }).join('/');
            var self = this;

            return new Promise(function (resolve, reject) {
              client.withUrl(urlApp).asDelete().send().then(function (data) {
                Object.keys(self).forEach(function (key) {
                  return delete self[key];
                });
                resolve(data.content);
              }, function (err) {
                reject(err);
              })['catch'](function (err) {
                reject(err);
              });
            });
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