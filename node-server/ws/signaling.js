const express = require('express');
const util = require('util');
const GlobalDataService = require('../GlobalDataService');

const router = express.Router();
const dataService = GlobalDataService.getInstance();


function sendToAllExcept(participants, exception, content) {
  participants.forEach(({ username, socket }) => {
    if (username !== exception) {
      socket.send(JSON.stringify(content));
    }
  });
}


router.ws('/', (ws) => {
  ws.on('message', (msgStr) => {
    const msg = JSON.parse(msgStr);
    console.log('Message received', msg);

    if (util.isNullOrUndefined(msg.type) || util.isNullOrUndefined(msg.room) || util.isNullOrUndefined(msg.username)) {
      console.error('Invalid message received');
      return;
    }
    const room = dataService.getRoom(Number.parseInt(msg.room, 10));
    if (!room) {
      console.error('Room not available');
      return;
    }

    switch (msg.type) {
      case 'ready-to-call':
        room.participants.push({ username: msg.username, socket: ws });
        sendToAllExcept(room.participants, msg.username, {
          type: 'new-participant',
          targetUsername: msg.username,
        });
        room.participants.forEach(({ username }) => {
          if (username !== msg.username) {
            ws.send(JSON.stringify({
              type: 'new-participant',
              targetUsername: username,
            }));
          }
        });
        break;
      default:
        sendToAllExcept(room.participants, msg.username, msg);
        break;
    }
  });
});


module.exports = router;
