// src/ccm/pages/Tuts.tsx
import { useState } from "react";
import type { AppData } from "../Home";

interface Tutorial {
  id: string;
  title: string;
  description: string;
  duration: string;
  category: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  thumbnailUrl: string;
  videoUrl: string;
  featured?: boolean;
}

type Category = "All" | "Biomedical" | "Nursing" | "Community Care" | "Field Training";

const TUTORIALS: Tutorial[] = [
  {
    id: "t1", featured: true,
    title: "Introduction to Community Health Management",
    description: "Core principles of CCM — patient engagement, field protocols, and community outreach basics.",
    duration: "18:42", category: "Community Care", level: "Beginner",
    thumbnailUrl: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&q=80",
    videoUrl: "https://youtu.be/c7HS3dBV3SI?si=guS0Df7qS5ylCJoj",
  },
  {
    id: "t2",
    title: "Biomedical Equipment Handling",
    description: "Safe operation and maintenance of basic biomedical devices used in field settings.",
    duration: "24:10", category: "Biomedical", level: "Intermediate",
    thumbnailUrl: "https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=600&q=80",
    videoUrl: "https://youtu.be/JVmPu8o2ycc?si=kjcrJ3Zc63STJ3Cs",
  },
  {
    id: "t3",
    title: "Nursing Fundamentals for Care Managers",
    description: "Essential nursing concepts every CCM should know — vitals, wound care, and escalation.",
    duration: "31:05", category: "Nursing", level: "Beginner",
    thumbnailUrl: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=600&q=80",
    videoUrl: "#",
  },
  {
    id: "t4",
    title: "Field Documentation & Reporting",
    description: "How to accurately document patient visits, incidents, and daily field reports.",
    duration: "14:28", category: "Field Training", level: "Beginner",
    thumbnailUrl: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600&q=80",
    videoUrl: "#",
  },
  {
    id: "t5",
    title: "Advanced Biomedical Diagnostics",
    description: "In-depth look at diagnostic tools — ECG interpretation, pulse oximetry, and glucose monitoring.",
    duration: "42:15", category: "Biomedical", level: "Advanced",
    thumbnailUrl: "https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=600&q=80",
    videoUrl: "#",
  },
  {
    id: "t6",
    title: "Patient Communication & Empathy",
    description: "Building trust with patients — active listening, cultural sensitivity, and de-escalation.",
    duration: "20:00", category: "Community Care", level: "Intermediate",
    thumbnailUrl: "https://images.unsplash.com/photo-1607990281513-2c110a25bd8c?w=600&q=80",
    videoUrl: "#",
  },
];

const LEVEL_STYLE: Record<Tutorial["level"], string> = {
  Beginner:     "bg-green-50 text-green-600 dark:bg-green-900/20",
  Intermediate: "bg-yellow-50 text-yellow-600 dark:bg-yellow-900/20",
  Advanced:     "bg-red-50 text-red-600 dark:bg-red-900/20",
};

const CATEGORIES: Category[] = ["All", "Biomedical", "Nursing", "Community Care", "Field Training"];

// How many cards fully visible before fade kicks in
const VISIBLE_COUNT = 2; // featured + 1 grid card

