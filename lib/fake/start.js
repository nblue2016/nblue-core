const Server = require('./http.js');

const port = 1033;
const server = new Server(port);

server.start();