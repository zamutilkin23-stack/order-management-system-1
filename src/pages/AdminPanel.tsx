import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';
import UsersManagement from '@/components/admin/UsersManagement';
import SectionsManagement from '@/components/admin/SectionsManagement';
import ColorsManagement from '@/components/admin/ColorsManagement';
import MaterialsManagement from '@/components/admin/MaterialsManagement';
import TimeTracking from '@/components/admin/TimeTracking';

interface User {
  id: number;
  login: string;
  full_name: string;
  role: string;
}

interface AdminPanelProps {
  user: User;
  onLogout: () => void;
}

export default function AdminPanel({ user, onLogout }: AdminPanelProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
              <Icon name="Shield" size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Панель администратора</h1>
              <p className="text-sm text-gray-600">{user.full_name}</p>
            </div>
          </div>
          <Button variant="outline" onClick={onLogout}>
            <Icon name="LogOut" size={16} className="mr-2" />
            Выход
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="users">
              <Icon name="Users" size={16} className="mr-2" />
              Пользователи
            </TabsTrigger>
            <TabsTrigger value="sections">
              <Icon name="FolderTree" size={16} className="mr-2" />
              Разделы
            </TabsTrigger>
            <TabsTrigger value="colors">
              <Icon name="Palette" size={16} className="mr-2" />
              Цвета
            </TabsTrigger>
            <TabsTrigger value="materials">
              <Icon name="Package" size={16} className="mr-2" />
              Материалы
            </TabsTrigger>
            <TabsTrigger value="timetracking">
              <Icon name="Clock" size={16} className="mr-2" />
              Табель
            </TabsTrigger>
          </TabsList>

          <UsersManagement />
          <SectionsManagement />
          <ColorsManagement />
          <MaterialsManagement />
          <TimeTracking />
        </Tabs>
      </div>
    </div>
  );
}