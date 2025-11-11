import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';

const API = 'https://functions.poehali.dev/74905bf8-26b1-4b87-9a75-660316d4ba77';

interface Material {
  id: number;
  name: string;
  section_id: number;
  quantity: number;
  colors: Color[];
}

interface Section {
  id: number;
  name: string;
  parent_id: number | null;
}

interface Color {
  id: number;
  name: string;
  hex_code: string;
}

export default function MaterialsManagement() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [colors, setColors] = useState<Color[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const [newMaterial, setNewMaterial] = useState({
    name: '',
    section_id: '',
    quantity: '',
    color_ids: [] as number[]
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [materialsRes, sectionsRes, colorsRes] = await Promise.all([
        fetch(API),
        fetch(`${API}?type=section`),
        fetch(`${API}?type=color`)
      ]);
      
      const materialsData = await materialsRes.json();
      const sectionsData = await sectionsRes.json();
      const colorsData = await colorsRes.json();
      
      setMaterials(materialsData);
      setSections(sectionsData);
      setColors(colorsData);
    } catch (error) {
      toast.error('Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMaterial = async () => {
    if (!newMaterial.name.trim() || !newMaterial.section_id || !newMaterial.quantity) {
      toast.error('Заполните все обязательные поля');
      return;
    }

    try {
      const response = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'material',
          name: newMaterial.name,
          section_id: parseInt(newMaterial.section_id),
          quantity: parseInt(newMaterial.quantity),
          color_ids: newMaterial.color_ids
        })
      });

      if (response.ok) {
        toast.success('Материал добавлен');
        setIsDialogOpen(false);
        setNewMaterial({ name: '', section_id: '', quantity: '', color_ids: [] });
        loadData();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Ошибка добавления');
      }
    } catch (error) {
      toast.error('Ошибка сервера');
    }
  };

  const handleDeleteMaterial = async (id: number) => {
    if (!confirm('Удалить этот материал?')) return;

    try {
      const response = await fetch(API, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'material', id })
      });

      if (response.ok) {
        toast.success('Материал удалён');
        loadData();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Ошибка удаления');
      }
    } catch (error) {
      toast.error('Ошибка сервера');
    }
  };

  const toggleColor = (colorId: number) => {
    setNewMaterial(prev => ({
      ...prev,
      color_ids: prev.color_ids.includes(colorId)
        ? prev.color_ids.filter(id => id !== colorId)
        : [...prev.color_ids, colorId]
    }));
  };

  const getSectionName = (sectionId: number) => {
    const section = sections.find(s => s.id === sectionId);
    if (!section) return 'Неизвестно';
    
    if (section.parent_id) {
      const parent = sections.find(s => s.id === section.parent_id);
      return `${parent?.name || ''} → ${section.name}`;
    }
    
    return section.name;
  };

  if (loading) {
    return (
      <TabsContent value="materials">
        <Card>
          <CardContent className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
          </CardContent>
        </Card>
      </TabsContent>
    );
  }

  return (
    <TabsContent value="materials">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Icon name="Package" size={20} />
                Управление материалами
              </CardTitle>
              <CardDescription>
                Добавление и удаление материалов
              </CardDescription>
            </div>
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Icon name="Plus" size={16} className="mr-2" />
                  Добавить материал
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Новый материал</DialogTitle>
                  <DialogDescription>
                    Заполните информацию о материале
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Название материала *</Label>
                    <Input
                      placeholder="Например: Плитка керамическая"
                      value={newMaterial.name}
                      onChange={(e) => setNewMaterial(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Раздел *</Label>
                    <Select value={newMaterial.section_id} onValueChange={(v) => setNewMaterial(prev => ({ ...prev, section_id: v }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите раздел" />
                      </SelectTrigger>
                      <SelectContent>
                        {sections.map(section => (
                          <SelectItem key={section.id} value={section.id.toString()}>
                            {getSectionName(section.id)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Количество *</Label>
                    <Input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={newMaterial.quantity}
                      onChange={(e) => setNewMaterial(prev => ({ ...prev, quantity: e.target.value }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Цвета (опционально)</Label>
                    <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 border rounded">
                      {colors.map(color => (
                        <button
                          key={color.id}
                          type="button"
                          onClick={() => toggleColor(color.id)}
                          className={`flex items-center gap-2 p-2 rounded border transition ${
                            newMaterial.color_ids.includes(color.id)
                              ? 'bg-blue-50 border-blue-500'
                              : 'bg-white border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div
                            className="w-4 h-4 rounded-full border"
                            style={{ backgroundColor: color.hex_code }}
                          />
                          <span className="text-sm">{color.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button onClick={handleAddMaterial} className="flex-1">
                    <Icon name="Plus" size={16} className="mr-2" />
                    Добавить
                  </Button>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="flex-1">
                    Отмена
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-3">
            {materials.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Icon name="PackageOpen" size={48} className="mx-auto mb-3 opacity-50" />
                <p className="text-lg">Материалы не добавлены</p>
                <p className="text-sm mt-1">Нажмите "Добавить материал" для создания</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {materials.map(material => (
                  <div key={material.id} className="border rounded-lg p-4 bg-gradient-to-br from-gray-50 to-white shadow-sm hover:shadow-md transition">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-base mb-1">{material.name}</h3>
                        <p className="text-xs text-gray-600">{getSectionName(material.section_id)}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteMaterial(material.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Icon name="Trash2" size={16} />
                      </Button>
                    </div>
                    
                    <div className="flex items-center gap-2 mb-3">
                      <Icon name="Package" size={14} className="text-gray-400" />
                      <span className="text-sm font-medium">{material.quantity} шт</span>
                    </div>
                    
                    {material.colors.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {material.colors.map(color => (
                          <div
                            key={color.id}
                            className="flex items-center gap-1 text-xs bg-white border rounded px-2 py-1"
                          >
                            <div
                              className="w-3 h-3 rounded-full border"
                              style={{ backgroundColor: color.hex_code }}
                            />
                            <span>{color.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );
}
