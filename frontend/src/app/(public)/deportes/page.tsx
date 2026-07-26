import { Trophy } from 'lucide-react';
import { CategoryLanding } from '@/components/category-landing';

export const metadata = {
  title: 'Deportes | WAMVIDEO',
};

export default function DeportesPage() {
  return (
    <CategoryLanding category="Deportes" tagline="Fútbol, ligas y más, todo en vivo." icon={<Trophy className="size-5" />} />
  );
}
