import { NgModule } from '@angular/core';
import { Routes, RouterModule, UrlSegment } from '@angular/router';
import { RoomEntranceComponent } from './room/room-entrance/room-entrance.component';
import { RoomModule } from './room/room.module';
import { RoomComponent } from './room/room/room.component';
import { ListenerRoomComponent } from './room/listener-room/listener-room.component';


export const routes: Routes = [
  { path: '', component: RoomEntranceComponent },
  { path: 'rooms/:rid/cast', component: RoomComponent },
  { path: 'rooms/:rid', component: ListenerRoomComponent },
  { path: '**', component: RoomEntranceComponent }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes),
    RoomModule
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
