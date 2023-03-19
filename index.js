const http = require('http');
const { connectDB, disconnectDB } = require('./models/db');
const { handleRequest } = require('./routes');
const mongoose = require('mongoose');
const url = process.env.DBURL || 'mongodb://localhost:27017/WebShopDb';
mongoose.connect(url, {useNewUrlParser: true}, { useUnifiedTopology: true } );
const PORT = process.env.PORT || 3000;
connectDB();
require('./setup/reset-db.js');
require('./setup/create-orders.js');
const server = http.createServer(handleRequest);

server.on('error', err => {
  console.error(err);
  server.close();
});

server.on('close', () => console.log('Server closed.'));

server.listen(PORT, () => {
  console.log(`Listening on port: ${PORT}`);
});