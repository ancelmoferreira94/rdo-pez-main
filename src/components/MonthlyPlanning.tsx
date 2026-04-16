import { useState, useMemo } from 'react';
import { Project, DiaryEntry, MonthlyPlanningEntry, getServiceMonthYear } from '@/lib/types';
import { loadPlanning, savePlanningEntry } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Save } from 'lucide-react';
import { toast } from 'sonner';

interface MonthlyPlanningProps {
  project: Project;
  diaries: DiaryEntry[];
  onBack: () => void;
}

const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

const formatCurrency = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

function createEmptyEntry(projectId: string, month: number, year: number, catalog: { id: string }[]): MonthlyPlanningEntry {
  return {
    id: crypto.randomUUID(),
    projectId,
    month,
    year,
    services: catalog.map(s => ({ serviceId: s.id, plannedMonth: 0 })),
    observations: '',
  };
}

const MonthlyPlanning = ({ project, diaries, onBack }: MonthlyPlanningProps) => {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const allPlanning = useMemo(() => loadPlanning(), []);

  const [entry, setEntry] = useState<MonthlyPlanningEntry>(() => {
    const existing = allPlanning.find(p => p.projectId === project.id && p.month === selectedMonth && p.year === selectedYear);
    return existing ? { ...existing } : createEmptyEntry(project.id, selectedMonth, selectedYear, project.serviceCatalog);
  });

  const handleMonthChange = (month: number, year: number) => {
    setSelectedMonth(month);
    setSelectedYear(year);
    const existing = allPlanning.find(p => p.projectId === project.id && p.month === month && p.year === year);
    setEntry(existing ? { ...existing } : createEmptyEntry(project.id, month, year, project.serviceCatalog));
  };

  const monthlyAccum = useMemo(() => {
    return project.serviceCatalog.map((_s, i) =>
      diaries
        .filter(d => { const { month, year } = getServiceMonthYear(d.date); return month === selectedMonth && year === selectedYear; })
        .reduce((sum, d) => sum + (d.executedServices[i]?.executedDay ?? 0), 0)
    );
  }, [diaries, selectedMonth, selectedYear, project.serviceCatalog]);

  const handleSave = () => {
    savePlanningEntry({ ...entry, month: selectedMonth, year: selectedYear });
    toast.success('Planejamento salvo!');
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 animate-fade-in">
      {/* Header */}
      <div className="bg-primary text-primary-foreground rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-bold">Planejamento Mensal</h1>
            <p className="text-primary-foreground/70 text-sm">{project.name}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={handleSave} className="gap-1.5">
              <Save className="h-4 w-4" /> Salvar
            </Button>
            <Button variant="ghost" size="sm" onClick={onBack} className="text-primary-foreground/80 gap-1.5">
              <ArrowLeft className="h-4 w-4" /> Voltar
            </Button>
          </div>
        </div>
      </div>

      {/* Seletor de mês */}
      <div className="flex items-center gap-3 mb-4">
        <select value={selectedMonth} onChange={e => handleMonthChange(parseInt(e.target.value), selectedYear)} className="h-9 rounded-md border border-input bg-background px-3 text-sm">
          {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
        </select>
        <Input type="number" value={selectedYear} onChange={e => handleMonthChange(selectedMonth, parseInt(e.target.value) || selectedYear)} className="w-24 h-9" />
      </div>

      {/* Tabela de serviços */}
      <div className="bg-card rounded-lg p-6 border overflow-x-auto mb-4">
        <h2 className="section-title">Planejamento — {MONTHS[selectedMonth]} {selectedYear}</h2>
        <table className="data-table">
          <thead>
            <tr>
              <th>Descrição</th>
              <th>Detalhamento</th>
              <th>UN</th>
              <th className="text-right">Preço Unit. (R$)</th>
              <th className="text-center">Previsto Mês</th>
              <th className="text-center">Executado Mês</th>
              <th className="text-right">Valor Previsto (R$)</th>
              <th className="text-right">Valor Executado (R$)</th>
            </tr>
          </thead>
          <tbody>
            {project.serviceCatalog.map((s, i) => {
              const planned = entry.services.find(es => es.serviceId === s.id)?.plannedMonth ?? 0;
              const executed = monthlyAccum[i] ?? 0;
              return (
                <tr key={s.id}>
                  <td className="font-medium">{s.description}</td>
                  <td>{s.detail}</td>
                  <td>{s.unit}</td>
                  <td className="text-right">{s.unitPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                  <td>
                    <Input type="number" min={0} step="0.01" value={planned || ''} className="h-7 w-24 text-center text-xs"
                      onChange={e => {
                        const services = entry.services.map(es => es.serviceId === s.id ? { ...es, plannedMonth: parseFloat(e.target.value) || 0 } : es);
                        setEntry(prev => ({ ...prev, services }));
                      }}
                    />
                  </td>
                  <td className="text-center">{executed.toFixed(3)}</td>
                  <td className="text-right">{formatCurrency(planned * s.unitPrice)}</td>
                  <td className="text-right">{formatCurrency(executed * s.unitPrice)}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={6} className="text-right font-bold">TOTAL</td>
              <td className="text-right font-bold">
                {formatCurrency(project.serviceCatalog.reduce((sum, s) => sum + (entry.services.find(es => es.serviceId === s.id)?.plannedMonth ?? 0) * s.unitPrice, 0))}
              </td>
              <td className="text-right font-bold">
                {formatCurrency(project.serviceCatalog.reduce((sum, s, i) => sum + (monthlyAccum[i] ?? 0) * s.unitPrice, 0))}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Observações */}
      <div className="bg-card rounded-lg p-6 border">
        <h2 className="section-title">Observações do Planejamento</h2>
        <Textarea value={entry.observations} onChange={e => setEntry(prev => ({ ...prev, observations: e.target.value }))} rows={5} placeholder="Observações sobre o planejamento mensal..." />
      </div>
    </div>
  );
};

export default MonthlyPlanning;
