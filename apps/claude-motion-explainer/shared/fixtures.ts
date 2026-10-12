export type Fixture = {
  id: string
  propertyName: string
  csv: string
  bullets: string
}

const mapleCsv = `# Maple Court Plaza
unit,tenant,sqft,rent,lease_end,status
101,Northwind Coffee,1400,4900,2027-03-31,occupied
102,Lumen Dental,2200,7700,2028-06-30,occupied
103,,900,0,,vacant
104,Birch & Co. Books,1800,5400,2026-12-15,occupied
105,Halcyon Yoga,1600,4800,2027-01-20,occupied
201,Parcel & Post,2400,7200,2029-04-01,occupied
202,,1100,0,,vacant`

const mapleBullets = `# Maple Court Plaza
- 101, Northwind Coffee, 1400 sqft, $4900, 2027-03-31, occupied
- 102, Lumen Dental, 2200 sqft, $7700, 2028-06-30, occupied
- 103, vacant, 900 sqft
- 104, Birch & Co. Books, 1800 sqft, $5400, 2026-12-15, occupied
- 105, Halcyon Yoga, 1600 sqft, $4800, 2027-01-20, occupied
- 201, Parcel & Post, 2400 sqft, $7200, 2029-04-01, occupied
- 202, vacant, 1100 sqft`

const riverbendCsv = `# Riverbend Commons
unit,tenant,sqft,rent,lease_end,status
A,Cedar Clinic,3200,9600,2027-02-01,occupied
B,Moss Market,2100,6300,2026-11-30,occupied
C,,1500,0,,vacant
D,Kindred Kids,1800,4500,2028-09-01,occupied
E,,900,0,,vacant
F,Orbit Optics,2500,8750,2027-08-15,occupied`

const riverbendBullets = `# Riverbend Commons
- A, Cedar Clinic, 3200 sqft, $9600, 2027-02-01, occupied
- B, Moss Market, 2100 sqft, $6300, 2026-11-30, occupied
- C, vacant, 1500 sqft
- D, Kindred Kids, 1800 sqft, $4500, 2028-09-01, occupied
- E, vacant, 900 sqft
- F, Orbit Optics, 2500 sqft, $8750, 2027-08-15, occupied`

const harborCsv = `# Harbor Point Retail
unit,tenant,sqft,rent,lease_end,status
R1,Salt & Pine Kitchen,2800,11200,2027-05-01,occupied
R2,,1200,0,,vacant
R3,Drift Goods,1600,5600,2026-10-31,occupied
R4,Lantern Fitness,3400,10200,2029-01-15,occupied
R5,Paper Crane Studio,1100,3300,2027-07-01,occupied`

const harborBullets = `# Harbor Point Retail
- R1, Salt & Pine Kitchen, 2800 sqft, $11,200/mo, 2027-05-01, occupied
- R2, vacant, 1200 sqft
- R3, Drift Goods, 1600 sqft, $5,600/mo, lease end 2026-10-31, occupied
- R4, Lantern Fitness, 3400 sqft, $10200, 2029-01-15, occupied
- R5, Paper Crane Studio, 1100 sqft, $3300, 2027-07-01, occupied`

export const FIXTURES: Fixture[] = [
  {
    id: "maple-court",
    propertyName: "Maple Court Plaza",
    csv: mapleCsv,
    bullets: mapleBullets,
  },
  {
    id: "riverbend",
    propertyName: "Riverbend Commons",
    csv: riverbendCsv,
    bullets: riverbendBullets,
  },
  {
    id: "harbor-point",
    propertyName: "Harbor Point Retail",
    csv: harborCsv,
    bullets: harborBullets,
  },
]
