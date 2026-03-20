import { client } from "./client";

// ==================== COURSE APIs ====================

// Create Course
export const createCourseApi = (payload: any) => {
  return client.post("trainer/app/courses/", payload).then((res) => res.data);
};

// Get All Courses
export const getAllCourseApi = () => {
  return client.get("trainer/app/courses/").then((res) => res.data);
};

// Get Course by ID
export const getCourseByIdApi = (id: number | string) => {
  return client.get(`trainer/app/courses/${id}/`).then((res) => res.data);
};

// Update Course (PATCH)
export const updateCourseApi = (id: number | string, payload: any) => {
  return client
    .patch(`trainer/app/courses/${id}/`, payload)
    .then((res) => res.data);
};

// Delete Course
export const deleteCourseApi = (id: number | string) => {
  return client.delete(`trainer/app/courses/${id}/`).then((res) => res.data);
};

// ==================== SUBJECT APIs ====================

// Create Subject
export const createCourseSubApi = (payload: any) => {
  return client.post("trainer/app/subjects/", payload).then((res) => res.data);
};

// Get All Subjects
export const getAllCourseSubApi = () => {
  return client.get("trainer/app/subjects/").then((res) => res.data);
};

// Get Subject by ID
export const getCourseSubByIdApi = (id: number | string) => {
  return client.get(`trainer/app/subjects/${id}/`).then((res) => res.data);
};

// Update Subject (PATCH)
export const updateCourseSubApi = (id: number | string, payload: any) => {
  return client
    .patch(`trainer/app/subjects/${id}/`, payload)
    .then((res) => res.data);
};

// Delete Subject
export const deleteCourseSubApi = (id: number | string) => {
  return client.delete(`trainer/app/subjects/${id}/`).then((res) => res.data);
};

// ==================== SUBJECT MATERIAL APIs ====================

// Create Subject Material
export const createSubMaterialApi = (payload: any) => {
  return client
    .post("trainer/app/subject-materials/", payload)
    .then((res) => res.data);
};

export const createSubMaterialImgApi = (payload: FormData) => {
  return client
    .post("trainer/app/subject-materials/", payload, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })
    .then((res) => res.data);
};
// Get All Subject Materials
export const getAllSubMaterialApi = () => {
  return client.get("trainer/app/subject-materials/").then((res) => res.data);
};

// Get Subject Material by ID
export const getSubMaterialByIdApi = (id: number | string) => {
  return client
    .get(`trainer/app/subject-materials/${id}/`)
    .then((res) => res.data);
};

// Update Subject Material (PATCH)
export const updateSubMaterialApi = (id: number | string, payload: any) => {
  return client
    .patch(`trainer/app/subject-materials/${id}/`, payload)
    .then((res) => res.data);
};

export const updateSubMaterialImgApi = (id: number | string, payload: any) => {
  return client
    .patch(`trainer/app/subject-materials/${id}/`, payload, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })
    .then((res) => res.data);
};

// Delete Subject Material
export const deleteSubMaterialApi = (id: number | string) => {
  return client
    .delete(`trainer/app/subject-materials/${id}/`)
    .then((res) => res.data);
};
