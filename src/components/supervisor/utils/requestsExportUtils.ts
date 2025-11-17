import * as XLSX from 'xlsx';
import { toast } from 'sonner';
import { Request } from '../hooks/useRequestsData';

export function printRequest(request: Request) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const statusText = request.status === 'new' ? 'Новая' : request.status === 'in_progress' ? 'Выполняется' : 'Готово';
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Заявка ${request.request_number}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .info { margin-bottom: 20px; }
        .info-row { display: flex; margin-bottom: 10px; }
        .info-label { font-weight: bold; width: 150px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #000; padding: 8px; text-align: left; }
        th { background-color: #f0f0f0; font-weight: bold; }
        .footer { margin-top: 40px; }
        @media print {
          button { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>ЗАЯВКА № ${request.request_number}</h1>
      </div>
      <div class="info">
        <div class="info-row"><div class="info-label">Статус:</div><div>${statusText}</div></div>
        <div class="info-row"><div class="info-label">Раздел:</div><div>${request.section_name}</div></div>
        <div class="info-row"><div class="info-label">Создал:</div><div>${request.created_by_name}</div></div>
        <div class="info-row"><div class="info-label">Дата создания:</div><div>${new Date(request.created_at).toLocaleDateString('ru-RU')}</div></div>
        ${request.comment ? `<div class="info-row"><div class="info-label">Комментарий:</div><div>${request.comment}</div></div>` : ''}
      </div>
      <table>
        <thead>
          <tr>
            <th>№</th>
            <th>Материал</th>
            <th>Требуется</th>
            <th>Выполнено</th>
            <th>Цвет</th>
            <th>Размер</th>
            <th>Примечание</th>
          </tr>
        </thead>
        <tbody>
          ${request.items.map((item, index) => `
            <tr>
              <td>${index + 1}</td>
              <td>${item.material_name}</td>
              <td>${item.quantity_required ?? '—'}</td>
              <td>${item.quantity_completed}</td>
              <td>${item.color || '—'}</td>
              <td>${item.size || '—'}</td>
              <td>${item.comment || '—'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <div class="footer">
        <p>Подпись: _______________________</p>
        <p>Дата: _______________________</p>
      </div>
      <button onclick="window.print()" style="margin-top: 20px; padding: 10px 20px; background: #007bff; color: white; border: none; cursor: pointer;">Печать</button>
    </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
}

export function exportToExcel(request: Request) {
  const statusText = request.status === 'new' ? 'Новая' : request.status === 'in_progress' ? 'Выполняется' : 'Готово';

  const worksheetData = [
    ['ЗАЯВКА №', request.request_number],
    ['Статус', statusText],
    ['Раздел', request.section_name],
    ['Создал', request.created_by_name],
    ['Дата создания', new Date(request.created_at).toLocaleDateString('ru-RU')],
    ['Комментарий', request.comment || ''],
    [],
    ['№', 'Материал', 'Требуется', 'Выполнено', 'Цвет', 'Размер', 'Примечание'],
    ...request.items.map((item, index) => [
      index + 1,
      item.material_name,
      item.quantity_required ?? '',
      item.quantity_completed,
      item.color || '',
      item.size || '',
      item.comment || ''
    ])
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Заявка');
  XLSX.writeFile(workbook, `Заявка_${request.request_number}.xlsx`);
  toast.success('Экспорт в Excel выполнен');
}

export function exportAllToExcel(filteredRequests: Request[]) {
  const worksheetData = [
    ['ВСЕ ЗАЯВКИ'],
    [],
    ['№', 'Номер', 'Статус', 'Раздел', 'Создал', 'Дата', 'Количество позиций'],
    ...filteredRequests.map((req, index) => {
      const statusText = req.status === 'new' ? 'Новая' : req.status === 'in_progress' ? 'Выполняется' : 'Готово';
      return [
        index + 1,
        req.request_number,
        statusText,
        req.section_name,
        req.created_by_name,
        new Date(req.created_at).toLocaleDateString('ru-RU'),
        req.items.length
      ];
    })
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Заявки');
  XLSX.writeFile(workbook, `Заявки_${new Date().toLocaleDateString('ru-RU')}.xlsx`);
  toast.success('Экспорт всех заявок выполнен');
}
