-- Karnataka Police Department FIR System ER Schema (Catalyst Reference)

CREATE TABLE CaseMaster (
    CaseMasterID INT PRIMARY KEY,
    CrimeNo VARCHAR(255),
    CaseNo VARCHAR(255),
    CrimeRegisteredDate DATETIME,
    PolicePersonID INT,
    PoliceStationID INT,
    CaseCategoryID INT,
    GravityOffenceID INT,
    CrimeMajorHeadID INT,
    CrimeMinorHeadID INT,
    CaseStatusID INT,
    CourtID INT
);

CREATE TABLE ComplainantDetails (
    ComplainantID INT PRIMARY KEY,
    CaseMasterID INT,
    ComplainantName VARCHAR(255),
    AgeYear INT,
    OccupationID INT,
    ReligionID INT,
    CasteID INT,
    GenderID INT
);

CREATE TABLE ActSectionAssociation (
    CaseMasterID INT,
    ActID INT,
    SectionID INT,
    ActOrderID INT,
    SectionOrderID INT
);

CREATE TABLE Victim (
    VictimMasterID INT PRIMARY KEY,
    CaseMasterID INT,
    VictimName VARCHAR(255),
    AgeYear INT,
    GenderID INT,
    VictimPolice VARCHAR(1)
);

CREATE TABLE Accused (
    AccusedMasterID INT PRIMARY KEY,
    CaseMasterID INT,
    AccusedName VARCHAR(255),
    AgeYear INT,
    GenderID INT,
    PersonID VARCHAR(50)
);

CREATE TABLE ArrestSurrender (
    ArrestSurrenderID INT PRIMARY KEY,
    CaseMasterID INT,
    ArrestSurrenderTypeID INT,
    ArrestSurrenderDate DATETIME,
    ArrestSurrenderStateId INT,
    ArrestSurrenderDistrictId INT,
    PoliceStationID INT,
    IOID INT,
    CourtID INT,
    AccusedMasterID INT,
    IsAccused BIT,
    IsComplainantAccused BIT
);

CREATE TABLE Act (
    ActCode VARCHAR(50) PRIMARY KEY,
    ActDescription VARCHAR(500),
    ShortName VARCHAR(50),
    Active BIT
);

CREATE TABLE Section (
    ActCode VARCHAR(50),
    SectionCode VARCHAR(50),
    SectionDescription VARCHAR(500),
    Active BIT
);

CREATE TABLE CrimeHeadActSection (
    CrimeHeadID INT,
    ActCode VARCHAR(50),
    SectionCode VARCHAR(50)
);

CREATE TABLE CrimeHead (
    CrimeHeadID INT PRIMARY KEY,
    CrimeGroupName VARCHAR(255),
    Active BIT
);

CREATE TABLE CrimeSubHead (
    CrimeSubHeadID INT PRIMARY KEY,
    CrimeHeadID INT,
    CrimeHeadName VARCHAR(255),
    SeqID INT
);

-- Master Tables
CREATE TABLE CasteMaster (
    caste_master_id INT PRIMARY KEY,
    caste_master_name VARCHAR(100)
);

CREATE TABLE ReligionMaster (
    ReligionID INT PRIMARY KEY,
    ReligionName VARCHAR(100)
);

CREATE TABLE OccupationMaster (
    OccupationID INT PRIMARY KEY,
    OccupationName VARCHAR(100)
);

CREATE TABLE CaseStatusMaster (
    CaseStatusID INT PRIMARY KEY,
    CaseStatusName VARCHAR(100)
);

CREATE TABLE Court (
    CourtID INT PRIMARY KEY,
    CourtName VARCHAR(255),
    DistrictID INT,
    StateID INT,
    Active BIT
);

CREATE TABLE Employee (
    EmployeeID INT PRIMARY KEY,
    DistrictID INT,
    UnitID INT,
    RankID INT,
    DesignationID INT,
    KGID VARCHAR(50),
    FirstName VARCHAR(255),
    EmployeeDOB DATETIME,
    GenderID INT,
    BloodGroupID INT,
    PhysicallyChallenged BIT,
    AppointmentDate DATETIME
);
