/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect, @next/next/no-img-element, react/no-unescaped-entities, @typescript-eslint/no-unused-vars, @typescript-eslint/ban-ts-comment */

"use client";

import { useState, useEffect } from "react";
import { X, Bell, Tag, ShoppingBag, Info, CheckCheck } from "lucide-react";
import { useNotificationStore } from "@/store/notificationStore";

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationsModal({ isOpen, onClose }: NotificationsModalProps) {
  const { notifications, markAsRead, markAllAsRead } = useNotificationStore();
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => setAnimateIn(true), 10);
      return () => clearTimeout(timer);
    } else {
      setAnimateIn(false);
    }
  }, [isOpen]);

  if (!isOpen && !animateIn) return null;

  const handleClose = () => {
    setAnimateIn(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'promo': return <Tag className="w-5 h-5 text-brand-500" />;
      case 'order': return <ShoppingBag className="w-5 h-5 text-blue-500" />;
      default: return <Info className="w-5 h-5 text-stone-500" />;
    }
  };

  const getBgColor = (type: string) => {
    switch (type) {
      case 'promo': return 'bg-brand-50';
      case 'order': return 'bg-blue-50';
      default: return 'bg-stone-100';
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div style={{ zIndex: 99999 }} className={`fixed inset-0 flex items-end justify-center ${isOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-stone-900/60 backdrop-blur-sm transition-opacity duration-300 ${animateIn ? 'opacity-100' : 'opacity-0'}`}
        onClick={handleClose}
      />

      {/* Bottom Sheet */}
      <div 
        className={`w-full bg-white rounded-t-[40px] shadow-2xl relative z-10 flex flex-col h-[85vh] transition-transform duration-300 ${animateIn ? 'translate-y-0' : 'translate-y-full'}`}
      >
        {/* Header Fixo */}
        <div className="flex items-center justify-between p-8 pb-4 border-b border-stone-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-50 rounded-full flex items-center justify-center">
              <Bell className="w-5 h-5 text-brand-500" />
            </div>
            <h2 className="text-xl font-bold text-stone-900">Notificações</h2>
          </div>
          <button 
            onClick={handleClose}
            className="w-10 h-10 bg-stone-100 rounded-full flex items-center justify-center text-stone-600 hover:bg-stone-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Lista de Notificações */}
        <div className="flex-1 overflow-y-auto p-6 pt-4 pb-24 hide-scrollbar">
          {unreadCount > 0 && (
            <div className="flex justify-between items-center mb-6">
              <span className="text-sm font-bold text-brand-500 bg-brand-50 px-3 py-1 rounded-full">
                {unreadCount} nova{unreadCount !== 1 && 's'}
              </span>
              <button 
                onClick={markAllAsRead}
                className="text-sm font-bold text-stone-400 flex items-center gap-1 hover:text-stone-600 transition-colors"
              >
                <CheckCheck className="w-4 h-4" />
                Marcar todas lidas
              </button>
            </div>
          )}

          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center">
              <Bell className="w-12 h-12 text-stone-200 mb-4" />
              <p className="text-stone-400 font-medium">Nenhuma notificação por enquanto.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {notifications.map((notification) => (
                <div 
                  key={notification.id}
                  onClick={() => markAsRead(notification.id)}
                  className={`relative flex gap-4 p-4 rounded-2xl border transition-all cursor-pointer active:scale-[0.98] ${notification.read ? 'border-stone-100 bg-white' : 'border-brand-100 bg-brand-50/30'}`}
                >
                  {!notification.read && (
                    <div className="absolute top-4 right-4 w-2.5 h-2.5 bg-brand-500 rounded-full" />
                  )}
                  
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${getBgColor(notification.type)}`}>
                    {getIcon(notification.type)}
                  </div>
                  
                  <div className="flex flex-col pr-6">
                    <span className="text-xs font-bold text-stone-400 mb-1">{notification.date}</span>
                    <h3 className={`font-bold text-base mb-1 ${notification.read ? 'text-stone-700' : 'text-stone-900'}`}>
                      {notification.title}
                    </h3>
                    <p className={`text-sm leading-relaxed ${notification.read ? 'text-stone-500' : 'text-stone-600 font-medium'}`}>
                      {notification.message}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
