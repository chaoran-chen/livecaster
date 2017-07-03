import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {RoomDataService} from '../room-data.service';
import {Router} from '@angular/router';

@Component({
  selector: 'app-room-entrance',
  templateUrl: './room-entrance.component.html',
  styleUrls: ['./room-entrance.component.scss']
})
export class RoomEntranceComponent {

  constructor(private roomDataService: RoomDataService, private router: Router) { }


  async createRoom() {
    const created = await this.roomDataService.createRoom();
    this.router.navigateByUrl(`/rooms/${created.id}`);
  }
}
