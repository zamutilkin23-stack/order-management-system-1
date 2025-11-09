import { Button } from '@/components/ui/button';
import { CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import { cn } from '@/lib/utils';

interface TimeTrackingHeaderProps {
  selectedMonth: number;
  selectedYear: number;
  loading: boolean;
  onMonthChange: (month: number) => void;
  onYearChange: (year: number) => void;
  onRefresh: () => void;
  onPrint: () => void;
}

export default function TimeTrackingHeader({
  selectedMonth,
  selectedYear,
  loading,
  onMonthChange,
  onYearChange,
  onRefresh,
  onPrint
}: TimeTrackingHeaderProps) {
  return (
    <CardHeader>
      <div className="flex items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Icon name="Clock" size={20} />
          Учет рабочего времени
        </CardTitle>
        <div className="flex items-center gap-2">
          <Select value={String(selectedMonth)} onValueChange={(v) => onMonthChange(Number(v))}>
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
          <Select value={String(selectedYear)} onValueChange={(v) => onYearChange(Number(v))}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[2024, 2025, 2026].map(y => (
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={onRefresh} disabled={loading}>
            <Icon name="RefreshCw" size={16} className={cn(loading && 'animate-spin')} />
          </Button>
          <Button variant="outline" size="sm" onClick={onPrint}>
            <Icon name="Printer" size={16} className="mr-2" />
            Печать
          </Button>
        </div>
      </div>
    </CardHeader>
  );
}
