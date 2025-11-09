import { useState, useEffect } from 'react';
import { TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const USERS_API = 'https://functions.poehali.dev/cb1be1e9-7f80-4e10-8f1f-4327a0daae82';

interface WorkScheduleProps {
  userId: number;
  userRole: string;
  scheduleApi: string;
}

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

export default function WorkSchedule({ userId, userRole, scheduleApi }: WorkScheduleProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [timesheet, setTimesheet] = useState<UserTimesheet[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);

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
      const response = await fetch(`${scheduleApi}?month=${selectedMonth}&year=${selectedYear}`);
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
    <TabsContent value="schedule" className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Icon name="Calendar" size={20} />
              График работы
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
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border p-2 text-left sticky left-0 bg-gray-50 min-w-[150px]">ФИО</th>
                  {days.map(day => (
                    <th key={day} className="border p-1 text-center min-w-[50px]">{day}</th>
                  ))}
                  <th className="border p-2 text-center min-w-[70px]">Итого</th>
                </tr>
              </thead>
              <tbody>
                {timesheet.map(user => {
                  let totalHours = 0;
                  return (
                    <tr key={user.user_id} className="hover:bg-gray-50">
                      <td className="border p-2 font-medium sticky left-0 bg-white">{user.full_name}</td>
                      {days.map(day => {
                        const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                        const record = user.days[dateStr];
                        const hours = record?.hours || 0;
                        const isFired = !isDateBeforeFired(dateStr, user.fired_at);
                        
                        if (!isFired) {
                          totalHours += hours;
                        }

                        return (
                          <td key={day} className={cn('border p-1 text-center', isFired && 'bg-gray-100')}>
                            <div className="h-8 flex items-center justify-center text-sm">
                              {!isFired ? (hours > 0 ? hours : '-') : '-'}
                            </div>
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