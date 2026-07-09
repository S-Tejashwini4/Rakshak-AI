import { CaseMaster, ComplainantDetails, Victim, Accused, ActSectionAssociation, Act, Section, CaseStatusMaster, Employee } from '../types/schema';

// Master Data Lookups
export const STATUS_MASTER: CaseStatusMaster[] = [
  { CaseStatusID: 1, CaseStatusName: 'Under Investigation' },
  { CaseStatusID: 2, CaseStatusName: 'Charge Sheeted' },
  { CaseStatusID: 3, CaseStatusName: 'Closed' }
];

export const EMPLOYEES: Employee[] = [
  { EmployeeID: 101, FirstName: 'Ramesh Kumar', RankID: 4 },
  { EmployeeID: 102, FirstName: 'Suresh Patil', RankID: 3 }
];

// Transactional Data conforming exactly to the ER Diagram Schema
export const CASE_MASTERS: CaseMaster[] = [
  {
    CaseMasterID: 1,
    CrimeNo: '104430006202600001',
    CaseNo: '202600001',
    CrimeRegisteredDate: '2026-07-01T08:30:00Z',
    PolicePersonID: 101,
    PoliceStationID: 40006,
    CaseCategoryID: 1, // FIR
    GravityOffenceID: 1, // Heinous
    CrimeMajorHeadID: 10, // Crimes Against Body
    CrimeMinorHeadID: 101, // Murder
    CaseStatusID: 1, // Under Investigation
    CourtID: 501
  },
  {
    CaseMasterID: 2,
    CrimeNo: '104430006202600002',
    CaseNo: '202600002',
    CrimeRegisteredDate: '2026-07-02T14:15:00Z',
    PolicePersonID: 102,
    PoliceStationID: 40006,
    CaseCategoryID: 1,
    GravityOffenceID: 2, // Non-Heinous
    CrimeMajorHeadID: 20, // Crimes Against Property
    CrimeMinorHeadID: 205, // Cyber Theft
    CaseStatusID: 2, // Charge Sheeted
    CourtID: 501
  },
  {
    CaseMasterID: 3,
    CrimeNo: '104430006202600003',
    CaseNo: '202600003',
    CrimeRegisteredDate: '2026-07-03T09:00:00Z',
    PolicePersonID: 101,
    PoliceStationID: 40006,
    CaseCategoryID: 1,
    GravityOffenceID: 1, 
    CrimeMajorHeadID: 30, // Financial Fraud
    CrimeMinorHeadID: 301, // Embezzlement
    CaseStatusID: 1, 
    CourtID: 502
  },
  {
    CaseMasterID: 4,
    CrimeNo: '104430006202600004',
    CaseNo: '202600004',
    CrimeRegisteredDate: '2026-07-03T11:45:00Z',
    PolicePersonID: 102,
    PoliceStationID: 40006,
    CaseCategoryID: 1,
    GravityOffenceID: 2, 
    CrimeMajorHeadID: 10, 
    CrimeMinorHeadID: 102, // Assault
    CaseStatusID: 1, 
    CourtID: 501
  },
  {
    CaseMasterID: 5,
    CrimeNo: '304430006202600005', // UDR
    CaseNo: '202600005',
    CrimeRegisteredDate: '2026-07-03T16:20:00Z',
    PolicePersonID: 101,
    PoliceStationID: 40006,
    CaseCategoryID: 3, // UDR
    GravityOffenceID: 2, 
    CrimeMajorHeadID: 40, // Missing Person
    CrimeMinorHeadID: 401,
    CaseStatusID: 1, 
    CourtID: 503
  }
];

export const ACCUSED_LIST: Accused[] = [
  { AccusedMasterID: 1, CaseMasterID: 1, AccusedName: 'Unknown', AgeYear: 0, GenderID: 3, PersonID: 'A1' },
  { AccusedMasterID: 2, CaseMasterID: 2, AccusedName: 'Ravi Kumar', AgeYear: 34, GenderID: 1, PersonID: 'A1' },
  { AccusedMasterID: 3, CaseMasterID: 3, AccusedName: 'Priya Desai', AgeYear: 41, GenderID: 2, PersonID: 'A1' },
  { AccusedMasterID: 4, CaseMasterID: 4, AccusedName: 'John Doe', AgeYear: 29, GenderID: 1, PersonID: 'A1' }
];

