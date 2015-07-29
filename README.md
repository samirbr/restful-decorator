# Aurelia @rest decorator

Created to simplify calls with Aurelia HttpClient. The @rest decorator adds CRUD methods to es6 classes.

## Usage

Define an entity class.

```
class RequestInterceptor {
    request(message) {
        return message;
    }

    requestError(error) {
        return error;
    }
}

class ResponseInterceptor {
    response(message) {
        return message;
    }

    responseError(error) {
        return error;
    }
}

@rest('http://example.com/api/user/:id', {
    params: { 'id': '@id' },
    headers: {
        'Authorization': 'Token 9a8b7c6e5f4g3h2i1jk09a8b7c6e5f4g3h2i1jk0'
    },
    interceptors: [
        new RequestInterceptor(),
        new ResponseInterceptor()
    ]
})
class User {
    name;

    constructor(name) {
        this.name = name;
    }

    resolve() {

    }
}
```

RESTful methods of class ```User``` will request http://example.com/api/user/ on all calls.

```
var user = new User('Fulano');
```

```Create``` and ```update``` methods promise resolution, update the user, and return the user instance.

#### Create method

```
user.create()
    .then((userInstance) => {
        // do something else with user
        // userInstance === user
    });
```

#### Update method

Ex.:

```
user.name = 'Sicrano';

user.update()
    .then((userInstance) => {
        // do something else with user
        // userInstance === user
    });
```

#### Destroy method

Destroy method removes all properties and property values of the user instance. It can't destroy the user instance object since 'this' object is immutable.

```
user.destroy()
    .then(() => {
        // do something
        // works on non strict mode
        delete user;
    });
```

### Retrieving data

#### User.get static method:

Ex.: Lookup an user with id 1.

```
User.get({ id: 1 })
    .then((userInstance) => {
        // do something with user
    });
```

#### User.query static method:

Ex.: Lookup users with name equal to 'Beltrano'.

```
User.query({ name: 'Beltrano' })
    .then((list) => {
        // do something with Array<User>
    });
```

## Polyfills

* None

## Dependencies

* aurelia-http-client

## Used By

This library is used directly by applications only.

## Platform Support

This library can be used in the **browser** only.

## Building The Code

To build the code, follow these steps.

1. Ensure that [NodeJS](http://nodejs.org/) is installed. This provides the platform on which the build tooling runs.
2. From the project folder, execute the following command:

  ```shell
  npm install
  ```
3. Ensure that [Gulp](http://gulpjs.com/) is installed. If you need to install it, use the following command:

  ```shell
  npm install -g gulp
  ```
4. To build the code, you can now run:

  ```shell
  gulp build
  ```
5. You will find the compiled code in the `dist` folder, available in three module formats: AMD, CommonJS and ES6.

6. See `gulpfile.js` for other tasks related to generating the docs and linting.

## Running The Tests

To run the unit tests, first ensure that you have followed the steps above in order to install all dependencies and successfully build the library. Once you have done that, proceed with these additional steps:

1. Ensure that the [Karma](http://karma-runner.github.io/) CLI is installed. If you need to install it, use the following command:

  ```shell
  npm install -g karma-cli
  ```
2. Ensure that [jspm](http://jspm.io/) is installed. If you need to install it, use the following commnand:

  ```shell
  npm install -g jspm
  ```
3. Install the client-side dependencies with jspm:

  ```shell
  jspm install
  ```

4. You can now run the tests with this command:

  ```shell
  karma start
  ```
