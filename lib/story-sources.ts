export type StorySource = {
  id: string;
  prose: string;
  titleFile?: string;
  title?: string;
};

/** 首页只展示已发布作品。评测稿和创作草稿都不挂在这里。 */
export const STORY_SOURCES: StorySource[] = [];
