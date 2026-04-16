import React from 'react';
import { DiaryEntry, Project } from '@/lib/types';
import logoJpl from '@/assets/LOGO JPL GOMES ENGENHARIA SEM BORDA.png';
import logoPez from '@/assets/logo-pez.jpg';

type SectionKey = 'weather' | 'forecast' | 'staff' | 'contractors' | 'equipmentJpl' | 'leasedEquipment' | 'executed' | 'financial' | 'observations' | 'photos';

interface PrintProps {
  diary: DiaryEntry;
  project: Project;
  financialData: { group: string; dayValue: number; monthValue: number; plannedValue: number }[];
  financialTotal: { dayValue: number; monthValue: number; plannedValue: number };
  visibleSections?: Partial<Record<SectionKey, boolean>>;
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

function fmt(value: number, decimals = 3): string {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function fmtCur(value: number): string {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const WEEKDAYS = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];

const DiaryPrintLayoutFixed = ({ diary, project, financialData, financialTotal, visibleSections }: PrintProps) => {
  const show = (key: SectionKey) => visibleSections ? visibleSections[key] !== false : true;

  const dateObj = new Date(diary.date + 'T12:00:00');
  const weekday = WEEKDAYS[dateObj.getDay()];
  const serviceDate = getServiceDate(diary.date);
  const totalStaff = diary.staffJpl.reduce((s, r) => s + r.quantity, 0);
  const totalContractorStaff = diary.contractors.reduce((s, c) => s + c.employees, 0);
  const totalEquipment = diary.equipmentJpl.reduce((s, e) => s + e.quantity, 0);
  const totalLeasedEquipment = diary.leasedEquipment.reduce((s, e) => s + e.quantity, 0);

  const teams: { team: string; members: typeof diary.staffJpl }[] = [];
  diary.staffJpl.forEach(s => {
    const existing = teams.find(t => t.team === s.team);
    if (existing) existing.members.push(s);
    else teams.push({ team: s.team, members: [s] });
  });

  const activeForecasts = diary.serviceForecast.filter(s => s.jplOperating || s.jplStopped || s.thirdOperating || s.thirdStopped);
  const activeStaffTeams = teams.filter(t => t.members.some(m => m.quantity > 0));
  const activeContractors = diary.contractors.filter(c => c.employees > 0);
  const activeEquipment = diary.equipmentJpl.filter(e => e.quantity > 0);
  const activeLeasedEquipment = diary.leasedEquipment.filter(e => e.quantity > 0);
  const activeExecuted = diary.executedServices.filter(s => s.executedDay > 0 || s.executedMonth > 0);

  return (
    <div className="print-wrapper">
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 8mm;
          }
          
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          body {
            font-size: 8pt !important;
            line-height: 1.0 !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          
          .print-wrapper {
            width: 100% !important;
          }
          
          .page-section {
            margin-bottom: 6px !important;
          }
          
          .page-break-before {
            page-break-before: always !important;
          }
          
          table {
            width: 100% !important;
            border-collapse: collapse !important;
            font-size: 8pt !important;
            margin-bottom: 4px !important;
          }
          
          td, th {
            vertical-align: top !important;
          }
          
          th {
            background: #e8eaf6 !important;
            font-weight: bold !important;
            text-align: center !important;
          }
          
          .section-header {
            background: #1a237e !important;
            color: #fff !important;
            font-weight: bold !important;
            text-align: center !important;
          }
          
          .header-title {
            background: #1a237e !important;
            color: #fff !important;
            text-align: center !important;
            font-weight: bold !important;
          }
          
          .total-row {
            background: #e8eaf6 !important;
            font-weight: bold !important;
          }
          
          .text-center { text-align: center !important; }
          .text-right { text-align: right !important; }
          .text-left { text-align: left !important; }
        }
        
        .logo-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 4px;
        }
        
        .logo-header img {
          height: 35px;
          display: block;
        }
        
        .weather-box {
          display: inline-flex;
          align-items: center;
          gap: 2px;
          margin-right: 6px;
        }
        
        .weather-check {
          width: 8px;
          height: 8px;
          border: 1px solid #333;
          display: inline-block;
        }
        
        .weather-check.checked {
          background: #333;
        }
      `}</style>

      {/* Page 1 - Header and Basic Info */}
      <div className="page-section">
        <div className="logo-header">
          <img src={logoJpl} alt="JPL Gomes Engenharia" />
          <img src={logoPez} alt="Grupo PEZ" />
        </div>

        <table>
          <tbody>
            <tr>
              <td style={{ width: '15%' }}><strong>Contrato(s):</strong></td>
              <td style={{ width: '35%' }}>{project.contract}</td>
              <td rowSpan={4} className="header-title" style={{ width: '50%' }}>DIÁRIO DE OBRA</td>
            </tr>
            <tr>
              <td><strong>Início:</strong></td>
              <td>{formatDateBR(project.contractStart)} &nbsp;&nbsp; <strong>Término:</strong> {formatDateBR(project.contractEnd)}</td>
            </tr>
            <tr>
              <td><strong>Rodovia(s):</strong></td>
              <td style={{ fontSize: '6pt' }}>{project.highway}</td>
            </tr>
            <tr>
              <td><strong>Escritório(s):</strong></td>
              <td>{project.office}</td>
            </tr>
          </tbody>
        </table>

        <table>
          <tbody>
            <tr>
              <td style={{ width: '20%', textAlign: 'center', fontWeight: 'bold' }}>
                {formatDateBR(diary.date)}
              </td>
              <td style={{ width: '15%', textAlign: 'center' }}>{weekday}</td>
              {show('weather') && (
                <td>
                  <span className="weather-box"><span className={`weather-check ${diary.weather.clear ? 'checked' : ''}`}></span> Céu Claro</span>
                  <span className="weather-box"><span className={`weather-check ${diary.weather.cloudyRain ? 'checked' : ''}`}></span> Nublado - panc. chuvas</span>
                  <span className="weather-box"><span className={`weather-check ${diary.weather.cloudy ? 'checked' : ''}`}></span> Nublado</span>
                  <span className="weather-box"><span className={`weather-check ${diary.weather.rainy ? 'checked' : ''}`}></span> Chuvoso</span>
                </td>
              )}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Page 2 - Service Forecast */}
      {show('forecast') && activeForecasts.length > 0 && (
        <div className="page-break-before page-section">
          <table>
            <thead>
              <tr>
                <th colSpan={4} className="section-header">PREVISÃO DE SERVIÇOS</th>
                <th colSpan={2} style={{ fontSize: '6pt' }}>{formatDateBR(diary.date)}</th>
              </tr>
              <tr>
                <th colSpan={2}>Serviços</th>
                <th colSpan={2}>JPL GOMES</th>
                <th colSpan={2}>TERCEIRO</th>
              </tr>
              <tr>
                <th>Descrição</th>
                <th>Detalhamento</th>
                <th>Operando</th>
                <th>Parado</th>
                <th>Operando</th>
                <th>Parado</th>
              </tr>
            </thead>
            <tbody>
              {activeForecasts.map((s, i) => (
                <tr key={i}>
                  <td>{s.description}</td>
                  <td>{s.detail}</td>
                  <td className="text-center">{s.jplOperating ? 'X' : ''}</td>
                  <td className="text-center">{s.jplStopped ? 'X' : ''}</td>
                  <td className="text-center">{s.thirdOperating ? 'X' : ''}</td>
                  <td className="text-center">{s.thirdStopped ? 'X' : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Page 3 - Staff */}
      {show('staff') && activeStaffTeams.length > 0 && (
        <div className="page-break-before page-section">
          <table>
            <thead>
              <tr><th colSpan={3} className="section-header">QUADRO DE PESSOAL - JPL GOMES</th></tr>
              <tr>
                <th>Função</th>
                <th style={{ width: '15%' }}>Quantidade</th>
                <th style={{ width: '30%' }}>Observações</th>
              </tr>
            </thead>
            <tbody>
              {activeStaffTeams.map((team, ti) => (
                <React.Fragment key={ti}>
                  <tr className="team-header">
                    <td colSpan={3}>{team.team}</td>
                  </tr>
                  {team.members.map((member, mi) => (
                    <tr key={mi}>
                      <td style={{ paddingLeft: '20px' }}>{member.role}</td>
                      <td className="text-center">{member.quantity}</td>
                      <td>{member.observations}</td>
                    </tr>
                  ))}
                  <tr className="total-row">
                    <td colSpan={2}><strong>TOTAL {team.team.toUpperCase()}</strong></td>
                    <td className="text-center"><strong>{team.members.reduce((s, m) => s + m.quantity, 0)}</strong></td>
                  </tr>
                </React.Fragment>
              ))}
              <tr className="total-row">
                <td><strong>TOTAL QUADRO CONCRETA</strong></td>
                <td className="text-center"><strong>{totalStaff}</strong></td>
                <td className="text-center">0</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Page 4 - Contractors */}
      {show('contractors') && activeContractors.length > 0 && (
        <div className="page-break-before page-section">
          <table>
            <thead>
              <tr><th colSpan={4} className="section-header">QUADRO DE EMPREITEIROS</th></tr>
              <tr>
                <th>Contrato nº</th>
                <th>Razão Social</th>
                <th>Nº Funcionários</th>
                <th>Objeto do Contrato</th>
              </tr>
            </thead>
            <tbody>
              {activeContractors.map((c, i) => (
                <tr key={i}>
                  <td>{c.contractNo}</td>
                  <td>{c.companyName}</td>
                  <td className="text-center">{c.employees}</td>
                  <td>{c.contractObject}</td>
                </tr>
              ))}
              <tr className="total-row">
                <td colSpan={2}><strong>TOTAL QUADRO DE EMPREITEIROS</strong></td>
                <td className="text-center"><strong>{totalContractorStaff}</strong></td>
                <td></td>
              </tr>
              <tr className="total-row">
                <td colSpan={2}><strong>TOTAL QUADRO CONCRETA + TOTAL QUADRO DE EMPREITEIROS</strong></td>
                <td className="text-center"><strong>{totalStaff + totalContractorStaff}</strong></td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Page 5 - Equipment */}
      {(show('equipmentJpl') && activeEquipment.length > 0) || (show('leasedEquipment') && activeLeasedEquipment.length > 0) ? (
        <div className="page-break-before page-section">
          {show('equipmentJpl') && activeEquipment.length > 0 && (
            <table style={{ marginBottom: 8 }}>
              <thead>
                <tr><th colSpan={5} className="section-header">ACOMPANHAMENTO DE EQUIPAMENTOS - TBL</th></tr>
                <tr>
                  <th>Quantidade</th>
                  <th>Equipamento / Veículo</th>
                  <th>Prefixos / Identificação</th>
                  <th>Operando</th>
                  <th>Parado</th>
                </tr>
              </thead>
              <tbody>
                {activeEquipment.map((eq, i) => (
                  <tr key={i}>
                    <td className="text-center">{eq.quantity}</td>
                    <td>{eq.equipment}</td>
                    <td>{eq.identification}</td>
                    <td className="text-center">{eq.operating ? 'X' : ''}</td>
                    <td className="text-center">{eq.stopped ? 'X' : ''}</td>
                  </tr>
                ))}
                <tr className="total-row">
                  <td className="text-center"><strong>{totalEquipment}</strong></td>
                  <td colSpan={2}><strong>TOTAL QUADRO DE EQUIPAMENTOS CONCRETA</strong></td>
                  <td colSpan={2}></td>
                </tr>
              </tbody>
            </table>
          )}

          {show('leasedEquipment') && activeLeasedEquipment.length > 0 && (
            <table>
              <thead>
                <tr><th colSpan={7} className="section-header">ACOMPANHAMENTO DE EQUIPAMENTOS - LOCADOS</th></tr>
                <tr>
                  <th>Contrato nº</th>
                  <th>Equipamento / Veículo</th>
                  <th>Identificação</th>
                  <th>Quant.</th>
                  <th>Propriedade</th>
                  <th>Operando</th>
                  <th>Parado</th>
                </tr>
              </thead>
              <tbody>
                {activeLeasedEquipment.map((eq, i) => (
                  <tr key={i}>
                    <td>{eq.contractNo}</td>
                    <td>{eq.equipment}</td>
                    <td>{eq.identification}</td>
                    <td className="text-center">{eq.quantity}</td>
                    <td>{eq.ownership}</td>
                    <td className="text-center">{eq.operating ? 'X' : ''}</td>
                    <td className="text-center">{eq.stopped ? 'X' : ''}</td>
                  </tr>
                ))}
                <tr className="total-row">
                  <td colSpan={3}><strong>TOTAL QUADRO DE EQUIPAMENTOS LOCADOS</strong></td>
                  <td className="text-center"><strong>{totalLeasedEquipment}</strong></td>
                  <td colSpan={3}></td>
                </tr>
                <tr className="total-row">
                  <td colSpan={3}><strong>TOTAL EQUIPAMENTOS CONCRETA + EQUIPAMENTOS LOCADOS</strong></td>
                  <td className="text-center"><strong>{totalEquipment + totalLeasedEquipment}</strong></td>
                  <td colSpan={3}></td>
                </tr>
              </tbody>
            </table>
          )}
        </div>
      ) : null}

      {/* Page 6 - Executed Services */}
      {show('executed') && activeExecuted.length > 0 && (
        <div className="page-break-before page-section">
          <table>
            <thead>
              <tr>
                <th colSpan={7} className="section-header">SERVIÇOS EXECUTADOS</th>
                <th colSpan={3} style={{ fontSize: '6pt' }}>Produção: {formatDateBR(serviceDate)}</th>
              </tr>
              <tr>
                <th rowSpan={2}>Equipe<br/>Execução</th>
                <th rowSpan={2}>Projeto</th>
                <th colSpan={2}>Serviço</th>
                <th rowSpan={2}>UN</th>
                <th rowSpan={2}>Km<br/>Inicial</th>
                <th rowSpan={2}>Km<br/>Final</th>
                <th>Executado</th>
                <th>Executado</th>
                <th>Previsto</th>
              </tr>
              <tr>
                <th>Descrição</th>
                <th>Detalhamento</th>
                <th>Dia</th>
                <th>Mês</th>
                <th>Mês</th>
              </tr>
            </thead>
            <tbody>
              {activeExecuted.map((s, i) => (
                <tr key={i}>
                  <td style={{ fontSize: '6pt', fontWeight: 'bold' }}>{s.team}</td>
                  <td style={{ fontSize: '6pt' }}>{s.project}</td>
                  <td style={{ fontSize: '6pt' }}>{s.description}</td>
                  <td style={{ fontSize: '6pt' }}>{s.detail}</td>
                  <td className="text-center" style={{ fontSize: '6pt' }}>{s.unit}</td>
                  <td className="text-center" style={{ fontSize: '6pt' }}>{s.kmStart}</td>
                  <td className="text-center" style={{ fontSize: '6pt' }}>{s.kmEnd}</td>
                  <td className="text-center" style={{ fontSize: '6pt' }}>{fmt(s.executedDay)}</td>
                  <td className="text-center" style={{ fontSize: '6pt' }}>{fmt(s.executedMonth)}</td>
                  <td className="text-center" style={{ fontSize: '6pt' }}>{s.plannedMonth ? fmt(s.plannedMonth) : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Page 7 - Financial Control */}
      {show('financial') && (
        <div className="page-break-before page-section">
          <table className="financial-section">
            <thead>
              <tr>
                <th colSpan={4} className="section-header">CONTROLE FINANCEIRO</th>
                <th colSpan={2} style={{ fontSize: '6pt' }}>Produção: {formatDateBR(serviceDate)}</th>
              </tr>
              <tr>
                <th rowSpan={2}>Grupo de Produção</th>
                <th>Dia</th>
                <th>Acumulado Mensal</th>
                <th>Planejado Mensal</th>
                <th rowSpan={2} colSpan={2}>Gráfico Financeiro</th>
              </tr>
              <tr>
                <th>(R$)</th>
                <th>(R$)</th>
                <th>(R$)</th>
              </tr>
            </thead>
            <tbody>
              {financialData.map(f => {
                const pct = f.plannedValue > 0 ? Math.round((f.monthValue / f.plannedValue) * 100) : 0;
                return (
                  <tr key={f.group}>
                    <td className="text-left">{f.group}</td>
                    <td>{fmtCur(f.dayValue)}</td>
                    <td>{fmtCur(f.monthValue)}</td>
                    <td>{fmtCur(f.plannedValue)}</td>
                    <td colSpan={2}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <div style={{ flex: 1, height: 8, background: '#e0e0e0', borderRadius: 1 }}>
                          <div style={{ width: `${Math.min(pct, 100)}%`, height: '100%', background: '#1a237e', borderRadius: 1 }}></div>
                        </div>
                        <span style={{ fontSize: '6pt' }}>{pct}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
              <tr className="total-row">
                <td className="text-left"><strong>TOTAL</strong></td>
                <td><strong>{fmtCur(financialTotal.dayValue)}</strong></td>
                <td><strong>{fmtCur(financialTotal.monthValue)}</strong></td>
                <td><strong>{fmtCur(financialTotal.plannedValue)}</strong></td>
                <td colSpan={2}>
                  {(() => {
                    const pct = financialTotal.plannedValue > 0 ? Math.round((financialTotal.monthValue / financialTotal.plannedValue) * 100) : 0;
                    return (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <div style={{ flex: 1, height: 8, background: '#e0e0e0', borderRadius: 1 }}>
                          <div style={{ width: `${Math.min(pct, 100)}%`, height: '100%', background: '#1a237e', borderRadius: 1 }}></div>
                        </div>
                        <span style={{ fontSize: '6pt' }}>{pct}%</span>
                      </div>
                    );
                  })()}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Page 8 - Observations */}
      {show('observations') && diary.observations?.trim() && (
        <div className="page-break-before page-section">
          <table>
            <thead>
              <tr><th className="section-header">OBSERVAÇÕES</th></tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ minHeight: 100, whiteSpace: 'pre-wrap', padding: 8, verticalAlign: 'top', fontSize: '8pt' }}>
                  {diary.observations}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Page 9 - Photos */}
      {show('photos') && diary.photos.length > 0 && (
        <div className="page-break-before page-section">
          <p style={{ fontWeight: 'bold', marginBottom: 4, fontSize: '8pt' }}>Fotos:</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4 }}>
            {diary.photos.map((photo, i) => (
              <div key={photo.id} style={{ border: '1px solid #333', padding: 2, background: '#e8eaf6' }}>
                <img src={photo.dataUrl} alt={`Foto ${i + 1}`} style={{ width: '100%', height: 80, objectFit: 'cover' }} />
                <div style={{ fontSize: '6pt', padding: '2px 4px' }}>
                  <div><strong>Rodovia:</strong> {photo.highway}</div>
                  <div><strong>Km:</strong> {photo.km}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DiaryPrintLayoutFixed;
