import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';

const USERS_API = 'https://functions.poehali.dev/d545977b-a793-4d1c-bcd3-7a3687a7b0cd';

interface User {
  id: number;
  login: string;
  password: string;
  full_name: string;
  role: string;
  status: string;
}

export default function UsersManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    login: '',
    password: '',
    full_name: '',
    role: 'worker',
    status: 'active'
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await fetch(USERS_API);
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      toast.error('Ошибка загрузки пользователей');
    }
  };

  const handleSubmit = async () => {
    if (!formData.login || !formData.password || !formData.full_name) {
      toast.error('Заполните все поля');
      return;
    }

    setLoading(true);
    try {
      const url = editingUser ? USERS_API : USERS_API;
      const method = editingUser ? 'PUT' : 'POST';
      const body = editingUser ? { ...formData, id: editingUser.id } : formData;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        toast.success(editingUser ? 'Пользователь обновлен' : 'Пользователь создан');
        setDialogOpen(false);
        resetForm();
        loadUsers();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Ошибка');
      }
    } catch (error) {
      toast.error('Ошибка сервера');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      login: user.login,
      password: user.password,
      full_name: user.full_name,
      role: user.role,
      status: user.status
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить пользователя?')) return;

    try {
      const response = await fetch(`${USERS_API}?id=${id}`, { method: 'DELETE' });
      if (response.ok) {
        toast.success('Пользователь удален');
        loadUsers();
      }
    } catch (error) {
      toast.error('Ошибка удаления');
    }
  };

  const resetForm = () => {
    setFormData({ login: '', password: '', full_name: '', role: 'worker', status: 'active' });
    setEditingUser(null);
  };

  const getRoleText = (role: string) => {
    const roles: Record<string, string> = {
      admin: 'Администратор',
      manager: 'Руководитель',
      supervisor: 'Начальник',
      worker: 'Работник'
    };
    return roles[role] || role;
  };

  return (
    <TabsContent value="users" className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Управление пользователями</CardTitle>
              <CardDescription>Создание и редактирование учетных записей</CardDescription>
            </div>
            <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
              <DialogTrigger asChild>
                <Button>
                  <Icon name="Plus" size={16} className="mr-2" />
                  Добавить пользователя
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingUser ? 'Редактировать' : 'Новый'} пользователь</DialogTitle>
                  <DialogDescription>Заполните данные учетной записи</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Логин</Label>
                    <Input
                      value={formData.login}
                      onChange={(e) => setFormData({ ...formData, login: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Пароль</Label>
                    <Input
                      type="text"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>ФИО</Label>
                    <Input
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Должность</Label>
                    <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Администратор</SelectItem>
                        <SelectItem value="manager">Руководитель</SelectItem>
                        <SelectItem value="supervisor">Начальник</SelectItem>
                        <SelectItem value="worker">Работник</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Статус</Label>
                    <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Работает</SelectItem>
                        <SelectItem value="fired">Уволен</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleSubmit} className="w-full" disabled={loading}>
                    {loading ? 'Сохранение...' : 'Сохранить'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Логин</TableHead>
                <TableHead>Пароль</TableHead>
                <TableHead>ФИО</TableHead>
                <TableHead>Должность</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead className="text-right">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.login}</TableCell>
                  <TableCell className="font-mono text-xs">{user.password}</TableCell>
                  <TableCell>{user.full_name}</TableCell>
                  <TableCell>{getRoleText(user.role)}</TableCell>
                  <TableCell>
                    <Badge variant={user.status === 'active' ? 'default' : 'destructive'}>
                      {user.status === 'active' ? 'Работает' : 'Уволен'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(user)}>
                      <Icon name="Edit" size={14} />
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(user.id)}>
                      <Icon name="Trash2" size={14} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </TabsContent>
  );
}
