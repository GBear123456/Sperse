import { Injectable } from '@angular/core';

export interface Notification {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notifications: Notification[] = [];

  show(notification: Notification) {
    this.notifications.push(notification);
    
    // Auto-remove after duration (default: 5000ms)
    const duration = notification.duration || 5000;
    setTimeout(() => {
      this.remove(notification);
    }, duration);
  }

  success(message: string, duration?: number) {
    this.show({ message, type: 'success', duration });
  }

  error(message: string, duration?: number) {
    this.show({ message, type: 'error', duration });
  }

  warning(message: string, duration?: number) {
    this.show({ message, type: 'warning', duration });
  }

  info(message: string, duration?: number) {
    this.show({ message, type: 'info', duration });
  }

  remove(notification: Notification) {
    const index = this.notifications.indexOf(notification);
    if (index > -1) {
      this.notifications.splice(index, 1);
    }
  }

  getNotifications(): Notification[] {
    return [...this.notifications];
  }

  clear() {
    this.notifications = [];
  }
}
