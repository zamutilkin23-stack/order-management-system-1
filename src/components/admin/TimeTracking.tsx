import { useState, useEffect } from 'react';
import { TabsContent } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const SCHEDULE_API = 'https://functions.poehali.dev/f617714b-d72a-41e1-87ec-519f6dff2f28';

interface TimesheetEmployee {
  id: number;
  full_name: string;
}

interface DayRecord {
  hours: number;
  record_id: number | null;
}

interface UserTimesheet {
  employee_id: number;
  full_name: string;
  days: Record<string, DayRecord>;
}

interface TimeTrackingProps {
  userRole: string;
}

export default function TimeTracking({ userRole }: TimeTrackingProps) {
  const [employees, setEmployees] = useState<TimesheetEmployee[]>([]);
  const [timesheet, setTimesheet] = useState<UserTimesheet[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newEmployeeName, setNewEmployeeName] = useState('');
  
  const canEdit = userRole === 'admin' || userRole === 'manager' || userRole === 'worker';
  const isReadOnly = !canEdit;

  useEffect(() => {
    loadEmployees();
  }, []);

  useEffect(() => {
    if (employees.length > 0) {
      loadTimesheet();
    }
  }, [selectedMonth, selectedYear, employees]);

  const loadEmployees = async () => {
    try {
      const response = await fetch(`${SCHEDULE_API}?type=employees`);
      const data = await response.json();
      setEmployees(data);
    } catch (error) {
      toast.error('Ошибка загрузки сотрудников');
    }
  };

  const loadTimesheet = async () => {
    setLoading(true);
    try {
      const empIds = employees.map(e => e.id).join(',');
      const response = await fetch(`${SCHEDULE_API}?month=${selectedMonth}&year=${selectedYear}&employee_ids=${empIds}`);
      const data = await response.json();
      setTimesheet(data);
    } catch (error) {
      toast.error('Ошибка загрузки табеля');
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = () => {
    return new Date(selectedYear, selectedMonth, 0).getDate();
  };

  const addEmployee = async () => {
    if (!newEmployeeName.trim()) {
      toast.error('Введите ФИО');
      return;
    }
    
    try {
      const response = await fetch(SCHEDULE_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'employee', full_name: newEmployeeName })
      });
      
      if (response.ok) {
        toast.success('Сотрудник добавлен');
        setNewEmployeeName('');
        setShowAddDialog(false);
        loadEmployees();
      }
    } catch (error) {
      toast.error('Ошибка');
    }
  };
  
  const deleteEmployee = async (id: number) => {
    if (!confirm('Удалить сотрудника из списка?')) return;
    
    try {
      const response = await fetch(`${SCHEDULE_API}?type=employee&id=${id}`, { method: 'DELETE' });
      if (response.ok) {
        toast.success('Сотрудник удален');
        loadEmployees();
      }
    } catch (error) {
      toast.error('Ошибка');
    }
  };

  const handleHoursChange = async (employeeId: number, dateStr: string, hours: string) => {
    if (isReadOnly) {
      toast.error('Только просмотр');
      return;
    }
    
    const hoursNum = parseFloat(hours) || 0;
    
    try {
      const response = await fetch(SCHEDULE_API, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_id: employeeId,
          work_date: dateStr,
          hours: hoursNum
        })
      });

      if (response.ok) {
        await loadTimesheet();
        toast.success('Сохранено', { duration: 1000 });
      } else {
        toast.error('Ошибка обновления');
      }
    } catch (error) {
      toast.error('Ошибка сервера');
    }
  };

  const handleFillMonth = async (employeeId: number) => {
    if (isReadOnly) return;
    
    const daysInMonth = getDaysInMonth();
    const promises = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayOfWeek = new Date(dateStr).getDay();
      
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        promises.push(
          fetch(SCHEDULE_API, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              employee_id: employeeId,
              work_date: dateStr,
              hours: 8
            })
          })
        );
      }
    }

    try {
      setLoading(true);
      await Promise.all(promises);
      toast.success('Месяц заполнен');
      loadTimesheet();
    } catch (error) {
      toast.error('Ошибка заполнения');
    } finally {
      setLoading(false);
    }
  };

  const handleClearMonth = async (employeeId: number) => {
    if (isReadOnly) return;
    if (!window.confirm('Удалить все часы за месяц?')) return;

    const daysInMonth = getDaysInMonth();
    const promises = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      promises.push(
        fetch(SCHEDULE_API, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            employee_id: employeeId,
            work_date: dateStr,
            hours: 0
          })
        })
      );
    }

    try {
      setLoading(true);
      await Promise.all(promises);
      toast.success('Часы очищены');
      loadTimesheet();
    } catch (error) {
      toast.error('Ошибка очистки');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    const daysInMonth = getDaysInMonth();
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    let html = `
      <html>
        <head>
          <title>Табель ${selectedMonth}.${selectedYear}</title>
          <style>
            body { font-family: Arial; font-size: 10px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #000; padding: 4px; text-align: center; }
            th { background: #f0f0f0; font-weight: bold; }
            .name { text-align: left; min-width: 150px; }
            .total { font-weight: bold; background: #f9f9f9; }
          </style>
        </head>
        <body>
          <h2>Табель учета рабочего времени - ${selectedMonth}.${selectedYear}</h2>
          <table>
            <tr>
              <th class="name">ФИО</th>
              ${days.map(d => `<th>${d}</th>`).join('')}
              <th>Итого</th>
            </tr>
    `;

    timesheet.forEach(user => {
      let totalHours = 0;
      html += `<tr><td class="name">${user.full_name}</td>`;

      days.forEach(day => {
        const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const record = user.days[dateStr];
        const hours = record?.hours || 0;
        totalHours += hours;
        html += `<td>${hours > 0 ? hours : '-'}</td>`;
      });

      html += `<td class="total">${totalHours}</td></tr>`;
    });

    html += `</table></body></html>`;

    const printWindow = window.open('', '', 'width=1200,height=800');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const daysInMonth = getDaysInMonth();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <TabsContent value="timetracking" className="space-y-4">
      <Card>
        <div className="border-b p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Табель учета рабочего времени</h2>
              <p className="text-sm text-gray-600 mt-1">
                {isReadOnly ? (
                  'Только просмотр'
                ) : (
                  <span className="flex items-center gap-2">
                    <Icon name="Save" size={14} className="text-green-600" />
                    Автосохранение при вводе · Добавление/удаление сотрудников
                  </span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Select value={String(selectedMonth)} onValueChange={(v) => setSelectedMonth(Number(v))}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'].map((m, i) => (
                    <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(Number(v))}>
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[2024, 2025, 2026].map(y => (
                    <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={loadTimesheet} disabled={loading} variant="outline">
                <Icon name="RefreshCw" size={16} className={cn('mr-2', loading && 'animate-spin')} />
                Обновить
              </Button>
              <Button onClick={handlePrint} variant="outline">
                <Icon name="Printer" size={16} className="mr-2" />
                Печать
              </Button>
              {!isReadOnly && (
                <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <Icon name="UserPlus" size={16} className="mr-2" />
                      Добавить
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Добавить сотрудника</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>ФИО</Label>
                        <Input value={newEmployeeName} onChange={(e) => setNewEmployeeName(e.target.value)} />
                      </div>
                      <Button onClick={addEmployee} className="w-full">Добавить</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
        </div>
        <CardContent className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border p-2 text-left min-w-[200px] sticky left-0 bg-gray-50 z-10">ФИО</th>
                  {days.map(day => {
                    const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const dayOfWeek = new Date(dateStr).getDay();
                    return (
                      <th key={day} className={cn('border p-1 text-xs min-w-[50px]', (dayOfWeek === 0 || dayOfWeek === 6) && 'bg-red-50')}>
                        {day}
                      </th>
                    );
                  })}
                  <th className="border p-2 text-center font-bold">Итого</th>
                  {!isReadOnly && <th className="border p-2 text-center">Действия</th>}
                </tr>
              </thead>
              <tbody>
                {timesheet.map(user => {
                  let totalHours = 0;
                  return (
                    <tr key={user.employee_id} className="hover:bg-gray-50">
                      <td className="border p-2 font-medium sticky left-0 bg-white z-10">
                        {user.full_name}
                      </td>
                      {days.map(day => {
                        const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                        const record = user.days[dateStr];
                        const hours = record?.hours || 0;
                        const dayOfWeek = new Date(dateStr).getDay();
                        totalHours += hours;
                        
                        return (
                          <td key={day} className={cn('border p-0', (dayOfWeek === 0 || dayOfWeek === 6) && 'bg-red-50')}>
                            <Input
                              type="number"
                              value={hours || ''}
                              onChange={(e) => handleHoursChange(user.employee_id, dateStr, e.target.value)}
                              className="border-0 text-center p-1 h-8 text-sm"
                              disabled={isReadOnly}
                            />
                          </td>
                        );
                      })}
                      <td className="border p-2 text-center font-bold">{totalHours}</td>
                      {!isReadOnly && (
                        <td className="border p-2">
                          <div className="flex gap-1 justify-center">
                            <Button size="sm" variant="outline" onClick={() => handleFillMonth(user.employee_id)} title="Заполнить месяц">
                              <Icon name="CalendarCheck" size={14} />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleClearMonth(user.employee_id)} title="Очистить месяц">
                              <Icon name="X" size={14} />
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => deleteEmployee(user.employee_id)} title="Удалить сотрудника">
                              <Icon name="Trash2" size={14} />
                            </Button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );
}