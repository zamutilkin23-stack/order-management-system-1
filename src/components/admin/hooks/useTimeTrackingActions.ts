import { toast } from 'sonner';

const SCHEDULE_API = 'https://functions.poehali.dev/f617714b-d72a-41e1-87ec-519f6dff2f28';

interface UseTimeTrackingActionsProps {
  loadEmployees: () => void;
  loadTimesheet: () => void;
  isReadOnly: boolean;
  setLoading: (loading: boolean) => void;
  getDaysInMonth: () => number;
  selectedMonth: number;
  selectedYear: number;
}

export function useTimeTrackingActions({
  loadEmployees,
  loadTimesheet,
  isReadOnly,
  setLoading,
  getDaysInMonth,
  selectedMonth,
  selectedYear,
}: UseTimeTrackingActionsProps) {
  const addEmployee = async (newEmployeeName: string, setNewEmployeeName: (name: string) => void, setShowAddDialog: (show: boolean) => void) => {
    if (!newEmployeeName.trim()) {
      toast.error('Введите ФИО');
      return;
    }
    
    try {
      const response = await fetch(SCHEDULE_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'employee', full_name: newEmployeeName })
      });
      
      if (response.ok) {
        toast.success('Сотрудник добавлен');
        setNewEmployeeName('');
        setShowAddDialog(false);
        loadEmployees();
      }
    } catch (error) {
      toast.error('Ошибка');
    }
  };
  
  const deleteEmployee = async (id: number, fullName: string) => {
    if (!confirm(`Удалить сотрудника "${fullName}" из табеля?\n\nВсе данные о рабочем времени этого сотрудника будут удалены.`)) return;
    
    try {
      const response = await fetch(`${SCHEDULE_API}?type=employee&id=${id}`, { method: 'DELETE' });
      if (response.ok) {
        toast.success(`Сотрудник "${fullName}" удален`);
        loadEmployees();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Ошибка удаления');
      }
    } catch (error) {
      toast.error('Ошибка сервера');
    }
  };

  const handleHoursChange = async (employeeId: number, dateStr: string, hours: string) => {
    if (isReadOnly) {
      toast.error('Только просмотр');
      return;
    }
    
    const hoursNum = parseFloat(hours) || 0;
    
    try {
      const response = await fetch(SCHEDULE_API, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_id: employeeId,
          work_date: dateStr,
          hours: hoursNum
        })
      });

      if (response.ok) {
        loadTimesheet();
        toast.success('Сохранено', { duration: 1000 });
      } else {
        toast.error('Ошибка обновления');
      }
    } catch (error) {
      toast.error('Ошибка сервера');
    }
  };

  const handleFillMonth = async (employeeId: number) => {
    if (isReadOnly) return;
    
    const daysInMonth = getDaysInMonth();
    const promises = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayOfWeek = new Date(dateStr).getDay();
      
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        promises.push(
          fetch(SCHEDULE_API, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              employee_id: employeeId,
              work_date: dateStr,
              hours: 8
            })
          })
        );
      }
    }

    try {
      setLoading(true);
      await Promise.all(promises);
      toast.success('Месяц заполнен');
      loadTimesheet();
    } catch (error) {
      toast.error('Ошибка заполнения');
    } finally {
      setLoading(false);
    }
  };

  const handleClearMonth = async (employeeId: number) => {
    if (isReadOnly) return;
    if (!window.confirm('Удалить все часы за месяц?')) return;

    const daysInMonth = getDaysInMonth();
    const promises = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      promises.push(
        fetch(SCHEDULE_API, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            employee_id: employeeId,
            work_date: dateStr,
            hours: 0
          })
        })
      );
    }

    try {
      setLoading(true);
      await Promise.all(promises);
      toast.success('Часы очищены');
      loadTimesheet();
    } catch (error) {
      toast.error('Ошибка очистки');
    } finally {
      setLoading(false);
    }
  };

  return {
    addEmployee,
    deleteEmployee,
    handleHoursChange,
    handleFillMonth,
    handleClearMonth,
  };
}
