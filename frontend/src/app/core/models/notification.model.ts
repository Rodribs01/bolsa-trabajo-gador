export interface AppNotification {
  id: number;
  type: string;
  title: string;
  message: string;
  link: string | null;
  read: boolean;
  createdAt: string;
}

export interface NotificationPage {
  items: AppNotification[];
  total: number;
  page: number;
  limit: number;
  unreadCount: number;
}
