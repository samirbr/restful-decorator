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
    return new Promise((resolve, reject) => {
      let client = createRequest();
      let urlApp = Object.keys(params)
        .filter(key => paramKeys.indexOf(key) !== -1)
        .map(key => params[key])
        .join('/');

      if (appendUrl) {
        client.withUrl(urlApp);
      } else {
        client.withParams(params);
      }

      client.asGet()
        .send()
        .then((response) => {
          resolve(response.content);
        }, (err) => {
          reject(err);
        })
        .catch((err) => {
          reject(err);
        });
    });
  };

  function extractParams(src, params) {
    return [{}].concat(Object.keys(params))
      .reduce((obj, key) => {
        obj[key] = params[key].indexOf('@') === 0 ?
          src[params[key].substr(1)] : params[key];
        return obj;
      });
  }

  function clone(o) {
    return Object.assign({}, o);
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
          let content = clone(this);
          let client = createRequest();
          let self = this;

          return new Promise((resolve, reject) => {
            client.withContent(content)
              .asPost()
              .send()
              .then(data => {
                Object.assign(self, data.content);
                resolve(self);
              })
              .catch(err => {
                reject(err);
              });
          });
        }
      },
      /**
       * Update method
       * @method update
       * @return {Promise} Returns updated target instance by RESTful service.
       */
      'update': {
        value: function update() {
          let keyVal = extractParams(this, config.params);
          let content = clone(this);
          let client = createRequest();
          let urlApp = paramKeys.map(key => keyVal[key])
            .join('/');
          let self = this;

          return new Promise((resolve, reject) => {
            client.withUrl(urlApp)
              .withContent(content)
              .asPut()
              .send()
              .then(data => {
                Object.assign(self, data.content);
                resolve(self);
              }, (err) => {
                reject(err);
              })
              .catch(err => {
                reject(err);
              });
          });
        }
      },
      /**
       * Destroy method
       * @method destroy
       * @return {Promise} Delete target instance and returns nothing.
       */
      'destroy': {
        value: function destroy() {
          let keyVal = extractParams(this, config.params);
          let client = createRequest();
          let urlApp = paramKeys.map(key => keyVal[key])
            .join('/');
          let self = this;

          return new Promise((resolve, reject) => {
            client.withUrl(urlApp)
              .asDelete()
              .send()
              .then(data => {
                Object.keys(self).forEach(key => delete self[key]);
                resolve(data.content);
              }, (err) => {
                reject(err);
              })
              .catch(err => {
                reject(err);
              });
          });
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
