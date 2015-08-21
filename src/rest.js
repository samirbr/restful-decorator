import {HttpClient, RequestBuilder} from 'aurelia-http-client';

// modify RequestBuilder to append parameters to request
RequestBuilder.addHelper('withParams', (params) => {
  return (client, processor, message) => {
    message.params = Object.assign({}, params, message.params);
  };
});

/**
 * The RESTful decorator
 *
 * @function
 * @param {string} url A parametrized URL with parameters prefixed by ":" as in /user/:id.
 * @param {Object} config Configuration object. Currently, accepts:
 * * {Object} params If the parameter value is prefixed with @ then the value for that parameter will be extracted from the corresponding property from object instance.
 * * {Array} interceptors Array of interceptors.
 * * {Object} headers Dictionary of headers.
 * @return {Function} ES7 decorator.
 */
 // ES7 Decorator
export function rest(url, config) {
  let paramKeys = (url.match(/\/(:\w+)+/g) || [])
    .map((key) => {
      return key.replace('/:', '');
    });
  let extraParams = Object.keys(config.params)
    .filter(key => {
      return config.params[key].indexOf('@') === -1;
    }).reduce((obj, key) => {
      obj[key] = config.params[key];
      return obj;
    }, {});
  let defaultMethods = {
    'GET': { withParams: true },
    'POST': { withContent: true },
    'PUT': { withContent: true, withUrl: true },
    'PATCH': { withContent: true, withUrl: true },
    'DELETE': { withUrl: true }
  };

  function createRequest() {
    let baseUrl = url.replace(/(\/:\w+\/?)/g, '') + '/';
    let client = new HttpClient()
      .createRequest()
      .withBaseUrl(baseUrl)
      .withParams(extraParams);

    if (config.headers) {
      Object.keys(config.headers)
        .forEach(header => {
          client.withHeader(header, config.headers[header]);
        });
    }

    if (config.interceptors) {
      config.interceptors.forEach(interceptor => {
        client.withInterceptor(interceptor);
      });
    }

    return client;
  }

  /**
   * $resource helper
   * @private
   * @function
   * @param {*} Target Ttarget class
   * @param {Object} data Key-value pair dictionary with instance parameters data
   * @return {Object} Returns target instance.
   */
  function $resource(Target, data) {
    let resource = new Target();
    Object.assign(resource, data);
    return resource;
  }

  /**
   * $resource get static helper
   * @private
   * @static
   * @method
   * @param {Objects} params Key-value pair for lookup
   * @param {boolean} [appendUrl=true] Whether append /:parameter to url or to query string ?:parameter
   * @return {Promise} Returns get or query promise.
   */
  $resource.get = (params, appendUrl = false) => {
    return doRequest('GET', params, appendUrl);
  };

  function extractParams(src, params) {
    return Object.keys(params)
      .reduce((obj, key) => {
        obj[key] = params[key].indexOf('@') === 0 ?
          src[params[key].substr(1)] : params[key];
        return obj;
      }, {});
  }

  function clone(o) {
    return Object.assign({}, o);
  }

  function toMethodFn(method) {
    return 'as' + method[0].toUpperCase() + method.substr(1).toLowerCase();
  }

  function doRequest(method, obj, appendUrl = false) {
    let client = createRequest();
    let urlApp;

    return new Promise((resolve, reject) => {
      if (defaultMethods[method].withUrl) {
        let keyVal = extractParams(obj, config.params);
        urlApp = paramKeys.map(key => keyVal[key])
          .join('/');

        client.withUrl(urlApp);
      }

      if (defaultMethods[method].withContent) {
        client.withContent(clone(obj));
      }

      if (defaultMethods[method].withParams) {
        if (appendUrl) {
          urlApp = Object.keys(obj)
            .filter(key => paramKeys.indexOf(key) !== -1)
            .map(key => obj[key])
            .join('/');

          client.withUrl(urlApp);
        } else {
          client.withParams(obj);
        }
      }

      client[toMethodFn(method)].call(client)
        .send()
        .then(response => {
          if (defaultMethods[method].withParams) {
            resolve(response.content);
          } else if (defaultMethods[method].withContent) {
            Object.assign(obj, response.content);
            resolve(obj);
          } else {
            Object.keys(obj).forEach(key => delete obj[key]);
            resolve(response.content);
          }
        })
        .catch(err => {
          reject(err);
        });
    });
  }

  return function restDecorator(target) {
    Object.defineProperties(target.prototype, {
      /**
       * Create method
       * @method create
       * @return {Promise} Returns created target instance by RESTful service.
       */
      'create': {
        value: function create() {
          return doRequest('POST', this);
        }
      },
      /**
       * Update method
       * @method update
       * @return {Promise} Returns updated target instance by RESTful service.
       */
      'update': {
        value: function update() {
          return doRequest('PUT', this);
        }
      },
      /**
       * Destroy method
       * @method destroy
       * @return {Promise} Delete target instance and returns nothing.
       */
      'destroy': {
        value: function destroy() {
          return doRequest('DELETE', this);
        }
      },
      /**
       * Save method
       * @method save
       * @return {Promise} Create or update target instance.
       */
      'save': {
        value: function save() {
          return (this.id) ? this.update() : this.create();
        }
      }
    });

    /**
     * Get method
     * @static
     * @method get
     * @param {Object} params Key-value pair to lookup
     * @return {Promise} Retrieves a single target instance that matches the params
     */
    target.get = (params) => {
      return new Promise((resolve, reject) => {
        $resource.get(params, true).then((data) => {
          if (!Array.isArray(data)) {
            let resource = $resource(target, data);
            resolve(resource);
          } else {
            reject(`Expects Object got Array.`);
          }
        }, (err) => {
          reject(err);
        })
        .catch(err => {
          reject(err);
        });
      });
    };

    /**
     * Query method
     * @static
     * @method query
     * @param {Object} params Key-value pair to lookup
     * @return {Promise} Retrieves a list of target instances that matches the params
     */
    target.query = (params) => {
      return new Promise((resolve, reject) => {
        $resource.get(params).then((data) => {
          if (Array.isArray(data)) {
            let resources = data.map(obj => {
              let resource = $resource(target, obj);
              return resource;
            });

            resolve(resources);
          } else {
            reject(`Expects Array got ${ data ? data.constructor.name : 'null' }.`);
          }
        }, (err) => {
          reject(err);
        })
        .catch((err) => {
          reject(err);
        });
      });
    };
  };
}
