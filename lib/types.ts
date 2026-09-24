export type DocKind = 'topic' | 'design' | 'chapters' | 'style' | 'prose';

export type Phase = DocKind;

export type StudioDocs = Record<DocKind, string>;

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
  requireAnyFacts?: string[];
  minStats?: Record<string, number>;
  maxStats?: Record<string, number>;
};

export type StoryChoice = {
  id: string;
  text: string;
  meaning?: string;
  next: string;
  pageTurn?: boolean;
  effects?: Record<string, number>;
  setFacts?: string[];
  unsetFacts?: string[];
  settleWhen?: 'on_choice' | 'on_result';
  conditions?: ChoiceConditions;
};

export type SceneKind = 'linear' | 'choice' | 'branch' | 'merge' | 'ending';

export type StoryNode = {
  id: string;
  chapter: string;
  title: string;
  kind?: SceneKind;
  isEnding?: boolean;
  endingId?: string | null;
  fromScene?: string;
  mergeAt?: string;
  unmerged?: boolean;
  carries?: string;
  body: string;
  choices: StoryChoice[];
};

export type StoryMeta = {
  title: string;
  logline?: string;
  start: string;
  stats: StatDef[];
  factLabels?: Record<string, string>;
};

export type StoryData = {
  meta: StoryMeta | null;
  nodes: Record<string, StoryNode>;
};

export type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export type StoryProjectId = string;

export type GeneratePhase = Phase | 'chat';
