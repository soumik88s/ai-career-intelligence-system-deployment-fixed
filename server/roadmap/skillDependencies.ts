export const SKILL_DEPENDENCIES: Record<string, string[]> = {
  "numpy": ["Python"],
  "pandas": ["Python"],
  "scikit-learn": ["Python", "NumPy", "Pandas"],
  "machine learning": ["Python", "Statistics"],
  "deep learning": ["Machine Learning", "Python"],
  "pytorch": ["Python", "Deep Learning"],
  "tensorflow": ["Python", "Deep Learning"],
  "transformers": ["PyTorch"],
  "langchain": ["Python", "Transformers"],
  "nlp": ["Python", "Machine Learning"],
  "mlops": ["Machine Learning", "Docker", "Python"],
  "typescript": ["JavaScript"],
  "react": ["JavaScript", "HTML/CSS"],
  "next.js": ["React", "TypeScript"],
  "express": ["Node.js", "JavaScript"],
  "postgresql": ["SQL"],
  "kubernetes": ["Docker"],
  "aws": ["Linux", "Cloud Computing"],
  "gcp": ["Linux", "Cloud Computing"],
  "terraform": ["Cloud Computing"],
  "power bi": ["Data Analysis", "SQL"],
  "tableau": ["Data Analysis", "SQL"],
  "cypress": ["JavaScript", "Automated Testing"],
  "vector dbs": ["Python", "API Development"]
};

export function getSkillPrerequisites(skillName: string): string[] {
  const norm = skillName.trim().toLowerCase();
  return SKILL_DEPENDENCIES[norm] || [];
}
