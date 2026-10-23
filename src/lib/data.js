/* ------------------------------ CONSTANTS ------------------------------- */

export const EXP_LEVELS = ['Entry', 'Mid', 'Senior', 'Lead'];
export const NOTICE_PERIODS = ['Immediate', '15 Days', '30 Days', '60+ Days'];
export const EDUCATION_LEVELS = [
  'High School / Diploma', "Bachelor's Degree", "Master's Degree", 'MBA', 'PhD', 'Professional Certification',
];
export const STATUSES = ['Active', 'Pending Verification', 'Sold Out'];
export const PAYMENT_METHODS = ['Credit Card', 'UPI', 'Bank Transfer'];

export const CTC_UNITS = {
  INR_LPA: { label: '₹ per year (LPA)', hint: 'e.g. 18 for ₹18 LPA', fmt: (n) => `₹${n} LPA` },
  INR_MONTH: { label: '₹ per month', hint: 'e.g. 85000', fmt: (n) => `₹${Number(n).toLocaleString('en-IN')}/mo` },
  INR_HR: { label: '₹ per hour', hint: 'e.g. 1500', fmt: (n) => `₹${Number(n).toLocaleString('en-IN')}/hr` },
};

export const SOUTH_INDIA =
  /(bengaluru|bangalore|chennai|hyderabad|kochi|cochin|coimbatore|thiruvananthapuram|trivandrum|visakhapatnam|mysuru|mysore|madurai|kozhikode|mangaluru|vijayawada)/i;

export const PRICE_TIERS = [
  { id: 'Budget', range: 'Under ₹25', test: (p) => p < 25 },
  { id: 'Standard', range: '₹25 – ₹59', test: (p) => p >= 25 && p < 60 },
  { id: 'Premium', range: '₹60 and above', test: (p) => p >= 60 },
];

export const PROMOS = {
  WELCOME10: { pct: 10, min: 0, label: '10% off any order' },
  SAVE15: { pct: 15, min: 200, label: '15% off orders over ₹200' },
  HIRE25: { pct: 25, min: 500, label: '25% off orders over ₹500' },
};

export const SKILL_SUGGESTIONS = {
  it: ['React', 'TypeScript', 'Node.js', 'AWS', 'Kubernetes', 'Python', 'SQL', 'Figma', 'Docker', 'GraphQL'],
  health: ['Patient Care', 'EHR', 'ICD-10 Coding', 'Clinical Trials', 'GCP', 'ICU', 'HIPAA', 'Pharmacovigilance'],
  fin: ['Credit Risk', 'Basel III', 'GST', 'Tally', 'IFRS', 'SAS', 'Financial Modelling', 'AML / KYC', 'Excel'],
  retail: ['SEO', 'Performance Marketing', 'Merchandising', 'Shopify', 'CRM', 'Inventory Planning', 'Analytics'],
  logi: ['Route Optimisation', 'SAP SCM', 'WMS', 'Procurement', 'Fleet Telematics', 'Forecasting', 'Six Sigma'],
  mfg: ['Lean', 'Six Sigma', 'AutoCAD', 'PLC', 'CNC', 'ISO 9001', 'Root Cause Analysis', 'SolidWorks'],
};
export const GENERIC_SKILLS = ['Communication', 'Project Management', 'MS Excel', 'Leadership', 'Data Analysis'];

/* ------------------------------ SEED DATA ------------------------------- */

