import { useState } from 'react';
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
import { cn } from '@/lib/utils';
import { useMaterialsData } from './hooks/useMaterialsData';
import { useMaterialsActions } from './hooks/useMaterialsActions';
import { getSectionName, getFilteredMaterials, getSectionHierarchy } from './utils/materialsUtils';

interface MaterialsManagementProps {
  userId: number;
}

export default function MaterialsManagement({ userId }: MaterialsManagementProps) {
  const { materials, sections, loadMaterials } = useMaterialsData({ userId });
  const { handleSubmit, handleDelete } = useMaterialsActions({ loadMaterials });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<any>(null);
  const [selectedSectionFilter, setSelectedSectionFilter] = useState<string>('all');
  const [formData, setFormData] = useState({
    name: '',
    section_id: '',
    quantity: 0,
    manual_deduct: true,
    defect_tracking: false
  });

  const handleEdit = (material: any) => {
    setEditingMaterial(material);
    setFormData({
      name: material.name,
      section_id: String(material.section_id),
      quantity: material.quantity,
      manual_deduct: material.manual_deduct,
      defect_tracking: material.defect_tracking
    });
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingMaterial(null);
    setFormData({ name: '', section_id: '', quantity: 0, manual_deduct: true, defect_tracking: false });
  };

  const onSubmit = () => handleSubmit(formData, editingMaterial, setDialogOpen, setEditingMaterial, setFormData);
  const filteredMaterials = getFilteredMaterials(materials, sections, selectedSectionFilter);
  const sectionHierarchy = getSectionHierarchy(sections);

  return (
    <TabsContent value="materials">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Материалы</CardTitle>
              <CardDescription>Управление материалами на складе</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={selectedSectionFilter} onValueChange={setSelectedSectionFilter}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Все разделы" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все разделы</SelectItem>
                  {sectionHierarchy.flatMap(parent => [
                    <SelectItem key={parent.id} value={String(parent.id)}>
                      <span className="font-semibold">{parent.name}</span>
                    </SelectItem>,
                    ...parent.children.map(child => (
                      <SelectItem key={child.id} value={String(child.id)}>
                        <span className="ml-4">↳ {child.name}</span>
                      </SelectItem>
                    ))
                  ])}
                </SelectContent>
              </Select>
              <Dialog open={dialogOpen} onOpenChange={handleCloseDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Icon name="Plus" size={16} className="mr-2" />
                  Добавить материал
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingMaterial ? 'Редактировать материал' : 'Новый материал'}</DialogTitle>
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
                        {sectionHierarchy.flatMap(parent => [
                          <SelectItem key={parent.id} value={String(parent.id)}>
                            <span className="font-semibold">{parent.name}</span>
                          </SelectItem>,
                          ...parent.children.map(child => (
                            <SelectItem key={child.id} value={String(child.id)}>
                              <span className="ml-4">↳ {child.name}</span>
                            </SelectItem>
                          ))
                        ])}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Количество</Label>
                    <Input type="number" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })} />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="manual_deduct" 
                      checked={formData.manual_deduct}
                      onCheckedChange={(checked) => setFormData({ ...formData, manual_deduct: !!checked })}
                    />
                    <Label htmlFor="manual_deduct" className="text-sm font-normal">Ручное списание</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="defect_tracking" 
                      checked={formData.defect_tracking}
                      onCheckedChange={(checked) => setFormData({ ...formData, defect_tracking: !!checked })}
                    />
                    <Label htmlFor="defect_tracking" className="text-sm font-normal">Учёт брака</Label>
                  </div>
                  <Button onClick={onSubmit} className="w-full">
                    {editingMaterial ? 'Сохранить' : 'Создать'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Название</TableHead>
                <TableHead>Раздел</TableHead>
                <TableHead>Количество</TableHead>
                <TableHead>Настройки</TableHead>
                <TableHead className="text-right">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMaterials.map(material => (
                <TableRow key={material.id}>
                  <TableCell className="font-medium">{material.name}</TableCell>
                  <TableCell>{getSectionName(material.section_id, sections)}</TableCell>
                  <TableCell>
                    <span className={cn(
                      'font-mono font-semibold',
                      material.quantity <= 0 ? 'text-red-600' : 'text-green-600'
                    )}>
                      {material.quantity}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {material.manual_deduct && (
                        <Badge variant="outline" className="text-xs">Ручное списание</Badge>
                      )}
                      {material.defect_tracking && (
                        <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">Учёт брака</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleEdit(material)}>
                        <Icon name="Edit" size={14} />
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(material.id, material.name)}>
                        <Icon name="Trash2" size={14} />
                      </Button>
                    </div>
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
