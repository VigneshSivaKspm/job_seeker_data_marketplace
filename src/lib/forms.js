export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const URL_RE = /^https?:\/\/[^\s/$.?#][^\s]*\.[^\s]{2,}$/i;

export const EMPTY_FORM = {
  name: '', email: '', phone: '', currentLocation: '', preferredLocation: '',
  industry: '', role: '', experience: '', years: '', education: '', skills: [],
  noticePeriod: '', ctcUnit: 'INR_LPA', ctcAmount: '', resume: '',
};

/** sections: array of 1 (personal) | 2 (professional) | 3 (job search) */
export function validateCandidate(f, sections) {
  const e = {};
  if (sections.includes(1)) {
    if (f.name.trim().length < 2) e.name = 'Enter your full name';
    if (!EMAIL_RE.test(f.email.trim())) e.email = 'Enter a valid email address';
    if (f.phone.replace(/\D/g, '').length < 10) e.phone = 'Enter a valid phone number (10+ digits)';
    if (!f.currentLocation.trim()) e.currentLocation = 'Current location is required';
    if (!f.preferredLocation.trim()) e.preferredLocation = 'Preferred work location is required';
  }
  if (sections.includes(2)) {
    if (!f.industry) e.industry = 'Select your industry';
    if (!f.role) e.role = 'Select your primary job role';
    if (!f.experience) e.experience = 'Select your experience level';
    if (f.years === '' || Number(f.years) < 0 || Number(f.years) > 50) e.years = 'Enter years (0–50)';
    if (!f.education) e.education = 'Select your highest education';
    if (!f.skills.length) e.skills = 'Add at least one skill';
  }
  if (sections.includes(3)) {
    if (!f.noticePeriod) e.noticePeriod = 'Select your notice period';
    if (f.ctcAmount === '' || !(Number(f.ctcAmount) > 0)) e.ctcAmount = 'Enter a positive amount';
    if (!URL_RE.test(f.resume.trim())) e.resume = 'Enter a valid link starting with http:// or https://';
  }
  return e;
}

export const toCandidateData = (f) => ({
  ...f,
  name: f.name.trim(), email: f.email.trim(), phone: f.phone.trim(),
  currentLocation: f.currentLocation.trim(), preferredLocation: f.preferredLocation.trim(),
  years: Number(f.years), ctcAmount: Number(f.ctcAmount), resume: f.resume.trim(),
});

export function validateCheckout(f, method) {
  const e = {};
  if (f.name.trim().length < 2) e.name = 'Enter your full name';
  if (!EMAIL_RE.test(f.email)) e.email = 'Enter a valid work email';
  if (f.company.trim().length < 2) e.company = 'Enter your company name';
  if (method === 'Credit Card') {
    if (!/^\d{15,16}$/.test(f.card.replace(/\s/g, ''))) e.card = 'Enter a valid 15–16 digit card number';
    if (f.cardName.trim().length < 2) e.cardName = 'Name on card is required';
    const m = f.expiry.match(/^(\d{2})\/(\d{2})$/);
    if (!m || +m[1] < 1 || +m[1] > 12) e.expiry = 'Use MM/YY';
    else if (new Date(2000 + +m[2], +m[1], 1) <= new Date()) e.expiry = 'Card has expired';
    if (!/^\d{3,4}$/.test(f.cvv)) e.cvv = '3–4 digits';
  }
  if (method === 'UPI' && !/^[\w.-]{2,}@[a-zA-Z]{2,}$/.test(f.upi)) e.upi = 'Enter a valid UPI ID, e.g. name@okbank';
  if (method === 'Bank Transfer' && !/^[A-Za-z0-9]{8,}$/.test(f.utr)) e.utr = 'Enter the 8+ character transfer reference (UTR)';
  return e;
}
