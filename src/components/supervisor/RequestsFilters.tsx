import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';

interface Section {
  id: number;
  name: string;
}

interface RequestsFiltersProps {
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  sectionFilter: string;
  setSectionFilter: (value: string) => void;
  dateFrom: string;
  setDateFrom: (value: string) => void;
  dateTo: string;
  setDateTo: (value: string) => void;
  sections: Section[];
  onExportAll: () => void;
  exportDisabled: boolean;
}

export default function RequestsFilters({
  statusFilter,
  setStatusFilter,
  sectionFilter,
  setSectionFilter,
  dateFrom,
  setDateFrom,
  dateTo,
  setDateTo,
  sections,
  onExportAll,
  exportDisabled
}: RequestsFiltersProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={onExportAll}
          disabled={exportDisabled}
        >
          <Icon name="Download" size={16} className="mr-2" />
          Экспорт в Excel
        </Button>
      </div>
      
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex gap-2 items-center">
          <Label className="text-sm font-medium">Раздел:</Label>
          <Select value={sectionFilter} onValueChange={setSectionFilter}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все разделы</SelectItem>
              {sections.map(s => (
                <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2 items-center">
          <Label className="text-sm font-medium">Дата от:</Label>
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-40"
          />
        </div>

        <div className="flex gap-2 items-center">
          <Label className="text-sm font-medium">до:</Label>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-40"
          />
        </div>

        {(sectionFilter !== 'all' || dateFrom || dateTo) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSectionFilter('all');
              setDateFrom('');
              setDateTo('');
            }}
          >
            <Icon name="X" size={14} className="mr-1" />
            Сбросить
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant={statusFilter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setStatusFilter('all')}
        >
          Все
        </Button>
        <Button
          variant={statusFilter === 'new' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setStatusFilter('new')}
        >
          Новые
        </Button>
        <Button
          variant={statusFilter === 'in_progress' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setStatusFilter('in_progress')}
        >
          В работе
        </Button>
        <Button
          variant={statusFilter === 'completed' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setStatusFilter('completed')}
        >
          Готово
        </Button>
        <Button
          variant={statusFilter === 'sent' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setStatusFilter('sent')}
        >
          Отправлено
        </Button>
      </div>
    </div>
  );
}