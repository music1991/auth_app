type ResourceType = "pdf" | "link" | "video" | "doc";

interface CreateResourceData {
  title?: string;
  type: ResourceType;
  file?: File;
  url?: string;
}

export const resourceApi = {
  getAll: async () => {
    const res = await fetch("/api/resources");
    return res.json();
  },

  create: async (data: CreateResourceData) => {
    const formData = new FormData();
    formData.append("title", data.title || "Recurso");
    formData.append("type", data.type);

    if (data.type === "pdf" && data.file) {
      formData.append("file", data.file);
    } else if (data.type === "link" && data.url) {
      formData.append("url", data.url);
    }

    const res = await fetch("/api/resources", {
      method: "POST",
      body: formData,
    });

    const result = await res.json();

    if (!res.ok) {
      throw new Error(result.message || `Error ${res.status}`);
    }

    return result;
  },
};
