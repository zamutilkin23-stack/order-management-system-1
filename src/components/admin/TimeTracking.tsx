import { useState } from 'react';
import { TabsContent } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import { cn } from '@/lib/utils';
import { useTimeTrackingData } from './hooks/useTimeTrackingData';
import { useTimeTrackingActions } from './hooks/useTimeTrackingActions';
import { handlePrint, getMonthName } from './utils/timeTrackingUtils';

interface TimeTrackingProps {
  userRole: string;
}

export default function TimeTracking({ userRole }: TimeTrackingProps) {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newEmployeeName, setNewEmployeeName] = useState('');
  
  const canEdit = userRole === 'admin' || userRole === 'manager' || userRole === 'worker';
  const isReadOnly = !canEdit;

  const { employees, timesheet, loading, setLoading, loadEmployees, loadTimesheet } = useTimeTrackingData({
    selectedMonth,
    selectedYear,
  });

  const getDaysInMonth = () => {
    return new Date(selectedYear, selectedMonth, 0).getDate();
  };

  const { addEmployee, deleteEmployee, handleHoursChange, handleFillMonth, handleClearMonth } = useTimeTrackingActions({
    loadEmployees,
    loadTimesheet,
    isReadOnly,
    setLoading,
    getDaysInMonth,
    selectedMonth,
    selectedYear,
  });

  const daysInMonth = getDaysInMonth();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const getWeekday = (day: number) => {
    const date = new Date(selectedYear, selectedMonth - 1, day);
    const weekdays = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
    return weekdays[date.getDay()];
  };

  const isWeekend = (day: number) => {
    const dayOfWeek = new Date(selectedYear, selectedMonth - 1, day).getDay();
    return dayOfWeek === 0 || dayOfWeek === 6;
  };

  const onAddEmployee = () => addEmployee(newEmployeeName, setNewEmployeeName, setShowAddDialog);
  const onPrint = () => handlePrint(timesheet, selectedMonth, selectedYear, getDaysInMonth);

  return (
    <TabsContent value="timesheet">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <h3 className="text-lg font-semibold">Табель рабочего времени</h3>
              
              <div className="flex items-center gap-2">
                <Select value={String(selectedMonth)} onValueChange={(v) => setSelectedMonth(Number(v))}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                      <SelectItem key={m} value={String(m)}>{getMonthName(m)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(Number(v))}>
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(y => (
                      <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={onPrint}>
                <Icon name="Printer" size={16} className="mr-1" />
                Печать
              </Button>
              
              {canEdit && (
                <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Icon name="Plus" size={16} className="mr-1" />
                      Добавить сотрудника
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Новый сотрудник</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>ФИО</Label>
                        <Input
                          value={newEmployeeName}
                          onChange={(e) => setNewEmployeeName(e.target.value)}
                          placeholder="Иванов Иван Иванович"
                        />
                      </div>
                      <Button onClick={onAddEmployee} className="w-full">Добавить</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr>
                    <th className="border border-gray-300 p-2 bg-gray-50 sticky left-0 z-10 min-w-[180px]">
                      ФИО
                    </th>
                    {days.map(day => (
                      <th
                        key={day}
                        className={cn(
                          'border border-gray-300 p-1 text-center min-w-[40px]',
                          isWeekend(day) ? 'bg-red-50' : 'bg-gray-50'
                        )}
                      >
                        <div className="font-bold">{day}</div>
                        <div className="text-[10px] text-gray-600">{getWeekday(day)}</div>
                      </th>
                    ))}
                    <th className="border border-gray-300 p-2 bg-blue-50 min-w-[60px]">Итого</th>
                    {canEdit && <th className="border border-gray-300 p-2 bg-gray-50 min-w-[140px]">Действия</th>}
                  </tr>
                </thead>
                <tbody>
                  {timesheet.map(user => {
                    let totalHours = 0;
                    return (
                      <tr key={user.employee_id}>
                        <td className="border border-gray-300 p-2 font-medium sticky left-0 bg-white z-10">
                          {user.full_name}
                        </td>
                        {days.map(day => {
                          const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                          const record = user.days[dateStr];
                          const hours = record?.hours || 0;
                          totalHours += hours;

                          return (
                            <td
                              key={day}
                              className={cn(
                                'border border-gray-300 p-0',
                                isWeekend(day) && 'bg-red-50/50'
                              )}
                            >
                              <input
                                type="number"
                                step="0.5"
                                value={hours || ''}
                                onChange={(e) => handleHoursChange(user.employee_id, dateStr, e.target.value)}
                                className="w-full h-full px-1 py-2 text-center border-none focus:ring-1 focus:ring-blue-500 bg-transparent"
                                disabled={isReadOnly}
                                placeholder="-"
                              />
                            </td>
                          );
                        })}
                        <td className="border border-gray-300 p-2 text-center font-bold bg-blue-50">
                          {totalHours}
                        </td>
                        {canEdit && (
                          <td className="border border-gray-300 p-2">
                            <div className="flex gap-1 justify-center">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleFillMonth(user.employee_id)}
                                disabled={loading}
                              >
                                <Icon name="CalendarCheck" size={14} />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleClearMonth(user.employee_id)}
                                disabled={loading}
                              >
                                <Icon name="X" size={14} />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => deleteEmployee(user.employee_id, user.full_name)}
                              >
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
          )}
        </CardContent>
      </Card>
    </TabsContent>
  );
}
