import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface UserTimesheet {
  user_id: number;
  full_name: string;
  fired_at: string | null;
  days: Record<string, any>;
}

interface TimeTrackingBulkActionsProps {
  timesheet: UserTimesheet[];
  onFillWeekRange: (userId: number, startDay: number) => void;
  onClearWeekRange: (userId: number, startDay: number) => void;
}

export default function TimeTrackingBulkActions({
  timesheet,
  onFillWeekRange,
  onClearWeekRange
}: TimeTrackingBulkActionsProps) {
  return (
    <>
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
                  timesheet.forEach(user => onFillWeekRange(user.user_id, startDay));
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
                    timesheet.forEach(user => onClearWeekRange(user.user_id, startDay));
                  }
                }}
              >
                Очистить {weekNum}
              </Button>
            </div>
          );
        })}
      </div>
    </>
  );
}
