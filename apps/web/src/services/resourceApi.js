export const resourceApi = {
  getAll: async () => {
    const res = await fetch("/api/resources");
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

    const res = await fetch("/api/resources", {
      method: 'POST',
      body: formData,
    });
    return res.json();
  }
};
