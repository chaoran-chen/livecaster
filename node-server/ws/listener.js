const express = require('express');
const util = require('util');
const GlobalDataService = require('../GlobalDataService');

const router = express.Router();
const dataService = GlobalDataService.getInstance();


class ListenerService {
  static welcomeListener(socket, msg) {
    if (util.isNullOrUndefined(msg.room)) {
      console.error('Invalid message received');
      return;
    }
    socket.room = dataService.getRoom(msg.room);
    socket.room.listeners.push(socket);
  }


  static dismissListener(socket) {
    if (socket.room) {
      socket.room.listeners.splice(socket.room.listeners.indexOf(socket), 1);
    }
  }
}


router.ws('/', (socket) => {
  socket.on('close', () => {
    ListenerService.dismissListener(socket);
  });


  socket.on('message', (msgStr) => {
    const msg = JSON.parse(msgStr);
    switch (msg.type) {
      case 'hello':
        ListenerService.welcomeListener(socket, msg);
        break;
      default:
        break;
    }
  });
});


module.exports = router;
