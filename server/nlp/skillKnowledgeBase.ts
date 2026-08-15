export interface SkillKBItem {
  skill_name: string;
  normalized_name: string;
  category: "Programming Languages" | "Frameworks & Libraries" | "Databases" | "Cloud & DevOps" | "Tools & Technologies" | "AI & Machine Learning" | "Other";
  aliases: string[];
  related_skills?: string[];
  description?: string;
}

export const SKILL_KNOWLEDGE_BASE: SkillKBItem[] = [
  // Programming Languages
  {
    skill_name: "Python",
    normalized_name: "python",
    category: "Programming Languages",
    aliases: ["python3", "python 3", "py"],
    related_skills: ["FastAPI", "Django", "Flask", "PyTorch"],
    description: "High-level, interpreted programming language widely used in AI, web development, and automation."
  },
  {
    skill_name: "JavaScript",
    normalized_name: "javascript",
    category: "Programming Languages",
    aliases: ["js", "ecmascript", "es6", "es2020", "vanillajs", "vanilla js"],
    related_skills: ["TypeScript", "React", "Node.js"],
    description: "Dynamic programming language essential for web development."
  },
  {
    skill_name: "TypeScript",
    normalized_name: "typescript",
    category: "Programming Languages",
    aliases: ["ts"],
    related_skills: ["JavaScript", "React", "Node.js"],
    description: "Typed superset of JavaScript that compiles to plain JavaScript."
  },
  {
    skill_name: "Java",
    normalized_name: "java",
    category: "Programming Languages",
    aliases: ["java8", "java11", "java17", "java EE", "jakarta ee"],
    related_skills: ["Spring Boot", "Kotlin", "Hibernate"],
    description: "Object-oriented, class-based programming language popular for enterprise systems."
  },
  {
    skill_name: "C++",
    normalized_name: "cpp",
    category: "Programming Languages",
    aliases: ["c plus plus", "cpp", "c/c++"],
    related_skills: ["C", "System Programming"],
    description: "High-performance general-purpose programming language."
  },
  {
    skill_name: "C",
    normalized_name: "c",
    category: "Programming Languages",
    aliases: ["c language", "ansi c"],
    related_skills: ["C++", "Embedded C"],
    description: "Procedural computer programming language."
  },
  {
    skill_name: "C#",
    normalized_name: "csharp",
    category: "Programming Languages",
    aliases: ["c sharp", "csharp", ".net c#"],
    related_skills: [".NET", "ASP.NET Core"],
    description: "Modern, object-oriented language developed by Microsoft."
  },
  {
    skill_name: "Go",
    normalized_name: "go",
    category: "Programming Languages",
    aliases: ["golang"],
    related_skills: ["Docker", "Kubernetes", "Microservices"],
    description: "Statically typed, compiled language developed by Google."
  },
  {
    skill_name: "Rust",
    normalized_name: "rust",
    category: "Programming Languages",
    aliases: ["rustlang"],
    related_skills: ["Systems Programming", "WebAssembly"],
    description: "Language empowering everyone to build reliable and efficient software."
  },
  {
    skill_name: "PHP",
    normalized_name: "php",
    category: "Programming Languages",
    aliases: ["php7", "php8"],
    related_skills: ["Laravel", "WordPress"],
    description: "Popular general-purpose scripting language suited for web development."
  },
  {
    skill_name: "Kotlin",
    normalized_name: "kotlin",
    category: "Programming Languages",
    aliases: ["kt"],
    related_skills: ["Java", "Android Development"],
    description: "Cross-platform, statically typed programming language with type inference."
  },
  {
    skill_name: "Swift",
    normalized_name: "swift",
    category: "Programming Languages",
    aliases: ["swiftui"],
    related_skills: ["iOS Development", "Objective-C"],
    description: "Powerful language for iOS, iPadOS, macOS, and watchOS."
  },
  {
    skill_name: "SQL",
    normalized_name: "sql",
    category: "Programming Languages",
    aliases: ["tsql", "plsql", "pl/sql", "ansi sql"],
    related_skills: ["PostgreSQL", "MySQL", "Database Management"],
    description: "Standard language for storing, manipulating and retrieving data in databases."
  },
  {
    skill_name: "R",
    normalized_name: "r",
    category: "Programming Languages",
    aliases: ["r programming", "r language"],
    related_skills: ["Data Science", "Statistics", "ggplot2"],
    description: "Language and environment for statistical computing and graphics."
  },
  {
    skill_name: "HTML",
    normalized_name: "html",
    category: "Programming Languages",
    aliases: ["html5"],
    related_skills: ["CSS", "JavaScript"],
    description: "Standard markup language for document display in web browsers."
  },
  {
    skill_name: "CSS",
    normalized_name: "css",
    category: "Programming Languages",
    aliases: ["css3", "sass", "scss", "less"],
    related_skills: ["HTML", "Tailwind CSS"],
    description: "Style sheet language used for describing presentation of a document."
  },

  // Frameworks & Libraries
  {
    skill_name: "React",
    normalized_name: "react",
    category: "Frameworks & Libraries",
    aliases: ["reactjs", "react.js", "react js"],
    related_skills: ["Next.js", "Redux", "TypeScript"],
    description: "Free and open-source front-end JavaScript library for building user interfaces."
  },
  {
    skill_name: "Angular",
    normalized_name: "angular",
    category: "Frameworks & Libraries",
    aliases: ["angularjs", "angular.js", "angular 2+"],
    related_skills: ["TypeScript", "RxJS"],
    description: "TypeScript-based free and open-source web application framework."
  },
  {
    skill_name: "Vue.js",
    normalized_name: "vue",
    category: "Frameworks & Libraries",
    aliases: ["vue", "vuejs", "vue.js", "vue 3"],
    related_skills: ["Nuxt.js", "JavaScript"],
    description: "Progressive JavaScript framework for building user interfaces."
  },
  {
    skill_name: "Next.js",
    normalized_name: "nextjs",
    category: "Frameworks & Libraries",
    aliases: ["next.js", "nextjs", "next js"],
    related_skills: ["React", "TypeScript"],
    description: "React framework for full-stack web applications."
  },
  {
    skill_name: "Django",
    normalized_name: "django",
    category: "Frameworks & Libraries",
    aliases: ["django rest framework", "drf"],
    related_skills: ["Python", "PostgreSQL"],
    description: "High-level Python web framework that encourages rapid development."
  },
  {
    skill_name: "Flask",
    normalized_name: "flask",
    category: "Frameworks & Libraries",
    aliases: ["flask api"],
    related_skills: ["Python", "REST API"],
    description: "Micro web framework written in Python."
  },
  {
    skill_name: "FastAPI",
    normalized_name: "fastapi",
    category: "Frameworks & Libraries",
    aliases: ["fast api"],
    related_skills: ["Python", "Pydantic", "AsyncIO"],
    description: "Modern, fast web framework for building APIs with Python."
  },
  {
    skill_name: "Spring Boot",
    normalized_name: "spring boot",
    category: "Frameworks & Libraries",
    aliases: ["spring", "spring framework", "springboot"],
    related_skills: ["Java", "Microservices"],
    description: "Java-based framework used to create microservices."
  },
  {
    skill_name: "Express.js",
    normalized_name: "express",
    category: "Frameworks & Libraries",
    aliases: ["express", "expressjs", "express.js"],
    related_skills: ["Node.js", "JavaScript"],
    description: "Fast, unopinionated, minimalist web framework for Node.js."
  },
  {
    skill_name: "Tailwind CSS",
    normalized_name: "tailwind",
    category: "Frameworks & Libraries",
    aliases: ["tailwind", "tailwindcss"],
    related_skills: ["CSS", "React"],
    description: "Utility-first CSS framework for rapid UI development."
  },

  // AI & Machine Learning
  {
    skill_name: "PyTorch",
    normalized_name: "pytorch",
    category: "AI & Machine Learning",
    aliases: ["torch"],
    related_skills: ["Python", "TensorFlow", "Deep Learning", "Transformers"],
    description: "Open-source machine learning framework based on Torch."
  },
  {
    skill_name: "TensorFlow",
    normalized_name: "tensorflow",
    category: "AI & Machine Learning",
    aliases: ["tf", "tf.keras"],
    related_skills: ["Keras", "PyTorch", "Python", "Deep Learning"],
    description: "Free and open-source software library for machine learning and AI."
  },
  {
    skill_name: "Scikit-learn",
    normalized_name: "scikit-learn",
    category: "AI & Machine Learning",
    aliases: ["sklearn", "scikit learn", "scikit-learn"],
    related_skills: ["Python", "Pandas", "Machine Learning"],
    description: "Free software machine learning library for the Python programming language."
  },
  {
    skill_name: "Pandas",
    normalized_name: "pandas",
    category: "AI & Machine Learning",
    aliases: ["py-pandas"],
    related_skills: ["Python", "NumPy", "Data Analysis"],
    description: "Data manipulation and analysis library for Python."
  },
  {
    skill_name: "NumPy",
    normalized_name: "numpy",
    category: "AI & Machine Learning",
    aliases: ["numpy array"],
    related_skills: ["Python", "SciPy"],
    description: "Fundamental package for scientific computing with Python."
  },
  {
    skill_name: "spaCy",
    normalized_name: "spacy",
    category: "AI & Machine Learning",
    aliases: ["spacy nlp"],
    related_skills: ["Python", "NLP"],
    description: "Open-source software library for advanced Natural Language Processing."
  },
  {
    skill_name: "NLTK",
    normalized_name: "nltk",
    category: "AI & Machine Learning",
    aliases: ["natural language toolkit"],
    related_skills: ["Python", "NLP"],
    description: "Leading platform for building Python programs to work with human language data."
  },
  {
    skill_name: "Hugging Face",
    normalized_name: "huggingface",
    category: "AI & Machine Learning",
    aliases: ["huggingface", "transformers", "diffusers"],
    related_skills: ["PyTorch", "LLMs"],
    description: "AI platform and repository for transformers and pre-trained models."
  },

  // Databases
  {
    skill_name: "PostgreSQL",
    normalized_name: "postgresql",
    category: "Databases",
    aliases: ["postgres", "postgresql", "postgresdb"],
    related_skills: ["SQL", "Relational Databases"],
    description: "Powerful, open source object-relational database system."
  },
  {
    skill_name: "MySQL",
    normalized_name: "mysql",
    category: "Databases",
    aliases: ["mysql server", "mariadb"],
    related_skills: ["SQL", "Database Administration"],
    description: "Open-source relational database management system."
  },
  {
    skill_name: "MongoDB",
    normalized_name: "mongodb",
    category: "Databases",
    aliases: ["mongo", "mongodb atlas"],
    related_skills: ["NoSQL", "Express.js"],
    description: "Source-available cross-platform document-oriented database program."
  },
  {
    skill_name: "Redis",
    normalized_name: "redis",
    category: "Databases",
    aliases: ["redis cache", "redis server"],
    related_skills: ["Caching", "Key-Value Store"],
    description: "In-memory data structure store used as database, cache, and message broker."
  },
  {
    skill_name: "SQLite",
    normalized_name: "sqlite",
    category: "Databases",
    aliases: ["sqlite3"],
    related_skills: ["Embedded DB", "SQL"],
    description: "C-language library that implements a small, fast, self-contained SQL database engine."
  },
  {
    skill_name: "Firebase",
    normalized_name: "firebase",
    category: "Databases",
    aliases: ["firestore", "firebase auth", "firebase realtime db"],
    related_skills: ["GCP", "NoSQL"],
    description: "App development platform backed by Google."
  },

  // Cloud & DevOps
  {
    skill_name: "AWS",
    normalized_name: "aws",
    category: "Cloud & DevOps",
    aliases: ["amazon web services", "aws ec2", "aws s3", "aws lambda"],
    related_skills: ["Cloud Computing", "DevOps"],
    description: "Comprehensive cloud computing platform provided by Amazon."
  },
  {
    skill_name: "Google Cloud Platform",
    normalized_name: "gcp",
    category: "Cloud & DevOps",
    aliases: ["gcp", "google cloud", "cloud run", "gke"],
    related_skills: ["Cloud Computing", "BigQuery"],
    description: "Suite of cloud computing services offered by Google."
  },
  {
    skill_name: "Microsoft Azure",
    normalized_name: "azure",
    category: "Cloud & DevOps",
    aliases: ["azure cloud", "azure devops"],
    related_skills: ["Cloud Computing", ".NET"],
    description: "Cloud computing service operated by Microsoft."
  },
  {
    skill_name: "Docker",
    normalized_name: "docker",
    category: "Cloud & DevOps",
    aliases: ["docker container", "docker-compose"],
    related_skills: ["Kubernetes", "Containerization"],
    description: "Set of platform as a service products for containerization."
  },
  {
    skill_name: "Kubernetes",
    normalized_name: "kubernetes",
    category: "Cloud & DevOps",
    aliases: ["k8s", "kubectl"],
    related_skills: ["Docker", "DevOps"],
    description: "Open-source system for automating deployment, scaling, and management of containerized applications."
  },
  {
    skill_name: "Jenkins",
    normalized_name: "jenkins",
    category: "Cloud & DevOps",
    aliases: ["jenkins ci"],
    related_skills: ["CI/CD", "Automation"],
    description: "Open source automation server for building CI/CD pipelines."
  },
  {
    skill_name: "GitHub Actions",
    normalized_name: "github actions",
    category: "Cloud & DevOps",
    aliases: ["gh actions", "github action"],
    related_skills: ["CI/CD", "Git"],
    description: "Automate, customize, and execute your software development workflows."
  },

  // Tools & Technologies
  {
    skill_name: "Git",
    normalized_name: "git",
    category: "Tools & Technologies",
    aliases: ["git vcs", "version control"],
    related_skills: ["GitHub", "GitLab"],
    description: "Distributed version control system."
  },
  {
    skill_name: "GitHub",
    normalized_name: "github",
    category: "Tools & Technologies",
    aliases: ["github repository"],
    related_skills: ["Git", "GitHub Actions"],
    description: "Internet hosting service for software development and version control using Git."
  },
  {
    skill_name: "VS Code",
    normalized_name: "vscode",
    category: "Tools & Technologies",
    aliases: ["visual studio code", "vscode"],
    related_skills: ["IDE", "Development Tools"],
    description: "Source-code editor made by Microsoft."
  },
  {
    skill_name: "Postman",
    normalized_name: "postman",
    category: "Tools & Technologies",
    aliases: ["postman api"],
    related_skills: ["REST API", "API Testing"],
    description: "API platform for building and using APIs."
  },
  {
    skill_name: "Jupyter",
    normalized_name: "jupyter",
    category: "Tools & Technologies",
    aliases: ["jupyter notebook", "jupyterlab"],
    related_skills: ["Python", "Data Science"],
    description: "Project for interactive computing across programming languages."
  },
  {
    skill_name: "Linux",
    normalized_name: "linux",
    category: "Tools & Technologies",
    aliases: ["ubuntu", "centos", "debian", "bash", "unix"],
    related_skills: ["Shell Scripting", "DevOps"],
    description: "Open-source Unix-like operating system kernel."
  }
];

export function findCanonicalSkill(rawToken: string): SkillKBItem | null {
  if (!rawToken || typeof rawToken !== "string") return null;

  const normalizedInput = rawToken.trim().toLowerCase();

  for (const item of SKILL_KNOWLEDGE_BASE) {
    if (item.normalized_name === normalizedInput || item.skill_name.toLowerCase() === normalizedInput) {
      return item;
    }
    for (const alias of item.aliases) {
      if (alias.toLowerCase() === normalizedInput) {
        return item;
      }
    }
  }

  return null;
}
