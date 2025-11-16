import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { cn } from '@/lib/utils';

interface RequestItem {
  id: number;
  request_id: number;
  material_name: string;
  quantity_required: number | null;
  quantity_completed: number;
  color: string | null;
  size: string | null;
  comment: string;
}

interface Request {
  id: number;
  request_number: string;
  section_id: number;
  section_name: string;
  status: 'new' | 'in_progress' | 'completed';
  comment: string;
  created_by: number;
  created_by_name: string;
  created_at: string;
  items: RequestItem[];
}

interface RequestCardProps {
  request: Request;
  onPrint: (request: Request) => void;
  onExport: (request: Request) => void;
  onUpdateQuantity: (itemId: number, quantity: number) => void;
}

export default function RequestCard({
  request,
  onPrint,
  onExport,
  onUpdateQuantity
}: RequestCardProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Новая</Badge>;
      case 'in_progress':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Выполняется</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Готово</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Card className={cn('border-l-4', 
      request.status === 'new' && 'border-l-blue-500',
      request.status === 'in_progress' && 'border-l-yellow-500',
      request.status === 'completed' && 'border-l-green-500'
    )}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">{request.request_number}</CardTitle>
              {getStatusBadge(request.status)}
            </div>
            <CardDescription className="mt-1">
              {request.section_name} • {request.created_by_name} • {new Date(request.created_at).toLocaleDateString('ru-RU')}
            </CardDescription>
            {request.comment && (
              <p className="text-sm text-gray-600 mt-2">{request.comment}</p>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onPrint(request)}
            >
              <Icon name="Printer" size={14} />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onExport(request)}
            >
              <Icon name="Download" size={14} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Материал</TableHead>
              <TableHead>Требуется</TableHead>
              <TableHead>Выполнено</TableHead>
              <TableHead>Цвет</TableHead>
              <TableHead>Размер</TableHead>
              <TableHead>Примечание</TableHead>
              <TableHead>Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {request.items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.material_name}</TableCell>
                <TableCell>{item.quantity_required ?? '—'}</TableCell>
                <TableCell className="font-mono">
                  <span className={cn(
                    item.quantity_required && item.quantity_completed >= item.quantity_required && 'text-green-600 font-bold'
                  )}>
                    {item.quantity_completed}
                  </span>
                </TableCell>
                <TableCell>{item.color || '—'}</TableCell>
                <TableCell>{item.size || '—'}</TableCell>
                <TableCell className="text-sm text-gray-600">{item.comment || '—'}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const newQty = prompt('Введите выполненное количество:', String(item.quantity_completed));
                        if (newQty !== null) {
                          onUpdateQuantity(item.id, Number(newQty));
                        }
                      }}
                    >
                      <Icon name="Edit" size={14} />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}