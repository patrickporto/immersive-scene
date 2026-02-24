import { Music, Rocket, Skull, Sparkles, Swords } from 'lucide-react';

export const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'Fantasia':
      return <Swords size={16} />;
    case 'Ficção Científica':
      return <Rocket size={16} />;
    case 'Terror':
      return <Skull size={16} />;
    case 'Taberna':
      return <Music size={16} />;
    default:
      return <Sparkles size={16} />;
  }
};
