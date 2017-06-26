import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {RoomDataService} from '../room-data.service';
import {Router} from '@angular/router';

@Component({
  selector: 'app-room-entrance',
  templateUrl: './room-entrance.component.html',
  styleUrls: ['./room-entrance.component.scss']
})
export class RoomEntranceComponent implements OnInit {

  @ViewChild('usernameField') usernameField: ElementRef;
  @ViewChild('roomNameField') roomNameField: ElementRef;

  availableRooms: Array<object>;


  constructor(private roomDataService: RoomDataService, private router: Router) { }


  async ngOnInit() {
    this.availableRooms = await this.roomDataService.getAllRooms();
  }


  async onCreateRoomSubmit() {
    const username = this.usernameField.nativeElement.value;
    const roomName = this.roomNameField.nativeElement.value;
    if (!username || !roomName) {
      return alert('Please fill out the fields.');
    }
    const created = await this.roomDataService.createRoom(roomName);
    this.gotoRoom(created.id);
  }


  gotoRoom(id) {
    const username = this.usernameField.nativeElement.value;
    if (!username) {
      return alert('Please enter a username');
    }
    this.router.navigateByUrl(`/rooms/${id}?username=${username}`);
  }
}
