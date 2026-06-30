import { connectDatabase, disconnectDatabase } from '../config/db';
import { logger } from '../config/logger';
import { BlogModel, UserModel } from '../models';

/**
 * Populates a handful of real, useful articles so the Health Blog isn't empty
 * on a fresh install. Not required for the app to function; run `npm run seed` first.
 */
async function main(): Promise<void> {
  await connectDatabase();

  const author = await UserModel.findOne({ role: 'admin' });
  if (!author) {
    throw new Error('Run `npm run seed` first to create the admin user.');
  }

  const posts = [
    {
      title: "Generic vs Branded Medicines: What's Actually the Difference?",
      slug: 'generic-vs-branded-medicines',
      excerpt:
        "Generic medicines cost less than branded ones, but contain the exact same active ingredient. Here's what actually differs — and what doesn't.",
      category: 'Medicine Guides',
      tags: ['generic medicines', 'savings', 'medicine basics'],
      coverImage: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=1200',
      content: `A generic medicine contains the same active ingredient, in the same dosage and strength, as its branded equivalent. Regulatory authorities require generics to demonstrate the same safety and effectiveness as the original before they can be sold — the difference isn't quality, it's the name on the box.

When a pharmaceutical company develops a new drug, it holds exclusive rights to manufacture and sell it under a brand name for a fixed period to recover its research and development costs. Once that period ends, other manufacturers can produce the same formulation and sell it under the generic (salt) name — usually at a significantly lower price, since they don't carry the original R&D or marketing costs.

This is why a strip of Paracetamol 650mg can cost noticeably less than a branded equivalent containing the exact same composition.

On our platform, products tagged "Generic" are unbranded formulations sold under their salt name. Anything without that tag is a branded product. Both go through the same sourcing and quality checks before they reach your order — the choice between them is really just a question of price and brand familiarity, not safety.

If you're managing a long-term prescription (for example, for blood pressure or diabetes), ask your doctor or pharmacist whether a generic alternative is suitable — for most common conditions, it is, and switching can meaningfully reduce your monthly medicine bill.`,
    },
    {
      title: 'Building a Well-Stocked Home Medicine Cabinet',
      slug: 'home-medicine-cabinet-essentials',
      excerpt: 'A practical checklist of over-the-counter essentials every household should keep on hand, and how to store them properly.',
      category: 'Home Care',
      tags: ['home care', 'first aid', 'essentials'],
      coverImage: 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=1200',
      content: `A well-organized medicine cabinet saves you a late-night pharmacy run when someone in the house gets a fever or a minor cut. Here's a practical starting list:

**Pain and fever**: Paracetamol (adult and pediatric strength if you have children), and an anti-inflammatory like ibuprofen for body aches.

**Digestive issues**: An antacid for acidity, ORS sachets for dehydration, and a basic anti-diarrheal.

**Allergies and colds**: A non-drowsy antihistamine like cetirizine, and a cough syrup suited to your household's needs.

**First aid**: Antiseptic solution, sterile dressings, adhesive bandages, and a digital thermometer.

**For specific household needs**: If anyone in the family manages a chronic condition, keep at least a few days' buffer of their regular prescription medicines — and set a reminder to reorder before you run low.

A few habits make a real difference:
- Store medicines in a cool, dry place away from direct sunlight — not the bathroom, where humidity is highest.
- Keep everything in its original packaging so you don't lose track of expiry dates or dosage instructions.
- Do a six-monthly check and discard anything expired.
- Keep the cabinet out of reach of children.

One thing worth knowing: once a strip of medicine has been opened or a package's seal broken, it generally can't be returned, for safety reasons — so it's worth ordering common essentials in reasonable quantities rather than overstocking on a whim.`,
    },
    {
      title: 'When Do You Actually Need a Prescription?',
      slug: 'when-do-you-need-a-prescription',
      excerpt: "Not every medicine needs a doctor's prescription — but some legally can't be sold without one. Here's how that distinction works in India.",
      category: 'Medicine Guides',
      tags: ['prescriptions', 'schedule h', 'regulations'],
      coverImage: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=1200',
      content: `In India, medicines are broadly split into those you can buy over the counter (OTC) and those classified under Schedule H, H1, or X — which legally cannot be sold without a valid prescription from a registered medical practitioner.

**Schedule H** drugs include most antibiotics, and many medicines for chronic conditions like diabetes and hypertension. These require a prescription specifically because incorrect or unsupervised use can lead to serious harm — antibiotic misuse, for instance, contributes directly to antibiotic resistance.

**Schedule H1** covers a stricter category — certain antibiotics and habit-forming drugs — where pharmacies are legally required to maintain a record of the prescribing doctor, patient details, and quantity dispensed.

**Schedule X** covers narcotic and psychotropic substances with the tightest controls of all.

Everyday OTC products — paracetamol, antacids, basic cough syrups, vitamins, and most personal care items — don't require a prescription and can be ordered directly.

On our platform, any product that needs a prescription is clearly marked "Prescription Required." At checkout, you'll be asked to upload a photo of a valid prescription, which a licensed pharmacist reviews before your order is confirmed for dispatch. This isn't a formality — it's the same verification a physical pharmacy is legally required to do, just moved online.

If your prescription has expired or is for a one-time course (like a course of antibiotics) that you've already completed, you'll need a fresh one from your doctor — pharmacists can't dispense against an old or unrelated prescription, even if the medicine looks the same.`,
    },
    {
      title: 'How to Store Medicines Safely at Home',
      slug: 'how-to-store-medicines-safely',
      excerpt: 'Heat, humidity, and light degrade medicines faster than most people realize. A few simple habits keep your medicine cabinet genuinely effective.',
      category: 'Home Care',
      tags: ['storage', 'safety', 'expiry'],
      coverImage: 'https://images.unsplash.com/photo-1576671081837-49000212a370?w=1200',
      content: `Most medicine labels include a storage instruction — "store below 30°C," "protect from light," "store in a cool, dry place" — and it's easy to skim past. But storage conditions genuinely affect how long a medicine stays effective.

**Heat and humidity** are the two biggest culprits. A bathroom cabinet, despite being the traditional spot for a "medicine cabinet," is actually one of the worst places to keep medicines — showers create exactly the heat and humidity that degrade tablets and capsules faster. A bedroom drawer or a dedicated cabinet in a dry room works much better.

**Light exposure** degrades certain medicines, which is why many come in amber bottles or foil blister packs rather than clear packaging. Keep them in their original containers rather than transferring to a clear pillbox for long-term storage.

**Refrigerated medicines** — insulin, certain vaccines, and some liquid antibiotics — need consistent cold storage, typically 2-8°C. Don't freeze them, and don't leave them at room temperature for extended periods; check the label for exactly how long a refrigerated medicine can safely sit out once opened.

**Child safety** matters as much as chemical stability. Use child-resistant containers where available, and store everything out of reach and out of sight — children mimic what they see, and a brightly colored tablet can look like candy.

**Check expiry dates** every few months, not just when you reach for something and notice it's past date. An expired medicine isn't necessarily dangerous, but it may no longer be effective at the dose you need — and for some categories (notably liquid antibiotics and insulin), using expired stock can genuinely reduce effectiveness when you need it most.

When you order with us, batches are dispatched on a first-expiry-first-out basis automatically, so you're never waiting on stock that's been sitting at the back of a warehouse shelf.`,
    },
    {
      title: 'Monsoon Health: Preparing Your Home Pharmacy for the Rainy Season',
      slug: 'monsoon-health-preparation',
      excerpt: 'The monsoon brings a predictable rise in colds, water-borne infections, and fungal skin issues. A little preparation goes a long way.',
      category: 'Seasonal Health',
      tags: ['monsoon', 'seasonal illness', 'prevention'],
      coverImage: 'https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?w=1200',
      content: `Every monsoon season brings a predictable rise in a handful of common health issues — and most of them are manageable with basic preparation and timely care.

**Colds, flu, and viral fever** spread more easily as people spend more time indoors and humidity rises. Keep paracetamol, a basic cough syrup, and ORS sachets on hand. Rest and hydration handle most mild viral infections; a fever that persists beyond a few days, or comes with severe symptoms, is a reason to see a doctor rather than continue self-medicating.

**Water-borne illness** — particularly stomach infections from contaminated water — spikes during monsoon. Stick to boiled or filtered water, avoid street food during heavy rain spells, and keep ORS and a basic antacid stocked. Diarrhea that doesn't improve in a day or two, or comes with high fever or blood, needs medical attention.

**Fungal skin infections** thrive in the damp conditions monsoon creates, especially in skin folds and on feet kept in wet shoes for long periods. Keeping skin dry, changing out of wet clothing promptly, and using a basic antifungal cream at the first sign of irritation usually prevents things from getting worse.

**Mosquito-borne illness** — dengue and malaria in particular — become a real concern in many parts of India during and after monsoon. Use mosquito repellent, eliminate standing water around your home, and treat any fever with body aches and a rash as a reason to get tested promptly rather than assuming it's a regular viral fever.

A simple monsoon-ready kit: paracetamol, ORS, a basic antifungal cream, mosquito repellent, an antiseptic for cuts and insect bites, and a digital thermometer. None of this replaces a doctor's visit when something doesn't improve — but it covers you for the everyday stuff so you're not caught off guard.`,
    },
    {
      title: 'Understanding Your Blood Pressure Monitor Readings',
      slug: 'understanding-blood-pressure-readings',
      excerpt: "A home BP monitor is only useful if you know how to use it correctly and what the numbers actually mean. Here's a practical guide.",
      category: 'Wellness',
      tags: ['blood pressure', 'home devices', 'wellness'],
      coverImage: 'https://images.unsplash.com/photo-1615486511484-92e172cc4fe0?w=1200',
      content: `A home blood pressure monitor is one of the most useful devices for anyone managing hypertension, or simply keeping an eye on their cardiovascular health — but it only gives you reliable numbers if you use it correctly.

**Getting an accurate reading**: Sit quietly for five minutes before measuring — don't check immediately after walking in, drinking coffee, or a stressful phone call, as all of these temporarily raise blood pressure. Keep your arm at heart level, supported on a table, with the cuff positioned directly on skin rather than over clothing. Avoid talking during the measurement.

**Reading the numbers**: A blood pressure reading has two numbers — systolic (the higher number, pressure when your heart beats) over diastolic (the lower number, pressure between beats). As a general reference, readings consistently around 120/80 mmHg or lower are typically considered normal, while readings consistently at or above 140/90 mmHg are generally flagged as high. These are general population reference ranges, not a diagnosis — what's "normal" for you specifically depends on your age, existing conditions, and your doctor's assessment.

**Why consistency matters more than a single reading**: Blood pressure naturally fluctuates throughout the day. A single high reading isn't cause for alarm on its own — what matters is the pattern over days and weeks. If you're monitoring regularly, take readings at the same time each day (morning and evening is a common approach) and keep a simple log, either on paper or using your monitor's memory function if it has one.

**When to contact a doctor**: A single very high reading (especially with symptoms like severe headache, chest pain, or shortness of breath) warrants prompt medical attention. Otherwise, share your logged readings with your doctor at your next visit so they have real data to work with, rather than just a one-off office reading.

A home monitor is a tool for tracking trends and supporting conversations with your doctor — it's not a substitute for regular checkups, especially if you're on medication for blood pressure already.`,
    },
  ];

  for (const post of posts) {
    const existing = await BlogModel.findOne({ slug: post.slug });
    if (existing) {
      logger.info(`Already exists, skipping: ${post.title}`);
      continue;
    }
    await BlogModel.create({
      ...post,
      authorId: author._id,
      isPublished: true,
      publishedAt: new Date(),
    } as never);
    logger.info(`Seeded blog post: ${post.title}`);
  }

  await disconnectDatabase();
  logger.info('Blog posts seeded.');
}

main().catch((err) => {
  logger.error({ err }, 'Blog seed failed');
  process.exit(1);
});
