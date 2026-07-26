import { Newspaper } from 'lucide-react';
import { CategoryLanding } from '@/components/category-landing';

export const metadata = {
  title: 'Noticias | WAMVIDEO',
};

export default function NoticiasPage() {
  return (
    <CategoryLanding
      category="Noticias"
      tagline="Actualidad y noticieros en vivo, 24/7."
      icon={<Newspaper className="size-5" />}
    />
  );
}
