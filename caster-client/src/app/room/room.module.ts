import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RoomEntranceComponent } from './room-entrance/room-entrance.component';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { RoomDataService } from './room-data.service';
import { RoomComponent } from './room/room.component';
import {SignalingService} from './signaling.service';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    RouterModule
  ],
  declarations: [RoomEntranceComponent, RoomComponent],
  providers: [
    RoomDataService,
    SignalingService
  ]
})
export class RoomModule { }
