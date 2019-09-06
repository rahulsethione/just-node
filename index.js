const { Server } = require('./src/Server');
const { Route } = require('./src/Route');

const server = new Server();
const logRequest = (request) => { console.log(`Request { method = ${request.method.toUpperCase()}, path = "${request.url}", body = ${request.body}}`); }

server.allowCors = true;

server.addRoute(
    new Route("/")
        .get(
            (request, response, next) => {
                logRequest(request);
                next();
            },
            server.serveResource("index.html")
        )
        .post((request, response) => {
            logRequest(request);
            response.writeHead(200, {'Content-Type': 'text/plain'});
            response.write("Server is working");
            response.end();
        })
);

server.start(8080, () => console.log("Server with Process ID: " + process.pid + " is running at http://" + server.address + ":" + server.port));