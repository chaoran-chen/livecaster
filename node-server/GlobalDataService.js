const randomstring = require('randomstring');


let instance;


class GlobalDataService {
  static getInstance() {
    if (!instance) {
      instance = new GlobalDataService();
    }
    return instance;
  }


  constructor() {
    if (instance) {
      throw new Error('The GlobalDataService can only be created once.');
    }

    this.rooms = new Map();
    this.participants = new Map();
    this.participantIdCounter = 0;
  }


  getRoom(id) {
    return this.rooms.get(id);
  }


  getRooms() {
    return Array.from(this.rooms.values());
  }


  addRoom(room) {
    let id;
    do {
      id = randomstring.generate({ length: 5, charset: 'alphanumeric' });
    } while (this.rooms.has(id));
    const newRoom = Object.assign({
      name: '',
    }, room, {
      participants: [],
      id,
    });
    this.rooms.set(id, newRoom);
    return newRoom;
  }


  addParticipant(roomId, socket, participant) {
    const newParticipant = Object.assign({
      name: '',
    }, participant, {
      id: this.participantIdCounter,
      socket,
      room: roomId,
    });
    this.participantIdCounter += 1;
    this.participants.set(newParticipant.id, newParticipant);
    this.rooms.get(roomId).participants.push(newParticipant.id);
    return newParticipant;
  }


  getParticipant(participantId) {
    return this.participants.get(participantId);
  }


  setParticipant(participant) {
    const oldParticipant = this.participants.get(participant.id);
    Object.assign(oldParticipant, participant, {
      id: oldParticipant.id,
      socket: oldParticipant.socket,
      room: oldParticipant.room,
    });
  }


  removeParticipant(participant) {
    this.participants.delete(participant.id);
    const roomParticipants = this.rooms.get(participant.room).participants;
    roomParticipants.splice(roomParticipants.indexOf(participant.id), 1);
  }
}


module.exports = GlobalDataService;
