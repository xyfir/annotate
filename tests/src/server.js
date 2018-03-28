const express = require('express');
const server = express();
const path = require('path');

server.use('/', express.static(path.resolve(__dirname, '../')));
server.get('/', (rq, rs) => rs.sendFile(__dirname + '/index.html'));
server.listen(2061, () => console.log('Server running'));