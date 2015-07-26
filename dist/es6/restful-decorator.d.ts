declare module 'restful-decorator' {
  import { HttpClient, RequestBuilder }  from 'aurelia-http-client';
  
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
  //  ES7 Decorator
  export function rest(url: any, config: any): any;
}