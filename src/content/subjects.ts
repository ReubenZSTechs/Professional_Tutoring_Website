import type { RateLevelId } from "@/config/rates";

import type { Lang } from "./types";

/**
 * Subjects: the cards on the home page and the page for each subject
 * (/subjects/<slug>). Edit the topic lists here. To add a subject, add
 * its slug to SUBJECT_SLUGS and an entry in both languages below.
 */
export const SUBJECT_SLUGS = [
  "mathematics",
  "university-mathematics",
  "physics",
  "chemistry",
  "computer-science",
] as const;

export type SubjectSlug = (typeof SUBJECT_SLUGS)[number];

export interface TopicGroup {
  /** e.g. "IGCSE & O Level" or "Calculus I" */
  title: string;
  /** Syllabus codes, shown under the title. */
  codes?: string;
  topics: string[];
}

export interface Subject {
  slug: SubjectSlug;
  /** Short mark shown on the card, e.g. "∑". */
  symbol: string;
  name: string;
  /** Levels line on the card. */
  levels: string;
  /** One or two sentences for the card. */
  summary: string;
  /** Syllabus codes on the card footer. */
  codes: string;
  /** Opening paragraph on the subject page. */
  intro: string;
  groups: TopicGroup[];
  /** Which rows of src/config/rates.ts apply. Empty for "coming soon". */
  rateIds: RateLevelId[];
  /** e.g. "Coming soon". Subjects with a badge cannot be booked yet. */
  badge?: string;
}

