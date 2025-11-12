import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Employee {
  id: number;
  login: string;
  full_name: string;
  role: string;
  created_at: string;
}

export default function EmployeeManagement() {
  const USERS_API = '/api/users';
  
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState({
    login: '',
    password: '',
    full_name: '',
    role: 'worker'
  });

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    setLoading(true);
    try {
      const response = await fetch(USERS_API);
      const data = await response.json();
      setEmployees(data.filter((u: Employee) => u.role !== 'admin') || []);
    } catch (error) {
      toast.error('Ошибка загрузки сотрудников');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.login || !formData.full_name) {
      toast.error('Заполните все обязательные поля');
      return;
    }

    if (!editingEmployee && !formData.password) {
      toast.error('Укажите пароль для нового сотрудника');
      return;
    }

    setLoading(true);
    try {
      const payload = editingEmployee 
        ? { id: editingEmployee.id, ...formData }
        : formData;

      const response = await fetch(USERS_API, {
        method: editingEmployee ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        toast.success(editingEmployee ? 'Сотрудник обновлен' : 'Сотрудник добавлен');
        setDialogOpen(false);
        resetForm();
        loadEmployees();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Ошибка сохранения');
      }
    } catch (error) {
      toast.error('Ошибка сервера');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить сотрудника?')) return;

    try {
      const response = await fetch(USERS_API, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });

      if (response.ok) {
        toast.success('Сотрудник удален');
        loadEmployees();
      } else {
        toast.error('Ошибка удаления');
      }
    } catch (error) {
      toast.error('Ошибка сервера');
    }
  };

  const openEditDialog = (employee: Employee) => {
    setEditingEmployee(employee);
    setFormData({
      login: employee.login,
      password: '',
      full_name: employee.full_name,
      role: employee.role
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditingEmployee(null);
    setFormData({
      login: '',
      password: '',
      full_name: '',
      role: 'worker'
    });
  };

  const getRoleName = (role: string) => {
    switch (role) {
      case 'admin': return 'Администратор';
      case 'supervisor': return 'Начальник';
      case 'manager': return 'Руководитель';
      case 'worker': return 'Работник';
      default: return role;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-500';
      case 'supervisor': return 'bg-blue-500';
      case 'manager': return 'bg-green-500';
      case 'worker': return 'bg-gray-500';
      default: return 'bg-gray-400';
    }
  };

  return (
    <TabsContent value="employees" className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Управление сотрудниками</CardTitle>
              <CardDescription>Добавление, редактирование и удаление учетных записей</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={loadEmployees} disabled={loading}>
                <Icon name="RefreshCw" size={14} className={cn(loading && 'animate-spin')} />
              </Button>
              <Dialog open={dialogOpen} onOpenChange={(open) => {
                setDialogOpen(open);
                if (!open) resetForm();
              }}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Icon name="UserPlus" size={14} className="mr-2" />
                    Добавить сотрудника
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {editingEmployee ? 'Редактировать сотрудника' : 'Новый сотрудник'}
                    </DialogTitle>
                    <DialogDescription>
                      {editingEmployee ? 'Измените данные сотрудника' : 'Создайте учетную запись для нового сотрудника'}
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="full_name">ФИО *</Label>
                      <Input
                        id="full_name"
                        value={formData.full_name}
                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                        placeholder="Иванов Иван Иванович"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="role">Должность *</Label>
                      <Select
                        value={formData.role}
                        onValueChange={(value) => setFormData({ ...formData, role: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="worker">Работник</SelectItem>
                          <SelectItem value="manager">Руководитель</SelectItem>
                          <SelectItem value="supervisor">Начальник</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="login">Логин *</Label>
                      <Input
                        id="login"
                        value={formData.login}
                        onChange={(e) => setFormData({ ...formData, login: e.target.value })}
                        placeholder="ivanov"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password">
                        Пароль {editingEmployee ? '(оставьте пустым, чтобы не менять)' : '*'}
                      </Label>
                      <Input
                        id="password"
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder="••••••••"
                        required={!editingEmployee}
                      />
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button type="submit" className="flex-1" disabled={loading}>
                        {loading ? 'Сохранение...' : editingEmployee ? 'Сохранить' : 'Создать'}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setDialogOpen(false);
                          resetForm();
                        }}
                      >
                        Отмена
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading && employees.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Icon name="Loader2" size={32} className="animate-spin mx-auto mb-2" />
              Загрузка...
            </div>
          ) : employees.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Icon name="Users" size={48} className="mx-auto mb-2 opacity-20" />
              <p>Нет сотрудников</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {employees.map((employee) => (
                <Card key={employee.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-base">{employee.full_name}</CardTitle>
                        <Badge className={cn('text-white mt-2', getRoleColor(employee.role))}>
                          {getRoleName(employee.role)}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Icon name="User" size={14} />
                      <span className="font-mono">{employee.login}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Icon name="Calendar" size={14} />
                      <span>{new Date(employee.created_at).toLocaleDateString('ru-RU')}</span>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => openEditDialog(employee)}
                      >
                        <Icon name="Edit" size={14} className="mr-1" />
                        Изменить
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(employee.id)}
                      >
                        <Icon name="Trash2" size={14} />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </TabsContent>
  );
}
