import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';
import TimeTrackingHeader from '@/components/admin/timetracking/TimeTrackingHeader';
import TimeTrackingBulkActions from '@/components/admin/timetracking/TimeTrackingBulkActions';
import TimeTrackingTable from '@/components/admin/timetracking/TimeTrackingTable';
import WorkerSchedule from '@/components/worker/WorkerSchedule';

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

interface SupervisorTimeTrackingProps {
  userId: number;
  userName: string;
}

export default function SupervisorTimeTracking({ userId, userName }: SupervisorTimeTrackingProps) {
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

  const handleHoursChange = async (userIdParam: number, dateStr: string, hours: string) => {
    const hoursNum = parseFloat(hours) || 0;
    
    try {
      const response = await fetch(SCHEDULE_API, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'X-User-Id': String(userId)
        },
        body: JSON.stringify({
          user_id: userIdParam,
          work_date: dateStr,
          hours: hoursNum,
          comment: ''
        })
      });

      if (response.ok) {
        await loadTimesheet();
        toast.success('Часы обновлены');
      } else {
        toast.error('Ошибка обновления');
      }
    } catch (error) {
      toast.error('Ошибка сервера');
    }
  };

  const handleFillMonth = async (userIdParam: number) => {
    const daysInMonth = getDaysInMonth();
    const promises = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayOfWeek = new Date(dateStr).getDay();
      
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        promises.push(
          fetch(SCHEDULE_API, {
            method: 'PUT',
            headers: { 
              'Content-Type': 'application/json',
              'X-User-Id': String(userId)
            },
            body: JSON.stringify({
              user_id: userIdParam,
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

  const handleClearMonth = async (userIdParam: number) => {
    const confirmed = window.confirm('Удалить все часы за месяц для этого сотрудника?');
    if (!confirmed) return;

    const daysInMonth = getDaysInMonth();
    const promises = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      promises.push(
        fetch(SCHEDULE_API, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'X-User-Id': String(userId)
          },
          body: JSON.stringify({
            user_id: userIdParam,
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

  const handleBulkEdit = async (userIdParam: number) => {
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
            headers: { 
              'Content-Type': 'application/json',
              'X-User-Id': String(userId)
            },
            body: JSON.stringify({
              user_id: userIdParam,
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

  const handleFillWeekRange = async (userIdParam: number, startDay: number) => {
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
            headers: { 
              'Content-Type': 'application/json',
              'X-User-Id': String(userId)
            },
            body: JSON.stringify({
              user_id: userIdParam,
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

  const handleClearWeekRange = async (userIdParam: number, startDay: number) => {
    const promises = [];
    for (let i = 0; i < 7; i++) {
      const day = startDay + i;
      if (day > getDaysInMonth()) break;
      
      const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      promises.push(
        fetch(SCHEDULE_API, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'X-User-Id': String(userId)
          },
          body: JSON.stringify({
            user_id: userIdParam,
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
    <Card>
      <Tabs defaultValue="all">
        <div className="p-4 border-b">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="all">
              <Icon name="Users" size={16} className="mr-2" />
              Общий график
            </TabsTrigger>
            <TabsTrigger value="personal">
              <Icon name="User" size={16} className="mr-2" />
              Мой график
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="all">
          <Card className="border-0 shadow-none">
            <TimeTrackingHeader
              selectedMonth={selectedMonth}
              selectedYear={selectedYear}
              loading={loading}
              onMonthChange={setSelectedMonth}
              onYearChange={setSelectedYear}
              onRefresh={loadTimesheet}
              onPrint={handlePrint}
            />
            <CardContent>
              <TimeTrackingBulkActions
                timesheet={timesheet}
                onFillWeekRange={handleFillWeekRange}
                onClearWeekRange={handleClearWeekRange}
              />
              <TimeTrackingTable
                timesheet={timesheet}
                selectedMonth={selectedMonth}
                selectedYear={selectedYear}
                days={days}
                isDateBeforeFired={isDateBeforeFired}
                onHoursChange={handleHoursChange}
                onFillMonth={handleFillMonth}
                onBulkEdit={handleBulkEdit}
                onClearMonth={handleClearMonth}
                setTimesheet={setTimesheet}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="personal" className="p-0">
          <WorkerSchedule
            userId={userId}
            userName={userName}
            scheduleApi={SCHEDULE_API}
          />
        </TabsContent>
      </Tabs>
    </Card>
  );
}
