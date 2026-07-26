import { Music } from 'lucide-react';
import { CategoryLanding } from '@/components/category-landing';

export const metadata = {
  title: 'Música | WAMVIDEO',
};

export default function MusicaPage() {
  return (
    <CategoryLanding category="Música" tagline="Videos, conciertos y canales musicales en vivo." icon={<Music className="size-5" />} />
  );
}
