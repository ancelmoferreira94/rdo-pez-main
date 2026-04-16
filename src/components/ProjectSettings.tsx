import { useState } from 'react';
import { Project, ServiceCatalogItem, StaffRoleWithQuantity } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Save, X, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface ProjectSettingsProps {
  project: Project;
  onSave: (project: Project) => void;
  onCancel: () => void;
}

const ProjectSettings = ({ project: initial, onSave, onCancel }: ProjectSettingsProps) => {
  const [project, setProject] = useState<Project>({ ...initial });

  const update = <K extends keyof Project>(key: K, value: Project[K]) => {
    setProject(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    onSave(project);
    toast.success('Obra salva com sucesso!');
  };

  const updateService = (index: number, field: keyof ServiceCatalogItem, value: string | number) => {
    const arr = [...project.serviceCatalog];
    arr[index] = { ...arr[index], [field]: value };
    update('serviceCatalog', arr);
  };

  const updateArray = <T,>(key: keyof Project, arr: T[]) => update(key, arr as any);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 animate-fade-in">
      {/* Header */}
      <div className="bg-primary text-primary-foreground rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-bold">Configurações da Obra</h1>
            <p className="text-primary-foreground/70 text-sm">{project.name || 'Nova Obra'}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={handleSave} className="gap-1.5">
              <Save className="h-4 w-4" /> Salvar
            </Button>
            <Button variant="ghost" size="sm" onClick={onCancel} className="text-primary-foreground/80 gap-1.5">
              <X className="h-4 w-4" /> Cancelar
            </Button>
          </div>
        </div>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="flex flex-wrap h-auto gap-1 bg-muted p-1 mb-4">
          {['Dados Gerais', 'Catálogo de Serviços', 'Equipes', 'Equipamentos', 'Empreiteiros'].map((label, i) => (
            <TabsTrigger key={i} value={['general', 'services', 'staff', 'equipment', 'contractors'][i]} className="text-xs px-3 py-1.5">
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Dados Gerais */}
        <TabsContent value="general">
          <div className="bg-card rounded-lg p-6 border space-y-4">
            <h2 className="section-title">Dados Gerais</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <LabeledInput label="Nome da Obra" value={project.name} onChange={v => update('name', v)} />
              <LabeledInput label="Contrato" value={project.contract} onChange={v => update('contract', v)} />
              <div className="md:col-span-2">
                <LabeledInput label="Rodovia(s)" value={project.highway} onChange={v => update('highway', v)} />
              </div>
              <LabeledInput label="Escritório" value={project.office} onChange={v => update('office', v)} />
              <div />
              <LabeledInput label="Início do Contrato" value={project.contractStart} onChange={v => update('contractStart', v)} type="date" />
              <LabeledInput label="Término do Contrato" value={project.contractEnd} onChange={v => update('contractEnd', v)} type="date" />
            </div>
          </div>
        </TabsContent>

        {/* Catálogo de Serviços */}
        <TabsContent value="services">
          <div className="bg-card rounded-lg p-6 border overflow-x-auto">
            <h2 className="section-title">Catálogo de Serviços</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Defina os serviços disponíveis para esta obra.
            </p>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Descrição (Grupo)</th>
                  <th>Detalhamento</th>
                  <th>Unidade</th>
                  <th className="text-right">Preço Unitário (R$)</th>
                  <th className="w-12" />
                </tr>
              </thead>
              <tbody>
                {project.serviceCatalog.map((s, i) => (
                  <tr key={s.id}>
                    <td><Input value={s.description} className="h-8" onChange={e => updateService(i, 'description', e.target.value)} /></td>
                    <td><Input value={s.detail} className="h-8" onChange={e => updateService(i, 'detail', e.target.value)} /></td>
                    <td><Input value={s.unit} className="h-8 w-20" onChange={e => updateService(i, 'unit', e.target.value)} /></td>
                    <td><Input type="number" step="0.01" value={s.unitPrice || ''} className="h-8 w-32 text-right" onChange={e => updateService(i, 'unitPrice', parseFloat(e.target.value) || 0)} /></td>
                    <td>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => update('serviceCatalog', project.serviceCatalog.filter((_, j) => j !== i))}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Button variant="outline" size="sm" className="mt-3 gap-1.5" onClick={() => update('serviceCatalog', [...project.serviceCatalog, { id: crypto.randomUUID(), description: '', detail: '', unit: '', unitPrice: 0 }])}>
              <Plus className="h-4 w-4" /> Adicionar Serviço
            </Button>
          </div>
        </TabsContent>

        {/* Equipes */}
        <TabsContent value="staff">
          <div className="bg-card rounded-lg p-6 border">
            <h2 className="section-title">Equipes Padrão</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Defina as equipes e funções padrão para os diários desta obra.
            </p>
            {project.defaultStaff.map((team, ti) => (
              <div key={ti} className="mb-4 p-4 border rounded-md">
                <div className="flex items-center gap-2 mb-2">
                  <Input value={team.team} className="h-8 font-semibold" placeholder="Nome da Equipe"
                    onChange={e => {
                      const arr = [...project.defaultStaff];
                      arr[ti] = { ...arr[ti], team: e.target.value };
                      update('defaultStaff', arr);
                    }} />
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive shrink-0"
                    onClick={() => update('defaultStaff', project.defaultStaff.filter((_, i) => i !== ti))}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                {team.roles.map((role, ri) => (
                  <div key={ri} className="flex items-center gap-2 ml-4 mb-1">
                    <Input value={role.role} className="h-7 text-sm flex-1" placeholder="Função"
                      onChange={e => {
                        const arr = [...project.defaultStaff];
                        const roles = [...arr[ti].roles];
                        arr[ti] = { ...arr[ti], roles: roles.map((r, i) => i === ri ? { ...r, role: e.target.value } : r) };
                        update('defaultStaff', arr);
                      }} />
                    <Input type="number" min={0} value={role.quantity || ''} className="h-7 w-16 text-center text-sm" placeholder="Qtd"
                      onChange={e => {
                        const arr = [...project.defaultStaff];
                        const roles = [...arr[ti].roles];
                        arr[ti] = { ...arr[ti], roles: roles.map((r, i) => i === ri ? { ...r, quantity: parseInt(e.target.value) || 0 } : r) };
                        update('defaultStaff', arr);
                      }} />
                    <Input value={role.observations} className="h-7 text-sm flex-1" placeholder="Observações"
                      onChange={e => {
                        const arr = [...project.defaultStaff];
                        const roles = [...arr[ti].roles];
                        arr[ti] = { ...arr[ti], roles: roles.map((r, i) => i === ri ? { ...r, observations: e.target.value } : r) };
                        update('defaultStaff', arr);
                      }} />
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive shrink-0"
                      onClick={() => {
                        const arr = [...project.defaultStaff];
                        arr[ti] = { ...arr[ti], roles: arr[ti].roles.filter((_, i) => i !== ri) };
                        update('defaultStaff', arr);
                      }}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                <Button variant="ghost" size="sm" className="ml-4 mt-1 text-xs gap-1"
                  onClick={() => {
                    const arr = [...project.defaultStaff];
                    arr[ti] = { ...arr[ti], roles: [...arr[ti].roles, { role: '', quantity: 0, observations: '' }] };
                    update('defaultStaff', arr);
                  }}>
                  <Plus className="h-3 w-3" /> Função
                </Button>
              </div>
            ))}
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => update('defaultStaff', [...project.defaultStaff, { team: '', roles: [{ role: '', quantity: 0, observations: '' }] }])}>
              <Plus className="h-4 w-4" /> Adicionar Equipe
            </Button>
          </div>
        </TabsContent>

        {/* Equipamentos */}
        <TabsContent value="equipment">
          <div className="bg-card rounded-lg p-6 border overflow-x-auto">
            <h2 className="section-title">Equipamentos Padrão</h2>
            <table className="data-table">
              <thead>
                <tr>
                  <th className="w-16">Qtd</th>
                  <th>Equipamento/Veículo</th>
                  <th>Prefixo/Identificação</th>
                  <th className="w-12" />
                </tr>
              </thead>
              <tbody>
                {project.defaultEquipment.map((eq, i) => (
                  <tr key={i}>
                    <td><Input type="number" min={0} value={eq.quantity || ''} className="h-8 w-16 text-center"
                      onChange={e => { const arr = [...project.defaultEquipment]; arr[i] = { ...arr[i], quantity: parseInt(e.target.value) || 0 }; update('defaultEquipment', arr); }} /></td>
                    <td><Input value={eq.equipment} className="h-8"
                      onChange={e => { const arr = [...project.defaultEquipment]; arr[i] = { ...arr[i], equipment: e.target.value }; update('defaultEquipment', arr); }} /></td>
                    <td><Input value={eq.identification} className="h-8"
                      onChange={e => { const arr = [...project.defaultEquipment]; arr[i] = { ...arr[i], identification: e.target.value }; update('defaultEquipment', arr); }} /></td>
                    <td><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"
                      onClick={() => update('defaultEquipment', project.defaultEquipment.filter((_, j) => j !== i))}>
                      <Trash2 className="h-4 w-4" /></Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Button variant="outline" size="sm" className="mt-3 gap-1.5" onClick={() => update('defaultEquipment', [...project.defaultEquipment, { quantity: 1, equipment: '', identification: '' }])}>
              <Plus className="h-4 w-4" /> Adicionar Equipamento
            </Button>
          </div>
        </TabsContent>

        {/* Empreiteiros */}
        <TabsContent value="contractors">
          <div className="bg-card rounded-lg p-6 border overflow-x-auto">
            <h2 className="section-title">Empreiteiros Padrão</h2>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Contrato nº</th>
                  <th>Razão Social</th>
                  <th className="w-24">Nº Func.</th>
                  <th>Objeto do Contrato</th>
                  <th className="w-12" />
                </tr>
              </thead>
              <tbody>
                {project.defaultContractors.map((c, i) => (
                  <tr key={i}>
                    <td><Input value={c.contractNo} className="h-8" onChange={e => { const arr = [...project.defaultContractors]; arr[i] = { ...arr[i], contractNo: e.target.value }; update('defaultContractors', arr); }} /></td>
                    <td><Input value={c.companyName} className="h-8" onChange={e => { const arr = [...project.defaultContractors]; arr[i] = { ...arr[i], companyName: e.target.value }; update('defaultContractors', arr); }} /></td>
                    <td><Input type="number" min={0} value={c.employees || ''} className="h-8 w-20 text-center" onChange={e => { const arr = [...project.defaultContractors]; arr[i] = { ...arr[i], employees: parseInt(e.target.value) || 0 }; update('defaultContractors', arr); }} /></td>
                    <td><Input value={c.contractObject} className="h-8" onChange={e => { const arr = [...project.defaultContractors]; arr[i] = { ...arr[i], contractObject: e.target.value }; update('defaultContractors', arr); }} /></td>
                    <td><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => update('defaultContractors', project.defaultContractors.filter((_, j) => j !== i))}><Trash2 className="h-4 w-4" /></Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Button variant="outline" size="sm" className="mt-3 gap-1.5" onClick={() => update('defaultContractors', [...project.defaultContractors, { contractNo: '', companyName: '', employees: 0, contractObject: '' }])}>
              <Plus className="h-4 w-4" /> Adicionar Empreiteiro
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Helper component
function LabeledInput({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="text-sm font-medium text-muted-foreground">{label}</label>
      <Input type={type} value={value} onChange={e => onChange(e.target.value)} className="mt-1" />
    </div>
  );
}

export default ProjectSettings;
