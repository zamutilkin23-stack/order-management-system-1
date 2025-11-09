import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const API = 'https://functions.poehali.dev/74905bf8-26b1-4b87-9a75-660316d4ba77';

interface Material {
  id: number;
  name: string;
  section_id: number;
  quantity: number;
  auto_deduct: boolean;
  manual_deduct: boolean;
  defect_tracking: boolean;
}

interface Section {
  id: number;
  name: string;
}

export default function MaterialsManagement() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    section_id: '',
    quantity: 0,
    auto_deduct: false,
    manual_deduct: true,
    defect_tracking: false
  });

  useEffect(() => {
    loadMaterials();
    loadSections();
  }, []);

  const loadMaterials = async () => {
    try {
      const response = await fetch(API);
      const data = await response.json();
      setMaterials(data);
    } catch (error) {
      toast.error('Ошибка загрузки');
    }
  };

  const loadSections = async () => {
    try {
      const response = await fetch(`${API}?type=section`);
      const data = await response.json();
      setSections(data);
    } catch (error) {
      toast.error('Ошибка загрузки разделов');
    }
  };

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.section_id) {
      toast.error('Заполните обязательные поля');
      return;
    }

    try {
      const response = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, section_id: Number(formData.section_id) })
      });

      if (response.ok) {
        toast.success('Материал создан');
        setDialogOpen(false);
        setFormData({ name: '', section_id: '', quantity: 0, auto_deduct: false, manual_deduct: true, defect_tracking: false });
        loadMaterials();
      }
    } catch (error) {
      toast.error('Ошибка');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить материал?')) return;

    try {
      const response = await fetch(`${API}?id=${id}`, { method: 'DELETE' });
      if (response.ok) {
        toast.success('Материал удален');
        loadMaterials();
      }
    } catch (error) {
      toast.error('Ошибка');
    }
  };

  const getSectionName = (id: number) => {
    return sections.find(s => s.id === id)?.name || '—';
  };

  return (
    <TabsContent value="materials">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Материалы</CardTitle>
              <CardDescription>Управление материалами и остатками</CardDescription>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Icon name="Plus" size={16} className="mr-2" />
                  Добавить материал
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Новый материал</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Название</Label>
                    <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                  </div>
                  <div>
                    <Label>Раздел</Label>
                    <Select value={formData.section_id} onValueChange={(value) => setFormData({ ...formData, section_id: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите раздел" />
                      </SelectTrigger>
                      <SelectContent>
                        {sections.map(s => (
                          <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Начальное количество</Label>
                    <Input type="number" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })} />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox checked={formData.auto_deduct} onCheckedChange={(checked) => setFormData({ ...formData, auto_deduct: checked as boolean })} />
                      <Label>Автоматическое списание</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox checked={formData.manual_deduct} onCheckedChange={(checked) => setFormData({ ...formData, manual_deduct: checked as boolean })} />
                      <Label>Ручное списание</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox checked={formData.defect_tracking} onCheckedChange={(checked) => setFormData({ ...formData, defect_tracking: checked as boolean })} />
                      <Label>Учет брака</Label>
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
                <TableHead>Название</TableHead>
                <TableHead>Раздел</TableHead>
                <TableHead className="text-right">Количество</TableHead>
                <TableHead>Списание</TableHead>
                <TableHead className="text-right">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {materials.map((material) => (
                <TableRow key={material.id} className={cn(material.quantity < 10 && 'bg-red-50')}>
                  <TableCell className="font-medium">{material.name}</TableCell>
                  <TableCell>{getSectionName(material.section_id)}</TableCell>
                  <TableCell className={cn('text-right font-mono', material.quantity < 10 && 'text-red-600 font-bold')}>
                    {material.quantity}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {material.auto_deduct && <Badge variant="outline" className="text-xs">Авто</Badge>}
                      {material.manual_deduct && <Badge variant="outline" className="text-xs">Ручное</Badge>}
                      {material.defect_tracking && <Badge variant="outline" className="text-xs">Брак</Badge>}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(material.id)}>
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
