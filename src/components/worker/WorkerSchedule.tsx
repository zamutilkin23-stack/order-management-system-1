import { useState, useEffect } from 'react';
import { TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface WorkerScheduleProps {
  userId: number;
  userName: string;
  scheduleApi: string;
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

export default function WorkerSchedule({ userId, userName, scheduleApi }: WorkerScheduleProps) {
  const [timesheet, setTimesheet] = useState<UserTimesheet | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTimesheet();
  }, [selectedMonth, selectedYear, userId]);

  const loadTimesheet = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${scheduleApi}?month=${selectedMonth}&year=${selectedYear}&user_id=${userId}`);
      const data = await response.json();
      
      if (data.length > 0) {
        setTimesheet(data[0]);
      } else {
        setTimesheet({
          user_id: userId,
          full_name: userName,
          fired_at: null,
          days: {}
        });
      }
    } catch (error) {
      toast.error('Ошибка загрузки табеля');
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = () => {
    return new Date(selectedYear, selectedMonth, 0).getDate();
  };

  const getTotalHours = () => {
    if (!timesheet) return 0;
    return Object.values(timesheet.days).reduce((sum, record) => sum + (record?.hours || 0), 0);
  };

  const handleHoursChange = async (dateStr: string, hours: string) => {
    const hoursNum = parseFloat(hours) || 0;
    
    try {
      const response = await fetch(scheduleApi, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'X-User-Id': String(userId)
        },
        body: JSON.stringify({
          user_id: userId,
          work_date: dateStr,
          hours: hoursNum,
          comment: ''
        })
      });

      if (response.ok) {
        await loadTimesheet();
        toast.success('Часы обновлены');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Ошибка обновления');
      }
    } catch (error) {
      toast.error('Ошибка сервера');
    }
  };

  const daysInMonth = getDaysInMonth();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const totalHours = getTotalHours();

  return (
    <TabsContent value="schedule" className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Icon name="Calendar" size={20} />
                График работы
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">{userName}</p>
            </div>
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
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Отработано в месяце</p>
                <p className="text-2xl font-bold text-blue-600">{totalHours} часов</p>
              </div>
              <Icon name="Clock" size={40} className="text-blue-400" />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border p-2 text-center">День</th>
                  <th className="border p-2 text-center">Часов</th>
                </tr>
              </thead>
              <tbody>
                {days.map(day => {
                  const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const record = timesheet?.days[dateStr];
                  const hours = record?.hours || 0;
                  const dayOfWeek = new Date(dateStr).getDay();
                  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

                  return (
                    <tr key={day} className={cn('hover:bg-gray-50', isWeekend && 'bg-gray-50')}>
                      <td className="border p-2 text-center font-medium">
                        {day} {new Date(dateStr).toLocaleString('ru', { weekday: 'short' })}
                      </td>
                      <td className="border p-2 text-center">
                        <Input
                          type="number"
                          step="0.5"
                          min="0"
                          max="24"
                          value={hours || ''}
                          onChange={(e) => {
                            if (timesheet) {
                              setTimesheet({
                                ...timesheet,
                                days: {
                                  ...timesheet.days,
                                  [dateStr]: {
                                    hours: parseFloat(e.target.value) || 0,
                                    comment: '',
                                    record_id: record?.record_id || null
                                  }
                                }
                              });
                            }
                          }}
                          onBlur={(e) => {
                            const newValue = parseFloat(e.target.value) || 0;
                            const oldValue = record?.hours || 0;
                            if (newValue !== oldValue) {
                              handleHoursChange(dateStr, e.target.value);
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.currentTarget.blur();
                            }
                          }}
                          className="w-20 text-center mx-auto"
                          placeholder="0"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-gray-100 font-bold">
                  <td className="border p-2 text-center">Итого:</td>
                  <td className="border p-2 text-center text-blue-600">{totalHours}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );
}