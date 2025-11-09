import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import { cn } from '@/lib/utils';

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

interface TimeTrackingTableProps {
  timesheet: UserTimesheet[];
  selectedMonth: number;
  selectedYear: number;
  days: number[];
  isDateBeforeFired: (dateStr: string, firedAt: string | null) => boolean;
  onHoursChange: (userId: number, dateStr: string, hours: string) => void;
  onFillMonth: (userId: number) => void;
  onBulkEdit: (userId: number) => void;
  onClearMonth: (userId: number) => void;
  setTimesheet: (timesheet: UserTimesheet[]) => void;
}

export default function TimeTrackingTable({
  timesheet,
  selectedMonth,
  selectedYear,
  days,
  isDateBeforeFired,
  onHoursChange,
  onFillMonth,
  onBulkEdit,
  onClearMonth,
  setTimesheet
}: TimeTrackingTableProps) {
  return (
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
                        onClick={() => onFillMonth(user.user_id)}
                        title="Заполнить месяц по 8ч (пн-пт)"
                      >
                        <Icon name="CalendarPlus" size={12} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-1"
                        onClick={() => onBulkEdit(user.user_id)}
                        title="Установить свое количество часов"
                      >
                        <Icon name="Edit3" size={12} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-1 text-red-600 hover:text-red-700"
                        onClick={() => onClearMonth(user.user_id)}
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
                          onChange={(e) => {
                            const newTimesheet = [...timesheet];
                            const userIndex = newTimesheet.findIndex(u => u.user_id === user.user_id);
                            if (userIndex !== -1) {
                              newTimesheet[userIndex].days[dateStr] = {
                                hours: parseFloat(e.target.value) || 0,
                                comment: '',
                                record_id: record?.record_id || null
                              };
                              setTimesheet(newTimesheet);
                            }
                          }}
                          onBlur={(e) => {
                            const newValue = parseFloat(e.target.value) || 0;
                            const oldValue = record?.hours || 0;
                            if (newValue !== oldValue) {
                              onHoursChange(user.user_id, dateStr, e.target.value);
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.currentTarget.blur();
                            }
                          }}
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
  );
}