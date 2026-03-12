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
  region: string;
  roles: string[];
  manager?: number;
}

export const getAllUsers = () => {
    return client.get("accounts/users/")
        .then(res => res.data);
}

export const updateUsersApi = (userId: number ,payload: any) => {
    return client.patch(`accounts/users/${userId}/`, payload)
        .then(res => res.data);
}

export const getApplicationsApi = () => {
    return client.get("applications/app/")
        .then(res => res.data);
} 

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
    return client.get(`shg/app/${userId}/`)
    .then(res => res.data)
}  