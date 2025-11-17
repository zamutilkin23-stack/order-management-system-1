import { Order, Section, Material, Color } from '../hooks/useShippedOrdersData';

export function filterShippedByDate(orders: Order[], dateFilter: string) {
  const now = new Date();
  return orders.filter(order => {
    if (!order.shipped_at) return false;
    const shippedDate = new Date(order.shipped_at);
    
    switch (dateFilter) {
      case 'today':
        return shippedDate.toDateString() === now.toDateString();
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return shippedDate >= weekAgo;
      case 'month':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return shippedDate >= monthAgo;
      default:
        return true;
    }
  });
}

export function getSectionName(id: number, sections: Section[]) {
  return sections.find(s => s.id === id)?.name || '—';
}

export function getMaterialName(id: number, materials: Material[]) {
  return materials.find(m => m.id === id)?.name || '—';
}

export function getColorName(id: number, colors: Color[]) {
  return colors.find(c => c.id === id)?.name || '—';
}

export function getColorHex(id: number, colors: Color[]) {
  return colors.find(c => c.id === id)?.hex_code || '#000000';
}
