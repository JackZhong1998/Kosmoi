import { apiJson } from './client-api';
import { isStoryId, type StoryProject } from './stories';

export type CreateWorkspace = {
  stories: StoryProject[];
  story: StoryProject;
};

type Cache = {
  key: string;
  promise: Promise<CreateWorkspace>;
  value?: CreateWorkspace;
};

let cache: Cache | null = null;

export function invalidateCreateWorkspace() {
  cache = null;
}

export function createWorkspaceKey(id?: string) {
  return isStoryId(id || '') ? id! : '';
}

export function peekCreateWorkspace(id?: string): CreateWorkspace | null {
  if (!cache?.value) return null;
  const key = createWorkspaceKey(id);
  if (key && cache.value.story.id !== key) return null;
  return cache.value;
}

export function loadCreateWorkspace(id?: string): Promise<CreateWorkspace> {
  const key = createWorkspaceKey(id);
  if (cache?.key === key) return cache.promise;
  if (!key && cache?.value) return cache.promise;
  const promise = apiJson<CreateWorkspace>(`/api/stories?open=${encodeURIComponent(key || '1')}`)
    .then((data) => {
      if (cache && cache.promise === promise) cache.value = data;
      return data;
    })
    .catch((err) => {
      if (cache && cache.promise === promise) cache = null;
      throw err;
    });
  cache = { key, promise };
  return promise;
}

export function prefetchCreateWorkspace(id?: string) {
  void loadCreateWorkspace(id);
}
