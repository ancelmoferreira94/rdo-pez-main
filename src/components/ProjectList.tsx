import { Project } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, FolderOpen, Settings, Trash2 } from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface ProjectListProps {
  projects: Project[];
  onSelect: (project: Project) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onSettings: (project: Project) => void;
}

const ProjectList = ({ projects, onSelect, onNew, onDelete, onSettings }: ProjectListProps) => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-6 animate-fade-in">
      {/* Header */}
      <div className="bg-primary text-primary-foreground rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold">Diário de Obra</h1>
            <p className="text-primary-foreground/80 text-sm mt-1">JPL GOMES ENGENHARIA LTDA</p>
          </div>
          <Button onClick={onNew} variant="secondary" size="lg" className="gap-2">
            <Plus className="h-5 w-5" /> Nova Obra
          </Button>
        </div>
      </div>

      {/* Lista de projetos ou estado vazio */}
      {projects.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <FolderOpen className="h-16 w-16 mx-auto mb-4 opacity-30" />
          <p className="text-lg">Nenhuma obra cadastrada</p>
          <p className="text-sm mt-1">Clique em "Nova Obra" para começar</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {projects.map(project => (
            <Card
              key={project.id}
              className="cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-primary"
              onClick={() => onSelect(project)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{project.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Contrato: {project.contract} | {project.highway.substring(0, 60)}...
                    </p>
                  </div>
                  <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onSettings(project)}>
                      <Settings className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir Obra</AlertDialogTitle>
                          <AlertDialogDescription>
                            Excluir "{project.name}" e todos os seus diários? Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => onDelete(project.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProjectList;
