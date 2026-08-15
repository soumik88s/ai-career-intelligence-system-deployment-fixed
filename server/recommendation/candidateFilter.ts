export interface RecommendationFilters {
  location?: string;
  work_mode?: string;
  employment_type?: string;
  minimum_score?: number;
  experience_min?: number;
  experience_max?: number;
  target_role?: string;
}

export function applyHardFilters(
  jobs: any[],
  filters: RecommendationFilters
): { passedJobs: any[]; excludedCount: number } {
  const initialCount = jobs.length;
  let filtered = [...jobs];

  // 1. Exclude inactive or expired jobs
  const nowTime = new Date().getTime();
  filtered = filtered.filter((j) => {
    if (j.is_active === false) return false;
    if (j.expires_at) {
      const expTime = new Date(j.expires_at).getTime();
      if (!isNaN(expTime) && expTime < nowTime) return false;
    }
    return true;
  });

  // 2. Work Mode Filter
  if (filters.work_mode && filters.work_mode !== "All") {
    const wm = filters.work_mode.trim().toLowerCase();
    filtered = filtered.filter((j) => {
      const jwm = (j.work_mode || "hybrid").toLowerCase();
      return jwm === wm || (wm === "remote" && jwm.includes("remote"));
    });
  }

  // 3. Employment Type Filter
  if (filters.employment_type && filters.employment_type !== "All") {
    const et = filters.employment_type.trim().toLowerCase();
    filtered = filtered.filter((j) => {
      const jet = (j.employment_type || "full-time").toLowerCase();
      return jet.includes(et) || et.includes(jet);
    });
  }

  // 4. Location Filter (Hard filter if explicitly provided)
  if (filters.location && filters.location.trim() && filters.location !== "All") {
    const locQ = filters.location.trim().toLowerCase();
    filtered = filtered.filter((j) => {
      const jloc = (j.location || "").toLowerCase();
      const jwm = (j.work_mode || "").toLowerCase();
      return jloc.includes(locQ) || (locQ === "remote" && jwm.includes("remote"));
    });
  }

  // 5. Target Role Filter
  if (filters.target_role && filters.target_role.trim()) {
    const roleQ = filters.target_role.trim().toLowerCase();
    const keywords = roleQ.split(/\s+/).filter((k) => k.length > 2);
    if (keywords.length > 0) {
      filtered = filtered.filter((j) => {
        const jtitle = (j.title || "").toLowerCase();
        const jdesc = (j.description || "").toLowerCase();
        return keywords.some((kw) => jtitle.includes(kw) || jdesc.includes(kw));
      });
    }
  }

  return {
    passedJobs: filtered,
    excludedCount: initialCount - filtered.length,
  };
}

export function calculateSoftPreferences(
  job: any,
  candidateProfile: any,
  userProfile?: any
): number {
  let preferenceScore = 0;

  // Preferred Location Match (+3)
  const preferredLoc = userProfile?.location || candidateProfile?.location;
  if (preferredLoc && job.location) {
    const pLoc = preferredLoc.toLowerCase();
    const jLoc = job.location.toLowerCase();
    if (jLoc.includes(pLoc) || pLoc.includes(jLoc)) {
      preferenceScore += 3.0;
    }
  }

  // Target Role Alignment (+3)
  const targetRole = userProfile?.target_role || candidateProfile?.target_role;
  if (targetRole && job.title) {
    const tr = targetRole.toLowerCase();
    const jt = job.title.toLowerCase();
    if (jt.includes(tr) || tr.includes(jt)) {
      preferenceScore += 3.0;
    }
  }

  // Job Freshness Adjustment (+3 if posted in last 7 days, +1.5 if in 14 days)
  const postedDate = job.posted_at || job.created_at;
  if (postedDate) {
    const postedTime = new Date(postedDate).getTime();
    if (!isNaN(postedTime)) {
      const daysOld = (new Date().getTime() - postedTime) / (1000 * 60 * 60 * 24);
      if (daysOld <= 7) {
        preferenceScore += 3.0;
      } else if (daysOld <= 14) {
        preferenceScore += 1.5;
      }
    }
  }

  return preferenceScore;
}
