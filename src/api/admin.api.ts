import { client } from "./client"


interface invitationReseponse {
  token: string;
  password: string;
}

export type SendInvitationRequestArray = SendInvitationRequest[];
export interface SendInvitationRequest {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  region?: string;
  roles: string[];
  manager?: number;
}

export const dashboardApi = () => {
    return client.get("admin/dashboard/")
        .then(res => res.data);
}

export const getAllUsers = () => {
    return client.get("accounts/users/")
        .then(res => res.data);
}

export const getRoleUsers = (paramName: string, values: string) => {
  return client.get("accounts/users/", {
    params: {
      [paramName]: values,
    },
  });
};

export const updateUsersApi = (userId: number ,payload: any) => {
    return client.patch(`accounts/users/${userId}/`, payload)
        .then(res => res.data);
}

export const getApplicationsApi = (params?: Record<string, any>) => {
  return client.get("applications/app/", { params }).then((r) => r.data);
};

export const getApplicationByIdApi = (applicationId: number) => {
    return client.get(`applications/app/${applicationId}/`)
        .then(res => res.data);
}

export const updateApplicationStatusApi = (applicationId: number, updateStatus: any) => {
    return client.patch(`applications/app/${applicationId}/`,  updateStatus)
        .then(res => res.data);
}

export const sendInvitationApi = (userData: SendInvitationRequestArray) => {
    return client.post("accounts/invite/send/", userData)
        .then(res => res.data);
}

export const acceptInvitationApi = (invitationReseponse: invitationReseponse) => {
    return client.post("accounts/invite/accept/", invitationReseponse)
        .then(res => res.data);
}

export const getInvitationApi = () => {
    return client.get("accounts/invitations/")
    .then(res => res.data)
}

export const contactApi = () => {
    return client.get("app/meta/constants/")
        .then(res => res.data);
}

export const createRegionsApi = (payload: any) => {
    return client.post("accounts/regions/", payload) 
    .then(res => res.data); 
}

export const getAllRegionsApi = () => {
    return client.get("accounts/regions/") 
    .then(res => res.data); 
}

export const getSHGUserByIdApi = (userId: number) => {
    return client.get(`partners/app/cm-ccm/${userId}/`)
    .then(res => res.data)
}  

export const updateUserApplicationApi = (pk: number, data: Record<string, any>) =>
  client.patch(`partners/app/cm-ccm/${pk}/`, data).then(res => res.data)

export const getAllWebinarsApi = () => {
    return client.get("web/webinars/") 
    .then(res => res.data); 
}

export const getAllContactApi = () => {
    return client.get("web/contacts/") 
    .then(res => res.data); 
}