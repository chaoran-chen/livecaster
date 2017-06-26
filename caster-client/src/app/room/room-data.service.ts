import { Injectable } from '@angular/core';
import {environment} from '../../environments/environment';

@Injectable()
export class RoomDataService {

  constructor() { }


  async getAllRooms() {
    const res = await fetch(`//${environment.nodeServerHost}/rooms`, {
      headers: this.getHeaders(),
    });
    return await res.json();
  }


  async createRoom(name: string) {
    const res = await fetch(`//${environment.nodeServerHost}/rooms`, {
      headers: this.getHeaders(),
      method: 'POST',
      body: JSON.stringify({
        name
      })
    });
    const created = await res.json();
    console.log(created);
    return created;
  }


  private getHeaders() {
    return {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  }
}
