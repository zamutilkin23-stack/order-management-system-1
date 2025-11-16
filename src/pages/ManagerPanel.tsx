import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';

import MaterialsInventory from '@/components/manager/MaterialsInventory';
import MaterialsManagement from '@/components/worker/MaterialsManagement';
import ShippedOrders from '@/components/manager/ShippedOrders';
import DefectiveReport from '@/components/admin/DefectiveReport';
import TimeTracking from '@/components/admin/TimeTracking';
import MaterialsArrival from '@/components/manager/MaterialsArrival';

const ORDERS_API = 'https://functions.poehali.dev/0ffd935b-d2ee-48e1-a9e4-2b8fe0ffb3dd';
const MATERIALS_API = 'https://functions.poehali.dev/74905bf8-26b1-4b87-9a75-660316d4ba77';

interface User {
  id: number;
  login: string;
  full_name: string;
  role: string;
}

interface ManagerPanelProps {
  user: User;
  onLogout: () => void;
}

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

export default function ManagerPanel({ user, onLogout }: ManagerPanelProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [colors, setColors] = useState<Color[]>([]);
  const [loading, setLoading] = useState(false);

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

  const createOrder = async (orderData: any) => {
    setLoading(true);
    try {
      const response = await fetch(ORDERS_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...orderData, created_by: user.id })
      });

      if (response.ok) {
        toast.success('Заявка создана');
        loadOrders();
        return true;
      } else {
        const error = await response.json();
        toast.error(error.error || 'Ошибка создания заявки');
        return false;
      }
    } catch (error) {
      toast.error('Ошибка сервера');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deleteOrder = async (orderId: number) => {
    try {
      const response = await fetch(`${ORDERS_API}?id=${orderId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success('Заявка удалена');
        loadOrders();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Ошибка удаления');
      }
    } catch (error) {
      toast.error('Ошибка сервера');
    }
  };

  const updateOrderItem = async (orderId: number, itemId: number, quantityCompleted: number) => {
    try {
      const response = await fetch(ORDERS_API, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: orderId,
          item_id: itemId,
          quantity_completed: quantityCompleted
        })
      });

      if (response.ok) {
        toast.success('Количество обновлено');
        loadOrders();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Ошибка обновления');
      }
    } catch (error) {
      toast.error('Ошибка сервера');
    }
  };

  const updateMaterialQuantity = async (materialId: number, change: number, comment: string = '') => {
    try {
      const response = await fetch(MATERIALS_API, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: materialId,
          quantity_change: change,
          updated_by: user.id,
          comment
        })
      });

      if (response.ok) {
        toast.success('Остатки обновлены');
        loadMaterials();
      } else {
        toast.error('Ошибка обновления');
      }
    } catch (error) {
      toast.error('Ошибка сервера');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Icon name="Briefcase" size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Панель руководителя</h1>
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
        <Tabs defaultValue="orders" className="space-y-6">
          <TabsList className="grid w-full max-w-6xl grid-cols-6">
            <TabsTrigger value="shipped">
              <Icon name="PackageCheck" size={16} className="mr-2" />
              Отправлено
            </TabsTrigger>
            <TabsTrigger value="defective">
              <Icon name="AlertTriangle" size={16} className="mr-2" />
              Брак
            </TabsTrigger>
            <TabsTrigger value="arrival">
              <Icon name="TruckIcon" size={16} className="mr-2" />
              Приход
            </TabsTrigger>
            <TabsTrigger value="inventory">
              <Icon name="Package" size={16} className="mr-2" />
              Остатки
            </TabsTrigger>
            <TabsTrigger value="materials">
              <Icon name="PackagePlus" size={16} className="mr-2" />
              Материалы
            </TabsTrigger>
            <TabsTrigger value="timetracking">
              <Icon name="Clock" size={16} className="mr-2" />
              Табель
            </TabsTrigger>
          </TabsList>

          <ShippedOrders
            orders={orders}
            materials={materials}
            sections={sections}
            colors={colors}
            userId={user.id}
            onRefresh={loadOrders}
          />

          <DefectiveReport />

          <MaterialsArrival userId={user.id} />

          <MaterialsInventory
            materials={materials}
            sections={sections}
            onUpdateQuantity={updateMaterialQuantity}
            onRefresh={loadMaterials}
          />

          <MaterialsManagement />

          <TimeTracking userRole={user.role} />
        </Tabs>
      </div>
    </div>
  );
}