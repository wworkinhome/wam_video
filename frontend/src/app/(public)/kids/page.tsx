import { Baby } from 'lucide-react';
import { CategoryLanding } from '@/components/category-landing';

export const metadata = {
  title: 'Kids | WAMVIDEO',
};

export default function KidsPage() {
  return <CategoryLanding category="Kids" tagline="El canal para todas las edades." icon={<Baby className="size-5" />} />;
}
