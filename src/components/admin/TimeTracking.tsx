import { useState, useEffect } from 'react';
import { TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const SCHEDULE_API = 'https://functions.poehali.dev/f617714b-d72a-41e1-87ec-519f6dff2f28';
const USERS_API = 'https://functions.poehali.dev/cb1be1e9-7f80-4e10-8f1f-4327a0daae82';

interface User {
  id: number;
  full_name: string;
  fired_at: string | null;
}

interface DayRecord {
  hours: number;
  comment: string;
  record_id: number | null;
}

interface UserTimesheet {
  user_id: number;
  full_name: string;
  fired_at: string | null;
  days: Record<string, DayRecord>;
}

export default function TimeTracking() {
  const [users, setUsers] = useState<User[]>([]);
  const [timesheet, setTimesheet] = useState<UserTimesheet[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [selectedDays, setSelectedDays] = useState<Set<number>>(new Set());

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (users.length > 0) {
      loadTimesheet();
    }
  }, [selectedMonth, selectedYear, users]);

  const loadUsers = async () => {
    try {
      const response = await fetch(USERS_API);
      const data = await response.json();
      const workers = data.filter((u: any) => u.role === 'worker');
      setUsers(workers);
    } catch (error) {
      toast.error('Ошибка загрузки пользователей');
    }
  };

  const loadTimesheet = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${SCHEDULE_API}?month=${selectedMonth}&year=${selectedYear}`);
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

  const isDateBeforeFired = (dateStr: string, firedAt: string | null) => {
    if (!firedAt) return true;
    return new Date(dateStr) <= new Date(firedAt);
  };

  const handleHoursChange = async (userId: number, dateStr: string, hours: string, comment: string = '') => {
    const hoursNum = parseFloat(hours) || 0;
    
    try {
      const response = await fetch(SCHEDULE_API, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          work_date: dateStr,
          hours: hoursNum,
          comment
        })
      });

      if (response.ok) {
        loadTimesheet();
      } else {
        toast.error('Ошибка обновления');
      }
    } catch (error) {
      toast.error('Ошибка сервера');
    }
  };

  const handleFillWeek = async (userId: number, startDay: number) => {
    const promises = [];
    for (let i = 0; i < 5; i++) {
      const day = startDay + i;
      const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayOfWeek = new Date(dateStr).getDay();
      
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        promises.push(
          fetch(SCHEDULE_API, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_id: userId,
              work_date: dateStr,
              hours: 8,
              comment: ''
            })
          })
        );
      }
    }

    try {
      await Promise.all(promises);
      toast.success('Неделя заполнена');
      loadTimesheet();
    } catch (error) {
      toast.error('Ошибка заполнения');
    }
  };

  const handleFillMonth = async (userId: number) => {
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
              user_id: userId,
              work_date: dateStr,
              hours: 8,
              comment: ''
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

  const handleClearMonth = async (userId: number) => {
    const confirmed = window.confirm('Удалить все часы за месяц для этого сотрудника?');
    if (!confirmed) return;

    const daysInMonth = getDaysInMonth();
    const promises = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      promises.push(
        fetch(SCHEDULE_API, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: userId,
            work_date: dateStr,
            hours: 0,
            comment: ''
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

  const handleBulkEdit = async (userId: number) => {
    const hoursInput = window.prompt('Введите количество часов для всех будних дней месяца:');
    if (hoursInput === null) return;

    const hours = parseFloat(hoursInput);
    if (isNaN(hours) || hours < 0 || hours > 24) {
      toast.error('Введите корректное число от 0 до 24');
      return;
    }

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
              user_id: userId,
              work_date: dateStr,
              hours: hours,
              comment: ''
            })
          })
        );
      }
    }

    try {
      setLoading(true);
      await Promise.all(promises);
      toast.success(`Установлено ${hours} часов для всех будних дней`);
      loadTimesheet();
    } catch (error) {
      toast.error('Ошибка обновления');
    } finally {
      setLoading(false);
    }
  };

  const handleFillWeekRange = async (userId: number, startDay: number) => {
    const promises = [];
    for (let i = 0; i < 7; i++) {
      const day = startDay + i;
      if (day > getDaysInMonth()) break;
      
      const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayOfWeek = new Date(dateStr).getDay();
      
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        promises.push(
          fetch(SCHEDULE_API, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_id: userId,
              work_date: dateStr,
              hours: 8,
              comment: ''
            })
          })
        );
      }
    }

    try {
      await Promise.all(promises);
      toast.success('Неделя заполнена');
      loadTimesheet();
    } catch (error) {
      toast.error('Ошибка заполнения');
    }
  };

  const handleClearWeekRange = async (userId: number, startDay: number) => {
    const promises = [];
    for (let i = 0; i < 7; i++) {
      const day = startDay + i;
      if (day > getDaysInMonth()) break;
      
      const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      promises.push(
        fetch(SCHEDULE_API, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: userId,
            work_date: dateStr,
            hours: 0,
            comment: ''
          })
        })
      );
    }

    try {
      await Promise.all(promises);
      toast.success('Неделя очищена');
      loadTimesheet();
    } catch (error) {
      toast.error('Ошибка очистки');
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
        
        if (isDateBeforeFired(dateStr, user.fired_at)) {
          totalHours += hours;
          html += `<td>${hours > 0 ? hours : '-'}</td>`;
        } else {
          html += `<td style="background: #eee;">-</td>`;
        }
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
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Icon name="Clock" size={20} />
              Учет рабочего времени
            </CardTitle>
            <div className="flex items-center gap-2">
              <Select value={String(selectedMonth)} onValueChange={(v) => setSelectedMonth(Number(v))}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                    <SelectItem key={m} value={String(m)}>
                      {new Date(2000, m - 1).toLocaleString('ru', { month: 'long' })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(Number(v))}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[2024, 2025, 2026].map(y => (
                    <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={loadTimesheet} disabled={loading}>
                <Icon name="RefreshCw" size={16} className={cn(loading && 'animate-spin')} />
              </Button>
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Icon name="Printer" size={16} className="mr-2" />
                Печать
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-2">
              <Icon name="Info" size={16} className="text-blue-600 mt-0.5" />
              <div className="text-xs text-gray-700">
                <strong>Возможности табеля:</strong>
                <ul className="mt-1 space-y-1 ml-2">
                  <li>• Кнопки у каждого сотрудника: заполнить месяц (8ч), установить свои часы, очистить</li>
                  <li>• Быстрые действия для всех сотрудников по неделям ниже</li>
                  <li>• Выходные дни выделены серым фоном</li>
                </ul>
              </div>
            </div>
          </div>
          <div className="mb-3 flex gap-2 flex-wrap items-center">
            <div className="text-xs font-medium text-gray-700">Быстрые действия для всех:</div>
            {[1, 8, 15, 22].map(startDay => {
              const weekNum = Math.ceil(startDay / 7);
              return (
                <div key={startDay} className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => {
                      timesheet.forEach(user => handleFillWeekRange(user.user_id, startDay));
                    }}
                  >
                    Заполнить {weekNum} неделю
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs text-red-600"
                    onClick={() => {
                      if (window.confirm(`Очистить ${weekNum} неделю для всех сотрудников?`)) {
                        timesheet.forEach(user => handleClearWeekRange(user.user_id, startDay));
                      }
                    }}
                  >
                    Очистить {weekNum}
                  </Button>
                </div>
              );
            })}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border p-2 text-left sticky left-0 bg-gray-50 min-w-[150px]">ФИО</th>
                  {days.map(day => {
                    const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const dayOfWeek = new Date(dateStr).getDay();
                    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                    return (
                      <th key={day} className={cn('border p-1 text-center min-w-[50px]', isWeekend && 'bg-gray-200')}>
                        {day}
                        <div className="text-[8px] text-gray-500">
                          {['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'][dayOfWeek]}
                        </div>
                      </th>
                    );
                  })}
                  <th className="border p-2 text-center min-w-[70px]">Итого</th>
                </tr>
              </thead>
              <tbody>
                {timesheet.map(user => {
                  let totalHours = 0;
                  return (
                    <tr key={user.user_id} className="hover:bg-gray-50">
                      <td className="border p-2 font-medium sticky left-0 bg-white">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs">{user.full_name}</span>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 px-1"
                              onClick={() => handleFillMonth(user.user_id)}
                              title="Заполнить месяц по 8ч (пн-пт)"
                            >
                              <Icon name="CalendarPlus" size={12} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 px-1"
                              onClick={() => handleBulkEdit(user.user_id)}
                              title="Установить свое количество часов"
                            >
                              <Icon name="Edit3" size={12} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 px-1 text-red-600 hover:text-red-700"
                              onClick={() => handleClearMonth(user.user_id)}
                              title="Очистить месяц"
                            >
                              <Icon name="Trash2" size={12} />
                            </Button>
                          </div>
                        </div>
                      </td>
                      {days.map(day => {
                        const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                        const record = user.days[dateStr];
                        const hours = record?.hours || 0;
                        const isFired = !isDateBeforeFired(dateStr, user.fired_at);
                        const dayOfWeek = new Date(dateStr).getDay();
                        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                        
                        if (!isFired) {
                          totalHours += hours;
                        }

                        return (
                          <td key={day} className={cn('border p-0', isFired && 'bg-gray-100', isWeekend && !isFired && 'bg-gray-50')}>
                            {!isFired ? (
                              <Input
                                type="number"
                                step="0.5"
                                min="0"
                                max="24"
                                value={hours || ''}
                                onChange={(e) => handleHoursChange(user.user_id, dateStr, e.target.value, record?.comment || '')}
                                className={cn('border-0 text-center h-8 text-xs', isWeekend && 'bg-gray-50')}
                                placeholder="-"
                              />
                            ) : (
                              <div className="h-8 flex items-center justify-center text-gray-400">-</div>
                            )}
                          </td>
                        );
                      })}
                      <td className="border p-2 text-center font-bold bg-gray-50">{totalHours}</td>
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