export const INITIAL_CATEGORIES = [
  { id: 'it', color: 'indigo', name: 'IT & Software', rarity: 1.2, roles: ['Frontend Engineer', 'Backend Engineer', 'DevOps Engineer', 'Product Manager', 'Data Scientist', 'QA Automation Engineer'] },
  { id: 'health', color: 'rose', name: 'Healthcare', rarity: 1.3, roles: ['Registered Nurse', 'Clinical Research Associate', 'Medical Coder', 'Healthcare Administrator', 'Pharmacist'] },
  { id: 'fin', color: 'emerald', name: 'Banking & Finance', rarity: 1.2, roles: ['Credit Risk Analyst', 'Tax Accountant', 'Investment Analyst', 'Compliance Officer', 'Financial Controller'] },
  { id: 'retail', color: 'amber', name: 'Retail & E-Commerce', rarity: 1.0, roles: ['Category Manager', 'Growth Marketer', 'Customer Success Lead', 'Store Operations Manager', 'Merchandiser'] },
  { id: 'logi', color: 'sky', name: 'Logistics', rarity: 1.0, roles: ['Supply Chain Analyst', 'Fleet Manager', 'Warehouse Supervisor', 'Procurement Specialist'] },
  { id: 'mfg', color: 'violet', name: 'Manufacturing', rarity: 1.0, roles: ['Production Engineer', 'Quality Assurance Manager', 'Maintenance Technician', 'Plant Manager', 'CNC Programmer'] },
];

export const INITIAL_PRICING = { base: { Entry: 15, Mid: 30, Senior: 60, Lead: 100 } };

export const BUNDLES = [
  { id: 'b-it-south', name: 'Senior Software Talent — South India', blurb: 'Senior & Lead IT professionals based across Bengaluru, Chennai, Hyderabad and Kerala.', discount: 20, industryIds: ['it'], minLevel: 'Senior', south: true },
  { id: 'b-frontend', name: 'Frontend Engineers Starter Pack', blurb: 'Every verified Frontend Engineer profile — all experience levels, all locations.', discount: 15, industryIds: ['it'], roles: ['Frontend Engineer'] },
  { id: 'b-finance', name: 'Finance & Risk Professionals', blurb: 'Credit, tax, investment and compliance talent from banking & finance.', discount: 15, industryIds: ['fin'] },
  { id: 'b-health', name: 'Healthcare Specialists', blurb: 'Nurses, clinical research and healthcare administration candidates.', discount: 18, industryIds: ['health'] },
  { id: 'b-ops', name: 'Operations & Supply Chain', blurb: 'Logistics and manufacturing operators, planners and engineers.', discount: 12, industryIds: ['logi', 'mfg'] },
  { id: 'b-quick', name: 'Quick Joiners — Any Industry', blurb: 'Candidates available Immediately or within 15 days across every industry.', discount: 15, notices: ['Immediate', '15 Days'] },
];

export const daysAgoIso = (d) => new Date(Date.now() - d * 86400000).toISOString();

export const mk = (n, name, email, phone, cur, pref, industry, role, experience, years, education, skills, noticePeriod, ctcUnit, ctcAmount, slug, status, d) => ({
  id: `CND-${n}`, name, email, phone, currentLocation: cur, preferredLocation: pref, industry, role, experience, years,
  education, skills, noticePeriod, ctcUnit, ctcAmount, resume: `https://portfolio.example.com/${slug}`, status, createdAt: daysAgoIso(d),
});