const en: Record<SubjectSlug, Subject> = {
  mathematics: {
    slug: "mathematics",
    symbol: "∑",
    name: "Mathematics",
    levels: "IGCSE · O Level · AS/A Level · IB",
    summary: "From algebra and trigonometry to calculus and statistics, with exam-style practice on every topic.",
    codes: "Cambridge 0580 · 0606 · 4024 · 9709",
    intro:
      "School Mathematics from IGCSE and O Level through to AS and A Level, plus IB. Every topic is taught step by step and finished with exam-style questions, so students know exactly what the examiner is looking for.",
    groups: [
      {
        title: "IGCSE & O Level Mathematics",
        codes: "Cambridge 0580 · 4024",
        topics: [
          "Number: fractions, percentages, ratio, standard form and bounds",
          "Algebra and graphs: expressions, equations, inequalities and sequences",
          "Coordinate geometry: straight lines, gradients and midpoints",
          "Geometry and mensuration: angles, circles, area and volume",
          "Trigonometry: SOH CAH TOA, sine and cosine rules, 3D problems",
          "Vectors and transformations",
          "Probability and statistics",
        ],
      },
      {
        title: "IGCSE Additional Mathematics",
        codes: "Cambridge 0606",
        topics: [
          "Functions, inverse and composite functions",
          "Quadratics, polynomials, and the factor and remainder theorems",
          "Logarithms and exponentials",
          "Circular measure: radians, arcs and sectors",
          "Trigonometric identities, equations and graphs",
          "Permutations and combinations",
          "Series: binomial expansion, arithmetic and geometric progressions",
          "Differentiation and integration",
        ],
      },
      {
        title: "AS & A Level Mathematics",
        codes: "Cambridge 9709",
        topics: [
          "Pure Mathematics 1: quadratics, functions, coordinate geometry, circular measure, trigonometry, series",
          "Calculus: differentiation and integration with their applications",
          "Pure Mathematics 3: logarithms, further trigonometry and calculus, numerical methods",
          "Vectors, differential equations and complex numbers",
          "Probability & Statistics 1",
          "Mechanics: forces, kinematics and energy",
        ],
      },
      {
        title: "IB Mathematics",
        topics: [
          "Number and algebra",
          "Functions",
          "Geometry and trigonometry",
          "Statistics and probability",
          "Calculus",
        ],
      },
    ],
    rateIds: ["igcse", "alevel", "ib"],
  },
  "university-mathematics": {
    slug: "university-mathematics",
    symbol: "∫",
    name: "University Mathematics",
    levels: "Undergraduate · Calculus to PDEs",
    summary: "Calculus I to III, Linear Algebra, Discrete Mathematics and Differential Equations for university students.",
    codes: "Calculus · Linear Algebra · Discrete · ODE · PDE",
    intro:
      "One-to-one support for university students taking mathematics courses, whether in a maths, engineering, computer science or science degree. Lessons follow your course outline and help with lectures, problem sets and exam preparation.",
    groups: [
      {
        title: "Calculus I",
        topics: [
          "Limits and continuity",
          "Derivatives and differentiation rules",
          "Applications: optimisation, related rates, curve sketching",
          "Introduction to definite and indefinite integrals",
        ],
      },
      {
        title: "Calculus II",
        topics: [
          "Integration techniques",
          "Applications of integrals: area, volume, arc length",
          "Sequences and series, convergence tests",
          "Power and Taylor series",
          "Parametric equations and polar coordinates",
        ],
      },
      {
        title: "Calculus III (Multivariable)",
        topics: [
          "Vectors and the geometry of space",
          "Partial derivatives, gradients and directional derivatives",
          "Multiple integrals",
          "Line and surface integrals",
          "Green's, Stokes' and the divergence theorems",
        ],
      },
      {
        title: "Linear Algebra",
        topics: [
          "Systems of linear equations and row reduction",
          "Matrices and determinants",
          "Vector spaces, bases and dimension",
          "Linear transformations",
          "Eigenvalues, eigenvectors and diagonalisation",
        ],
      },
      {
        title: "Discrete Mathematics",
        topics: [
          "Logic and methods of proof, including induction",
          "Sets, relations and functions",
          "Combinatorics and counting",
          "Graph theory",
          "Recurrence relations",
        ],
      },
      {
        title: "Advanced Differentiation",
        topics: [
          "Derivatives with respect to vectors and matrices",
          "Gradients, Jacobians and Hessians",
          "The chain rule in many variables",
          "Applications in optimisation and machine learning",
        ],
      },
      {
        title: "Integration",
        topics: [
          "Substitution and integration by parts",
          "Partial fractions and trigonometric integrals",
          "Improper integrals",
          "Multiple integrals and change of variables",
        ],
      },
      {
        title: "Differential Equations",
        topics: [
          "First-order equations: separable, linear and exact",
          "Second-order linear equations",
          "Systems of differential equations",
          "Laplace transforms",
        ],
      },
      {
        title: "Partial Differential Equations",
        topics: [
          "Classification of PDEs",
          "Separation of variables",
          "Heat, wave and Laplace equations",
          "Fourier series",
        ],
      },
    ],
    rateIds: ["university"],
  },
  physics: {
    slug: "physics",
    symbol: "F=ma",
    name: "Physics",
    levels: "IGCSE · IB",
    summary: "Forces, energy, waves and electricity explained step by step, with plenty of worked problems.",
    codes: "Cambridge 0625 · IB Physics",
    intro:
      "Physics made clear: each idea is explained from first principles, then practised with worked problems and past-paper style questions until the method is second nature.",
    groups: [
      {
        title: "IGCSE Physics",
        codes: "Cambridge 0625",
        topics: [
          "Motion, forces and energy",
          "Thermal physics",
          "Waves: light, sound and the electromagnetic spectrum",
          "Electricity and magnetism",
          "Nuclear physics",
          "Space physics",
        ],
      },
      {
        title: "IB Physics",
        topics: [
          "Space, time and motion",
          "The particulate nature of matter",
          "Wave behaviour",
          "Fields",
          "Nuclear and quantum physics",
        ],
      },
    ],
    rateIds: ["igcse", "ib"],
  },
  chemistry: {
    slug: "chemistry",
    symbol: "H₂O",
    name: "Chemistry",
    levels: "IGCSE · IB",
    summary: "Atomic structure, bonding and reactions, plus clear methods for calculations like moles and concentration.",
    codes: "Cambridge 0620 · IB Chemistry",
    intro:
      "Chemistry broken into clear steps, with particular care on the calculations (moles, concentration, yields) where students most often lose marks.",
    groups: [
      {
        title: "IGCSE Chemistry",
        codes: "Cambridge 0620",
        topics: [
          "States of matter; atoms, elements and compounds",
          "Stoichiometry and the mole",
          "Electrochemistry",
          "Chemical energetics",
          "Rates of reaction and equilibrium",
          "Acids, bases and salts",
          "The periodic table and metals",
          "Chemistry of the environment",
          "Organic chemistry",
          "Experimental techniques and analysis",
        ],
      },
      {
        title: "IB Chemistry",
        topics: [
          "Models of the particulate nature of matter",
          "Bonding and structure",
          "Classification of matter",
          "Energetics and thermochemistry",
          "Rates of reaction and equilibrium",
          "Reaction mechanisms and organic chemistry",
        ],
      },
    ],
    rateIds: ["igcse", "ib"],
  },
  "computer-science": {
    slug: "computer-science",
    symbol: "</>",
    name: "Computer Science & Python",
    levels: "IGCSE · Beginners",
    summary: "Programming and computational thinking, taught by a Computer Science student who builds AI systems.",
    codes: "Cambridge 0478",
    intro:
      "Programming and computational thinking, taught by a Computer Science student who builds AI systems for a living.",
    groups: [
      {
        title: "IGCSE Computer Science",
        codes: "Cambridge 0478",
        topics: [
          "Data representation",
          "Computer systems, networks and security",
          "Algorithm design and problem-solving",
          "Programming",
          "Databases and Boolean logic",
        ],
      },
      {
        title: "Python for beginners",
        topics: ["Variables, conditions and loops", "Functions and data structures", "Small projects"],
      },
    ],
    rateIds: [],
    badge: "Coming soon",
  },
};

