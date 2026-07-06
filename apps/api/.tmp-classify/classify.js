// Rule-based classifier for Indian pharmacy brand names -> category + schedule/Rx.
// Rules are checked in order; first match wins. Fallback = unclassified (left in General).
const RULES = [
  // --- Antibiotics & Anti-infectives (Schedule H, Rx) ---
  { re: /AUGMENTIN|AMOXYVON|NOVAMOX|NOVACLAV|CLAVAM|MOXYWICK|GENCLOX|MUNTECIP|CEFAKIND|CEFIX|CEFOLAC|CEFUTRIA|GUDCEF|EXTACEF|MONOCEF|ZOCEF|T STAT|TSTAT|AZEE|AZERAL|AZIBEST|ZITHROX|ROXID|CIPLOX|NORFLOX|OFLOX|LEVOFLOX|DOXYMONT|SPORIDEX|LINEZOTAC|RIFAGUT|FLAGYL|METRON|NORCIN|NITAXAN|MOXICIP|ELDEWON|CAVMOX|SWICH-CV/, category: 'Antibiotics & Anti-infectives', schedule: 'schedule_h', rx: true },

  // --- Diabetes care (Schedule H, Rx) ---
  { re: /AMARYL|GLIMER|GLIZID|CETAPIN|MELMET|GLUCONORM|GLUCORED|TRAJENTA|DAPANORM|SITARED|SUPERMET|TENEPURE|VOGLIBOSE|EMBETA/, category: 'Diabetes Care', schedule: 'schedule_h', rx: true },

  // --- Cardiac & Blood Pressure (Schedule H, Rx) ---
  { re: /TELMA|TELMI|TELPRES|TELVAS|TELISTA|AMLOKIND|AMLOPRES|AMLOSAFE|LOSAR|LOSAKAR|METOLAR|NEBICARD|BISOHEART|BISOPRAN|AZTOR|ROSUVAS|ROZAVEL|ROSULIP|ATORVA|ATORLIP|ATORVATIN|CARDACE|STAMLO|DILZEM|DYTOR|LNBLOC|WINBP|NORTIPT|EBILITY|BRIV\b/, category: 'Cardiac & Blood Pressure', schedule: 'schedule_h', rx: true },

  // --- Cholesterol handled above via statins (Rosuvas/Atorva) ---

  // --- Steroids / hormones (Schedule H, Rx) ---
  { re: /WYSOLONE|OMNACORTIL|DEXONA|BETNESOL|MEDROL|CORTIROWA|HYDROCORT/, category: 'Prescription Medicines', schedule: 'schedule_h', rx: true },

  // --- PPIs / Acid reducers (Schedule H, Rx) ---
  { re: /PANTOP|PANTOCID|PANTOSEC|RABICIP|RABLET|RABIUM|RABESEC|RAZO|NEXPRO|OMEZ|SOMPRAZ|TOPCID|OXOBID|OLOX OZ|VELOZ/, category: 'Digestive & Antacids', schedule: 'schedule_h', rx: true },

  // --- Antacids / OTC digestive (no Rx) ---
  { re: /DIGENE|GELUSIL|ENO\b|ELECTRAL|ORS |ISABGOL|DUPHALAC|CREMAFFIN|CHYMOSIS|CIPZEN|MUCAINE|CILADUO|UNIENZYME|MORE ZYME|EMSET|COLIMEX|DIOVOL|WALYTE|RACIRAFT|FLORACHAMP|PET SAFA|BUSCOGAST|SPASMONIL|MEFTAL SPAS|DULCOFLEX|KAYAM|HAJMOLA/, category: 'Digestive & Antacids', schedule: 'none', rx: false },

  // --- Pain relief / fever (mostly OTC unless injectable/controlled) ---
  { re: /CROCIN|DOLO|CALPOL|PARACIP|DISPRIN|SARIDON/, category: 'Pain Relief & Fever', schedule: 'none', rx: false },
  { re: /COMBIFLAM|ZERODOL|HIFENAC|NISE\b|MOVEXX|ACENAC|NICIP|DICLOFENAC|DICLOWIN|INTAGESIC|NAPRA D|KETOROL|ETODY|FEBUTEC|BRUFEN|TOGESIC|PIROX|MEFTAL-P/, category: 'Pain Relief & Fever', schedule: 'schedule_h', rx: true },

  // --- Cough, Cold & Allergy ---
  { re: /ALLEGRA|ALERGIN|MONTAIR|MONTEK|MONTICOPE|OKACET|BILAZEST|CETZINE|CHESTON|SINAREST|KOLD TIME|FLUCOLD|COREX|TUSQ|ZEDEX|TOREX|HONITUSS|COFSIL|COSCOPIN|COSCORIL|OTRIVIN|EMPASOV|ONDITRA|STEMTIL|ONDEM|OFLOX OZ/, category: 'Cough, Cold & Allergy', schedule: 'none', rx: false },

  // --- Respiratory (inhalers, bronchodilators; Schedule H, Rx) ---
  { re: /ASTHALIN|BUDECORT|DERIPHYLLIN|LEVOLIN|AEROCORT|EASIBREATH|DUO 02/, category: 'Respiratory Care', schedule: 'schedule_h', rx: true },

  // --- Neuro & Psychiatry (controlled/Schedule H1, Rx) ---
  { re: /ALPRAX|RIVOTRIL|MIRTAZ|ZOLFRESH|LEVIPIL|OXETOL|VERTIN|SOLITRAL|CRINA-NCR|SPINFREE/, category: 'Neuro & Psychiatry', schedule: 'schedule_h1', rx: true },

  // --- Women's health & contraception (Rx, sensitive) ---
  { re: /DUPHASTON|OVRAL|MISOPROST|UNWANTED-72|I PILL|PREGA NEWS|I KNOW PREGNANCY|DYDROBOON|ESTROEASE|METHERGIN|TRANESURE|DROGYNA/, category: "Women's Health", schedule: 'schedule_h', rx: true },

  // --- Men's health (Rx, sensitive) ---
  { re: /VIAGRA|VYMADA|MODULA|MANFORCE 50|MANFORCE TAB/, category: "Men's Health", schedule: 'schedule_x', rx: true },
  { re: /MANFORCE CONDOM|BIG FUN CONDOM/, category: 'Personal Care', schedule: 'none', rx: false },

  // --- Skin care & dermatology (medicated; Schedule H, Rx) ---
  { re: /BETNOVATE|CANDID|QUADRIDERM|MOMATE|FUCIBET|CLOP G|ECLOSPAN|BETASALIC|SKINSHINE|SILVEREX|TENOVATE|FOURDERM|LILIFIN/, category: 'Skin Care & Dermatology', schedule: 'schedule_h', rx: true },
  { re: /SOFRAMYCIN|NEOSPORIN|T-BACT|SCABIGEN|DERMIFORD|MINOCAINE/, category: 'Skin Care & Dermatology', schedule: 'schedule_h', rx: true },

  // --- Wound care / antiseptics (OTC) ---
  { re: /BETADINE|CIPLADINE|POVICIDAL|DETTOL|BORIC ACID|COTTON |BANDAGE|CRAPE BANDAGE|KWICK HEAL|BURNOL|BURNHEAL|IODEX|DOCTOR SPIRIT|BONNE EAR|HISTOCALAMINE/, category: 'Wound Care & Antiseptics', schedule: 'none', rx: false },

  // --- Eye & ear care ---
  { re: /I-KUL|KUL E\/D|CLEARWAX|POLYDEX|MOXICIP EDROP|MOXICIP D EYE|EYEKIND|FESIVE D/, category: 'Eye & Ear Care', schedule: 'schedule_h', rx: true },

  // --- Vitamins, minerals & supplements (OTC) ---
  { re: /EVION|BECOSULES|BECOZYME|BENADON|SUPRADYN|REVITAL|SHELCAL|CALCIJOINT|SHIVCAL|ROCKBON|OBVIT|VITOMIN D3|FOLVITE|FOLDIVIT|NUROKIND|MEGANEURON|NEUROBION|SURBEX|LIMCEE|VITCOFOL|FEFOL|FEFORON|FERIUM|OROFER|HAEM UP|GEMCAL|DEXORANGE|AUTRIN|MAXIRICH|HEALTH CAP|RENOLOG|PAURUSH|ENLIVA|CIPCAL/, category: 'Vitamins & Supplements', schedule: 'none', rx: false },

  // --- Liver / general tonic OTC ---
  { re: /LIV-52|LIV 52|UDILIV|LUPIHEME/, category: 'Vitamins & Supplements', schedule: 'none', rx: false },

  // --- Oral & dental care ---
  { re: /SENSODYNE|COLGATE|KIDODENT|DENTOSYS|CLINSOL|ORASORE|BNC /, category: 'Oral & Dental Care', schedule: 'none', rx: false },

  // --- Baby care ---
  { re: /PAMPERS|JOHNSON BABY|JONSHON BABY|BABY CREAM|BABY BOTLE|BONNY BOTTLE|MACBERY|GLUCOSE-C|GLUCOSE-D|GLUCON-D/, category: 'Baby Care', schedule: 'none', rx: false, group: 'baby_care' },

  // --- Personal care / hygiene (OTC, cosmetic) ---
  { re: /WHISPER|STAYFREE|LACTO ?CALAMINE|BOROLINE|KETOMAC|DANFREE|KESHKING|SKIN FINE|VOLANT|TVAKSH|DERMICOOL|SAFI|DR\.ORTHO|HIM LIP|FACEMASK|DETTOL LATHER/, category: 'Personal Care', schedule: 'none', rx: false, group: 'personal_care' },

  // --- Orthopedic / muscle & joint (OTC topical) ---
  { re: /MOOV|VOLINI|ZANDU BALM/, category: 'Orthopedic & Pain Relief', schedule: 'none', rx: false },
  { re: /BENALGIS/, category: 'Orthopedic & Pain Relief', schedule: 'schedule_h', rx: true },

  // --- ORS / electrolytes / glucose (OTC) already partly covered above ---
  { re: /GLUCOSE/, category: 'Digestive & Antacids', schedule: 'none', rx: false },

  // --- Devices & clinical supplies ---
  { re: /DIGITAL THERMOMETER|BP MOITER|CERVICAL COLLAR|SURGICAL GLOVES|IV SET|DISPOVAN|NIHAL.*SYRING|MEDTECH/, category: 'Healthcare Devices', schedule: 'none', rx: false, group: 'devices' },

  // --- IV fluids / injectable hospital supplies ---
  { re: /NORMAL SALINE|RINGER LACTATE|DNS 500ML/, category: 'Healthcare Devices', schedule: 'none', rx: false, group: 'devices' },

  // --- Insulin (Schedule H, Rx, cold-chain) ---
  { re: /HUMINSULIN|LANTUS/, category: 'Diabetes Care', schedule: 'schedule_h', rx: true },

  // --- Cough syrups w/ codeine-like combos (Schedule H) already matched above by brand ---

  // --- Anti-emetics ---
  { re: /EMVON|ONDEM|ONDITRA|STEMTIL/, category: 'Digestive & Antacids', schedule: 'schedule_h', rx: true },

  // --- Antihelmintic (OTC-ish but technically Rx) ---
  { re: /ZENTEL/, category: "Digestive & Antacids", schedule: 'schedule_h', rx: true },

  // --- Misc well-known OTC brands ---
  { re: /VICKS|ZANDU|STREPSILS/, category: 'Cough, Cold & Allergy', schedule: 'none', rx: false },

  // --- Second pass: brands missed by the primary rules above ---
  { re: /\bAVIL\b/, category: 'Cough, Cold & Allergy', schedule: 'schedule_h', rx: true },
  { re: /ABD-400/, category: 'Digestive & Antacids', schedule: 'schedule_h', rx: true },
  { re: /ABHAYRAB/, category: 'Prescription Medicines', schedule: 'schedule_h', rx: true },
  { re: /ABVIDA/, category: 'Diabetes Care', schedule: 'schedule_h', rx: true },
  { re: /ACILOC/, category: 'Digestive & Antacids', schedule: 'schedule_h', rx: true },
  { re: /AMICLAV|POLYCLAV|MEGACEF|MACPOD|TAXIM-O|NOVACEFF|NOR TZ\b|\bZIFI\b/, category: 'Antibiotics & Anti-infectives', schedule: 'schedule_h', rx: true },
  { re: /ANTOXIPAN|A TO Z|BETHADOXIN|CCM \d|OSTOCALCIUM|SHILAJIT|SUPRA PLUS|PROTIATE|MAXTRA/, category: 'Vitamins & Supplements', schedule: 'none', rx: false },
  { re: /APIBAN|INZIT|TRAPIC MF|BENFOMET/, category: 'Diabetes Care', schedule: 'schedule_h', rx: true },
  { re: /BANDY PLUS|LYSER-D|LYSER DP|MEFTAL -P|IBUGESIC PLUS|VONO/, category: 'Pain Relief & Fever', schedule: 'schedule_h', rx: true },
  { re: /BENADRYL/, category: 'Cough, Cold & Allergy', schedule: 'none', rx: false },
  { re: /BETT INJ|DELTONE|DECA-INSTABOLIN/, category: 'Prescription Medicines', schedule: 'schedule_h1', rx: true },
  { re: /BILYSPA|MEBEX/, category: 'Digestive & Antacids', schedule: 'schedule_h', rx: true },
  { re: /BIZLO OD|ETERNEA MD/, category: 'Cough, Cold & Allergy', schedule: 'schedule_h', rx: true },
  { re: /CLOPILET|CLOPITAB|CLOPIVAS|ECOSPRIN|LASIX|LOSACAR-H/, category: 'Cardiac & Blood Pressure', schedule: 'schedule_h', rx: true },
  { re: /CONTIFLO|MIRAGO|TAMDURA|VELTAM|ZYLORIC/, category: 'Prescription Medicines', schedule: 'schedule_h', rx: true },
  { re: /DALACIN C|ITASPOR|ITRACIP|FLUKA/, category: 'Antibiotics & Anti-infectives', schedule: 'schedule_h', rx: true },
  { re: /DOXINATE/, category: "Women's Health", schedule: 'schedule_h', rx: true },
  { re: /ELDECA|ELTIVIT M/, category: 'Vitamins & Supplements', schedule: 'schedule_h', rx: true },
  { re: /ENZYFINE|FIGOLAX|LOMASAFE/, category: 'Digestive & Antacids', schedule: 'none', rx: false },
  { re: /PAN-D\b|RCAP DSR/, category: 'Digestive & Antacids', schedule: 'schedule_h', rx: true },
  { re: /FLUDAC|STUGERON PLUS|SZETALO/, category: 'Neuro & Psychiatry', schedule: 'schedule_h', rx: true },
  { re: /HYDROGEN 100ML/, category: 'Wound Care & Antiseptics', schedule: 'none', rx: false },
  { re: /JOHNSON POWDER/, category: 'Baby Care', schedule: 'none', rx: false, group: 'baby_care' },
  { re: /OMNIGEL/, category: 'Orthopedic & Pain Relief', schedule: 'none', rx: false },
  { re: /PICLIN/, category: 'Cough, Cold & Allergy', schedule: 'none', rx: false },
  { re: /THYRONORM/, category: 'Prescription Medicines', schedule: 'schedule_h', rx: true },
];

function classify(name) {
  const upper = name.toUpperCase();
  for (const rule of RULES) {
    if (rule.re.test(upper)) return rule;
  }
  return null;
}

module.exports = { classify, RULES };

if (require.main === module) {
  const meds = require('C:/Users/rakshit/AppData/Local/Temp/claude/c--Users-rakshit-Downloads-medicine-delivery-healthmart/c1a0433a-e667-4a2d-8c3f-9c93339293f5/scratchpad/all-medicines.json');
  const counts = {};
  const unclassified = [];
  for (const m of meds) {
    const r = classify(m.name);
    if (!r) { unclassified.push(m.name); continue; }
    counts[r.category] = (counts[r.category] || 0) + 1;
  }
  console.log('Total:', meds.length);
  console.log('Classified:', meds.length - unclassified.length);
  console.log('Unclassified:', unclassified.length);
  console.log('\nCounts by category:');
  console.log(JSON.stringify(counts, null, 1));
  console.log('\nUnclassified names:');
  console.log(unclassified.join('\n'));
}
