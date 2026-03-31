import api from './api';

export const jobApi = {
  // Get all job assignments for current user's class
  getJobs: (params?: any) => {
    // Clean params - remove undefined/null values but keep 0
    const cleanParams = Object.fromEntries(
      Object.entries(params || {}).filter(([_, value]) => 
        value !== '' && value !== null && value !== undefined
      )
    );
    return api.get('/jobs', { params: cleanParams });
  },

  // Get eligible students for job assignment
  getEligibleStudents: (search?: string) => 
    api.get('/jobs/eligible-students', { params: { search } }),

  // Get job statistics
  getJobStats: () => api.get('/jobs/stats'),

  // Assign job to student
  assignJob: (studentId: string) => 
    api.post('/jobs/assign', { studentId }),

  // Update job (sub_class, type, and background)
  updateJob: (jobId: string, data: { 
    sub_class?: string; 
    type?: string; 
    background?: string 
  }) => api.put(`/jobs/${jobId}`, data),

  // Delete job assignment
  deleteJob: (jobId: string) => api.delete(`/jobs/${jobId}`),

  // Get all jobs by student ID (across all classes)
  getAllJobsByStudentId: (studentId: string) => 
    api.get(`/jobs/student/${studentId}/all`),
};