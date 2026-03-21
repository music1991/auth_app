export const resourceApi = {
  getAll: async () => {
    const res = await fetch("/resources");
    return res.json();
  },
  create: async (data) => {
    const formData = new FormData();
    formData.append('title', data.title || 'Recurso');
    formData.append('type', data.type);

    if (data.type === 'pdf' && data.file) {
      formData.append('file', data.file);
    } else if (data.type === 'link') {
      formData.append('url', data.url); 
    }

    const res = await fetch("/api/resources", { // <--- Ruta interna de Next.js
      method: 'POST',
      body: formData,
    });

    const result = await res.json();
    
    // Si el proxy falló (404 o 500), lanzamos el error con la URL que configuramos antes
    if (!res.ok) {
      throw new Error(result.message || `Error ${res.status}: ${result.api_url || ''}`);
    }
    
    return result;
  }
};
