import { useState, useEffect } from 'react';
import { toast } from 'sonner';

const SCHEDULE_API = 'https://functions.poehali.dev/f617714b-d72a-41e1-87ec-519f6dff2f28';

export interface TimesheetEmployee {
  id: number;
  full_name: string;
}

export interface DayRecord {
  hours: number;
  record_id: number | null;
}

export interface UserTimesheet {
  employee_id: number;
  full_name: string;
  days: Record<string, DayRecord>;
}

interface UseTimeTrackingDataProps {
  selectedMonth: number;
  selectedYear: number;
}

export function useTimeTrackingData({ selectedMonth, selectedYear }: UseTimeTrackingDataProps) {
  const [employees, setEmployees] = useState<TimesheetEmployee[]>([]);
  const [timesheet, setTimesheet] = useState<UserTimesheet[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadEmployees();
  }, []);

  useEffect(() => {
    if (employees.length > 0) {
      loadTimesheet();
    }
  }, [selectedMonth, selectedYear, employees]);

  const loadEmployees = async () => {
    try {
      const response = await fetch(`${SCHEDULE_API}?type=employees`);
      const data = await response.json();
      setEmployees(data);
    } catch (error) {
      toast.error('Ошибка загрузки сотрудников');
    }
  };

  const loadTimesheet = async () => {
    setLoading(true);
    try {
      const empIds = employees.map(e => e.id).join(',');
      const response = await fetch(`${SCHEDULE_API}?month=${selectedMonth}&year=${selectedYear}&employee_ids=${empIds}`);
      const data = await response.json();
      setTimesheet(data);
    } catch (error) {
      toast.error('Ошибка загрузки табеля');
    } finally {
      setLoading(false);
    }
  };

  return {
    employees,
    timesheet,
    loading,
    setLoading,
    loadEmployees,
    loadTimesheet,
  };
}
