import { DiaryEntry, Project, getServiceMonthYear } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Plus, FileText, Users, DollarSign, ArrowLeft, Settings, Calendar, ChevronDown } from 'lucide-react';
import { useState, useMemo } from 'react';

interface DiaryListProps {
  project: Project;
  diaries: DiaryEntry[];
  onNew: () => void;
  onOpen: (diary: DiaryEntry) => void;
  onBack: () => void;
  onSettings: () => void;
  onPlanning: () => void;
}

const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

const formatDate = (dateStr: string) => {
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
};

const formatCurrency = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

interface MonthGroup {
  key: string;
  label: string;
  diaries: DiaryEntry[];
}

function groupByMonth(diaries: DiaryEntry[]): MonthGroup[] {
  const groups: Record<string, DiaryEntry[]> = {};
  for (const d of diaries) {
    const { month, year } = getServiceMonthYear(d.date);
    const key = `${year}-${String(month).padStart(2, '0')}`;
    (groups[key] ??= []).push(d);
  }
  return Object.entries(groups)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([key, items]) => {
      const [year, month] = key.split('-').map(Number);
      return {
        key,
        label: `${MONTHS[month]} ${year}`,
        diaries: items.sort((a, b) => b.number - a.number),
      };
    });
}

const DiaryList = ({ project, diaries, onNew, onOpen, onBack, onSettings, onPlanning }: DiaryListProps) => {
  const monthGroups = useMemo(() => groupByMonth(diaries), [diaries]);
  const currentKey = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth()).padStart(2, '0')}`;
  }, []);

  const [openMonths, setOpenMonths] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    monthGroups.forEach(g => { init[g.key] = g.key === currentKey; });
    return init;
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 animate-fade-in">
      {/* Header */}
      <div className="bg-primary text-primary-foreground rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold">Diário de Obra</h1>
            <p className="text-primary-foreground/80 text-sm mt-1">{project.name}</p>
            <p className="text-primary-foreground/60 text-xs mt-0.5">Contrato: {project.contract}</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button onClick={onPlanning} variant="secondary" size="sm" className="gap-2">
              <Calendar className="h-4 w-4" /> Planejamento
            </Button>
            <Button onClick={onSettings} variant="secondary" size="sm" className="gap-2">
              <Settings className="h-4 w-4" /> Configurações
            </Button>
            <Button onClick={onNew} variant="secondary" size="lg" className="gap-2">
              <Plus className="h-5 w-5" /> Novo Diário
            </Button>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onBack} className="mt-2 text-primary-foreground/70 gap-1.5 -ml-2">
          <ArrowLeft className="h-4 w-4" /> Voltar às Obras
        </Button>
      </div>

      {/* Lista ou estado vazio */}
      {diaries.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <FileText className="h-16 w-16 mx-auto mb-4 opacity-30" />
          <p className="text-lg">Nenhum diário registrado</p>
          <p className="text-sm mt-1">Clique em "Novo Diário" para começar</p>
        </div>
      ) : (
        <div className="space-y-4">
          {monthGroups.map(group => {
            const isCurrentMonth = group.key === currentKey;
            const isOpen = openMonths[group.key] ?? isCurrentMonth;
            return (
              <Collapsible key={group.key} open={isOpen} onOpenChange={v => setOpenMonths(prev => ({ ...prev, [group.key]: v }))}>
                <CollapsibleTrigger asChild>
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg cursor-pointer hover:bg-muted/80 transition-colors">
                    <div className="flex items-center gap-3">
                      <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? '' : '-rotate-90'}`} />
                      <h2 className="font-semibold text-lg">{group.label}</h2>
                      <span className="text-sm text-muted-foreground">({group.diaries.length} diários)</span>
                    </div>
                    {!isCurrentMonth && (
                      <span className="text-xs text-muted-foreground bg-muted-foreground/10 px-2 py-0.5 rounded">Mês anterior</span>
                    )}
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="grid gap-3 mt-2">
                    {group.diaries.map(diary => {
                      const totalStaff = diary.staffJpl.reduce((s, r) => s + r.quantity, 0) + diary.contractors.reduce((s, c) => s + c.employees, 0);
                      const totalFinancial = diary.executedServices.reduce((s, sv) => s + sv.executedDay * sv.unitPrice, 0);
                      return (
                        <Card key={diary.id} className="cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-primary" onClick={() => onOpen(diary)}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <div className="flex items-center gap-4">
                                <div className="bg-primary/10 text-primary font-bold rounded-md w-12 h-12 flex items-center justify-center text-lg">
                                  {String(diary.number).padStart(2, '0')}
                                </div>
                                <div>
                                  <p className="font-medium">Diário nº {String(diary.number).padStart(2, '0')}</p>
                                  <p className="text-sm text-muted-foreground">{formatDate(diary.date)}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1.5"><Users className="h-4 w-4" />{totalStaff} func.</span>
                                <span className="flex items-center gap-1.5"><DollarSign className="h-4 w-4" />{formatCurrency(totalFinancial)}</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DiaryList;