export const SEED_CANDIDATES = [
  mk(1001, 'Vikram Kumar', 'vikram.kumar@gmail.com', '+91 98450 31276', 'Bengaluru, Karnataka', 'Chennai / Remote', 'IT & Software', 'Frontend Engineer', 'Senior', 8, "Master's Degree", ['React', 'TypeScript', 'Next.js', 'Redux', 'Tailwind CSS', 'Jest'], '30 Days', 'INR_LPA', 32, 'vikram-kumar', 'Active', 40),
  mk(1002, 'Priya Nair', 'priya.nair88@gmail.com', '+91 94470 28813', 'Kochi, Kerala', 'Bengaluru / Remote', 'IT & Software', 'Frontend Engineer', 'Senior', 7, "Bachelor's Degree", ['React', 'Vue.js', 'JavaScript', 'GraphQL', 'Accessibility', 'Storybook'], '60+ Days', 'INR_LPA', 28, 'priya-nair', 'Active', 36),
  mk(1003, 'Arjun Reddy', 'arjun.reddy@outlook.com', '+91 99890 44127', 'Hyderabad, Telangana', 'Hyderabad / Remote', 'IT & Software', 'DevOps Engineer', 'Lead', 11, "Master's Degree", ['AWS', 'Kubernetes', 'Terraform', 'CI/CD', 'Prometheus', 'Python'], '60+ Days', 'INR_LPA', 48, 'arjun-reddy', 'Active', 33),
  mk(1004, 'Sneha Iyer', 'sneha.iyer@yahoo.com', '+91 98410 66392', 'Chennai, Tamil Nadu', 'Bengaluru', 'IT & Software', 'Product Manager', 'Mid', 5, 'MBA', ['Roadmapping', 'Agile', 'SQL', 'Figma', 'A/B Testing', 'Stakeholder Mgmt'], '15 Days', 'INR_LPA', 24, 'sneha-iyer', 'Active', 29),
  mk(1005, 'Rahul Verma', 'rahul.verma07@gmail.com', '+91 91675 20458', 'Pune, Maharashtra', 'Pune / Hybrid', 'IT & Software', 'Backend Engineer', 'Entry', 1, "Bachelor's Degree", ['Node.js', 'Express', 'MongoDB', 'REST APIs', 'Docker'], 'Immediate', 'INR_LPA', 7, 'rahul-verma', 'Active', 21),
  mk(1006, 'Meera Krishnan', 'meera.krishnan@gmail.com', '+91 98430 91724', 'Coimbatore, Tamil Nadu', 'Dubai / Bengaluru', 'Healthcare', 'Registered Nurse', 'Mid', 6, "Bachelor's Degree", ['ICU', 'Patient Care', 'BLS / ACLS', 'EHR', 'Triage'], '30 Days', 'INR_LPA', 9, 'meera-krishnan', 'Active', 27),
  mk(1007, 'Anil Menon', 'anil.menon@gmail.com', '+91 94950 73315', 'Thiruvananthapuram, Kerala', 'Bengaluru / Remote', 'Healthcare', 'Clinical Research Associate', 'Senior', 9, "Master's Degree", ['Clinical Trials', 'GCP', 'ICH Guidelines', 'Site Monitoring', 'Pharmacovigilance'], '30 Days', 'INR_LPA', 21, 'anil-menon', 'Active', 25),
  mk(1008, 'Farah Khan', 'farah.khan@outlook.com', '+91 98200 48851', 'Mumbai, Maharashtra', 'Mumbai / Hybrid', 'Banking & Finance', 'Credit Risk Analyst', 'Senior', 7, 'MBA', ['Credit Risk', 'Basel III', 'SAS', 'Python', 'IFRS 9', 'Stress Testing'], '60+ Days', 'INR_LPA', 30, 'farah-khan', 'Active', 22),
  mk(1009, 'Karthik Subramanian', 'karthik.s@gmail.com', '+91 98840 17269', 'Chennai, Tamil Nadu', 'Chennai', 'Banking & Finance', 'Tax Accountant', 'Mid', 4, "Bachelor's Degree", ['GST', 'Tally', 'IND AS', 'TDS', 'Excel'], '30 Days', 'INR_LPA', 12, 'karthik-subramanian', 'Active', 20),
  mk(1010, 'Ananya Das', 'ananya.das@gmail.com', '+91 98300 55640', 'Kolkata, West Bengal', 'Remote', 'Retail & E-Commerce', 'Growth Marketer', 'Mid', 5, "Bachelor's Degree", ['Performance Marketing', 'SEO', 'Google Ads', 'Shopify', 'Analytics'], 'Immediate', 'INR_LPA', 18, 'ananya-das', 'Active', 18),
  mk(1011, 'Daniel Brooks', 'dbrooks@protonmail.com', '+1 512 555 0147', 'Austin, Texas, USA', 'Remote (US)', 'Retail & E-Commerce', 'Category Manager', 'Lead', 12, 'MBA', ['Merchandising', 'Vendor Negotiation', 'P&L Ownership', 'Pricing Strategy', 'Amazon Marketplace'], '60+ Days', 'INR_LPA', 110, 'daniel-brooks', 'Active', 17),
  mk(1012, 'Suresh Babu', 'suresh.babu@gmail.com', '+91 98490 30912', 'Visakhapatnam, Andhra Pradesh', 'Hyderabad', 'Logistics', 'Supply Chain Analyst', 'Entry', 2, "Bachelor's Degree", ['SAP SCM', 'Forecasting', 'Excel', 'Power BI'], 'Immediate', 'INR_LPA', 6, 'suresh-babu', 'Active', 15),
  mk(1013, 'Lakshmi Narayanan', 'lakshmi.n@yahoo.com', '+91 98410 82276', 'Chennai, Tamil Nadu', 'Chennai / Coimbatore', 'Logistics', 'Fleet Manager', 'Senior', 10, "Bachelor's Degree", ['Fleet Telematics', 'Route Optimisation', 'Vendor Mgmt', 'Compliance', 'Cost Control'], '30 Days', 'INR_LPA', 22, 'lakshmi-narayanan', 'Active', 14),
  mk(1014, 'Imran Sheikh', 'imran.sheikh@gmail.com', '+91 98220 61743', 'Pune, Maharashtra', 'Pune / Nashik', 'Manufacturing', 'Production Engineer', 'Mid', 6, "Bachelor's Degree", ['Lean', 'Six Sigma', 'AutoCAD', 'PLC', 'Kaizen'], '15 Days', 'INR_LPA', 14, 'imran-sheikh', 'Active', 12),
  mk(1015, 'Rohit Jain', 'rohit.jain@outlook.com', '+91 98250 74408', 'Ahmedabad, Gujarat', 'Pune / Gujarat', 'Manufacturing', 'Quality Assurance Manager', 'Lead', 14, "Master's Degree", ['ISO 9001', 'IATF 16949', 'Root Cause Analysis', 'Supplier Audits', 'SPC'], '60+ Days', 'INR_LPA', 38, 'rohit-jain', 'Active', 11),
  mk(1016, 'Sarah Mitchell', 'sarah.mitchell@gmail.com', '+1 416 555 0193', 'Toronto, Canada', 'Remote', 'IT & Software', 'Data Scientist', 'Mid', 5, "Master's Degree", ['Python', 'PyTorch', 'SQL', 'MLOps', 'Statistics', 'Airflow'], '15 Days', 'INR_HR', 4000, 'sarah-mitchell', 'Active', 9),
  mk(1017, 'Divya Prakash', 'divya.prakash@gmail.com', '+91 98860 25531', 'Bengaluru, Karnataka', 'Bengaluru', 'Healthcare', 'Healthcare Administrator', 'Senior', 9, 'MBA', ['Hospital Operations', 'NABH', 'Revenue Cycle', 'Staff Scheduling', 'EHR'], '30 Days', 'INR_LPA', 20, 'divya-prakash', 'Pending Verification', 2),
  mk(1018, 'Naveen Chandra', 'naveen.chandra@gmail.com', '+91 99000 18847', 'Bengaluru, Karnataka', 'Bengaluru / Hybrid', 'IT & Software', 'Frontend Engineer', 'Mid', 4, "Bachelor's Degree", ['React', 'JavaScript', 'CSS', 'Cypress', 'Webpack'], '15 Days', 'INR_LPA', 16, 'naveen-chandra', 'Sold Out', 8),
  mk(1019, 'Tanvi Shah', 'tanvi.shah@gmail.com', '+91 98190 33057', 'Mumbai, Maharashtra', 'Mumbai', 'Banking & Finance', 'Investment Analyst', 'Entry', 2, 'Professional Certification', ['Financial Modelling', 'CFA Level II', 'Equity Research', 'Excel', 'Bloomberg'], 'Immediate', 'INR_LPA', 10, 'tanvi-shah', 'Active', 6),
  mk(1020, 'Faizal Rahman', 'faizal.rahman@gmail.com', '+91 98470 90386', 'Kochi, Kerala', 'Kochi / Gulf', 'Logistics', 'Procurement Specialist', 'Mid', 6, "Bachelor's Degree", ['Procurement', 'Vendor Negotiation', 'SAP MM', 'Import / Export', 'Cost Savings'], '30 Days', 'INR_LPA', 13, 'faizal-rahman', 'Active', 4),
];


