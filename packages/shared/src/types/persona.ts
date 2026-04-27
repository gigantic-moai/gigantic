/**
 * 모아이 아바타 시각 설정.
 * 돌 색상, 눈/입 모양, 액세서리 등 개별 페르소나의 외형을 정의한다.
 */
export interface MoaiAvatarConfig {
  stoneColor: string;
  eyes: 'closed' | 'open' | 'narrow' | 'wide';
  mouth: 'flat' | 'smile' | 'frown' | 'open';
  accessory?: 'headphones' | 'glasses' | 'crown' | 'cap' | null;
  background?: string;
}

export interface Persona {
  id: string;
  name: string;
  role: string;
  description: string;
  avatarConfig: MoaiAvatarConfig;
  tags: string[];
  systemPrompt: string;
  createdAt: string;
  updatedAt: string;
}

export type PersonaDraft = Omit<Persona, 'id' | 'createdAt' | 'updatedAt'>;
