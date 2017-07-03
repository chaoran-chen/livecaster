import { Injectable } from '@angular/core';
import {environment} from '../../environments/environment';

@Injectable()
export class RoomDataService {


  static getUrl(): string {
    let host;
    if (environment.production) {
      host = window.location.host;
    } else {
      host = environment.nodeServerHost;
    }
    return `https://${host}/api`;
  }


  constructor() { }


  async getAllRooms() {
    const res = await fetch(`${RoomDataService.getUrl()}/rooms`, {
      headers: this.getHeaders(),
    });
    return await res.json();
  }


  async createRoom() {
    const res = await fetch(`${RoomDataService.getUrl()}/rooms`, {
      headers: this.getHeaders(),
      method: 'POST'
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
