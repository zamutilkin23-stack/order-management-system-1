import { UserTimesheet } from '../hooks/useTimeTrackingData';

export function handlePrint(
  timesheet: UserTimesheet[],
  selectedMonth: number,
  selectedYear: number,
  getDaysInMonth: () => number
) {
  const daysInMonth = getDaysInMonth();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  let html = `
    <html>
      <head>
        <title>Табель ${selectedMonth}.${selectedYear}</title>
        <style>
          body { font-family: Arial; font-size: 10px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #000; padding: 4px; text-align: center; }
          th { background: #f0f0f0; font-weight: bold; }
          .name { text-align: left; min-width: 150px; }
          .total { font-weight: bold; background: #f9f9f9; }
        </style>
      </head>
      <body>
        <h2>Табель учета рабочего времени - ${selectedMonth}.${selectedYear}</h2>
        <table>
          <tr>
            <th class="name">ФИО</th>
            ${days.map(d => `<th>${d}</th>`).join('')}
            <th>Итого</th>
          </tr>
  `;

  timesheet.forEach(user => {
    let totalHours = 0;
    html += `<tr><td class="name">${user.full_name}</td>`;

    days.forEach(day => {
      const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const record = user.days[dateStr];
      const hours = record?.hours || 0;
      totalHours += hours;
      html += `<td>${hours > 0 ? hours : '-'}</td>`;
    });

    html += `<td class="total">${totalHours}</td></tr>`;
  });

  html += `</table></body></html>`;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
  }
}

export function getMonthName(month: number): string {
  const months = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ];
  return months[month - 1];
}
