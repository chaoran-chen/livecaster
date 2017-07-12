const express = require('express');
const util = require('util');
const GlobalDataService = require('../GlobalDataService');

const router = express.Router();
const dataService = GlobalDataService.getInstance();


const clientStates = {
  READY: 0,
};


class SignalingService {

  static broadcastMessage(socket, msg) {
    if (socket.state !== clientStates.READY) {
      console.error('Invalid current client state, expected ', clientStates.READY, ' got ', socket.state);
      return;
    }

    SignalingService.sendToAllExcept(socket.room, socket.participant.id, msg);
  }


  static redirectMessage(socket, msg) {
    SignalingService.sendTo(dataService.getParticipant(msg.target), msg);
  }


  static registerParticipant(socket, msg) {
    if (util.isNullOrUndefined(msg.room)) {
      console.error('Invalid message received');
      return;
    }
    const room = dataService.getRoom(msg.room);
    if (!room) {
      console.error('Room not available');
      socket.send(JSON.stringify({
        type: 'room-not-available',
      }));
      return;
    }
    if (room.casterKey !== msg.casterKey) {
      console.error('Not authorized');
      socket.send(JSON.stringify({
        type: 'not-authorized',
      }));
      return;
    }

    const participant = dataService.addParticipant(room.id, socket);
    socket.state = clientStates.READY;
    socket.room = room;
    socket.participant = participant;

    SignalingService.sendTo(participant, {
      type: 'registration-successful',
      participantId: participant.id,
    });

    SignalingService.sendToAllExcept(room, participant.id, {
      type: 'participant-joined',
      participantId: participant.id,
      name: participant.name,
    });

    socket.room.participants.forEach((participantId) => {
      const participantName = dataService.getParticipant(participantId).name;
      if (participantId !== participant.id) {
        SignalingService.sendTo(participant, {
          type: 'participant-joined',
          participantId,
          name: participantName,
        });
      }
    });
  }


  static sendTo(participant, content) {
    participant.socket.send(JSON.stringify(content));
  }


  static sendToAll(room, content) {
    room.participants.forEach((participantId) => {
      SignalingService.sendTo(dataService.getParticipant(participantId), content);
    });
  }


  static sendToAllExcept(room, exceptionParticipantId, content) {
    room.participants.forEach((participantId) => {
      if (participantId !== exceptionParticipantId) {
        SignalingService.sendTo(dataService.getParticipant(participantId), content);
      }
    });
  }
}


router.ws('/', (socket) => {
  socket.on('close', () => {
    if (socket.state !== clientStates.READY) {
      return;
    }
    console.log('Connection closed, participant id: ', socket.participant.id);
    dataService.removeParticipant(socket.participant);
    SignalingService.sendToAll(socket.room, {
      type: 'participant-leaved',
      participantId: socket.participant.id,
    });
  });


  socket.on('message', (msgStr) => {
    const msg = JSON.parse(msgStr);
    console.log('Message received, type:', msg.type
      + (socket.participant ? `, Sender ID: ${socket.participant.id}` : ''));
    switch (msg.type) {
      case 'ready-to-call':
        SignalingService.registerParticipant(socket, msg);
        break;
      case 'change-name':
        if (socket.state !== clientStates.READY) {
          console.error('Invalid client state');
          break;
        }
        dataService.setParticipant({ id: socket.participant.id, name: msg.name });
        SignalingService.sendToAllExcept(socket.room, socket.participant.id, {
          type: 'participant-name-changed',
          participantId: socket.participant.id,
          name: msg.name,
        });
        break;
      default:
        msg.sender = socket.participant.id;
        if (msg.target) {
          SignalingService.redirectMessage(socket, msg);
        } else {
          SignalingService.broadcastMessage(socket, msg);
        }
        break;
    }
  });
});


module.exports = router;
