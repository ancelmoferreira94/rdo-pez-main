// ==============================
// Camada de persistência — Supabase + localStorage
// ==============================

import { DiaryEntry, Project, MonthlyPlanningEntry } from './types';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';

// ---------- Helpers ----------

function isSupabaseReady(): boolean {
  try {
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    return Boolean(url && key);
  } catch {
    return false;
  }
}

// ---------- Projects ----------

export async function loadProjects(): Promise<Project[]> {
  if (!isSupabaseReady()) {
    console.warn('[storage] Supabase não configurado — usando localStorage');
    return loadFromLocal<Project>('jpl-projects');
  }
  const { data, error } = await supabase.from('projects').select('*');
  if (error) { console.error('loadProjects error:', error); return []; }
  return (data ?? []).map(row => row.data as unknown as Project);
}

export async function saveProject(project: Project): Promise<Project[]> {
  if (!isSupabaseReady()) {
    return saveToLocal<Project>('jpl-projects', project, p => p.id);
  }
  const { error } = await supabase.from('projects').upsert({
    id: project.id,
    name: project.name,
    data: project as unknown as Json,
  });
  if (error) console.error('saveProject error:', error);
  return loadProjects();
}

export async function deleteProject(id: string): Promise<Project[]> {
  if (!isSupabaseReady()) {
    return deleteFromLocal<Project>('jpl-projects', p => p.id !== id);
  }
  const { error } = await supabase.from('projects').delete().eq('id', id);
  if (error) console.error('deleteProject error:', error);
  return loadProjects();
}

// ---------- Diaries ----------

export async function loadDiaries(projectId?: string): Promise<DiaryEntry[]> {
  if (!isSupabaseReady()) {
    const all = loadFromLocal<DiaryEntry>('jpl-diaries');
    return projectId ? all.filter(d => d.projectId === projectId) : all;
  }
  let query = supabase.from('diaries').select('*');
  if (projectId) query = query.eq('project_id', projectId);
  const { data, error } = await query;
  if (error) { console.error('loadDiaries error:', error); return []; }
  return (data ?? []).map(row => row.data as unknown as DiaryEntry);
}

export async function saveDiary(diary: DiaryEntry): Promise<DiaryEntry[]> {
  if (!isSupabaseReady()) {
    return saveToLocal<DiaryEntry>('jpl-diaries', diary, d => d.id);
  }
  const { error } = await supabase.from('diaries').upsert({
    id: diary.id,
    project_id: diary.projectId,
    data: diary as unknown as Json,
  });
  if (error) console.error('saveDiary error:', error);
  return loadDiaries(diary.projectId);
}

export async function deleteDiary(id: string, projectId: string): Promise<DiaryEntry[]> {
  if (!isSupabaseReady()) {
    await deleteFromLocal<DiaryEntry>('jpl-diaries', d => d.id !== id);
    return loadDiaries(projectId);
  }
  const { error } = await supabase.from('diaries').delete().eq('id', id);
  if (error) console.error('deleteDiary error:', error);
  return loadDiaries(projectId);
}

// ---------- Monthly Planning (localStorage) ----------

const PLANNING_KEY = 'jpl-gomes-planning';

export function loadPlanning(): MonthlyPlanningEntry[] {
  return loadFromLocal<MonthlyPlanningEntry>(PLANNING_KEY);
}

export function savePlanning(entries: MonthlyPlanningEntry[]): void {
  localStorage.setItem(PLANNING_KEY, JSON.stringify(entries));
}

export function savePlanningEntry(entry: MonthlyPlanningEntry): MonthlyPlanningEntry[] {
  const entries = loadPlanning();
  const idx = entries.findIndex(e => e.id === entry.id);
  if (idx >= 0) entries[idx] = entry;
  else entries.push(entry);
  savePlanning(entries);
  return entries;
}

// ---------- localStorage helpers ----------

function loadFromLocal<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveToLocal<T>(key: string, item: T, getId: (t: T) => string): T[] {
  const items = loadFromLocal<T>(key);
  const idx = items.findIndex(i => getId(i) === getId(item));
  if (idx >= 0) items[idx] = item;
  else items.push(item);
  localStorage.setItem(key, JSON.stringify(items));
  return items;
}

function deleteFromLocal<T>(key: string, filterFn: (t: T) => boolean): T[] {
  const items = loadFromLocal<T>(key).filter(filterFn);
  localStorage.setItem(key, JSON.stringify(items));
  return items;
}
