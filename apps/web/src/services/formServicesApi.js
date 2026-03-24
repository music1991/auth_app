const urlServer = process.env.NEXT_PUBLIC_SERVICES_URL; 

export const startEvaluation = async (evaluationId) => {
  try {

    
    const response = await fetch(`${urlServer}/form`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        evaluationId: evaluationId, 
        status: 1
      }),
    });

    // Validamos si la respuesta es exitosa
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || "Error al iniciar");
    }

    // Si todo salió bien, retornamos true
    return true;

  } catch (error) {
    console.error("Error en startEvaluation service:", error);
    // Podrías quitar el alert de aquí si prefieres manejar el mensaje en el componente
    alert("No se pudo iniciar la evaluación: " + error.message);
    return false;
    
  } finally {
  //  if (setSubmitting) setSubmitting(false);
  }
};


export const finishEvaluation = async (evaluationId) => {
  try {
    
    const response = await fetch(`${urlServer}/form`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        evaluationId: evaluationId, 
        status: 3
      }),
    });

    // Validamos si la respuesta es exitosa
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || "Error al iniciar");
    }

    // Si todo salió bien, retornamos true
    return true;

  } catch (error) {
    console.error("Error en startEvaluation service:", error);
    // Podrías quitar el alert de aquí si prefieres manejar el mensaje en el componente
    alert("No se pudo completar la evaluacion" + error.message);
    return false;
    
  } finally {
   // if (setSubmitting) setSubmitting(false);
  }
};
