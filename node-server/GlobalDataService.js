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

    this.rooms = [];
    this.roomIdCouter = 0;
  }


  getRooms() {
    return this.rooms;
  }


  addRoom(room) {
    const newRoom = Object.assign({ id: this.roomIdCouter }, room);
    this.roomIdCouter += 1;
    this.rooms.push(newRoom);
    return newRoom;
  }
}


module.exports = GlobalDataService;
