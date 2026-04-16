import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { DiaryEntry, Project, createNewDiary, createDefaultProject } from '@/lib/types';
import {
  loadDiaries, saveDiary, deleteDiary,
  loadProjects, saveProject, deleteProject,
  loadPlanning,
} from '@/lib/storage';
import DiaryList from '@/components/DiaryList';
import DiaryForm from '@/components/DiaryForm';
import ProjectList from '@/components/ProjectList';
import ProjectSettings from '@/components/ProjectSettings';
import MonthlyPlanning from '@/components/MonthlyPlanning';

type View = 'projects' | 'diaries' | 'form' | 'project-settings' | 'planning';

const Index = () => {
  const [view, setView] = useState<View>('projects');
  const [projects, setProjects] = useState<Project[]>([]);
  const [diaries, setDiaries] = useState<DiaryEntry[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [currentDiary, setCurrentDiary] = useState<DiaryEntry | null>(null);
  const [readOnly, setReadOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carrega projetos ao montar
  useEffect(() => {
    loadProjects()
      .then(setProjects)
      .catch(err => {
        console.error('Erro ao carregar projetos:', err);
        setError('Erro ao conectar ao banco de dados. Tente recarregar a página.');
      })
      .finally(() => setLoading(false));
  }, []);

  // Carrega diários quando muda o projeto
  useEffect(() => {
    if (currentProject) {
      loadDiaries(currentProject.id).then(setDiaries);
    }
  }, [currentProject?.id]);

  // === Handlers de Projeto ===

  const handleSelectProject = useCallback((project: Project) => {
    setCurrentProject(project);
    setView('diaries');
  }, []);

  const handleNewProject = useCallback(async () => {
    const p = createDefaultProject();
    const updated = await saveProject(p);
    setProjects(updated);
    setCurrentProject(p);
    setView('project-settings');
  }, []);

  const handleDeleteProject = useCallback(async (id: string) => {
    const updated = await deleteProject(id);
    setProjects(updated);
    setDiaries(prev => prev.filter(d => d.projectId !== id));
  }, []);

  const handleSaveProject = useCallback(async (project: Project) => {
    const updated = await saveProject(project);
    setProjects(updated);
    setCurrentProject(project);
    setView('diaries');
  }, []);

  // === Handlers de Diário ===

  const handleNewDiary = useCallback(() => {
    if (!currentProject) return;
    const planning = loadPlanning();
    const newDiary = createNewDiary(currentProject, diaries, planning);
    setCurrentDiary(newDiary);
    setReadOnly(false);
    setView('form');
  }, [currentProject, diaries]);

  const handleOpenDiary = useCallback((diary: DiaryEntry) => {
    setCurrentDiary(diary);
    setReadOnly(true);
    setView('form');
  }, []);

  const handleSaveDiary = useCallback(async (diary: DiaryEntry) => {
    const updated = await saveDiary(diary);
    setDiaries(updated);
    setView('diaries');
  }, []);

  const handleDeleteDiary = useCallback(async (id: string) => {
    if (!currentProject) return;
    const updated = await deleteDiary(id, currentProject.id);
    setDiaries(updated);
    setCurrentDiary(null);
    setView('diaries');
    toast.success('Diário excluído com sucesso!');
  }, [currentProject]);

  // === Navegação ===

  const handleCancel = useCallback(() => {
    if (view === 'form') setView('diaries');
    else if (view === 'project-settings') setView(currentProject ? 'diaries' : 'projects');
    else if (view === 'planning') setView('diaries');
    else setView('projects');
    setCurrentDiary(null);
  }, [view, currentProject]);

  const projectDiaries = currentProject
    ? diaries.filter(d => d.projectId === currentProject.id)
    : [];

  // === Render ===

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">Carregando dados...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <p className="text-destructive font-medium mb-2">⚠️ {error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:opacity-90 transition-opacity"
          >
            Recarregar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {view === 'projects' && (
        <ProjectList
          projects={projects}
          onSelect={handleSelectProject}
          onNew={handleNewProject}
          onDelete={handleDeleteProject}
          onSettings={(p) => { setCurrentProject(p); setView('project-settings'); }}
        />
      )}
      {view === 'diaries' && currentProject && (
        <DiaryList
          project={currentProject}
          diaries={projectDiaries}
          onNew={handleNewDiary}
          onOpen={handleOpenDiary}
          onBack={() => setView('projects')}
          onSettings={() => setView('project-settings')}
          onPlanning={() => setView('planning')}
        />
      )}
      {view === 'form' && currentDiary && currentProject && (
        <DiaryForm
          project={currentProject}
          diary={currentDiary}
          allDiaries={diaries}
          readOnly={readOnly}
          onSave={handleSaveDiary}
          onCancel={handleCancel}
          onEdit={() => setReadOnly(false)}
          onBack={() => { setView('diaries'); setCurrentDiary(null); }}
          onDelete={handleDeleteDiary}
        />
      )}
      {view === 'project-settings' && currentProject && (
        <ProjectSettings
          project={currentProject}
          onSave={handleSaveProject}
          onCancel={handleCancel}
        />
      )}
      {view === 'planning' && currentProject && (
        <MonthlyPlanning
          project={currentProject}
          diaries={projectDiaries}
          onBack={handleCancel}
        />
      )}
    </div>
  );
};

export default Index;
