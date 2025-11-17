interface Material {
  id: number;
  name: string;
  section_id: number;
  quantity: number;
}

interface Section {
  id: number;
  name: string;
}

export function getSectionName(id: number, sections: Section[]) {
  return sections.find(s => s.id === id)?.name || '—';
}

export function filterMaterials(materials: Material[], sectionFilter: string) {
  return materials
    .filter(m => {
      if (sectionFilter === 'all') return true;
      return m.section_id === Number(sectionFilter);
    })
    .sort((a, b) => {
      const sectionCompare = a.section_id - b.section_id;
      if (sectionCompare !== 0) return sectionCompare;
      return a.name.localeCompare(b.name);
    });
}

export function printInventory(filteredMaterials: Material[], sections: Section[]) {
  const printContent = `
    <html>
      <head>
        <title>Остатки материалов</title>
        <style>
          body { font-family: Arial; padding: 20px; }
          h1 { text-align: center; margin-bottom: 30px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #000; padding: 12px; text-align: left; }
          th { background-color: #f0f0f0; font-weight: bold; }
          .low { background-color: #fee; color: #c00; font-weight: bold; }
        </style>
      </head>
      <body>
        <h1>Остатки материалов</h1>
        <table>
          <thead>
            <tr>
              <th>Материал</th>
              <th>Раздел</th>
              <th>Количество</th>
            </tr>
          </thead>
          <tbody>
            ${filteredMaterials.map(m => `
              <tr${m.quantity < 10 ? ' class="low"' : ''}>
                <td>${m.name}</td>
                <td>${getSectionName(m.section_id, sections)}</td>
                <td>${m.quantity}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
    </html>
  `;
  const win = window.open('', '', 'height=800,width=800');
  win?.document.write(printContent);
  win?.document.close();
  win?.print();
}
