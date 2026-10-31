import React from 'react';
import {
  Footprints,
  Flame,
  Share2,
  Droplet,
  Moon,
  Code,
  CheckSquare,
  CheckCircle,
  Activity,
  Award,
  Heart,
  BookOpen,
  Coffee,
  Dumbbell,
  Compass,
  Smile,
  Zap,
  RefreshCw,
} from 'lucide-react';

interface IconRendererProps {
  name: string;
  className?: string;
}

const iconMap: Record<string, React.ElementType> = {
  Footprints,
  Flame,
  Share2,
  Droplet,
  Moon,
  Code,
  CheckSquare,
  CheckCircle,
  Activity,
  Award,
  Heart,
  BookOpen,
  Coffee,
  Dumbbell,
  Compass,
  Smile,
  Zap,
  RefreshCw,
};

export const IconRenderer: React.FC<IconRendererProps> = ({ name, className = 'w-5 h-5' }) => {
  const IconComponent = iconMap[name] || CheckCircle;
  return <IconComponent className={className} />;
};
