import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {

    if (!this.authService.isLoggedIn()) {
        this.router.navigate(['/login']);
        return false;
    }

    const expectedRole = route.data['expectedRole'] as string;
    const userRole = this.authService.getRole();

    if (userRole === expectedRole) {
      return true;
    }

    this.router.navigate(['/dashboard']);
    return false;
  }
}
