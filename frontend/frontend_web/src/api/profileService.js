import api from './axiosInstance';



//get 
export const getMyProfile = async () => {
  try {
    const response = await api.get("/profiles/me");
    return response.data; // ProfileResponse DTO
  } catch (error) {
    console.error("Error fetching profile:", error.response?.data || error.message);
    throw error;
  }
};

//put 
export const updateMyProfile = async (profileData) => {
  try {
    const response = await api.put("/profiles/me", profileData);
    return response.data; // ProfileResponse DTO
  } catch (error) {
    console.error("Error updating profile:", error.response?.data || error.message);
    throw error;
  }
};

//profile-picture
export const uploadProfilePicture = async (file) => {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post(
      "/profiles/picture",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error(
      "Error uploading profile picture:",
      error.response?.data || error.message
    );
    throw error;
  }
};

export const addEducation = async (payload) => {
  try {
    const response = await api.post("/profiles/education", payload);
    return response.data;
  } catch (error) {
    console.error("Error adding education:", error.response?.data || error.message);
    throw error;
  }
};

export const updateEducation = async (id, payload) => {
  try {
    const response = await api.put(`/profiles/education/${id}`, payload);
    return response.data;
  } catch (error) {
    console.error("Error updating education:", error.response?.data || error.message);
    throw error;
  }
};

export const deleteEducation = async (id) => {
  try {
    await api.delete(`/profiles/education/${id}`);
  } catch (error) {
    console.error("Error deleting education:", error.response?.data || error.message);
    throw error;
  }
};


export const addProject = async (payload) => {
  try {
    const response = await api.post("/profiles/projects", payload);
    return response.data;
  } catch (error) {
    console.error("Error adding project:", error.response?.data || error.message);
    throw error;
  }
};

export const updateProject = async (id, payload) => {
  try {
    const response = await api.put(`/profiles/projects/${id}`, payload);
    return response.data;
  } catch (error) {
    console.error("Error updating project:", error.response?.data || error.message);
    throw error;
  }
};

export const deleteProject = async (id) => {
  try {
    await api.delete(`/profiles/projects/${id}`);
  } catch (error) {
    console.error("Error deleting project:", error.response?.data || error.message);
    throw error;
  }
};


export const getPublicProfile = async (userId) => {
  try {
    const response = await api.get(`/profiles/${userId}`);
    return response.data; // PublicProfileResponse
  } catch (error) {
    console.error('Error fetching public profile:', error.response?.data || error.message);
    throw error;
  }
};
