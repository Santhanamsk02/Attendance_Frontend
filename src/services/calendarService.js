import { apiClient } from "./api";

const LOCAL_STORAGE_KEY = "ams_calendar_overrides_v1";

export const calendarService = {
  /**
   * Get all calendar overrides, optionally filtered by params
   */
  async getOverrides(params = {}) {
    try {
      const res = await apiClient.get("/calendar/overrides", { params });
      if (res.data && res.data.items) {
        // Sync local cache
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(res.data.items));
        return res.data.items;
      }
    } catch (e) {
      console.warn("API unavailable for calendar overrides, loading local cache...", e);
    }
    
    // Fallback to localStorage if API fails or offline
    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
      let items = cached ? JSON.parse(cached) : [];
      
      // Basic filtering for fallback
      if (params.override_type) {
        items = items.filter(i => i.override_type === params.override_type);
      }
      if (params.department_id) {
        items = items.filter(i => !i.department_id || i.department_id === params.department_id);
      }
      if (params.section_name) {
        items = items.filter(i => !i.section_name || i.section_name === params.section_name);
      }
      return items;
    } catch {
      return [];
    }
  },

  /**
   * Create a new override
   */
  async createOverride(data) {
    try {
      const res = await apiClient.post("/calendar/overrides", data);

      if (res.data && res.data.item) {
        return res.data.item;
      }
    } catch (e) {
      console.warn("API create failed, saving to local cache", e);
    }

    // Local fallback creation
    const newItem = {
      id: crypto.randomUUID(),
      ...data,
      created_at: new Date().toISOString()
    };
    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
      const items = cached ? JSON.parse(cached) : [];
      items.push(newItem);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error("Local storage create error", e);
    }
    return newItem;
  },

  /**
   * Update an existing override
   */
  async updateOverride(id, data) {
    try {
      const res = await apiClient.put(`/calendar/overrides/${id}`, data);
      if (res.data && res.data.item) {
        return res.data.item;
      }
    } catch (e) {
      console.warn("API update failed, updating local cache", e);
    }

    // Local fallback update
    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
      let items = cached ? JSON.parse(cached) : [];
      items = items.map(item => item.id === id ? { ...item, ...data, updated_at: new Date().toISOString() } : item);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
      return items.find(i => i.id === id);
    } catch (e) {
      console.error("Local storage update error", e);
      return { id, ...data };
    }
  },

  /**
   * Delete an override
   */
  async deleteOverride(id) {
    try {
      await apiClient.delete(`/calendar/overrides/${id}`);
    } catch (e) {
      console.warn("API delete failed, updating local cache", e);
    }

    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
      let items = cached ? JSON.parse(cached) : [];
      items = items.filter(item => item.id !== id);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error("Local storage delete error", e);
    }
    return true;
  }
};
