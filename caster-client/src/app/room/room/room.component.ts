import {AfterViewInit, Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {SignalingService} from '../signaling.service';


@Component({
  selector: 'app-room',
  templateUrl: './room.component.html',
  styleUrls: ['./room.component.scss']
})
export class RoomComponent implements AfterViewInit {

  @ViewChild('receivedAudio') receivedAudio: ElementRef;

  constructor(private route: ActivatedRoute, private router: Router, private signalingService: SignalingService) { }


  ngAfterViewInit() {
    this.route.params.subscribe((pathParams) => {
      this.route.queryParams.subscribe(async (queryParams) => {
        const id = pathParams.rid;
        const username = queryParams.username;
        if (!username) {
          return this.router.navigateByUrl('/');
        }

        try {
          const localStream = await navigator.mediaDevices.getUserMedia({audio: true});
          this.signalingService.init(username, this.receivedAudio, id, localStream);
        } catch (err) {
          this.handleGetUserMediaError(err);
        }
      });
    });
  }

  handleGetUserMediaError(err) {
    console.log('handleGetUserMediaError', err);
    switch (err.name) {
      case 'NotFoundError':
        alert('Unable to open your call because no camera and/or microphone' +
          'were found.');
        break;
      case 'SecurityError':
      case 'PermissionDeniedError':
        // Do nothing; this is the same as the user canceling the call.
        break;
      default:
        alert('Error opening your camera and/or microphone: ' + err.message);
        break;
    }
  }

}
