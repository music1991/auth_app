import type {
  EvaluationTemplateStatus,
  EvaluationType,
  Mode,
  NewEvaluationFormData,
} from "@/types";

export const EVALUATION_TYPE_LABELS: Record<EvaluationType, string> = {
  environment: "Clima Laboral",
  performance: "Desempeño",
  skills: "Skills",
};

export const TEMPLATE_STATUS_LABELS: Record<EvaluationTemplateStatus, string> = {
  draft: "Sin publicar",
  active: "Publicada",
  completed: "Finalizada",
};

export const MODE: Record<Mode, string> = {
  true: "Online",
  false: "Presencial",
};

export const INITIAL_EVALUATION_FORM: NewEvaluationFormData = {
  title: "",
  description: "",
  type: "environment",
  dueDate: "",
  google_form_id: "",
  online: true,
  max_score: 0,
};
