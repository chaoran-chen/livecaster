import { Injectable } from '@angular/core';
import {environment} from '../../environments/environment';

@Injectable()
export class SignalingService {

  private socket: WebSocket;

  constructor() {
    this.socket = new WebSocket(`ws://${environment.nodeServerHost}/signaling`);
  }

}
