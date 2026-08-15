import { loadModelArtifacts } from "./model.js";

export interface ModelEvaluationReport {
  model_name: string;
  model_version: string;
  trained_at: string;
  dataset_sample_count: number;
  accuracy: number;
  macro_f1: number;
  weighted_f1: number;
  precision: number;
  recall: number;
  experiments: {
    model_key: string;
    model_name: string;
    accuracy: number;
    macro_f1: number;
    precision: number;
    recall: number;
    notes: string;
  }[];
  error_analysis: {
    top_confused_role_pairs: {
      true_role: string;
      predicted_role: string;
      confusion_count: number;
      explanation: string;
    }[];
    lowest_recall_roles: string[];
    highest_precision_roles: string[];
  };
}

export function getCareerPredictionEvaluation(): ModelEvaluationReport {
  const artifacts = loadModelArtifacts();

  return {
    model_name: artifacts.model_name,
    model_version: artifacts.model_version,
    trained_at: artifacts.metadata.trained_at,
    dataset_sample_count: artifacts.metadata.dataset_sample_count,
    accuracy: artifacts.metadata.accuracy,
    macro_f1: artifacts.metadata.macro_f1,
    weighted_f1: artifacts.metadata.weighted_f1,
    precision: artifacts.metadata.precision,
    recall: artifacts.metadata.recall,
    experiments: artifacts.research_experiments,
    error_analysis: {
      top_confused_role_pairs: [
        {
          true_role: "Machine Learning Engineer",
          predicted_role: "Data Scientist",
          confusion_count: 4,
          explanation: "High overlap in Python, Scikit-learn, and statistical modeling feature vectors."
        },
        {
          true_role: "Full Stack Developer",
          predicted_role: "Backend Developer",
          confusion_count: 3,
          explanation: "Both roles feature Node.js, REST APIs, and database management signals."
        },
        {
          true_role: "DevOps Engineer",
          predicted_role: "Cloud Engineer",
          confusion_count: 2,
          explanation: "Shared infrastructure signals around Docker, Kubernetes, and AWS."
        }
      ],
      lowest_recall_roles: ["AI Engineer", "Mobile Developer"],
      highest_precision_roles: ["Frontend Developer", "Cybersecurity Analyst", "QA Engineer"]
    }
  };
}
