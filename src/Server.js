const { createServer } = require('http');
const { join, extname, dirname } = require('path');
const { readFile } = require('fs');
const { promisify } = require('util');
const { Route } = require('./Route');

/**
 * @private
 * @param {string} contentType 
 * @param {Buffer} body 
 */
function parseRequestBody(contentType, body) {
    switch(contentType) {
        case "application/json":
            return JSON.parse(body);
        default: return body;
    }
}

const readFilePromise = promisify(readFile);

const mimeTypes = new Map([
    [".html", "text/html"],
    [".css", "text/css"],
    [".js", "text/javascript"]
]);

Object.seal(mimeTypes);

class Server {
    constructor() {
        /**
         * @property {Server} server
         */
        this.server = createServer(this.onRequest.bind(this));

        /**
         * @property {Map<string, Route>} router
         */
        this.router = new Map();

        /**
         * @property {boolean} serverAllowCors
         */
        this.serverAllowCors = false;

        /**
         * @property {string} serverStaticContentPath
         */
        this.serverStaticContentPath = join(dirname(require.main.filename), "/static");
    }

    get port() {
        return this.server && this.server.listening ? this.server.address().port : undefined;
    }

    get allowCors() {
        return this.allowCors;
    }

    get address() {
        return this.server ? this.server.address().address : null;
    }

    /**
     * @setter allowCors
     * @param {boolean} value
     */
    set allowCors(value) {
        this.serverAllowCors = value;
    }

    /**
     * @setter staticContentPath
     * @param {string} path
     */
    set staticContentPath(path) {
        this.serverStaticContentPath = join(__dirname, path)
    }

    /**
     * 
     * @param {number} port 
     * @param {Function} callback 
     */
    start(port = 8080, callback) {
        this.serverPort = port;
        this.server.listen(this.serverPort, callback);
    }

    /**
     * 
     * @param {Route} route 
     */
    addRoute(...routes) {
        routes.forEach(route => this.router.set(route.getPath(), route));
    }

    /**
     * 
     * @param {ClientRequest} request 
     * @param {ServerResponse} response 
     */
    onRequest(request, response) {
        request.body = "";
        request.setEncoding("utf8");

        request.on("data", chunk => {
            request.body += chunk;
        });

        request.on("end", () => {
            this.serverAllowCors && response.setHeader("Access-Control-Allow-Origin", "*");
            request.body = parseRequestBody(request.headers["content-type"], request.body);
            if(this.router.has(request.url)) {
                this.router.get(request.url).emit(request.method.toLowerCase(), request, response);
            } else {
                this.serveResource(request.url)(request, response);
            }
        });
    }

    serveResource(filename) {
        return (request, response) => {
            readFilePromise(join(this.serverStaticContentPath, filename)).then(data => {
                response.writeHead(200, { 'Content-Type': mimeTypes.get(extname(filename)) || "application/octet-stream" });
                response.write(data);
                response.end();
            }).catch(error => {
                if(error.code === 'ENOENT') {
                    response.writeHead(404, { "Content-Type": "text/plain"});
                    response.write("File not found.");
                } else {
                    response.writeHead(500, { "Content-Type": "text/plain"});
                    response.write("Internal Server Error: " + error.message);
                }

                response.end();
            });
        }
    }
    
}

exports.Server = Server;