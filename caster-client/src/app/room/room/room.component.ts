import { AfterViewInit, Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { environment } from '../../../environments/environment';


const clientStates = {
  CONN_OPENED: 0,
  READY: 1,
};


interface Target {
  participantId: number;
  name: string;
  peerConnection: RTCPeerConnection;
  audioStream: MediaStream;
}


declare const MediaRecorder: any;


@Component({
  selector: 'app-room',
  templateUrl: './room.component.html',
  styleUrls: ['./room.component.scss']
})
export class RoomComponent implements AfterViewInit {


  window = window;

  private roomId;
  private firstPackage = true;

  // Current user
  private participantId: number;
  private name: string;
  private currentState = -1;
  private localStream: MediaStream;

  // Socket to the server
  private socket: WebSocket;

  private targetArray: Array<Target> = [];
  private targets: Map<number, Target> = new Map();


  static getUrl(): string {
    let host;
    if (environment.production) {
      host = window.location.host;
    } else {
      host = environment.nodeServerHost;
    }
    return `wss://${host}/signaling`;
  }


  static stringToBuffer(str, uint8array, offset) {
    for (let i = 0; i < str.length; i++) {
      uint8array[offset++] = str.charCodeAt(i);
    }
    uint8array[offset++] = 0;
    return offset;
  }


  constructor(private route: ActivatedRoute, private router: Router) {
  }


  ngAfterViewInit() {
    this.route.params.subscribe(async (pathParams) => {
      const id = pathParams.rid;

      try {
        const localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        this.initWebRTC(id, localStream);
        this.initPushToServer(id, localStream);
      } catch (err) {
        this.handleGetUserMediaError(err);
      }
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


  initPushToServer(roomId, localStream) {
    // TODO Select room
    // TODO URL
    const socket = new WebSocket('wss://localhost:5552');
    socket.addEventListener('open', async () => {
      const mediaRecorder = new MediaRecorder(localStream, {
        audioBitsPerSecond: 64000
      });
      mediaRecorder.ondataavailable = (event) => {
        if (this.firstPackage) {
          // Send an ISO timestamp and time room number in the first package.
          const timestamp = new Date().toISOString();
          const roomIdString = roomId.toString();
          const buffer = new Uint8Array(timestamp.length + roomIdString.length + 2);
          const offset = RoomComponent.stringToBuffer(timestamp, buffer, 0);
          RoomComponent.stringToBuffer(roomIdString, buffer, offset);
          socket.send(new Blob([buffer, event.data], { 'type': 'audio/webm; codecs=opus' }));
          this.firstPackage = false;
        } else {
          socket.send(new Blob([event.data], { 'type': 'audio/webm; codecs=opus' }));
        }
      };
      mediaRecorder.start(500); // A blob every 500 ms.
    });
  }


  initWebRTC(roomId, localStream) {
    this.roomId = roomId;
    this.localStream = localStream;
    this.socket = new WebSocket(RoomComponent.getUrl());
    this.setMessageHandlers();

    this.socket.addEventListener('open', () => {
      this.currentState = clientStates.CONN_OPENED;
      this.sendToServer({
        type: 'ready-to-call',
        room: this.roomId
      });
    });
  }


  closeVideoCall(target: Target) {
    console.log('closeVideoCall');
    const elem = (<HTMLMediaElement> document.getElementById('stream-' + target.participantId));
    if (target.peerConnection) {
      if (elem.srcObject) {
        elem.srcObject.getTracks().forEach(track => track.stop());
        elem.srcObject = null;
      }

      target.peerConnection.close();
    }
    this.targets.delete(target.participantId);
    this.targetArray.splice(this.targetArray.indexOf(target), 1);
  }


  createPeerConnection(target: Target): RTCPeerConnection {
    console.log('createPeerConnection');
    const peerConnection = new RTCPeerConnection({
      iceServers: [
        {
          urls: [
            'stun:stun.l.google.com:19302',
            'stun:stun1.l.google.com:19302'
          ]
        }
      ]
    });

    target.peerConnection = peerConnection;
    const thisBinding = { current: this, target };
    peerConnection.onicecandidate = handleICECandidateEvent.bind(thisBinding);
    peerConnection.onaddstream = handleAddStreamEvent.bind(thisBinding);
    peerConnection.onremovestream = handleRemoveStreamEvent.bind(thisBinding);
    peerConnection.oniceconnectionstatechange = handleICEConnectionStateChangeEvent.bind(thisBinding);
    peerConnection.onicegatheringstatechange = handleICEGatheringStateChangeEvent.bind(thisBinding);
    peerConnection.onsignalingstatechange = handleSignalingStateChangeEvent.bind(thisBinding);
    peerConnection.onnegotiationneeded = handleNegotiationNeededEvent.bind(thisBinding);
    return peerConnection;
  }


  handleNewParticipantMsg(message) {
    if (this.currentState !== clientStates.READY) {
      throw new Error('Registration not finished');
    }
    const target = {
      participantId: message.participantId,
      name: message.name,
      peerConnection: undefined,
      audioStream: undefined
    };
    this.targets.set(message.participantId, target);
    this.targetArray.push(target);
    if (this.participantId < message.participantId) {
      console.log('I will invite the other one.');
      this.invite(message.participantId);
    } else {
      console.log('The other one has to invite me.');
    }
  }


  handleNewICECandidateMsg(msg) {
    console.log('handleNewICECandidateMsg', msg);
    const candidate = new RTCIceCandidate(msg.candidate);
    this.targets.get(msg.sender).peerConnection.addIceCandidate(candidate);
  }


  handleParticipantLeavedMsg(msg) {
    console.log('handleParticipantLeavedMsg', msg);
    this.closeVideoCall(this.targets.get(msg.participantId));
  }


  handleParticipantNameChangedMsg(msg) {
    console.log('handleParticipantNameChangedMsg', msg);
    this.targets.get(msg.participantId).name = msg.name;
  }


  handleRegistrationSuccessful(message) {
    this.participantId = message.participantId;
    this.currentState = clientStates.READY;
  }


  async handleVideoOfferMsg(msg) {
    console.log('handleVideoOfferMsg', msg);

    const peerConnection = this.createPeerConnection(this.targets.get(msg.sender));
    const desc = new RTCSessionDescription(msg.sdp);
    await peerConnection.setRemoteDescription(desc);
    await peerConnection.addStream(this.localStream);
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    const newMsg = {
      target: msg.sender,
      type: 'video-answer',
      sdp: peerConnection.localDescription
    };
    this.sendToServer(newMsg);
  }


  handleVideoAnswerMsg(msg) {
    console.log('handleVideoAnswerMsg', msg);
    const desc = new RTCSessionDescription(msg.sdp);
    this.targets.get(msg.sender).peerConnection.setRemoteDescription(desc);
  }


  async invite(participantId) {
    const peerConnection = await this.createPeerConnection(this.targets.get(participantId));
    peerConnection.addStream(this.localStream);
  }


  nameChanged(event) {
    console.log('Name changed to', event.target.value);
    this.sendToServer({
      type: 'change-name',
      name: event.target.value
    });
  }


  handleRoomNotAvailableMsg(message) {
    this.router.navigateByUrl('/');
  }


  sendToServer(msg) {
    msg.room = this.roomId;
    const msgJSON = JSON.stringify(msg);
    this.socket.send(msgJSON);
  }


  setMessageHandlers() {
    this.socket.addEventListener('message', (event) => {
      const message = JSON.parse(event.data);
      switch (message.type) {
        case 'new-ice-candidate':
          this.handleNewICECandidateMsg(message);
          break;
        case 'video-offer':
          this.handleVideoOfferMsg(message);
          break;
        case 'video-answer':
          this.handleVideoAnswerMsg(message);
          break;
        case 'registration-successful':
          this.handleRegistrationSuccessful(message);
          break;
        case 'room-not-available':
          this.handleRoomNotAvailableMsg(message);
          break;
        case 'participant-joined':
          this.handleNewParticipantMsg(message);
          break;
        case 'participant-leaved':
          this.handleParticipantLeavedMsg(message);
          break;
        case 'participant-name-changed':
          this.handleParticipantNameChangedMsg(message);
          break;
        default:
          console.error('Unknown message received', message);
      }
    });
  }
}


function handleAddStreamEvent(event) {
  console.log('handleAddStreamEvent', event);
  this.target.audioStream = event.stream;
  (<HTMLMediaElement> document.getElementById('stream-' + this.target.participantId)).srcObject = event.stream;
}


function handleICECandidateEvent(event) {
  console.log('handleICECandidateEvent', event);
  if (event.candidate) {
    this.current.sendToServer({
      type: 'new-ice-candidate',
      target: this.targetParticipantId,
      candidate: event.candidate
    });
  }
}


function handleICEConnectionStateChangeEvent(event) {
  console.log('handleICEConnectionStateChangeEvent', event);
  switch (this.target.peerConnection.iceConnectionState) {
    case 'closed':
    case 'failed':
    case 'disconnected':
      this.current.closeVideoCall(this.target);
      break;
  }
}


async function handleNegotiationNeededEvent() {
  console.log('handleNegotiationNeededEvent');
  try {
    const offer = await this.target.peerConnection.createOffer();
    await this.target.peerConnection.setLocalDescription(offer);
    await this.current.sendToServer({
      target: this.targetParticipantId,
      type: 'video-offer',
      sdp: this.target.peerConnection.localDescription
    });
  } catch (error) {
    console.error(error);
  }
}


function handleICEGatheringStateChangeEvent(event) {
  console.log('handleICEGatheringStateChangeEvent', event);
}


function handleRemoveStreamEvent(event) {
  console.log('handleRemoveStreamEvent', event);
  this.current.closeVideoCall(this.target);
}


function handleSignalingStateChangeEvent(event) {
  console.log('handleSignalingStateChangeEvent', event);
  switch (this.target.peerConnection.signalingState) {
    case 'closed':
      this.current.closeVideoCall(this.target);
      break;
  }
}
