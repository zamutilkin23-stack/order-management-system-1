import { Section, Material } from '../hooks/useMaterialsData';

export function getSectionName(id: number, sections: Section[]) {
  const section = sections.find(s => s.id === id);
  if (!section) return '—';
  
  const parent = sections.find(s => s.id === section.parent_id);
  if (parent) {
    return `${parent.name} → ${section.name}`;
  }
  return section.name;
}

export function getFilteredMaterials(
  materials: Material[],
  sections: Section[],
  selectedSectionFilter: string
) {
  if (selectedSectionFilter === 'all') return materials;
  
  const filterId = Number(selectedSectionFilter);
  const childSections = sections.filter(s => s.parent_id === filterId).map(s => s.id);
  const allSectionIds = [filterId, ...childSections];
  
  return materials.filter(m => allSectionIds.includes(m.section_id));
}

export function getSectionHierarchy(sections: Section[]) {
  const parentSections = sections.filter(s => !s.parent_id);
  return parentSections.map(parent => ({
    ...parent,
    children: sections.filter(s => s.parent_id === parent.id)
  }));
}