export const VICTIMS: Victim[] = [
  { VictimMasterID: 1, CaseMasterID: 1, VictimName: 'Suresh M', AgeYear: 45, GenderID: 1, VictimPolice: '0' },
  { VictimMasterID: 2, CaseMasterID: 2, VictimName: 'Anita H', AgeYear: 28, GenderID: 2, VictimPolice: '0' },
  { VictimMasterID: 3, CaseMasterID: 3, VictimName: 'Tech Corp Ltd', AgeYear: 0, GenderID: 3, VictimPolice: '0' },
  { VictimMasterID: 4, CaseMasterID: 4, VictimName: 'Ramesh Singh', AgeYear: 55, GenderID: 1, VictimPolice: '0' }
];

export const COMPLAINANTS: ComplainantDetails[] = [
  { ComplainantID: 1, CaseMasterID: 1, ComplainantName: 'Ramu K', AgeYear: 50, OccupationID: 5, ReligionID: 1, CasteID: 1, GenderID: 1 },
  { ComplainantID: 2, CaseMasterID: 2, ComplainantName: 'Bank Manager SBI', AgeYear: 40, OccupationID: 2, ReligionID: 1, CasteID: 1, GenderID: 1 },
  { ComplainantID: 3, CaseMasterID: 3, ComplainantName: 'Sarah Connor', AgeYear: 35, OccupationID: 3, ReligionID: 2, CasteID: 2, GenderID: 2 },
  { ComplainantID: 4, CaseMasterID: 4, ComplainantName: 'Arjun P', AgeYear: 28, OccupationID: 1, ReligionID: 1, CasteID: 3, GenderID: 1 },
  { ComplainantID: 5, CaseMasterID: 5, ComplainantName: 'Meera V', AgeYear: 45, OccupationID: 4, ReligionID: 1, CasteID: 1, GenderID: 2 }
];

export const ACTS: Act[] = [
  { ActCode: 'IPC', ActDescription: 'Indian Penal Code', ShortName: 'IPC', Active: true },
  { ActCode: 'ITACT', ActDescription: 'Information Technology Act', ShortName: 'IT Act', Active: true }
];

export const SECTIONS: Section[] = [
  { ActCode: 'IPC', SectionCode: '302', SectionDescription: 'Punishment for murder', Active: true },
  { ActCode: 'ITACT', SectionCode: '66D', SectionDescription: 'Punishment for cheating by personation by using computer resource', Active: true }
];

export const ACT_SECTIONS: ActSectionAssociation[] = [
  { CaseMasterID: 1, ActID: 'IPC', SectionID: '302', ActOrderID: 1, SectionOrderID: 1 },
  { CaseMasterID: 2, ActID: 'ITACT', SectionID: '66D', ActOrderID: 1, SectionOrderID: 1 }
];