function PlayIcon() {
  return (
    <svg className="w-6 h-6 text-white drop-shadow" fill="currentColor" viewBox="0 0 24 24">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function TutCard({ tut, fadeStyle }: { tut: Tutorial; fadeStyle?: React.CSSProperties }) {
  return (
    <div
      className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] overflow-hidden group hover:shadow-md transition-shadow"
      style={fadeStyle}
    >
      <div className="relative aspect-video bg-gray-100 dark:bg-gray-800 overflow-hidden">
        <img src={tut.thumbnailUrl} alt={tut.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/40">
            <PlayIcon />
          </div>
        </div>
        <span className="absolute bottom-2 right-2 text-[10px] font-semibold text-white bg-black/60 px-1.5 py-0.5 rounded">
          {tut.duration}
        </span>
        {tut.featured && (
          <span className="absolute top-2 left-2 text-[10px] font-bold text-white bg-brand-500 px-2 py-0.5 rounded-full">
            FEATURED
          </span>
        )}
      </div>
      <div className="p-4 space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-medium text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">{tut.category}</span>
          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${LEVEL_STYLE[tut.level]}`}>{tut.level}</span>
        </div>
        <h4 className="text-sm font-semibold text-gray-800 dark:text-white/90 line-clamp-2 leading-snug">{tut.title}</h4>
        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{tut.description}</p>
        <a href={tut.videoUrl} className="mt-1 inline-flex items-center gap-1.5 text-xs font-medium text-brand-500 hover:text-brand-600 transition">
          <PlayIcon /> Watch now
        </a>
      </div>
    </div>
  );
}

interface Props {
  appData?: AppData | null;
}

export default function Tuts({ appData }: Props) {
  const [activeCategory, setActiveCategory] = useState<Category>("All");
  const [search,         setSearch]         = useState("");

  // Locked until trainer is assigned
  const isLocked = !appData?.assigned_trainer;

  const filtered = TUTORIALS.filter(t => {
    const matchCat    = activeCategory === "All" || t.category === activeCategory;
    const matchSearch = t.title.toLowerCase().includes(search.toLowerCase()) ||
                        t.description.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const featured = filtered.find(t => t.featured);
  const rest     = filtered.filter(t => !t.featured);

  // Compute fade style per grid card index (after featured = slot 0)
  const getFadeStyle = (gridIdx: number): React.CSSProperties => {
    const slot = gridIdx + 1; // slot 0 = featured
    if (!isLocked || slot < VISIBLE_COUNT) return {};
    const level   = slot - VISIBLE_COUNT + 1;                        // 1, 2, 3...
    const opacity = Math.max(0.05, 1 - level * 0.35);               // 0.65 → 0.30 → 0.05
    const blur    = Math.min(level * 1.5, 4);                        // 1.5px → 3px → 4px
    return { opacity, filter: `blur(${blur}px)`, pointerEvents: "none", userSelect: "none" };
  };

  return (
    <div className="space-y-6">
      {/* Heading */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Trending Tutorials</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Video resources on biomedical fields, nursing practices, and care management.
        </p>
      </div>

      {/* Search + filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input type="text" placeholder="Search tutorials..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-0.5">
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)}
              className={`flex-shrink-0 text-xs px-3 py-2 rounded-xl border font-medium transition ${
                activeCategory === cat
                  ? "bg-brand-500 text-white border-brand-500"
                  : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/[0.03]"
              }`}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <svg className="w-12 h-12 mx-auto mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.382v7.236a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
          </svg>
          <p className="text-sm">No tutorials found.</p>
        </div>
      ) : (
        <div className="relative space-y-6">

          {/* Featured card — slot 0, always visible */}
          {featured && activeCategory === "All" && !search && (
            <div className="rounded-2xl border border-brand-200 bg-white dark:border-brand-800 dark:bg-white/[0.03] overflow-hidden group hover:shadow-md transition-shadow">
              <div className="flex flex-col md:flex-row">
                <div className="relative md:w-80 aspect-video md:aspect-auto bg-gray-100 dark:bg-gray-800 overflow-hidden flex-shrink-0">
                  <img src={featured.thumbnailUrl} alt={featured.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/40">
                      <PlayIcon />
                    </div>
                  </div>
                  <span className="absolute bottom-2 right-2 text-[10px] font-semibold text-white bg-black/60 px-1.5 py-0.5 rounded">{featured.duration}</span>
                  <span className="absolute top-2 left-2 text-[10px] font-bold text-white bg-brand-500 px-2 py-0.5 rounded-full">FEATURED</span>
                </div>
                <div className="p-6 flex flex-col justify-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-medium text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">{featured.category}</span>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${LEVEL_STYLE[featured.level]}`}>{featured.level}</span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-800 dark:text-white/90 leading-snug">{featured.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{featured.description}</p>
                  <a href={featured.videoUrl}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-500 text-white text-sm font-medium rounded-xl hover:bg-brand-600 transition w-fit">
                    <PlayIcon /> Watch Now
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Grid — fades from VISIBLE_COUNT onward when locked */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {rest.map((tut, idx) => (
              <TutCard key={tut.id} tut={tut} fadeStyle={getFadeStyle(idx)} />
            ))}
          </div>

          {/* Gradient fade + lock CTA — only when locked */}
          {isLocked && (
            <div className="relative -mt-32">
              {/* Gradient dissolve from content into lock card */}
              <div className="h-32 bg-gradient-to-b from-transparent to-white dark:to-gray-950 pointer-events-none" />

              {/* Lock CTA card */}
              <div className="rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-6 py-7 flex flex-col items-center gap-3 text-center shadow-sm">
                <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-700 dark:text-white/80">Tutorials Locked</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 leading-relaxed max-w-xs mx-auto">
                    Once you are assigned to an MNP, your full tutorial library will unlock here.
                  </p>
                </div>
                <span className="text-[10px] font-semibold px-3 py-1 rounded-full bg-purple-50 text-purple-600 border border-purple-200 dark:bg-purple-900/20 dark:border-purple-800 dark:text-purple-400">
                  Awaiting Trainer Assignment
                </span>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}