import {rest} from '../../src/rest';

describe('the @rest decorator', () => {
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

    var TestResponses = {
        query: {
            success: {
                status: 200,
                responseText: JSON.stringify([{
                    id: 1,
                    name: 'Fulano'
                }])
            }
        },
        getOrCreate: {
            success: {
                status: 200,
                responseText: JSON.stringify({
                    id: 1,
                    name: 'Fulano'
                })
            }
        },
        update: {
            success: {
                status: 200,
                responseText: JSON.stringify({
                    id: 1,
                    name: 'Sicrano'
                })
            }
        },
        destroy: {
            success: {
                status: 200,
                responseText: ''
            }
        },
        error: {
            status: 404,
            responseText: 'Not found'
        }
    };

    var request,
        customMatcher = {
            toContentBeEqual : function(util, customEqualityTesters) {
                return {
                    compare : function(actual, expected){
                        if (expected === undefined) {
                            expected = '';
                        }
                        var result = {};
                        result.pass = actual.every(function(item){
                            return util.equals(item, expected, customEqualityTesters);
                        });
                        if(result.pass){
                            result.message = 'Expected '+ actual + ' content to be equal '+ expected;
                        }
                        else{
                            result.message = 'Expected '+ actual + ' content to be equal '+ expected+' but ' + (item ? item.constructor.name : 'null') + ' found';
                        }
                        return result;
                    }
                };
            }
        };
    
    describe('User promises', () => {
        var promise,
            request,
            user;
        
        beforeEach(() => {
            jasmine.addMatchers(customMatcher);            
            jasmine.Ajax.install();
        });
        
        afterEach(() => {
            jasmine.Ajax.uninstall();            
        });
        
        describe('User.query promise', () => {            
            beforeEach(() => {                
                expect(User.query).toBeDefined();
                expect(User.query).toEqual(jasmine.any(Function));
                
                promise = User.query({
                    id: 1
                });
                
                expect(promise).toEqual(jasmine.any(Promise));
            });    
            
            it('User.query on resolve', (done) => {
                jasmine.Ajax
                    .stubRequest('http://example.com/api/user/?id=1')
                    .andReturn(TestResponses.query.success); 
                
                promise.then(function () {
                    request = jasmine.Ajax.requests.mostRecent();
                    
                    expect(request.url).toBe('http://example.com/api/user/?id=1');
                    expect(request.method).toBe('GET');                    
                    expect(arguments.length).toEqual(1);
                    expect(arguments[0]).toEqual(jasmine.any(Array));
                    expect(arguments[0]).toContentBeEqual(jasmine.any(User));
                    done();
                }, function noop() {
                    done();
                }).catch(err => {
                    
                });
            });

            it('User.query on reject', (done) => {
                jasmine.Ajax
                    .stubRequest('http://example.com/api/user/?id=1')
                    .andReturn(TestResponses.error); 
                
                promise.then(function noop() {
                    done();
                }, function () {
                    request = jasmine.Ajax.requests.mostRecent();
                    
                    expect(request.url).toBe('http://example.com/api/user/?id=1');
                    expect(request.method).toBe('GET');                    
                    expect(arguments.length).toEqual(1);
                    done();
                })
                .catch(err => {
                    
                });
            });
        });
        
        describe('User.get promise', () => {            
            beforeEach(() => {                
                expect(User.get).toBeDefined();
                expect(User.get).toEqual(jasmine.any(Function));
                
                promise = User.get({
                    id: 1
                });
                
                expect(promise).toEqual(jasmine.any(Promise));
            });    
            
            it('User.get on resolve', (done) => {
                jasmine.Ajax
                    .stubRequest('http://example.com/api/user/1')
                    .andReturn(TestResponses.getOrCreate.success); 
                
                promise.then(function () {
                    request = jasmine.Ajax.requests.mostRecent();
                    
                    expect(request.url).toBe('http://example.com/api/user/1');
                    expect(request.method).toBe('GET'); 
                    expect(arguments.length).toEqual(1);
                    expect(arguments[0]).toEqual(jasmine.any(User));
                    done();
                }, function noop() {
                    done();
                }).catch(err => {
                    
                });
            });

            it('User.get on reject', (done) => {
                jasmine.Ajax
                    .stubRequest('http://example.com/api/user/1')
                    .andReturn(TestResponses.error); 
                
                promise.then(function noop() {
                    done();
                }, function () {
                    request = jasmine.Ajax.requests.mostRecent();
                    
                    expect(request.url).toBe('http://example.com/api/user/1');
                    expect(request.method).toBe('GET'); 
                    expect(arguments.length).toEqual(1);
                    done();
                })
                .catch(err => {
                    
                });
            });
        });
        
        beforeEach(() => {
            user = new User('Fulano');
        });
        
        describe('user.create promise', () => {            
            beforeEach(() => {
                expect(user).toBeDefined();
                expect(user.name).toBe('Fulano');
                expect(user.create).toEqual(jasmine.any(Function));
                expect(user.id).toBeUndefined();
                
                promise = user.create();
                
                expect(promise).toEqual(jasmine.any(Promise));
            });    
            
            it('user.create on resolve', (done) => {
                jasmine.Ajax
                    .stubRequest('http://example.com/api/user/')
                    .andReturn(TestResponses.getOrCreate.success); 
                
                promise.then(function () {
                    request = jasmine.Ajax.requests.mostRecent();
                    
                    expect(request.url).toBe('http://example.com/api/user/');
                    expect(request.method).toBe('POST'); 
                    expect(arguments.length).toEqual(1);
                    expect(arguments[0]).toEqual(jasmine.any(User));
                    expect(arguments[0]).toEqual(user);
                    expect(arguments[0].name).toBe('Fulano');
                    expect(arguments[0].id).toBeDefined();
                    done();
                }, function noop() {
                    done();
                }).catch(err => {
                    
                });
            });

            it('user.create on reject', (done) => {
                jasmine.Ajax
                    .stubRequest('http://example.com/api/user/')
                    .andReturn(TestResponses.error);
                
                promise.then(function noop() {
                    done();
                }, function () {
                    request = jasmine.Ajax.requests.mostRecent();
                    
                    expect(request.url).toBe('http://example.com/api/user/');
                    expect(request.method).toBe('POST'); 
                    expect(arguments.length).toEqual(1);
                    done();
                })
                .catch(err => {
                    
                });
            });
        });

        describe('user.update promise', () => {
            beforeEach(() => {
                user.id = 1;            
            });
            
            beforeEach(() => {
                expect(user).toBeDefined();
                expect(user.id).toBeDefined();
                expect(user.name).toBe('Fulano');
                
                user.name = 'Sicrano';    
                
                expect(user.name).toBe('Sicrano');
                expect(user.create).toEqual(jasmine.any(Function));
                
                promise = user.update();
                
                expect(promise).toEqual(jasmine.any(Promise));
            });    
            
            it('user.update on resolve', (done) => {
                jasmine.Ajax
                    .stubRequest('http://example.com/api/user/1')
                    .andReturn(TestResponses.update.success);
                
                promise.then(function () {
                    request = jasmine.Ajax.requests.mostRecent();
                    
                    expect(request.url).toBe('http://example.com/api/user/1');
                    expect(request.method).toBe('PUT'); 
                    expect(arguments.length).toEqual(1);
                    expect(arguments[0]).toEqual(jasmine.any(User));
                    expect(arguments[0]).toEqual(user);
                    expect(arguments[0].name).toBe('Sicrano');
                    expect(arguments[0].id).toEqual(1);
                    done();
                }, function noop() {
                    done();
                }).catch(err => {
                    
                });
            });

            it('user.update on reject', (done) => {
                jasmine.Ajax
                    .stubRequest('http://example.com/api/user/1')
                    .andReturn(TestResponses.error); 
                
                promise.then(function noop() {
                    done();
                }, function () {
                    request = jasmine.Ajax.requests.mostRecent();
                    
                    expect(request.url).toBe('http://example.com/api/user/1');
                    expect(request.method).toBe('PUT'); 
                    expect(arguments.length).toEqual(1);
                    done();
                })
                .catch(err => {
                    
                });
            });
        });
        
        describe('user.save promise', () => {
            beforeEach(() => {
                expect(user).toBeDefined();
                expect(user.name).toBe('Fulano');
                expect(user.save).toEqual(jasmine.any(Function));
            });
            
            describe('user.save (create)', () => {                
                beforeEach(() => {
                    promise = user.save();
                    
                    expect(promise).toEqual(jasmine.any(Promise));
                });
            
                it('user.save (create) on resolve', (done) => {
                    expect(user.id).toBeUndefined();
                    
                    jasmine.Ajax
                        .stubRequest('http://example.com/api/user/')
                        .andReturn(TestResponses.getOrCreate.success);
                    
                    promise.then(function () {
                        request = jasmine.Ajax.requests.mostRecent();
                        
                        expect(request.url).toBe('http://example.com/api/user/');
                        expect(request.method).toBe('POST'); 
                        expect(arguments.length).toEqual(1);
                        expect(arguments[0]).toEqual(jasmine.any(User));
                        expect(user.id).toBeDefined();
                        expect(user.name).toBe('Fulano');
                        done();
                    }, function noop() {
                        done();
                    }).catch(err => {
                        
                    });
                });

                it('user.save (create) on reject', (done) => {
                    jasmine.Ajax
                        .stubRequest('http://example.com/api/user/')
                        .andReturn(TestResponses.error); 
                    
                    promise.then(function noop() {
                        done();
                    }, function () {
                        request = jasmine.Ajax.requests.mostRecent();
                        
                        expect(request.url).toBe('http://example.com/api/user/');
                        expect(request.method).toBe('POST'); 
                        expect(arguments.length).toEqual(1);
                        done();
                    })
                    .catch(err => {
                        
                    });
                });
            });
            
            describe('user.save (update)', () => {                
                beforeEach(() => {
                    user.id = 1;
                    
                    promise = user.save();
                    expect(promise).toEqual(jasmine.any(Promise));
                });
                
                it('user.save (update) on resolve', (done) => {
                    
                    expect(user.name).toBe('Fulano');
                    
                    user.name = 'Sicrano';
                    
                    jasmine.Ajax
                        .stubRequest('http://example.com/api/user/1')
                        .andReturn(TestResponses.update.success);
                    
                    promise.then(function () {
                        request = jasmine.Ajax.requests.mostRecent();
                        
                        expect(request.url).toBe('http://example.com/api/user/1');
                        expect(request.method).toBe('PUT'); 
                        expect(arguments.length).toEqual(1);
                        expect(arguments[0]).toEqual(jasmine.any(User));
                        expect(user.name).toBe('Sicrano');
                        done();
                    }, function noop() {
                        done();
                    }).catch(err => {
                        
                    });
                });

                it('user.save (update) on reject', (done) => {
                    expect(user.name).toBe('Fulano');
                    
                    user.name = 'Sicrano';
                    
                    jasmine.Ajax
                        .stubRequest('http://example.com/api/user/1')
                        .andReturn(TestResponses.error); 
                    
                    promise.then(function noop() {
                        done();
                    }, function () {
                        request = jasmine.Ajax.requests.mostRecent();
                        
                        expect(request.url).toBe('http://example.com/api/user/1');
                        expect(request.method).toBe('PUT'); 
                        expect(arguments.length).toEqual(1);
                        done();
                    })
                    .catch(err => {
                        
                    });
                });
            });
        });
        
        describe('user.destroy promise', () => {            
            beforeEach(() => {
                user.id = 1;
                
                expect(user).toBeDefined();
                expect(user.name).toBe('Fulano');                
                expect(user.destroy).toEqual(jasmine.any(Function));
                
                promise = user.destroy();
                
                expect(promise).toEqual(jasmine.any(Promise));
            });    
            
            it('user.destroy on resolve', (done) => {
                jasmine.Ajax
                    .stubRequest('http://example.com/api/user/1')
                    .andReturn(TestResponses.destroy.success);
                
                promise.then(function () {
                    request = jasmine.Ajax.requests.mostRecent();
                    
                    expect(request.url).toBe('http://example.com/api/user/1');
                    expect(request.method).toBe('DELETE'); 
                    expect(arguments.length).toEqual(1);
                    expect(arguments[0]).toBeUndefined()
                    expect(user.id).toBeUndefined();
                    expect(user.name).toBeUndefined();
                    done();
                }, function noop() {
                    done();
                }).catch(err => {
                    
                });
            });

            it('user.destroy on reject', (done) => {
                jasmine.Ajax
                    .stubRequest('http://example.com/api/user/1')
                    .andReturn(TestResponses.error); 
                
                promise.then(function noop() {
                    done();
                }, function () {
                    request = jasmine.Ajax.requests.mostRecent();
                    
                    expect(request.url).toBe('http://example.com/api/user/1');
                    expect(request.method).toBe('DELETE'); 
                    expect(arguments.length).toEqual(1);
                    done();
                })
                .catch(err => {
                    
                });
            });
        });
    });
});
