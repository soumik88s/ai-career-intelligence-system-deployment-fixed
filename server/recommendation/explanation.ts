export function generateRecommendationExplanation(
  matchResult: any,
  jobRecord: any,
  candidateProfile: any
): string {
  const matchedReq = matchResult.matched_required_skills || [];
  const missingReq = matchResult.missing_required_skills || [];
  const matchedPref = matchResult.matched_preferred_skills || [];
  const missingPref = matchResult.missing_preferred_skills || [];

  const sentences: string[] = [];

  // Skill match sentence
  if (matchedReq.length > 0) {
    const topSkills = matchedReq.slice(0, 3).join(", ");
    sentences.push(
      `Recommended because your profile strongly matches required skills including ${topSkills}.`
    );
  } else if (matchResult.semantic_score >= 70) {
    sentences.push(
      `Good semantic domain alignment with the ${jobRecord.title || "target"} position.`
    );
  } else {
    sentences.push(`Partial domain alignment for ${jobRecord.title || "this role"}.`);
  }

  // Experience sentence
  const expScore = matchResult.experience_score;
  const candExp = candidateProfile.total_experience_years ?? candidateProfile.parsedExperienceYears;
  const reqExp = jobRecord.experience_min ?? jobRecord.minimum_years;

  if (expScore >= 90) {
    if (candExp !== undefined && reqExp !== undefined) {
      sentences.push(`Your ${candExp} years of experience satisfies the ${reqExp}-year requirement.`);
    } else {
      sentences.push("Your experience level meets or exceeds the stated requirement.");
    }
  } else if (expScore < 70 && reqExp !== undefined) {
    sentences.push(`Requires ${reqExp} years of experience (your profile shows ${candExp || 0} years).`);
  }

  // Skill Gap / Missing Skills sentence
  if (missingReq.length > 0) {
    const keyGaps = missingReq.slice(0, 2).join(" and ");
    sentences.push(`Key skill gaps to address include ${keyGaps}.`);
  } else if (missingPref.length > 0) {
    const topPrefGap = missingPref[0];
    sentences.push(`The main optional gap is ${topPrefGap}, listed as a preferred skill.`);
  }

  return sentences.join(" ");
}