const id: Record<SubjectSlug, Subject> = {
  mathematics: {
    ...en.mathematics,
    name: "Matematika",
    summary: "Dari aljabar dan trigonometri hingga kalkulus dan statistika, dengan latihan soal bergaya ujian di setiap topik.",
    intro:
      "Matematika sekolah dari IGCSE dan O Level hingga AS dan A Level, serta IB. Setiap topik diajarkan langkah demi langkah dan ditutup dengan soal bergaya ujian, agar siswa tahu persis apa yang dicari penguji.",
    groups: [
      {
        title: "Matematika IGCSE & O Level",
        codes: "Cambridge 0580 · 4024",
        topics: [
          "Bilangan: pecahan, persen, rasio, notasi ilmiah, dan batas",
          "Aljabar dan grafik: bentuk aljabar, persamaan, pertidaksamaan, dan barisan",
          "Geometri koordinat: garis lurus, gradien, dan titik tengah",
          "Geometri dan pengukuran: sudut, lingkaran, luas, dan volume",
          "Trigonometri: SOH CAH TOA, aturan sinus dan kosinus, soal 3D",
          "Vektor dan transformasi",
          "Peluang dan statistika",
        ],
      },
      {
        title: "IGCSE Additional Mathematics",
        codes: "Cambridge 0606",
        topics: [
          "Fungsi, fungsi invers, dan fungsi komposisi",
          "Kuadrat, polinomial, serta teorema faktor dan sisa",
          "Logaritma dan eksponen",
          "Ukuran radian: busur dan juring",
          "Identitas, persamaan, dan grafik trigonometri",
          "Permutasi dan kombinasi",
          "Deret: binomial, deret aritmetika dan geometri",
          "Turunan dan integral",
        ],
      },
      {
        title: "Matematika AS & A Level",
        codes: "Cambridge 9709",
        topics: [
          "Pure Mathematics 1: kuadrat, fungsi, geometri koordinat, radian, trigonometri, deret",
          "Kalkulus: turunan dan integral beserta penerapannya",
          "Pure Mathematics 3: logaritma, trigonometri dan kalkulus lanjut, metode numerik",
          "Vektor, persamaan diferensial, dan bilangan kompleks",
          "Probability & Statistics 1",
          "Mekanika: gaya, kinematika, dan energi",
        ],
      },
      {
        title: "Matematika IB",
        topics: ["Bilangan dan aljabar", "Fungsi", "Geometri dan trigonometri", "Statistika dan peluang", "Kalkulus"],
      },
    ],
  },
  "university-mathematics": {
    ...en["university-mathematics"],
    name: "Matematika Universitas",
    levels: "Sarjana · Kalkulus hingga PDP",
    summary: "Kalkulus I sampai III, Aljabar Linear, Matematika Diskrit, dan Persamaan Diferensial untuk mahasiswa.",
    codes: "Kalkulus · Aljabar Linear · Diskrit · PD · PDP",
    intro:
      "Pendampingan privat untuk mahasiswa yang mengambil mata kuliah matematika, baik di jurusan matematika, teknik, ilmu komputer, maupun sains. Materi mengikuti silabus kuliah Anda dan membantu memahami perkuliahan, mengerjakan tugas, serta persiapan ujian.",
    groups: [
      {
        title: "Kalkulus I",
        topics: [
          "Limit dan kontinuitas",
          "Turunan dan aturan turunan",
          "Penerapan: optimasi, laju yang berkaitan, sketsa kurva",
          "Pengantar integral tentu dan tak tentu",
        ],
      },
      {
        title: "Kalkulus II",
        topics: [
          "Teknik integrasi",
          "Penerapan integral: luas, volume, panjang busur",
          "Barisan dan deret, uji konvergensi",
          "Deret pangkat dan deret Taylor",
          "Persamaan parametrik dan koordinat kutub",
        ],
      },
      {
        title: "Kalkulus III (Multivariabel)",
        topics: [
          "Vektor dan geometri ruang",
          "Turunan parsial, gradien, dan turunan berarah",
          "Integral lipat",
          "Integral garis dan integral permukaan",
          "Teorema Green, Stokes, dan divergensi",
        ],
      },
      {
        title: "Aljabar Linear",
        topics: [
          "Sistem persamaan linear dan eliminasi baris",
          "Matriks dan determinan",
          "Ruang vektor, basis, dan dimensi",
          "Transformasi linear",
          "Nilai eigen, vektor eigen, dan diagonalisasi",
        ],
      },
      {
        title: "Matematika Diskrit",
        topics: [
          "Logika dan metode pembuktian, termasuk induksi",
          "Himpunan, relasi, dan fungsi",
          "Kombinatorika dan teknik membilang",
          "Teori graf",
          "Relasi rekurensi",
        ],
      },
      {
        title: "Turunan Lanjut",
        topics: [
          "Turunan terhadap vektor dan matriks",
          "Gradien, Jacobian, dan Hessian",
          "Aturan rantai multivariabel",
          "Penerapan dalam optimasi dan machine learning",
        ],
      },
      {
        title: "Integral",
        topics: [
          "Substitusi dan integral parsial",
          "Pecahan parsial dan integral trigonometri",
          "Integral tak wajar",
          "Integral lipat dan perubahan variabel",
        ],
      },
      {
        title: "Persamaan Diferensial",
        topics: [
          "Persamaan orde satu: terpisah, linear, dan eksak",
          "Persamaan linear orde dua",
          "Sistem persamaan diferensial",
          "Transformasi Laplace",
        ],
      },
      {
        title: "Persamaan Diferensial Parsial",
        topics: [
          "Klasifikasi PDP",
          "Pemisahan variabel",
          "Persamaan panas, gelombang, dan Laplace",
          "Deret Fourier",
        ],
      },
    ],
  },
  physics: {
    ...en.physics,
    name: "Fisika",
    summary: "Gaya, energi, gelombang, dan listrik dijelaskan langkah demi langkah, dengan banyak contoh soal.",
    intro:
      "Fisika yang jelas: setiap konsep dijelaskan dari dasar, lalu dilatih dengan contoh soal dan soal bergaya ujian hingga caranya benar-benar dikuasai.",
    groups: [
      {
        title: "Fisika IGCSE",
        codes: "Cambridge 0625",
        topics: [
          "Gerak, gaya, dan energi",
          "Fisika termal",
          "Gelombang: cahaya, bunyi, dan spektrum elektromagnetik",
          "Listrik dan magnet",
          "Fisika nuklir",
          "Fisika luar angkasa",
        ],
      },
      {
        title: "Fisika IB",
        topics: [
          "Ruang, waktu, dan gerak",
          "Sifat partikel materi",
          "Perilaku gelombang",
          "Medan",
          "Fisika nuklir dan kuantum",
        ],
      },
    ],
  },
  chemistry: {
    ...en.chemistry,
    name: "Kimia",
    summary: "Struktur atom, ikatan, dan reaksi, serta cara yang jelas untuk perhitungan seperti mol dan konsentrasi.",
    intro:
      "Kimia dipecah menjadi langkah-langkah yang jelas, dengan perhatian khusus pada perhitungan (mol, konsentrasi, rendemen) yang paling sering membuat siswa kehilangan nilai.",
    groups: [
      {
        title: "Kimia IGCSE",
        codes: "Cambridge 0620",
        topics: [
          "Wujud zat; atom, unsur, dan senyawa",
          "Stoikiometri dan konsep mol",
          "Elektrokimia",
          "Energetika kimia",
          "Laju reaksi dan kesetimbangan",
          "Asam, basa, dan garam",
          "Tabel periodik dan logam",
          "Kimia lingkungan",
          "Kimia organik",
          "Teknik eksperimen dan analisis",
        ],
      },
      {
        title: "Kimia IB",
        topics: [
          "Model sifat partikel materi",
          "Ikatan dan struktur",
          "Klasifikasi materi",
          "Energetika dan termokimia",
          "Laju reaksi dan kesetimbangan",
          "Mekanisme reaksi dan kimia organik",
        ],
      },
    ],
  },
  "computer-science": {
    ...en["computer-science"],
    name: "Ilmu Komputer & Python",
    levels: "IGCSE · Pemula",
    summary: "Pemrograman dan berpikir komputasional, diajar oleh mahasiswa Ilmu Komputer yang membangun sistem AI.",
    intro: "Pemrograman dan berpikir komputasional, diajar oleh mahasiswa Ilmu Komputer yang sehari-hari membangun sistem AI.",
    groups: [
      {
        title: "Ilmu Komputer IGCSE",
        codes: "Cambridge 0478",
        topics: [
          "Representasi data",
          "Sistem komputer, jaringan, dan keamanan",
          "Desain algoritma dan pemecahan masalah",
          "Pemrograman",
          "Basis data dan logika Boolean",
        ],
      },
      {
        title: "Python untuk pemula",
        topics: ["Variabel, kondisi, dan perulangan", "Fungsi dan struktur data", "Proyek kecil"],
      },
    ],
    badge: "Segera hadir",
  },
};

const subjects: Record<Lang, Record<SubjectSlug, Subject>> = { en, id };

/** All subjects for a language, in card order. */
export function getSubjects(lang: Lang): Subject[] {
  return SUBJECT_SLUGS.map((slug) => subjects[lang][slug]);
}

export function getSubject(lang: Lang, slug: string): Subject | undefined {
  return (SUBJECT_SLUGS as readonly string[]).includes(slug) ? subjects[lang][slug as SubjectSlug] : undefined;
}
