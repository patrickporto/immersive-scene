export type ElementType = 'loop' | 'oneshot';

export interface SoundElement {
  id: string;
  name: string;
  type: ElementType;
  defaultVolume: number;
}

export interface Mood {
  id: string;
  name: string;
  activeElements: string[];
}

export interface SoundSet {
  id: string;
  title: string;
  category: string;
  cover: string;
  description: string;
  moods: Mood[];
  elements: SoundElement[];
}
