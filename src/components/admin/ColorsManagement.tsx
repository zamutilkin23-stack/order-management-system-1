import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TabsContent } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';

const API = 'https://functions.poehali.dev/74905bf8-26b1-4b87-9a75-660316d4ba77';

interface Color {
  id: number;
  name: string;
  hex_code: string;
}

interface ColorsManagementProps {
  userId: number;
}

export default function ColorsManagement({ userId }: ColorsManagementProps) {
  const [colors, setColors] = useState<Color[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', hex_code: '#000000' });

  useEffect(() => {
    loadColors();
  }, []);

  const loadColors = async () => {
    try {
      const response = await fetch(`${API}?type=color`, {
        headers: { 'X-User-Id': String(userId) }
      });
      const data = await response.json();
      setColors(data);
    } catch (error) {
      toast.error('Ошибка загрузки');
    }
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error('Введите название');
      return;
    }

    try {
      const response = await fetch(`${API}?type=color`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-User-Id': String(userId)
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast.success('Цвет создан');
        setDialogOpen(false);
        setFormData({ name: '', hex_code: '#000000' });
        loadColors();
      }
    } catch (error) {
      toast.error('Ошибка');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить цвет?')) return;

    try {
      const response = await fetch(`${API}?type=color&id=${id}`, { 
        method: 'DELETE',
        headers: { 'X-User-Id': String(userId) }
      });
      if (response.ok) {
        toast.success('Цвет удален');
        loadColors();
      }
    } catch (error) {
      toast.error('Ошибка');
    }
  };

  return (
    <TabsContent value="colors">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Цвета</CardTitle>
              <CardDescription>Управление цветовой палитрой</CardDescription>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Icon name="Plus" size={16} className="mr-2" />
                  Добавить цвет
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Новый цвет</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Название</Label>
                    <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                  </div>
                  <div>
                    <Label>Цвет (HEX)</Label>
                    <div className="flex gap-2">
                      <Input type="color" value={formData.hex_code} onChange={(e) => setFormData({ ...formData, hex_code: e.target.value })} className="w-20" />
                      <Input value={formData.hex_code} onChange={(e) => setFormData({ ...formData, hex_code: e.target.value })} />
                    </div>
                  </div>
                  <Button onClick={handleSubmit} className="w-full">Создать</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Цвет</TableHead>
                <TableHead>Название</TableHead>
                <TableHead>HEX</TableHead>
                <TableHead className="text-right">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {colors.map((color) => (
                <TableRow key={color.id}>
                  <TableCell>
                    <div className="w-8 h-8 rounded border" style={{ backgroundColor: color.hex_code }} />
                  </TableCell>
                  <TableCell className="font-medium">{color.name}</TableCell>
                  <TableCell className="font-mono text-xs">{color.hex_code}</TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(color.id)}>
                      <Icon name="Trash2" size={14} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </TabsContent>
  );
}