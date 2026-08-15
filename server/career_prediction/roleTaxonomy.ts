export interface CareerRoleTaxonomyItem {
  id: string;
  role_name: string;
  normalized_name: string;
  category: "Artificial Intelligence" | "Data & Analytics" | "Software Engineering" | "Cloud & Infrastructure" | "Security & Quality";
  description: string;
  required_skills: string[];
  related_roles: string[];
}

export const CAREER_ROLE_TAXONOMY: CareerRoleTaxonomyItem[] = [
  {
    id: "role_ml_engineer",
    role_name: "Machine Learning Engineer",
    normalized_name: "machine learning engineer",
    category: "Artificial Intelligence",
    description: "Designs, trains, and deploys scalable machine learning models and pipelines into production environments.",
    required_skills: ["Python", "PyTorch", "TensorFlow", "Scikit-learn", "Docker", "Machine Learning", "MLOps"],
    related_roles: ["AI Engineer", "Data Scientist", "Backend Developer"]
  },
  {
    id: "role_ai_engineer",
    role_name: "AI Engineer",
    normalized_name: "ai engineer",
    category: "Artificial Intelligence",
    description: "Specializes in building AI applications leveraging Generative AI, LLMs, NLP, and neural architecture integration.",
    required_skills: ["Python", "PyTorch", "LangChain", "NLP", "Transformers", "API Development", "Vector DBs"],
    related_roles: ["Machine Learning Engineer", "Full Stack Developer", "Data Scientist"]
  },
  {
    id: "role_data_scientist",
    role_name: "Data Scientist",
    normalized_name: "data scientist",
    category: "Data & Analytics",
    description: "Extracts insights from structured and unstructured data using statistical models, hypothesis testing, and predictive analytics.",
    required_skills: ["Python", "R", "SQL", "Pandas", "Scikit-learn", "Statistics", "Data Visualization"],
    related_roles: ["Data Analyst", "Machine Learning Engineer", "Business Analyst"]
  },
  {
    id: "role_data_analyst",
    role_name: "Data Analyst",
    normalized_name: "data analyst",
    category: "Data & Analytics",
    description: "Transforms complex raw datasets into actionable business dashboards, reporting metrics, and decision models.",
    required_skills: ["SQL", "Excel", "Tableau", "Power BI", "Python", "Data Visualization"],
    related_roles: ["Business Analyst", "Data Scientist", "Database Administrator"]
  },
  {
    id: "role_software_engineer",
    role_name: "Software Engineer",
    normalized_name: "software engineer",
    category: "Software Engineering",
    description: "Architects and implements core software algorithms, systems logic, and maintainable software products.",
    required_skills: ["Java", "C++", "Python", "Data Structures", "Algorithms", "Git", "Object-Oriented Design"],
    related_roles: ["Backend Developer", "Full Stack Developer", "Mobile Developer"]
  },
  {
    id: "role_backend_developer",
    role_name: "Backend Developer",
    normalized_name: "backend developer",
    category: "Software Engineering",
    description: "Builds high-performance server-side APIs, microservices, micro-architectures, and database integrations.",
    required_skills: ["Node.js", "Java", "Python", "Go", "Express", "REST APIs", "PostgreSQL", "Docker"],
    related_roles: ["Full Stack Developer", "Software Engineer", "DevOps Engineer"]
  },
  {
    id: "role_frontend_developer",
    role_name: "Frontend Developer",
    normalized_name: "frontend developer",
    category: "Software Engineering",
    description: "Crafts responsive, interactive user interfaces and frontend web applications using modern web frameworks.",
    required_skills: ["React", "TypeScript", "JavaScript", "HTML/CSS", "Tailwind CSS", "Next.js", "Vue.js"],
    related_roles: ["Full Stack Developer", "Mobile Developer", "UI/UX Engineer"]
  },
  {
    id: "role_fullstack_developer",
    role_name: "Full Stack Developer",
    normalized_name: "full stack developer",
    category: "Software Engineering",
    description: "Engineers end-to-end web applications across client interfaces, server logic, database design, and cloud deployments.",
    required_skills: ["React", "Node.js", "TypeScript", "SQL", "Express", "HTML/CSS", "REST APIs", "Git"],
    related_roles: ["Backend Developer", "Frontend Developer", "Software Engineer"]
  },
  {
    id: "role_devops_engineer",
    role_name: "DevOps Engineer",
    normalized_name: "devops engineer",
    category: "Cloud & Infrastructure",
    description: "Automates deployment pipelines, CI/CD, infrastructure as code, container orchestration, and system reliability.",
    required_skills: ["Docker", "Kubernetes", "CI/CD", "Linux", "Terraform", "AWS", "Bash/Shell", "Git"],
    related_roles: ["Cloud Engineer", "Backend Developer", "Database Administrator"]
  },
  {
    id: "role_cloud_engineer",
    role_name: "Cloud Engineer",
    normalized_name: "cloud engineer",
    category: "Cloud & Infrastructure",
    description: "Architects and provisions cloud architecture, serverless infrastructure, network security, and cloud storage.",
    required_skills: ["AWS", "GCP", "Azure", "Terraform", "Docker", "Linux", "Cloud Networking"],
    related_roles: ["DevOps Engineer", "Backend Developer", "Cybersecurity Analyst"]
  },
  {
    id: "role_cybersecurity_analyst",
    role_name: "Cybersecurity Analyst",
    normalized_name: "cybersecurity analyst",
    category: "Security & Quality",
    description: "Monitors, detects, and safeguards organization networks, software systems, and data against cyber threats and vulnerabilities.",
    required_skills: ["Cyber Security", "Networking", "Penetration Testing", "Linux", "Python", "SIEM", "Cryptography"],
    related_roles: ["Cloud Engineer", "DevOps Engineer", "Software Engineer"]
  },
  {
    id: "role_database_admin",
    role_name: "Database Administrator",
    normalized_name: "database administrator",
    category: "Data & Analytics",
    description: "Maintains relational and NoSQL databases, optimizing query performance, schema migrations, and backup recovery.",
    required_skills: ["SQL", "PostgreSQL", "MySQL", "MongoDB", "Database Tuning", "Linux", "Backup & Recovery"],
    related_roles: ["Backend Developer", "Data Analyst", "DevOps Engineer"]
  },
  {
    id: "role_qa_engineer",
    role_name: "QA Engineer",
    normalized_name: "qa engineer",
    category: "Security & Quality",
    description: "Develops automated test suites, quality assurance protocols, and regression testing pipelines for software releases.",
    required_skills: ["Selenium", "Cypress", "Python", "JavaScript", "Automated Testing", "JUnit", "Jira"],
    related_roles: ["Software Engineer", "Frontend Developer", "DevOps Engineer"]
  },
  {
    id: "role_mobile_developer",
    role_name: "Mobile Developer",
    normalized_name: "mobile developer",
    category: "Software Engineering",
    description: "Builds native and cross-platform mobile applications for iOS and Android operating systems.",
    required_skills: ["React Native", "Flutter", "Swift", "Kotlin", "JavaScript", "Mobile Design", "REST APIs"],
    related_roles: ["Frontend Developer", "Full Stack Developer", "Software Engineer"]
  },
  {
    id: "role_business_analyst",
    role_name: "Business Analyst",
    normalized_name: "business analyst",
    category: "Data & Analytics",
    description: "Bridges business goals and engineering capabilities through requirements gathering, process mapping, and data reporting.",
    required_skills: ["SQL", "Excel", "Requirement Gathering", "Data Analysis", "Agile/Scrum", "Process Mapping"],
    related_roles: ["Data Analyst", "Product Manager", "QA Engineer"]
  }
];

export function getAllCareerRoles(): CareerRoleTaxonomyItem[] {
  return CAREER_ROLE_TAXONOMY;
}

export function getRoleByName(roleName: string): CareerRoleTaxonomyItem | undefined {
  const norm = roleName.trim().toLowerCase();
  return CAREER_ROLE_TAXONOMY.find(r => r.normalized_name === norm || r.role_name.toLowerCase() === norm);
}