// Helper to generate the React Flow network from schema relationships
export const generateNetworkFromCase = (caseId: number) => {
  const nodes: any[] = [];
  const edges: any[] = [];

  const addCaseNetwork = (cId: number, offsetX = 0, offsetY = 0) => {
    const cMaster = CASE_MASTERS.find(c => c.CaseMasterID === cId);
    if (!cMaster) return;

    // Node Styles
    const caseStyle = { backgroundColor: '#1e3a8a', color: 'white', border: '2px solid #3b82f6', borderRadius: '12px', padding: '12px', fontWeight: 'bold', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)' };
    const accusedStyle = { backgroundColor: '#7f1d1d', color: 'white', border: '2px solid #ef4444', borderRadius: '50%', width: 90, height: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', fontSize: '11px', boxShadow: '0 4px 6px -1px rgba(239, 68, 68, 0.3)' };
    const victimStyle = { backgroundColor: '#14532d', color: 'white', border: '2px solid #22c55e', borderRadius: '8px', padding: '10px', fontSize: '12px' };
    const compStyle = { backgroundColor: '#713f12', color: 'white', border: '2px solid #eab308', borderRadius: '8px', padding: '10px', fontSize: '12px' };
    const evidStyle = { backgroundColor: '#374151', color: '#e5e7eb', border: '1px dashed #9ca3af', borderRadius: '4px', padding: '8px', fontSize: '11px' };

    const caseNodeId = `case-${cMaster.CaseMasterID}`;
    nodes.push({ 
      id: caseNodeId, 
      position: { x: 400 + offsetX, y: 300 + offsetY }, 
      data: { label: `FIR: ${cMaster.CrimeNo}`, type: 'case', details: cMaster }, 
      style: caseStyle 
    });

    const caseAccused = ACCUSED_LIST.filter(a => a.CaseMasterID === cId);
    caseAccused.forEach((a, i) => {
      const accId = `accused-${a.AccusedMasterID}`;
      nodes.push({ 
        id: accId, 
        position: { x: 200 + offsetX, y: 100 + (i * 150) + offsetY }, 
        data: { label: `Suspect\n${a.AccusedName}`, type: 'accused', details: a }, 
        style: accusedStyle 
      });
      edges.push({ id: `e-${caseNodeId}-${accId}`, source: caseNodeId, target: accId, label: 'Accused In', animated: true, style: { stroke: '#ef4444', strokeWidth: 2 } });
    });

    const caseVictims = VICTIMS.filter(v => v.CaseMasterID === cId);
    caseVictims.forEach((v, i) => {
      const vicId = `victim-${v.VictimMasterID}`;
      nodes.push({ 
        id: vicId, 
        position: { x: 600 + offsetX, y: 150 + (i * 100) + offsetY }, 
        data: { label: `Victim: ${v.VictimName}`, type: 'victim', details: v }, 
        style: victimStyle 
      });
      edges.push({ id: `e-${caseNodeId}-${vicId}`, source: caseNodeId, target: vicId, label: 'Victim Of', style: { stroke: '#22c55e' } });
    });

    const caseComplainants = COMPLAINANTS.filter(c => c.CaseMasterID === cId);
    caseComplainants.forEach((c, i) => {
      const compId = `comp-${c.ComplainantID}`;
      nodes.push({ 
        id: compId, 
        position: { x: 400 + offsetX, y: 100 + (i * 100) + offsetY }, 
        data: { label: `Complainant: ${c.ComplainantName}`, type: 'complainant', details: c }, 
        style: compStyle 
      });
      edges.push({ id: `e-${compId}-${caseNodeId}`, source: compId, target: caseNodeId, label: 'Filed By', style: { stroke: '#eab308' } });
    });

    // Evidences will now be dynamically injected by Network.tsx based on the Timeline Store!
  };

  if (caseId === 0) {
    // Global Network View
    addCaseNetwork(1, 0, 0);
    addCaseNetwork(2, 600, 200);
    addCaseNetwork(3, -400, 200);

    // Inject hidden syndicate links
    const syndicateStyle = { backgroundColor: '#4c1d95', color: 'white', border: '2px solid #8b5cf6', borderRadius: '50%', width: 100, height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', fontSize: '12px', fontWeight: 'bold' };
    
    nodes.push({
      id: 'syndicate-alpha',
      position: { x: 250, y: -50 },
      data: { label: 'Syndicate Alpha\n(Organized Crime)', type: 'syndicate' },
      style: syndicateStyle
    });

    edges.push({ id: 'e-syn-acc1', source: 'syndicate-alpha', target: 'accused-1', label: 'Known Associate', animated: true, style: { stroke: '#8b5cf6', strokeWidth: 3 } });
    edges.push({ id: 'e-syn-acc2', source: 'syndicate-alpha', target: 'accused-2', label: 'Financial Link', animated: true, style: { stroke: '#8b5cf6', strokeWidth: 3 } });
    edges.push({ id: 'e-syn-acc3', source: 'syndicate-alpha', target: 'accused-3', label: 'Operations Lead', animated: true, style: { stroke: '#8b5cf6', strokeWidth: 3 } });

  } else {
    addCaseNetwork(caseId, 0, 0);
  }

  return { nodes, edges };
};

// Legacy Data for Dashboard Charts
export const KPI_DATA = {
  totalFirs: 12450,
  activeCases: 3421,
  solvedCases: 8902,
  pendingInvestigation: 127,
  repeatOffenders: 456,
  crimeHotspots: 12
};

export const MONTHLY_CRIME_DATA = [
  { name: 'Jan', cyber: 400, theft: 240, assault: 240 },
  { name: 'Feb', cyber: 300, theft: 139, assault: 221 },
  { name: 'Mar', cyber: 200, theft: 980, assault: 229 },
  { name: 'Apr', cyber: 278, theft: 390, assault: 200 }
];

export const RECENT_ACTIVITIES = [
  { id: 1, type: 'info', message: 'FIR 104430006202600001 status updated to Under Investigation', time: '10 mins ago' },
  { id: 2, type: 'warning', message: 'New Act added to FIR 104430006202600002 (IT Act Sec 66D)', time: '2 hours ago' }
];

export const INVESTIGATOR_CASES: any[] = [];

export const SUPERVISOR_TEAMS = [
  { id: 1, name: 'Unit Alpha (Cyber)', lead: 'Insp. Ramesh K', clearance: 85, activeCases: 24 },
  { id: 2, name: 'Unit Beta (Homicide)', lead: 'Insp. Suresh P', clearance: 60, activeCases: 12 },
  { id: 3, name: 'Unit Gamma (Theft)', lead: 'Insp. Anita H', clearance: 92, activeCases: 45 }
];
