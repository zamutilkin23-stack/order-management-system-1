import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface User {
  id: number;
  login: string;
  full_name: string;
  role: string;
}

interface WorkerPanelProps {
  user: User;
  onLogout: () => void;
}

export default function WorkerPanel({ user, onLogout }: WorkerPanelProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center">
              <Icon name="Wrench" size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Панель работника</h1>
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
        <div className="text-center text-gray-600">
          <Icon name="Construction" size={48} className="mx-auto mb-4" />
          <p>Панель работника в разработке</p>
        </div>
      </div>
    </div>
  );
}
