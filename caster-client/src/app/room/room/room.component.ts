import { Component, OnInit } from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';


@Component({
  selector: 'app-room',
  templateUrl: './room.component.html',
  styleUrls: ['./room.component.scss']
})
export class RoomComponent implements OnInit {

  constructor(private route: ActivatedRoute, private router: Router) { }


  ngOnInit() {
    this.route.params.subscribe((pathParams) => {
      this.route.queryParams.subscribe((queryParams) => {
        const id = pathParams.rid;
        const username = queryParams.username;
        if (!username) {
          return this.router.navigateByUrl('/');
        }
        // Start doing the interesting stuff
      });
    });
  }

}
