const CATEGORY_COLORS: Record<string, string> = {
  '식비': '#039be5',
  '교통': '#33b679',
  '쇼핑': '#8e24aa',
  '문화/여가': '#f6bf26',
  '의료': '#d81b60',
  '기타': '#616161',
};

function getCategoryColor(name: string): string {
  return CATEGORY_COLORS[name] ?? '#9e9e9e';
}

interface CategoryChipProps {
  name: string;
}

export default function CategoryChip({ name }: CategoryChipProps) {
  const color = getCategoryColor(name);
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-xl text-xs font-medium whitespace-nowrap"
      style={{ background: color + '22', color }}
    >
      {name}
    </span>
  );
}
