import { useState } from 'react';
import { DiaryEntry, Project } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Printer } from 'lucide-react';
import DiaryPrintLayout from '@/components/DiaryPrintLayout';

interface PrintPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  diary: DiaryEntry;
  project: Project;
  financialData: { group: string; dayValue: number; monthValue: number; plannedValue: number }[];
  financialTotal: { dayValue: number; monthValue: number; plannedValue: number };
}

const SECTIONS = [
  { key: 'weather', label: 'Clima' },
  { key: 'forecast', label: 'Previsão de Serviços' },
  { key: 'staff', label: 'Quadro de Pessoal' },
  { key: 'contractors', label: 'Empreiteiros' },
  { key: 'equipmentJpl', label: 'Equipamentos JPL' },
  { key: 'leasedEquipment', label: 'Equipamentos Locados' },
  { key: 'executed', label: 'Serviços Executados' },
  { key: 'financial', label: 'Controle Financeiro' },
  { key: 'observations', label: 'Observações' },
  { key: 'photos', label: 'Fotos' },
] as const;

type SectionKey = typeof SECTIONS[number]['key'];

const PrintPreviewModal = ({ open, onOpenChange, diary, project, financialData, financialTotal }: PrintPreviewModalProps) => {
  const [visibleSections, setVisibleSections] = useState<Record<SectionKey, boolean>>(() => {
    const init: Record<string, boolean> = {};
    SECTIONS.forEach(s => {
      // Auto-hide empty sections
      switch (s.key) {
        case 'leasedEquipment': init[s.key] = diary.leasedEquipment.length > 0; break;
        case 'photos': init[s.key] = diary.photos.length > 0; break;
        case 'observations': init[s.key] = !!diary.observations?.trim(); break;
        default: init[s.key] = true;
      }
    });
    return init as Record<SectionKey, boolean>;
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] overflow-y-auto print:fixed print:inset-0 print:z-[9999] print:max-w-none print:max-h-none print:overflow-visible print:p-0 print:m-0 print:border-none print:shadow-none print:bg-white print:translate-x-0 print:translate-y-0 print:left-0 print:top-0">
        <DialogHeader className="no-print">
          <DialogTitle>Visualizar Impressão</DialogTitle>
        </DialogHeader>

        {/* Section toggles */}
        <div className="flex flex-wrap gap-3 p-3 bg-muted rounded-lg mb-4 no-print">
          {SECTIONS.map(s => (
            <label key={s.key} className="flex items-center gap-1.5 text-xs">
              <Checkbox
                checked={visibleSections[s.key]}
                onCheckedChange={v => setVisibleSections(prev => ({ ...prev, [s.key]: !!v }))}
              />
              {s.label}
            </label>
          ))}
        </div>

        <div className="no-print mb-3">
          <Button onClick={handlePrint} className="gap-1.5">
            <Printer className="h-4 w-4" /> Imprimir
          </Button>
        </div>

        {/* Print content */}
        <div id="print-content">
          <DiaryPrintLayout
            diary={diary}
            project={project}
            financialData={financialData}
            financialTotal={financialTotal}
            visibleSections={visibleSections}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PrintPreviewModal;
