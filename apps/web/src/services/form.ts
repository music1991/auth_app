const urlServer = process.env.NEXT_PUBLIC_SERVICES_URL;

async function patchEvaluationStatus(evaluationId: string, status: string): Promise<boolean> {
  const response = await fetch(`${urlServer}/form`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ evaluationId, status }),
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.message || "Error al actualizar evaluación");
  }

  return true;
}

export const startEvaluation = async (evaluationId: string): Promise<boolean> => {
  try {
    return await patchEvaluationStatus(evaluationId, "in_progress");
  } catch (error) {
    console.error("Error en startEvaluation:", error);
    return false;
  }
};

export const finishEvaluation = async (evaluationId: string): Promise<boolean> => {
  try {
    return await patchEvaluationStatus(evaluationId, "completed");
  } catch (error) {
    console.error("Error en finishEvaluation:", error);
    return false;
  }
};
