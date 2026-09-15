'use client'

import { Bell, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface NotificationsPanelProps {
  notifications: any[];
  onClose: () => void;
  onMarkAllRead: () => void;
}

export default function NotificationsPanel({ notifications, onClose, onMarkAllRead }: NotificationsPanelProps) {
  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-background/80 backdrop-blur-sm sm:bg-transparent sm:backdrop-blur-none">
      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 w-full sm:w-[400px] bg-card border-l shadow-2xl p-6 overflow-y-auto flex flex-col animate-in slide-in-from-right duration-300">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Bell className="size-5" />
            <h2 className="text-xl font-semibold">Notifications</h2>
            {unreadCount > 0 && (
              <span className="flex size-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                {unreadCount}
              </span>
            )}
          </div>
          <button onClick={onClose} className="p-2 hover:bg-secondary rounded-full transition-colors">
            <X className="size-5 text-muted-foreground" />
          </button>
        </div>

        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={onMarkAllRead} className="mb-4 self-start">
            <Check className="size-4 mr-2" /> Mark all as read
          </Button>
        )}

        <div className="flex flex-col gap-3">
          {notifications.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No notifications yet.</p>
          ) : (
            notifications.map(n => (
              <div key={n.id} className={`p-4 rounded-xl border ${n.isRead ? 'bg-background/50 border-border/50' : 'bg-secondary border-primary/20 shadow-sm'}`}>
                <h4 className={`text-sm font-semibold mb-1 ${n.isRead ? 'text-muted-foreground' : 'text-foreground'}`}>
                  {n.title}
                </h4>
                <p className="text-sm text-muted-foreground">{n.message}</p>
                <span className="text-[10px] text-muted-foreground/60 mt-2 block">
                  {new Date(n.createdAt).toLocaleString()}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
