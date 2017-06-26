import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { RoomEntranceComponent } from './room/room-entrance/room-entrance.component';
import { RoomModule } from './room/room.module';
import { RoomComponent } from './room/room/room.component';


const routes: Routes = [
  { path: '', component: RoomEntranceComponent },
  { path: 'rooms/:rid', component: RoomComponent },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes),
    RoomModule
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
