const http = require('http');
const server = http.createServer((req, res) => {
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end('Puerto 4000 funcionando\n');
});
server.listen(4000, '0.0.0.0', () => {
  console.log('Servidor de prueba en http://localhost:4000');
});
