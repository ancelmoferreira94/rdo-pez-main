import { useState, useRef } from 'react';
import { DiaryEntry, Project, getMonthlyAccumulated } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Save, X, Pencil, Eye, Plus, Trash2, Camera, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import DecimalInput from '@/components/DecimalInput';
import PrintPreviewModal from '@/components/PrintPreviewModal';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface DiaryFormProps {
  project: Project;
  diary: DiaryEntry;
  allDiaries: DiaryEntry[];
  readOnly: boolean;
  onSave: (diary: DiaryEntry) => void;
  onCancel: () => void;
  onEdit: () => void;
  onBack: () => void;
  onDelete?: (id: string) => void;
}

function formatDateBR(dateStr: string) {
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

function getServiceDate(diaryDate: string): string {
  const d = new Date(diaryDate + 'T12:00:00');
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

const WEEKDAYS = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];

const DiaryForm = ({ project, diary: initial, allDiaries, readOnly, onSave, onCancel, onEdit, onBack, onDelete }: DiaryFormProps) => {
  const [diary, setDiary] = useState<DiaryEntry>(() => {
    const d = { ...initial };
    d.executedServices = d.executedServices.map((s, i) => ({
      ...s,
      executedMonth: getMonthlyAccumulated(allDiaries, d, i),
    }));
    return d;
  });
  const [showPrintPreview, setShowPrintPreview] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const update = <K extends keyof DiaryEntry>(key: K, value: DiaryEntry[K]) => {
    setDiary(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    onSave(diary);
    toast.success('Diário salvo com sucesso!');
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const newPhoto = {
          id: crypto.randomUUID(),
          dataUrl: ev.target?.result as string,
          highway: 'BR-060/MS',
          km: '',
        };
        setDiary(prev => ({ ...prev, photos: [...prev.photos, newPhoto] }));
      };
      reader.readAsDataURL(file);
    });
  };

  const totalStaff = diary.staffJpl.reduce((s, r) => s + r.quantity, 0);
  const totalContractorStaff = diary.contractors.reduce((s, c) => s + c.employees, 0);

  const financialGroups = ['Conservação', 'Pavimentação', 'Serviços Auxiliares', 'Melhoramentos'] as const;
  const financialData = financialGroups.map(group => {
    const services = diary.executedServices.filter(s => s.description === group);
    const dayValue = services.reduce((sum, s) => sum + s.executedDay * s.unitPrice, 0);
    const monthValue = services.reduce((sum, s) => sum + s.executedMonth * s.unitPrice, 0);
    const plannedValue = services.reduce((sum, s) => sum + s.plannedMonth * s.unitPrice, 0);
    return { group, dayValue, monthValue, plannedValue };
  });
  const financialTotal = financialData.reduce(
    (acc, f) => ({
      dayValue: acc.dayValue + f.dayValue,
      monthValue: acc.monthValue + f.monthValue,
      plannedValue: acc.plannedValue + f.plannedValue,
    }),
    { dayValue: 0, monthValue: 0, plannedValue: 0 }
  );

  const dateObj = new Date(diary.date + 'T12:00:00');
  const weekday = WEEKDAYS[dateObj.getDay()];
  const serviceDate = getServiceDate(diary.date);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 animate-fade-in">
      {/* Header */}
      <div className="bg-primary text-primary-foreground rounded-lg p-4 mb-4 no-print">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-bold">
              Diário nº {String(diary.number).padStart(2, '0')}
            </h1>
            <p className="text-primary-foreground/70 text-sm">{project.name}</p>
            <p className="text-primary-foreground/50 text-xs mt-0.5">
              Produção referente a: {formatDateBR(serviceDate)} (D-1)
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {readOnly ? (
              <>
                <Button variant="secondary" size="sm" onClick={onEdit} className="gap-1.5">
                  <Pencil className="h-4 w-4" /> Editar
                </Button>
                <Button variant="secondary" size="sm" onClick={() => setShowPrintPreview(true)} className="gap-1.5">
                  <Eye className="h-4 w-4" /> Visualizar Impressão
                </Button>
              </>
            ) : (
              <>
                <Button variant="secondary" size="sm" onClick={handleSave} className="gap-1.5">
                  <Save className="h-4 w-4" /> Salvar
                </Button>
                <Button variant="ghost" size="sm" onClick={onCancel} className="text-primary-foreground/80 gap-1.5">
                  <X className="h-4 w-4" /> Cancelar
                </Button>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between mt-2">
          <Button variant="ghost" size="sm" onClick={onBack} className="text-primary-foreground/70 gap-1.5 -ml-2">
            <ArrowLeft className="h-4 w-4" /> Voltar aos Diários
          </Button>
          {onDelete && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-destructive-foreground/80 gap-1.5 hover:bg-destructive/20">
                  <Trash2 className="h-4 w-4" /> Excluir Diário
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Excluir Diário</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tem certeza que deseja excluir este diário? Esta ação não pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onDelete(diary.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Excluir
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      <Tabs defaultValue="header" className="w-full">
        <TabsList className="flex flex-wrap h-auto gap-1 bg-muted p-1 mb-4 no-print">
          {[
            ['header', 'Cabeçalho'],
            ['forecast', 'Previsão'],
            ['staff', 'Pessoal'],
            ['contractors', 'Empreiteiros'],
            ['equipment', 'Equip. JPL'],
            ['leased', 'Equip. Locados'],
            ['executed', 'Serviços Exec.'],
            ['financial', 'Financeiro'],
            ['observations', 'Observações'],
            ['photos', 'Fotos'],
          ].map(([value, label]) => (
            <TabsTrigger key={value} value={value} className="text-xs px-3 py-1.5">
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* SECTION 1 - Header */}
        <TabsContent value="header">
          <div className="bg-card rounded-lg p-6 border">
            <h2 className="section-title">Cabeçalho</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Contrato" value={project.contract} />
              <Field label="Diário nº" value={String(diary.number).padStart(2, '0')} />
              <div>
                <label className="text-sm font-medium text-muted-foreground">Data do Diário</label>
                <Input
                  type="date"
                  value={diary.date}
                  onChange={e => update('date', e.target.value)}
                  disabled={readOnly}
                  className="mt-1"
                />
              </div>
              <Field label="Dia da Semana" value={weekday} />
              <Field label="Data dos Serviços (D-1)" value={formatDateBR(serviceDate)} />
              <div className="md:col-span-2">
                <Field label="Rodovia" value={project.highway} />
              </div>
              <Field label="Início do Contrato" value={formatDateBR(project.contractStart)} />
              <Field label="Término do Contrato" value={formatDateBR(project.contractEnd)} />
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-muted-foreground mb-2 block">Tempo</label>
                <div className="flex flex-wrap gap-4">
                  {[
                    { key: 'clear' as const, label: 'Céu Claro' },
                    { key: 'cloudyRain' as const, label: 'Nublado - panc. chuvas' },
                    { key: 'cloudy' as const, label: 'Nublado' },
                    { key: 'rainy' as const, label: 'Chuvoso' },
                  ].map(w => (
                    <label key={w.key} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={diary.weather[w.key]}
                        disabled={readOnly}
                        onCheckedChange={v => update('weather', { ...diary.weather, [w.key]: !!v })}
                      />
                      {w.label}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* SECTION 2 - Service Forecast */}
        <TabsContent value="forecast">
          <div className="bg-card rounded-lg p-6 border overflow-x-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="section-title mb-0 border-0 pb-0">Previsão de Serviços</h2>
              {!readOnly && (
                <Button variant="outline" size="sm" className="gap-1.5" onClick={() => {
                  const usedIds = diary.serviceForecast.map(s => s.serviceId);
                  const available = project.serviceCatalog.filter(s => !usedIds.includes(s.id));
                  if (available.length === 0) {
                    toast.info('Todos os serviços do catálogo já estão na previsão');
                    return;
                  }
                  const s = available[0];
                  update('serviceForecast', [...diary.serviceForecast, {
                    serviceId: s.id,
                    description: s.description,
                    detail: s.detail,
                    jplOperating: false,
                    jplStopped: false,
                    thirdOperating: false,
                    thirdStopped: false,
                  }]);
                }}>
                  <Plus className="h-4 w-4" /> Adicionar Serviço
                </Button>
              )}
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Descrição</th>
                  <th>Detalhamento</th>
                  <th className="text-center">JPL Operando</th>
                  <th className="text-center">JPL Parado</th>
                  <th className="text-center">Terceiro Operando</th>
                  <th className="text-center">Terceiro Parado</th>
                  {!readOnly && <th className="w-12"></th>}
                </tr>
              </thead>
              <tbody>
                {diary.serviceForecast.map((s, i) => (
                  <tr key={i}>
                    <td className="font-medium">{s.description}</td>
                    <td>{s.detail}</td>
                    {(['jplOperating', 'jplStopped', 'thirdOperating', 'thirdStopped'] as const).map(field => (
                      <td key={field} className="text-center">
                        <Checkbox
                          checked={s[field]}
                          disabled={readOnly}
                          onCheckedChange={v => {
                            const arr = [...diary.serviceForecast];
                            arr[i] = { ...arr[i], [field]: !!v };
                            update('serviceForecast', arr);
                          }}
                        />
                      </td>
                    ))}
                    {!readOnly && (
                      <td>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => {
                          update('serviceForecast', diary.serviceForecast.filter((_, j) => j !== i));
                        }}><Trash2 className="h-4 w-4" /></Button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* SECTION 3 - Staff */}
        <TabsContent value="staff">
          <div className="bg-card rounded-lg p-6 border overflow-x-auto">
            <h2 className="section-title">Quadro de Pessoal — JPL GOMES</h2>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Equipe</th>
                  <th>Função</th>
                  <th className="w-24">Qtd</th>
                  <th>Observações</th>
                </tr>
              </thead>
              <tbody>
                {diary.staffJpl.map((s, i) => {
                  const isFirstOfTeam = i === 0 || diary.staffJpl[i - 1].team !== s.team;
                  const teamCount = diary.staffJpl.filter(r => r.team === s.team).length;
                  return (
                    <tr key={i}>
                      {isFirstOfTeam && (
                        <td rowSpan={teamCount} className="font-semibold bg-primary/5 align-top">
                          {s.team}
                        </td>
                      )}
                      <td>{s.role}</td>
                      <td>
                        <Input
                          type="number" min={0}
                          value={s.quantity || ''}
                          onChange={e => {
                            const arr = [...diary.staffJpl];
                            arr[i] = { ...arr[i], quantity: parseInt(e.target.value) || 0 };
                            update('staffJpl', arr);
                          }}
                          disabled={readOnly}
                          className="w-20 h-8 text-center"
                        />
                      </td>
                      <td>
                        <Input
                          value={s.observations}
                          onChange={e => {
                            const arr = [...diary.staffJpl];
                            arr[i] = { ...arr[i], observations: e.target.value };
                            update('staffJpl', arr);
                          }}
                          disabled={readOnly}
                          className="h-8"
                          placeholder="—"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={2} className="text-right font-semibold">TOTAL</td>
                  <td className="text-center font-bold">{totalStaff}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </TabsContent>

        {/* SECTION 4 - Contractors */}
        <TabsContent value="contractors">
          <div className="bg-card rounded-lg p-6 border overflow-x-auto">
            <h2 className="section-title">Quadro de Empreiteiros</h2>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Contrato nº</th>
                  <th>Razão Social</th>
                  <th className="w-24">Nº Func.</th>
                  <th>Objeto do Contrato</th>
                  {!readOnly && <th className="w-12"></th>}
                </tr>
              </thead>
              <tbody>
                {diary.contractors.map((c, i) => (
                  <tr key={i}>
                    <td><Input value={c.contractNo} disabled={readOnly} className="h-8" onChange={e => { const arr = [...diary.contractors]; arr[i] = { ...arr[i], contractNo: e.target.value }; update('contractors', arr); }} /></td>
                    <td><Input value={c.companyName} disabled={readOnly} className="h-8" onChange={e => { const arr = [...diary.contractors]; arr[i] = { ...arr[i], companyName: e.target.value }; update('contractors', arr); }} /></td>
                    <td><Input type="number" min={0} value={c.employees || ''} disabled={readOnly} className="h-8 w-20 text-center" onChange={e => { const arr = [...diary.contractors]; arr[i] = { ...arr[i], employees: parseInt(e.target.value) || 0 }; update('contractors', arr); }} /></td>
                    <td><Input value={c.contractObject} disabled={readOnly} className="h-8" onChange={e => { const arr = [...diary.contractors]; arr[i] = { ...arr[i], contractObject: e.target.value }; update('contractors', arr); }} /></td>
                    {!readOnly && (
                      <td><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => update('contractors', diary.contractors.filter((_, j) => j !== i))}><Trash2 className="h-4 w-4" /></Button></td>
                    )}
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={2} className="text-right font-semibold">TOTAL</td>
                  <td className="text-center font-bold">{totalContractorStaff}</td>
                  <td colSpan={readOnly ? 1 : 2}></td>
                </tr>
              </tfoot>
            </table>
            {!readOnly && (
              <Button variant="outline" size="sm" className="mt-3 gap-1.5" onClick={() => {
                update('contractors', [...diary.contractors, { contractNo: '', companyName: '', employees: 0, contractObject: '' }]);
              }}><Plus className="h-4 w-4" /> Adicionar Linha</Button>
            )}
          </div>
        </TabsContent>

        {/* SECTION 5 - Equipment JPL */}
        <TabsContent value="equipment">
          <div className="bg-card rounded-lg p-6 border overflow-x-auto">
            <h2 className="section-title">Equipamentos — JPL GOMES</h2>
            <table className="data-table">
              <thead>
                <tr>
                  <th className="w-16">Qtd</th>
                  <th>Equipamento/Veículo</th>
                  <th>Prefixo/Identificação</th>
                  <th className="text-center">Operando</th>
                  <th className="text-center">Parado</th>
                  {!readOnly && <th className="w-12"></th>}
                </tr>
              </thead>
              <tbody>
                {diary.equipmentJpl.map((eq, i) => (
                  <tr key={i}>
                    <td><Input type="number" min={0} value={eq.quantity || ''} disabled={readOnly} className="h-8 w-16 text-center" onChange={e => { const arr = [...diary.equipmentJpl]; arr[i] = { ...arr[i], quantity: parseInt(e.target.value) || 0 }; update('equipmentJpl', arr); }} /></td>
                    <td><Input value={eq.equipment} disabled={readOnly} className="h-8" onChange={e => { const arr = [...diary.equipmentJpl]; arr[i] = { ...arr[i], equipment: e.target.value }; update('equipmentJpl', arr); }} /></td>
                    <td><Input value={eq.identification} disabled={readOnly} className="h-8" onChange={e => { const arr = [...diary.equipmentJpl]; arr[i] = { ...arr[i], identification: e.target.value }; update('equipmentJpl', arr); }} /></td>
                    <td className="text-center"><Checkbox checked={eq.operating} disabled={readOnly} onCheckedChange={v => { const arr = [...diary.equipmentJpl]; arr[i] = { ...arr[i], operating: !!v }; update('equipmentJpl', arr); }} /></td>
                    <td className="text-center"><Checkbox checked={eq.stopped} disabled={readOnly} onCheckedChange={v => { const arr = [...diary.equipmentJpl]; arr[i] = { ...arr[i], stopped: !!v }; update('equipmentJpl', arr); }} /></td>
                    {!readOnly && (
                      <td><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => update('equipmentJpl', diary.equipmentJpl.filter((_, j) => j !== i))}><Trash2 className="h-4 w-4" /></Button></td>
                    )}
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td className="text-center font-bold">{diary.equipmentJpl.reduce((s, e) => s + e.quantity, 0)}</td>
                  <td colSpan={readOnly ? 4 : 5} className="font-semibold">TOTAL</td>
                </tr>
              </tfoot>
            </table>
            {!readOnly && (
              <Button variant="outline" size="sm" className="mt-3 gap-1.5" onClick={() => {
                update('equipmentJpl', [...diary.equipmentJpl, { quantity: 1, equipment: '', identification: '', operating: false, stopped: false }]);
              }}><Plus className="h-4 w-4" /> Adicionar Linha</Button>
            )}
          </div>
        </TabsContent>

        {/* SECTION 6 - Leased Equipment */}
        <TabsContent value="leased">
          <div className="bg-card rounded-lg p-6 border overflow-x-auto">
            <h2 className="section-title">Equipamentos Locados</h2>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Contrato nº</th>
                  <th>Equipamento/Veículo</th>
                  <th>Identificação</th>
                  <th className="w-16">Qtd</th>
                  <th>Propriedade</th>
                  <th className="text-center">Operando</th>
                  <th className="text-center">Parado</th>
                  {!readOnly && <th className="w-12"></th>}
                </tr>
              </thead>
              <tbody>
                {diary.leasedEquipment.length === 0 && (
                  <tr><td colSpan={readOnly ? 7 : 8} className="text-center text-muted-foreground py-4">Nenhum equipamento locado</td></tr>
                )}
                {diary.leasedEquipment.map((eq, i) => (
                  <tr key={i}>
                    <td><Input value={eq.contractNo} disabled={readOnly} className="h-8" onChange={e => { const arr = [...diary.leasedEquipment]; arr[i] = { ...arr[i], contractNo: e.target.value }; update('leasedEquipment', arr); }} /></td>
                    <td><Input value={eq.equipment} disabled={readOnly} className="h-8" onChange={e => { const arr = [...diary.leasedEquipment]; arr[i] = { ...arr[i], equipment: e.target.value }; update('leasedEquipment', arr); }} /></td>
                    <td><Input value={eq.identification} disabled={readOnly} className="h-8" onChange={e => { const arr = [...diary.leasedEquipment]; arr[i] = { ...arr[i], identification: e.target.value }; update('leasedEquipment', arr); }} /></td>
                    <td><Input type="number" min={0} value={eq.quantity || ''} disabled={readOnly} className="h-8 w-16 text-center" onChange={e => { const arr = [...diary.leasedEquipment]; arr[i] = { ...arr[i], quantity: parseInt(e.target.value) || 0 }; update('leasedEquipment', arr); }} /></td>
                    <td><Input value={eq.ownership} disabled={readOnly} className="h-8" onChange={e => { const arr = [...diary.leasedEquipment]; arr[i] = { ...arr[i], ownership: e.target.value }; update('leasedEquipment', arr); }} /></td>
                    <td className="text-center"><Checkbox checked={eq.operating} disabled={readOnly} onCheckedChange={v => { const arr = [...diary.leasedEquipment]; arr[i] = { ...arr[i], operating: !!v }; update('leasedEquipment', arr); }} /></td>
                    <td className="text-center"><Checkbox checked={eq.stopped} disabled={readOnly} onCheckedChange={v => { const arr = [...diary.leasedEquipment]; arr[i] = { ...arr[i], stopped: !!v }; update('leasedEquipment', arr); }} /></td>
                    {!readOnly && (
                      <td><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => update('leasedEquipment', diary.leasedEquipment.filter((_, j) => j !== i))}><Trash2 className="h-4 w-4" /></Button></td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            {!readOnly && (
              <Button variant="outline" size="sm" className="mt-3 gap-1.5" onClick={() => {
                update('leasedEquipment', [...diary.leasedEquipment, { contractNo: '', equipment: '', identification: '', quantity: 1, ownership: '', operating: false, stopped: false }]);
              }}><Plus className="h-4 w-4" /> Adicionar Linha</Button>
            )}
          </div>
        </TabsContent>

        {/* SECTION 7 - Executed Services */}
        <TabsContent value="executed">
          <div className="bg-card rounded-lg p-6 border overflow-x-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="section-title mb-0 border-0 pb-0">Serviços Executados</h2>
              <p className="text-sm text-muted-foreground">Produção ref.: {formatDateBR(serviceDate)} (D-1)</p>
            </div>
            <table className="data-table text-xs">
              <thead>
                <tr>
                  <th>Equipe</th>
                  <th>Projeto</th>
                  <th>Descrição</th>
                  <th>Detalhamento</th>
                  <th>UN</th>
                  <th className="text-right">P. Unit. (R$)</th>
                  <th>Km Ini</th>
                  <th>Km Fim</th>
                  <th>Exec. Dia</th>
                  <th>Exec. Mês</th>
                  <th>Prev. Mês</th>
                </tr>
              </thead>
              <tbody>
                {diary.executedServices.map((s, i) => (
                  <tr key={i}>
                    <td className="font-medium">{s.team}</td>
                    <td>{s.project}</td>
                    <td>{s.description}</td>
                    <td className="max-w-[200px] truncate">{s.detail}</td>
                    <td>{s.unit}</td>
                    <td>
                      <DecimalInput value={s.unitPrice} disabled={readOnly} className="h-7 w-24 text-xs text-right"
                        onChange={val => {
                          const arr = [...diary.executedServices];
                          arr[i] = { ...arr[i], unitPrice: val };
                          update('executedServices', arr);
                        }} />
                    </td>
                    <td>
                      <Input value={s.kmStart} disabled={readOnly} className="h-7 w-20 text-xs"
                        onChange={e => { const arr = [...diary.executedServices]; arr[i] = { ...arr[i], kmStart: e.target.value }; update('executedServices', arr); }} />
                    </td>
                    <td>
                      <Input value={s.kmEnd} disabled={readOnly} className="h-7 w-20 text-xs"
                        onChange={e => { const arr = [...diary.executedServices]; arr[i] = { ...arr[i], kmEnd: e.target.value }; update('executedServices', arr); }} />
                    </td>
                    <td>
                      <DecimalInput value={s.executedDay} disabled={readOnly} className="h-7 w-20 text-xs text-center" min={0}
                        onChange={val => {
                          const arr = [...diary.executedServices];
                          const accum = getMonthlyAccumulated(allDiaries, { ...diary, executedServices: arr.map((x, j) => j === i ? { ...x, executedDay: val } : x) }, i);
                          arr[i] = { ...arr[i], executedDay: val, executedMonth: accum };
                          update('executedServices', arr);
                        }} />
                    </td>
                    <td className="text-center font-medium">{s.executedMonth.toFixed(3).replace('.', ',')}</td>
                    <td>
                      <DecimalInput value={s.plannedMonth} disabled={readOnly} className="h-7 w-20 text-xs text-center" min={0}
                        onChange={val => { const arr = [...diary.executedServices]; arr[i] = { ...arr[i], plannedMonth: val }; update('executedServices', arr); }} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* SECTION 8 - Financial Control */}
        <TabsContent value="financial">
          <div className="bg-card rounded-lg p-6 border overflow-x-auto">
            <h2 className="section-title">Controle Financeiro</h2>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Grupo de Produção</th>
                  <th className="text-right">Valor Dia (R$)</th>
                  <th className="text-right">Acumulado Mensal (R$)</th>
                  <th className="text-right">Planejado Mensal (R$)</th>
                </tr>
              </thead>
              <tbody>
                {financialData.map(f => (
                  <tr key={f.group}>
                    <td className="font-medium">{f.group}</td>
                    <td className="text-right">{formatCurrency(f.dayValue)}</td>
                    <td className="text-right">{formatCurrency(f.monthValue)}</td>
                    <td className="text-right">{formatCurrency(f.plannedValue)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td className="font-bold">TOTAL</td>
                  <td className="text-right font-bold">{formatCurrency(financialTotal.dayValue)}</td>
                  <td className="text-right font-bold">{formatCurrency(financialTotal.monthValue)}</td>
                  <td className="text-right font-bold">{formatCurrency(financialTotal.plannedValue)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </TabsContent>

        {/* SECTION 9 - Observations */}
        <TabsContent value="observations">
          <div className="bg-card rounded-lg p-6 border">
            <h2 className="section-title">Observações</h2>
            <Textarea
              value={diary.observations}
              onChange={e => update('observations', e.target.value)}
              disabled={readOnly}
              rows={10}
              placeholder="Registre observações do dia..."
              className="resize-y"
            />
          </div>
        </TabsContent>

        {/* SECTION 10 - Photos */}
        <TabsContent value="photos">
          <div className="bg-card rounded-lg p-6 border">
            <h2 className="section-title">Fotos</h2>
            {!readOnly && (
              <>
                <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoUpload} />
                <Button variant="outline" className="gap-1.5 mb-4" onClick={() => fileInputRef.current?.click()}>
                  <Camera className="h-4 w-4" /> Adicionar Fotos
                </Button>
              </>
            )}
            {diary.photos.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">Nenhuma foto adicionada</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {diary.photos.map((photo, i) => (
                  <div key={photo.id} className="relative group">
                    <img src={photo.dataUrl} alt={`Foto ${i + 1}`} className="w-full h-40 object-cover rounded-md border" />
                    <div className="mt-2 space-y-1">
                      <Input value={photo.highway} disabled={readOnly} className="h-7 text-xs" placeholder="Rodovia"
                        onChange={e => { const arr = [...diary.photos]; arr[i] = { ...arr[i], highway: e.target.value }; update('photos', arr); }} />
                      <Input value={photo.km} disabled={readOnly} className="h-7 text-xs" placeholder="Km"
                        onChange={e => { const arr = [...diary.photos]; arr[i] = { ...arr[i], km: e.target.value }; update('photos', arr); }} />
                    </div>
                    {!readOnly && (
                      <Button variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => update('photos', diary.photos.filter((_, j) => j !== i))}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Print Preview Modal */}
      <PrintPreviewModal
        open={showPrintPreview}
        onOpenChange={setShowPrintPreview}
        diary={diary}
        project={project}
        financialData={financialData}
        financialTotal={financialTotal}
      />
    </div>
  );
};

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <label className="text-sm font-medium text-muted-foreground">{label}</label>
      <p className="mt-1 px-3 py-2 bg-muted rounded-md text-sm font-medium">{value}</p>
    </div>
  );
}

export default DiaryForm;
