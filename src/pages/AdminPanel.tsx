import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';
import UsersManagement from '@/components/admin/UsersManagement';
import SectionsManagement from '@/components/admin/SectionsManagement';
import ColorsManagement from '@/components/admin/ColorsManagement';
import MaterialsManagement from '@/components/admin/MaterialsManagement';
import TimeTracking from '@/components/admin/TimeTracking';
import ShippedOrders from '@/components/manager/ShippedOrders';
import DefectiveReport from '@/components/admin/DefectiveReport';

interface User {
  id: number;
  login: string;
  full_name: string;
  role: string;
}

interface AdminPanelProps {
  user: User;
  onLogout: () => void;
}

const ORDERS_API = 'https://functions.poehali.dev/0ffd935b-d2ee-48e1-a9e4-2b8fe0ffb3dd';
const MATERIALS_API = 'https://functions.poehali.dev/74905bf8-26b1-4b87-9a75-660316d4ba77';

interface Order {
  id: number;
  order_number: string;
  section_id: number;
  status: string;
  comment: string;
  created_at: string;
  items: OrderItem[];
}

interface OrderItem {
  id: number;
  material_id: number;
  color_id: number;
  quantity_required: number;
  quantity_completed: number;
}

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

export default function AdminPanel({ user, onLogout }: AdminPanelProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [colors, setColors] = useState<Color[]>([]);

  useEffect(() => {
    loadOrders();
    loadMaterials();
    loadSections();
    loadColors();
  }, []);

  const loadOrders = async () => {
    try {
      const response = await fetch(ORDERS_API);
      const data = await response.json();
      setOrders(data);
    } catch (error) {
      toast.error('Ошибка загрузки заявок');
    }
  };

  const loadMaterials = async () => {
    try {
      const response = await fetch(MATERIALS_API);
      const data = await response.json();
      setMaterials(data);
    } catch (error) {
      toast.error('Ошибка загрузки материалов');
    }
  };

  const loadSections = async () => {
    try {
      const response = await fetch(`${MATERIALS_API}?type=section`);
      const data = await response.json();
      setSections(data);
    } catch (error) {
      toast.error('Ошибка загрузки разделов');
    }
  };

  const loadColors = async () => {
    try {
      const response = await fetch(`${MATERIALS_API}?type=color`);
      const data = await response.json();
      setColors(data);
    } catch (error) {
      toast.error('Ошибка загрузки цветов');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
              <Icon name="Shield" size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Панель администратора</h1>
              <p className="text-sm text-gray-600">{user.full_name}</p>
            </div>
          </div>
          <Button variant="outline" onClick={onLogout}>
            <Icon name="LogOut" size={16} className="mr-2" />
            Выход
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="users">
              <Icon name="Users" size={16} className="mr-2" />
              Пользователи
            </TabsTrigger>
            <TabsTrigger value="shipped">
              <Icon name="PackageCheck" size={16} className="mr-2" />
              Отправлено
            </TabsTrigger>
            <TabsTrigger value="defective">
              <Icon name="AlertTriangle" size={16} className="mr-2" />
              Брак
            </TabsTrigger>
            <TabsTrigger value="sections">
              <Icon name="FolderTree" size={16} className="mr-2" />
              Разделы
            </TabsTrigger>
            <TabsTrigger value="colors">
              <Icon name="Palette" size={16} className="mr-2" />
              Цвета
            </TabsTrigger>
            <TabsTrigger value="materials">
              <Icon name="Package" size={16} className="mr-2" />
              Материалы
            </TabsTrigger>
            <TabsTrigger value="timetracking">
              <Icon name="Clock" size={16} className="mr-2" />
              Табель
            </TabsTrigger>
          </TabsList>

          <UsersManagement />
          <ShippedOrders
            orders={orders}
            materials={materials}
            sections={sections}
            colors={colors}
            userId={user.id}
            onRefresh={loadOrders}
          />
          <DefectiveReport />
          <SectionsManagement userId={user.id} />
          <ColorsManagement userId={user.id} />
          <MaterialsManagement userId={user.id} />
          <TimeTracking userRole={user.role} />
        </Tabs>
      </div>
    </div>
  );
}