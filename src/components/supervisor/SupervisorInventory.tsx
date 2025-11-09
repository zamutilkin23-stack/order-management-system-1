import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { cn } from '@/lib/utils';

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
}

interface Color {
  id: number;
  name: string;
  hex_code: string;
}

interface SupervisorInventoryProps {
  materials: Material[];
  sections: Section[];
  colors: Color[];
  onRefresh: () => void;
}

export default function SupervisorInventory({
  materials,
  sections,
  colors,
  onRefresh
}: SupervisorInventoryProps) {
  const [selectedSection, setSelectedSection] = useState<number | null>(null);

  const filteredMaterials = selectedSection
    ? materials.filter(m => m.section_id === selectedSection)
    : materials;

  const getSectionName = (id: number) => sections.find(s => s.id === id)?.name || '—';

  return (
    <TabsContent value="inventory" className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Остатки материалов</CardTitle>
              <CardDescription>Просмотр складских остатков (только чтение)</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={onRefresh}>
              <Icon name="RefreshCw" size={14} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4 flex-wrap">
            <Button
              variant={selectedSection === null ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedSection(null)}
            >
              Все разделы
            </Button>
            {sections.map(section => (
              <Button
                key={section.id}
                variant={selectedSection === section.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedSection(section.id)}
              >
                {section.name}
              </Button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMaterials.map(material => (
              <Card key={material.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-base">{material.name}</CardTitle>
                      <CardDescription className="text-xs mt-1">
                        {getSectionName(material.section_id)}
                      </CardDescription>
                    </div>
                    <Badge variant={material.quantity < 10 ? 'destructive' : 'default'}>
                      {material.quantity} шт
                    </Badge>
                  </div>
                </CardHeader>
                {material.colors && material.colors.length > 0 && (
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {material.colors.map(color => (
                        <div
                          key={color.id}
                          className="flex items-center gap-1 text-xs px-2 py-1 bg-gray-50 rounded"
                          title={color.name}
                        >
                          <div
                            className="w-3 h-3 rounded-full border"
                            style={{ backgroundColor: color.hex_code }}
                          />
                          <span className="text-gray-700">{color.name}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>

          {filteredMaterials.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Icon name="Package" size={48} className="mx-auto mb-2 opacity-20" />
              <p>Нет материалов</p>
            </div>
          )}
        </CardContent>
      </Card>
    </TabsContent>
  );
}
