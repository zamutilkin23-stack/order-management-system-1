import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';

const API = 'https://functions.poehali.dev/74905bf8-26b1-4b87-9a75-660316d4ba77';

interface Section {
  id: number;
  name: string;
  parent_id: number | null;
}

interface SectionsManagementProps {
  userId: number;
}

export default function SectionsManagement({ userId }: SectionsManagementProps) {
  const [sections, setSections] = useState<Section[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [name, setName] = useState('');
  const [parentId, setParentId] = useState<string>('');

  useEffect(() => {
    loadSections();
  }, []);

  const loadSections = async () => {
    try {
      const response = await fetch(`${API}?type=section`, {
        headers: { 'X-User-Id': String(userId) }
      });
      const data = await response.json();
      setSections(data);
    } catch (error) {
      toast.error('Ошибка загрузки');
    }
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error('Введите название');
      return;
    }

    try {
      const method = editingSection ? 'PUT' : 'POST';
      const body = editingSection
        ? { id: editingSection.id, name, parent_id: parentId ? parseInt(parentId) : null }
        : { name, parent_id: parentId ? parseInt(parentId) : null };

      const response = await fetch(`${API}?type=section`, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'X-User-Id': String(userId)
        },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        toast.success(editingSection ? 'Раздел обновлен' : 'Раздел создан');
        handleCloseDialog();
        loadSections();
      }
    } catch (error) {
      toast.error('Ошибка');
    }
  };

  const handleEdit = (section: Section) => {
    setEditingSection(section);
    setName(section.name);
    setParentId(section.parent_id ? String(section.parent_id) : '');
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingSection(null);
    setName('');
    setParentId('');
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить раздел?')) return;

    try {
      const response = await fetch(`${API}?type=section&id=${id}`, { 
        method: 'DELETE',
        headers: { 'X-User-Id': String(userId) }
      });
      if (response.ok) {
        toast.success('Раздел удален');
        loadSections();
      }
    } catch (error) {
      toast.error('Ошибка');
    }
  };

  return (
    <TabsContent value="sections">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Разделы</CardTitle>
              <CardDescription>Управление разделами производства</CardDescription>
            </div>
            <Dialog open={dialogOpen} onOpenChange={handleCloseDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Icon name="Plus" size={16} className="mr-2" />
                  Добавить раздел
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingSection ? 'Редактировать раздел' : 'Новый раздел'}</DialogTitle>
                  <DialogDescription>Можно создать подраздел, выбрав родительский раздел</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Название</Label>
                    <Input value={name} onChange={(e) => setName(e.target.value)} />
                  </div>
                  <div>
                    <Label>Родительский раздел (необязательно)</Label>
                    <Select value={parentId} onValueChange={setParentId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Без родителя" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="null">Без родителя</SelectItem>
                        {sections.filter(s => !s.parent_id && (!editingSection || s.id !== editingSection.id)).map((section) => (
                          <SelectItem key={section.id} value={String(section.id)}>
                            {section.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleSubmit} className="w-full">
                    {editingSection ? 'Сохранить' : 'Создать'}
                  </Button>
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
                <TableHead>Родитель</TableHead>
                <TableHead className="text-right">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sections.map((section) => {
                const parent = sections.find(s => s.id === section.parent_id);
                return (
                  <TableRow key={section.id}>
                    <TableCell className="font-medium">
                      {section.parent_id && <span className="mr-2 text-gray-400">↳</span>}
                      {section.name}
                    </TableCell>
                    <TableCell className="text-gray-600 text-sm">
                      {parent ? parent.name : '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button size="sm" variant="outline" onClick={() => handleEdit(section)}>
                          <Icon name="Edit" size={14} />
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDelete(section.id)}>
                          <Icon name="Trash2" size={14} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </TabsContent>
  );
}