import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RoomEntranceComponent } from './room-entrance/room-entrance.component';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { RoomDataService } from './room-data.service';
import { RoomComponent } from './room/room.component';
import { MdButtonModule, MdInputModule } from '@angular/material';
import { ListenerRoomComponent } from './listener-room/listener-room.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MdButtonModule,
    MdInputModule
  ],
  declarations: [
    RoomEntranceComponent,
    RoomComponent,
    ListenerRoomComponent
  ],
  providers: [
    RoomDataService
  ]
})
export class RoomModule {
}
