import { AfterViewInit, Component, OnInit } from '@angular/core';
import { environment } from '../../../environments/environment';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-listener-room',
  templateUrl: './listener-room.component.html',
  styleUrls: ['./listener-room.component.scss']
})
export class ListenerRoomComponent implements OnInit, AfterViewInit {

  socket: WebSocket;
  roomId;
  mpdUrl;


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


  constructor(private route: ActivatedRoute) { }


  ngAfterViewInit() {
    this.route.params.subscribe(async (pathParams) => {
      this.roomId = pathParams.rid;

      const { dashjs } = <any> window;
      this.mpdUrl = `https://livecaster.stream/dash-files/${this.roomId}/livecaster.mpd`;
      const player = dashjs.MediaPlayer().create();
      player.initialize(document.querySelector('#audioPlayer'), this.mpdUrl, true);
      this.socket = new WebSocket(ListenerRoomComponent.getUrl());
      this.socket.addEventListener('open', () => {
        this.sendToServer({
          type: 'hello'
        });
      });
    });
  }


  sendToServer(msg) {
    const msgJSON = JSON.stringify(msg);
    this.socket.send(msgJSON);
  }
}
