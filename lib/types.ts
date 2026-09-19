export type Phase = 'topic' | 'design' | 'prose';

export type StatDef = {
  id: string;
  name: string;
  initial: number;
  min: number;
  max: number;
  visible: boolean;
};

export type ChoiceConditions = {
  requireFacts?: string[];
  forbidFacts?: string[];
  minStats?: Record<string, number>;
  maxStats?: Record<string, number>;
};

export type StoryChoice = {
  id: string;
  text: string;
  meaning?: string;
  next: string;
  effects?: Record<string, number>;
  setFacts?: string[];
  unsetFacts?: string[];
  settleWhen?: 'on_choice' | 'on_result';
  conditions?: ChoiceConditions;
};

export type StoryNode = {
  id: string;
  chapter: string;
  title: string;
  isEnding?: boolean;
  endingId?: string | null;
  body: string;
  choices: StoryChoice[];
};

export type StoryMeta = {
  title: string;
  logline?: string;
  start: string;
  stats: StatDef[];
};

export type StoryData = {
  meta: StoryMeta | null;
  nodes: Record<string, StoryNode>;
};

export type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export type GeneratePhase = Phase | 'chat';
