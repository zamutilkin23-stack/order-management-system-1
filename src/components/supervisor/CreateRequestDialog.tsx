import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';

interface Section {
  id: number;
  name: string;
}

interface FormData {
  request_number: string;
  section_id: string;
  comment: string;
  items: Array<{
    material_name: string;
    quantity_required: string;
    color: string;
    size: string;
    comment: string;
  }>;
}

interface CreateRequestDialogProps {
  dialogOpen: boolean;
  setDialogOpen: (open: boolean) => void;
  formData: FormData;
  setFormData: (data: FormData) => void;
  sections: Section[];
  onSubmit: () => void;
}

export default function CreateRequestDialog({
  dialogOpen,
  setDialogOpen,
  formData,
  setFormData,
  sections,
  onSubmit
}: CreateRequestDialogProps) {
  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { material_name: '', quantity_required: '', color: '', size: '', comment: '' }]
    });
  };

  const removeItem = (index: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index)
    });
  };

  const updateItem = (index: number, field: string, value: string) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData({ ...formData, items: newItems });
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button>
          <Icon name="Plus" size={16} className="mr-2" />
          Создать заявку
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Новая заявка</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Номер заявки</Label>
              <Input
                value={formData.request_number}
                onChange={(e) => setFormData({ ...formData, request_number: e.target.value })}
                placeholder="Например: ЗАВ-001"
              />
            </div>
            <div>
              <Label>Раздел</Label>
              <Select
                value={formData.section_id}
                onValueChange={(value) => setFormData({ ...formData, section_id: value })}
              >
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
          </div>

          <div>
            <Label>Комментарий</Label>
            <Textarea
              value={formData.comment}
              onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
              placeholder="Дополнительная информация"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Материалы</Label>
              <Button size="sm" variant="outline" onClick={addItem}>
                <Icon name="Plus" size={14} className="mr-1" />
                Добавить
              </Button>
            </div>
            <div className="space-y-2">
              {formData.items.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 p-3 border rounded-lg">
                  <div className="col-span-3">
                    <Label className="text-xs">Название</Label>
                    <Input
                      value={item.material_name}
                      onChange={(e) => updateItem(index, 'material_name', e.target.value)}
                      placeholder="Материал"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs">Количество</Label>
                    <Input
                      type="number"
                      value={item.quantity_required}
                      onChange={(e) => updateItem(index, 'quantity_required', e.target.value)}
                      placeholder="необязательно"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs">Цвет</Label>
                    <Input
                      value={item.color}
                      onChange={(e) => updateItem(index, 'color', e.target.value)}
                      placeholder="необязательно"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs">Размер</Label>
                    <Input
                      value={item.size}
                      onChange={(e) => updateItem(index, 'size', e.target.value)}
                      placeholder="необязательно"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs">Примечание</Label>
                    <Input
                      value={item.comment}
                      onChange={(e) => updateItem(index, 'comment', e.target.value)}
                      placeholder="необязательно"
                    />
                  </div>
                  <div className="col-span-1 flex items-end">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeItem(index)}
                      disabled={formData.items.length === 1}
                    >
                      <Icon name="X" size={14} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Button onClick={onSubmit} className="w-full">
            Создать заявку
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
