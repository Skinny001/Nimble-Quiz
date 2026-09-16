'use client'

import { Bell, Check, X, Banknote, Play, Trophy, Coins } from 'lucide-react'

interface NotificationsPanelProps {
  notifications: any[];
  onClose: () => void;
  onMarkAllRead: () => void;
}

const renderNotificationIcon = (type: string) => {
  switch (type) {
    case 'PAYOUT':
      return <Banknote className="size-5 shrink-0" style={{ color: '#21BCA5' }} />
    case 'ROUND_START':
      return <Play className="size-5 shrink-0" style={{ color: '#E9B213' }} />
    case 'ROUND_END':
      return <Trophy className="size-5 shrink-0" style={{ color: '#E9B213' }} />
    case 'STAKE':
      return <Coins className="size-5 shrink-0" style={{ color: '#EC991C' }} />
    default:
      return <Bell className="size-5 shrink-0" style={{ color: '#8B8FAD' }} />
  }
}

export default function NotificationsPanel({ notifications, onClose, onMarkAllRead }: NotificationsPanelProps) {
  const unreadCount = notifications.filter(n => !n.isRead).length

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      style={{ background: 'rgba(13,15,31,0.7)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      {/* Drawer */}
      <div
        className="fixed inset-y-0 right-0 w-full sm:w-[380px] overflow-y-auto flex flex-col animate-in slide-in-from-right duration-300"
        style={{ background: '#13152A', borderLeft: '1px solid #2F3355' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between px-5 py-4" style={{ background: 'rgba(19,21,42,0.95)', borderBottom: '1px solid #2F3355', backdropFilter: 'blur(8px)' }}>
          <div className="flex items-center gap-2.5">
            <Bell className="size-5" style={{ color: '#E9B213' }} />
            <h2 className="text-base font-bold">Notifications</h2>
            {unreadCount > 0 && (
              <span className="flex size-5 items-center justify-center rounded-full text-[10px] font-bold"
                style={{ background: '#E9B213', color: '#0D0F1F' }}>{unreadCount}</span>
            )}
          </div>
          <button onClick={onClose} className="flex size-8 items-center justify-center rounded-full transition-colors"
            style={{ background: '#252847' }}>
            <X className="size-4" style={{ color: '#8B8FAD' }} />
          </button>
        </div>

        {/* Mark all read */}
        {unreadCount > 0 && (
          <div className="px-5 pt-4">
            <button
              onClick={onMarkAllRead}
              className="flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all"
              style={{ background: 'rgba(33,188,165,0.1)', border: '1px solid rgba(33,188,165,0.25)', color: '#21BCA5' }}
            >
              <Check className="size-3.5" /> Mark all as read
            </button>
          </div>
        )}

        {/* List */}
        <div className="flex flex-col gap-2 p-5">
          {notifications.length === 0 ? (
            <div className="py-16 text-center">
              <Bell className="mx-auto mb-3 size-8" style={{ color: '#2F3355' }} />
              <p className="text-sm" style={{ color: '#8B8FAD' }}>No notifications yet.</p>
            </div>
          ) : notifications.map(n => (
            <div
              key={n.id}
              className="rounded-2xl p-4"
              style={{
                background: n.isRead ? '#1A1D35' : 'rgba(233,178,19,0.06)',
                border: n.isRead ? '1px solid #2F3355' : '1px solid rgba(233,178,19,0.2)',
              }}
            >
              <div className="flex items-start gap-3">
                <div className="flex size-9 items-center justify-center rounded-xl" style={{ background: '#252847' }}>
                  {renderNotificationIcon(n.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold" style={{ color: n.isRead ? '#8B8FAD' : '#F0F2FF' }}>{n.title}</h4>
                  <p className="mt-0.5 text-xs leading-relaxed" style={{ color: '#8B8FAD' }}>{n.message}</p>
                  <span className="mt-2 block text-[10px]" style={{ color: '#2F3355' }}>
                    {new Date(n.createdAt).toLocaleString()}
                  </span>
                </div>
                {!n.isRead && (
                  <span className="mt-1 size-2 shrink-0 rounded-full" style={{ background: '#E9B213' }} />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
