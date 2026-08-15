export interface MarketSkillSignal {
  skill_name: string;
  frequency_count: number;
  frequency_percentage: number; // e.g. 72.5
  skill_type: "required" | "preferred" | "general";
  total_analyzed_jobs: number;
}

export function calculateRoleMarketSignals(
  targetRole: string,
  jobsList: any[]
): Record<string, MarketSkillSignal> {
  const normTarget = targetRole.trim().toLowerCase();
  
  // Filter jobs matching target role title or keyword
  let relevantJobs = jobsList.filter((j) => {
    const title = (j.title || "").toLowerCase();
    return title.includes(normTarget) || normTarget.includes(title);
  });

  // Fall back to all active jobs if target role specific jobs are sparse
  if (relevantJobs.length === 0) {
    relevantJobs = jobsList;
  }

  const totalAnalyzed = relevantJobs.length;
  if (totalAnalyzed === 0) {
    return {};
  }

  const skillCounts: Record<
    string,
    { count: number; requiredCount: number; preferredCount: number; originalName: string }
  > = {};

  for (const job of relevantJobs) {
    const required = job.required_skills || [];
    const preferred = job.preferred_skills || [];
    const allSkills = job.skills || [];

    const seenInJob = new Set<string>();

    // Process required skills
    for (const sk of required) {
      const skName = typeof sk === "string" ? sk : sk.skill_name || sk.normalized_name;
      if (!skName) continue;
      const norm = skName.trim().toLowerCase();
      if (!seenInJob.has(norm)) {
        seenInJob.add(norm);
        if (!skillCounts[norm]) {
          skillCounts[norm] = { count: 0, requiredCount: 0, preferredCount: 0, originalName: skName };
        }
        skillCounts[norm].count += 1;
        skillCounts[norm].requiredCount += 1;
      }
    }

    // Process preferred skills
    for (const sk of preferred) {
      const skName = typeof sk === "string" ? sk : sk.skill_name || sk.normalized_name;
      if (!skName) continue;
      const norm = skName.trim().toLowerCase();
      if (!seenInJob.has(norm)) {
        seenInJob.add(norm);
        if (!skillCounts[norm]) {
          skillCounts[norm] = { count: 0, requiredCount: 0, preferredCount: 0, originalName: skName };
        }
        skillCounts[norm].count += 1;
        skillCounts[norm].preferredCount += 1;
      }
    }

    // Fallback for general skills array if required/preferred aren't split
    if (required.length === 0 && preferred.length === 0 && Array.isArray(allSkills)) {
      for (const sk of allSkills) {
        const skName = typeof sk === "string" ? sk : sk.skill_name || sk.normalized_name;
        if (!skName) continue;
        const norm = skName.trim().toLowerCase();
        if (!seenInJob.has(norm)) {
          seenInJob.add(norm);
          if (!skillCounts[norm]) {
            skillCounts[norm] = { count: 0, requiredCount: 0, preferredCount: 0, originalName: skName };
          }
          skillCounts[norm].count += 1;
          skillCounts[norm].requiredCount += 1;
        }
      }
    }
  }

  const result: Record<string, MarketSkillSignal> = {};

  for (const [norm, data] of Object.entries(skillCounts)) {
    const pct = Number(((data.count / totalAnalyzed) * 100).toFixed(1));
    const skillType =
      data.requiredCount >= data.preferredCount ? "required" : "preferred";

    result[norm] = {
      skill_name: data.originalName,
      frequency_count: data.count,
      frequency_percentage: pct,
      skill_type: skillType,
      total_analyzed_jobs: totalAnalyzed,
    };
  }

  return result;
}
