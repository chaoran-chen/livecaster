import {ElementRef, Injectable, ViewChild} from '@angular/core';
import {environment} from '../../environments/environment';

/**
 * Based on https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Signaling_and_video_calling
 */
@Injectable()
export class SignalingService {

  private receivedAudio: ElementRef;
  private socket: WebSocket;
  private myPeerConnection: RTCPeerConnection;
  private username: string;
  private targetUsername: string;
  private roomId;
  private localStream: MediaStream;


  static getUrl(): string {
    let host;
    if (environment.production) {
      host = window.location.host;
    } else {
      host = environment.nodeServerHost;
    }
    return `wss://${host}/signaling`;
  }


  constructor() {
    this.handleICECandidateEvent = this.handleICECandidateEvent.bind(this);
    this.handleAddStreamEvent = this.handleAddStreamEvent.bind(this);
    this.handleRemoveStreamEvent = this.handleRemoveStreamEvent.bind(this);
    this.handleICEConnectionStateChangeEvent = this.handleICEConnectionStateChangeEvent.bind(this);
    this.handleICEGatheringStateChangeEvent = this.handleICEGatheringStateChangeEvent.bind(this);
    this.handleSignalingStateChangeEvent = this.handleSignalingStateChangeEvent.bind(this);
    this.handleNegotiationNeededEvent = this.handleNegotiationNeededEvent.bind(this);
  }


  init(username: string, audioElement: ElementRef, roomId, localStream) {
    this.localStream = localStream;
    this.socket = new WebSocket(SignalingService.getUrl());
    this.socket.addEventListener('message', (event) => {
      const message = JSON.parse(event.data);
      switch (message.type) {
        case 'new-ice-candidate':
          this.handleNewICECandidateMsg(message);
          break;
        case 'video-offer':
          this.handleVideoOfferMsg(message);
          break;
        case 'new-participant':
          this.handleNewParticipantMsg(message);
          break;
        case 'video-answer':
          this.handleVideoAnswerMsg(message);
          break;
        default:
          console.error('Unknown message received', message);
      }
    });

    this.socket.addEventListener('open', () => {
      this.username = username;
      this.receivedAudio = audioElement;
      this.roomId = roomId;
      this.sendToServer({
        type: 'ready-to-call',
        username,
        room: this.roomId
      });
    });
  }


  closeVideoCall() {
    console.log('closeVideoCall');
    const receivedAudio = this.receivedAudio.nativeElement;

    if (this.myPeerConnection) {
      if (receivedAudio.srcObject) {
        receivedAudio.srcObject.getTracks().forEach(track => track.stop());
        receivedAudio.srcObject = null;
      }

      this.myPeerConnection.close();
      this.myPeerConnection = null;
    }

    this.targetUsername = null;
  }


  async createPeerConnection() {
    console.log('createPeerConnection');
    this.myPeerConnection = new RTCPeerConnection({
      iceServers: [
        {
          urls: [
            'stun:stun.l.google.com:19302',
            'stun:stun1.l.google.com:19302',
            'stun:stun2.l.google.com:19302',
            'stun:stun3.l.google.com:19302',
            'stun:stun4.l.google.com:19302'
          ]
        }
      ]
    });

    this.myPeerConnection.onicecandidate = this.handleICECandidateEvent;
    this.myPeerConnection.onaddstream = this.handleAddStreamEvent;
    this.myPeerConnection.onremovestream = this.handleRemoveStreamEvent;
    this.myPeerConnection.oniceconnectionstatechange = this.handleICEConnectionStateChangeEvent;
    this.myPeerConnection.onicegatheringstatechange = this.handleICEGatheringStateChangeEvent;
    this.myPeerConnection.onsignalingstatechange = this.handleSignalingStateChangeEvent;
    this.myPeerConnection.onnegotiationneeded = this.handleNegotiationNeededEvent;
  }


  handleAddStreamEvent(event) {
    console.log('handleAddStreamEvent', event);
    this.receivedAudio.nativeElement.srcObject = event.stream;
  }


  handleICECandidateEvent(event) {
    console.log('handleICECandidateEvent', event);
    if (event.candidate) {
      this.sendToServer({
        type: 'new-ice-candidate',
        target: this.targetUsername,
        candidate: event.candidate
      });
    }
  }


  handleICEConnectionStateChangeEvent(event) {
    console.log('handleICEConnectionStateChangeEvent', event);
    switch (this.myPeerConnection.iceConnectionState) {
      case 'closed':
      case 'failed':
      case 'disconnected':
        this.closeVideoCall();
        break;
    }
  }


  handleNewParticipantMsg(message) {
    // At the beginning, only calls between two persons are possible.
    if (!this.targetUsername && this.username < message.targetUsername) {
      console.log('I will invite the other one.');
      this.targetUsername = message.targetUsername;
      this.invite();
    } else {
      console.log('The other one has to invite me.');
    }
  }


  handleNegotiationNeededEvent() {
    console.log('handleNegotiationNeededEvent');
    this.myPeerConnection.createOffer().then((offer) => {
      return this.myPeerConnection.setLocalDescription(offer);
    })
      .then(() => {
        this.sendToServer({
          name: this.username,
          target: this.targetUsername,
          type: 'video-offer',
          sdp: this.myPeerConnection.localDescription
        });
      })
      .catch(this.reportError);
  }


  handleNewICECandidateMsg(msg) {
    console.log('handleNewICECandidateMsg', msg);
    const candidate = new RTCIceCandidate(msg.candidate);
    this.myPeerConnection.addIceCandidate(candidate)
      .catch(this.reportError);
  }


  handleICEGatheringStateChangeEvent(event) {
    console.log('handleICEGatheringStateChangeEvent', event);
    // Our sample just logs information to console here,
    // but you can do whatever you need.
  }


  handleRemoveStreamEvent(event) {
    console.log('handleRemoveStreamEvent', event);
    this.closeVideoCall();
  }


  handleSignalingStateChangeEvent(event) {
    console.log('handleSignalingStateChangeEvent', event);
    switch (this.myPeerConnection.signalingState) {
      case 'closed':
        this.closeVideoCall();
        break;
    }
  }


  async handleVideoOfferMsg(msg) {
    console.log('handleVideoOfferMsg', msg);

    this.targetUsername = msg.name;

    await this.createPeerConnection();

    const desc = new RTCSessionDescription(msg.sdp);

    await this.myPeerConnection.setRemoteDescription(desc);

    await this.myPeerConnection.addStream(this.localStream);
    const answer = await this.myPeerConnection.createAnswer();
    await this.myPeerConnection.setLocalDescription(answer);
    const newMsg = {
      name: this.username,
      target: this.targetUsername,
      type: 'video-answer',
      sdp: this.myPeerConnection.localDescription
    };
    this.sendToServer(newMsg);
  }


  // TODO
  hangUpCall() {
    this.closeVideoCall();
    this.sendToServer({
      name: this.username,
      target: this.targetUsername,
      type: 'hang-up'
    });
  }


  handleVideoAnswerMsg(msg) {
    console.log('handleVideoAnswerMsg', msg);
    const desc = new RTCSessionDescription(msg.sdp);
    this.myPeerConnection.setRemoteDescription(desc).catch(this.reportError);
  }


  async invite() {
    await this.createPeerConnection();
    this.myPeerConnection.addStream(this.localStream);
  }


  reportError(err) {
    console.error(err);
  }


  sendToServer(msg) {
    msg.username = this.username;
    msg.room = this.roomId;
    const msgJSON = JSON.stringify(msg);
    this.socket.send(msgJSON);
  }

}
