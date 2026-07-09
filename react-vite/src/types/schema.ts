export interface CaseMaster {
  CaseMasterID: number;
  CrimeNo: string;
  CaseNo: string;
  CrimeRegisteredDate: string;
  PolicePersonID: number;
  PoliceStationID: number;
  CaseCategoryID: number;
  GravityOffenceID: number;
  CrimeMajorHeadID: number;
  CrimeMinorHeadID: number;
  CaseStatusID: number;
  CourtID: number;
}

export interface ComplainantDetails {
  ComplainantID: number;
  CaseMasterID: number;
  ComplainantName: string;
  AgeYear: number;
  OccupationID: number;
  ReligionID: number;
  CasteID: number;
  GenderID: number;
}

export interface Victim {
  VictimMasterID: number;
  CaseMasterID: number;
  VictimName: string;
  AgeYear: number;
  GenderID: number;
  VictimPolice: string;
}

export interface Accused {
  AccusedMasterID: number;
  CaseMasterID: number;
  AccusedName: string;
  AgeYear: number;
  GenderID: number;
  PersonID: string;
}

export interface Act {
  ActCode: string;
  ActDescription: string;
  ShortName: string;
  Active: boolean;
}

export interface Section {
  ActCode: string;
  SectionCode: string;
  SectionDescription: string;
  Active: boolean;
}

export interface ActSectionAssociation {
  CaseMasterID: number;
  ActID: string;
  SectionID: string;
  ActOrderID: number;
  SectionOrderID: number;
}

// Minimal Master Table Types for UI Reference
export interface CaseStatusMaster {
  CaseStatusID: number;
  CaseStatusName: string;
}

export interface Employee {
  EmployeeID: number;
  FirstName: string;
  RankID: number;
}
