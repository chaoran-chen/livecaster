import { AfterViewInit, Component, OnInit } from '@angular/core';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-listener-room',
  templateUrl: './listener-room.component.html',
  styleUrls: ['./listener-room.component.scss']
})
export class ListenerRoomComponent implements OnInit, AfterViewInit {

  socket: WebSocket;


  static getUrl(): string {
    let host;
    if (environment.production) {
      host = window.location.host;
    } else {
      host = environment.nodeServerHost;
    }
    return `wss://${host}/listener`;
  }

  ngOnInit() {
  }


  constructor() { }


  ngAfterViewInit() {
    const { dashjs } = <any> window;
    const url = 'http://rdmedia.bbc.co.uk/dash/ondemand/bbb/2/client_manifest-audio.mpd';
    const player = dashjs.MediaPlayer().create();
    console.log(player);
    player.initialize(document.querySelector('#audioPlayer'), url, true);
    // player.getDebug().setLogToBrowserConsole(false);
    this.socket = new WebSocket(ListenerRoomComponent.getUrl());
    this.socket.addEventListener('open', () => {
      this.sendToServer({
        type: 'hello'
      });
    });
  }


  sendToServer(msg) {
    const msgJSON = JSON.stringify(msg);
    this.socket.send(msgJSON);
  }
}