/* Colour themes for industries — literal class names so Tailwind can see them */
export const THEME_KEYS = ['indigo', 'rose', 'emerald', 'amber', 'sky', 'violet', 'fuchsia', 'teal'];
export const THEMES = {
  indigo: { grad: 'from-indigo-500 to-violet-500', soft: 'bg-indigo-50 text-indigo-700', text: 'text-indigo-600', bar: 'bg-indigo-500', border: 'border-indigo-200', hex: '#6366f1' },
  rose: { grad: 'from-rose-500 to-pink-500', soft: 'bg-rose-50 text-rose-700', text: 'text-rose-600', bar: 'bg-rose-500', border: 'border-rose-200', hex: '#f43f5e' },
  emerald: { grad: 'from-emerald-500 to-teal-500', soft: 'bg-emerald-50 text-emerald-700', text: 'text-emerald-600', bar: 'bg-emerald-500', border: 'border-emerald-200', hex: '#10b981' },
  amber: { grad: 'from-amber-500 to-orange-500', soft: 'bg-amber-50 text-amber-700', text: 'text-amber-600', bar: 'bg-amber-500', border: 'border-amber-200', hex: '#f59e0b' },
  sky: { grad: 'from-sky-500 to-blue-500', soft: 'bg-sky-50 text-sky-700', text: 'text-sky-600', bar: 'bg-sky-500', border: 'border-sky-200', hex: '#0ea5e9' },
  violet: { grad: 'from-violet-500 to-fuchsia-500', soft: 'bg-violet-50 text-violet-700', text: 'text-violet-600', bar: 'bg-violet-500', border: 'border-violet-200', hex: '#8b5cf6' },
  fuchsia: { grad: 'from-fuchsia-500 to-pink-500', soft: 'bg-fuchsia-50 text-fuchsia-700', text: 'text-fuchsia-600', bar: 'bg-fuchsia-500', border: 'border-fuchsia-200', hex: '#d946ef' },
  teal: { grad: 'from-teal-500 to-cyan-500', soft: 'bg-teal-50 text-teal-700', text: 'text-teal-600', bar: 'bg-teal-500', border: 'border-teal-200', hex: '#14b8a6' },
};

