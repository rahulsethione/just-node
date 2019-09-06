const EventEmmiter = require('events');

/**
 * @private chainMiddleware
 * @param {Function[]} middleware 
 */
function chainMiddleware(middleware, iterator, iterableResult) {
    "use strict";
    return (request, response) => {
        iterator = (function* (request, response) {
            let count = 0;

            while(count < middleware.length) {
                yield Promise.resolve().then(() => middleware[count](
                    request,
                    response,
                    () => {
                        if(!iterableResult.done) {
                            count++;
                            iterableResult = iterator.next();
                        }
                    }
                ));
            }

        })(request, response);
        
        iterableResult = iterator.next();
    }
}

class Route extends EventEmmiter {
    constructor(path) {
        super();
        this.path = path;
        this.on("get", Route.notFoundHandler);
        this.on("post", Route.notFoundHandler);
        this.on("put", Route.notFoundHandler);
        this.on("delete", Route.notFoundHandler);
    }
    
    static notFoundHandler(request, response) {
        response.writeHead(404, { "Content-Type": "text/plain"});
        response.write(`Path ${request.method.toUpperCase()} ${request.url} not found.`);
        response.end();
    }

    get(...middleware) {
        console.log(`Registering route [GET ${this.getPath()}]`);

        let iterator, iterableResult;

        this.off("get", Route.notFoundHandler);
        this.on("get", chainMiddleware(middleware, iterator, iterableResult));

        return this;
    }

    post(...middleware) {
        let iterator, iterableResult;

        console.log(`Registering route [POST ${this.getPath()}]`);
        this.off("post", Route.notFoundHandler);
        this.on("post", chainMiddleware(middleware, iterator, iterableResult));
        return this;
    }

    put(...middleware) {
        let iterator, iterableResult;

        console.log(`Registering route [PUT ${this.getPath()}]`);
        this.off("put", Route.notFoundHandler);
        this.on("put", chainMiddleware(middleware, iterator, iterableResult));
        return this;
    }

    delete(...middleware) {
        let iterator, iterableResult;

        console.log(`Registering route [DELETE ${this.getPath()}]`);
        this.off("delete", Route.notFoundHandler);
        this.on("delete", chainMiddleware(middleware, iterator, iterableResult));
        return this;
    }

    getPath() {
        return this.path;
    }
}

exports.Route = Route;