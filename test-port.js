const http = require('http');
const server = http.createServer((req, res) => {
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end('Puerto 3000 funcionando\n');
});
server.listen(3000, '0.0.0.0', () => {
  console.log('Servidor de prueba en http://localhost:3000');
});