export const EXP_INFO = {
  Entry: { years: '0–2 yrs', blurb: 'Starting out or early in your career' },
  Mid: { years: '3–6 yrs', blurb: 'Independent contributor with proven delivery' },
  Senior: { years: '7–11 yrs', blurb: 'Deep expertise, mentors others' },
  Lead: { years: '12+ yrs', blurb: 'Leads teams, owns outcomes' },
};

export const ADMIN_CREDENTIALS = { email: 'admin@seekerexchange.com', password: 'Admin@123' };
/* Bulk contact packages: buy credits once, unlock any profile for 1 credit each */
export const INITIAL_PACKAGES = [
  { id: 'pk-50', name: 'Starter', contacts: 50, price: 600, popular: false, tagline: 'Try bulk hiring' },
  { id: 'pk-100', name: 'Growth', contacts: 100, price: 1000, popular: false, tagline: 'For active hiring' },
  { id: 'pk-500', name: 'Pro', contacts: 500, price: 4000, popular: true, tagline: 'Best for agencies' },
  { id: 'pk-1000', name: 'Scale', contacts: 1000, price: 7000, popular: false, tagline: 'High-volume sourcing' },
  { id: 'pk-5000', name: 'Enterprise', contacts: 5000, price: 30000, popular: false, tagline: 'Maximum savings' },
];
export const INITIAL_WALLET = { credits: 0, bought: 0, spent: 0 };