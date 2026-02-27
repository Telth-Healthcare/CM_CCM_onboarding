import { client } from "./client"


interface invitationReseponse {
  key: string;
  password: string;
}

interface sendInvitationRequest {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  role: string; // single selected role, will be sent as [role]
}

export const getAllUsers = () => {
    return client.get("_admin/users/")
        .then(res => res.data);
}

export const getApplicationsApi = () => {
    return client.get("applications/all/")
        .then(res => res.data);
} 

export const updateApplicationStatusApi = (applicationId: number, updateStatus: string) => {
    return client.patch(`applications/${applicationId}/update/`,  updateStatus)
        .then(res => res.data);
}

export const sendInvitationApi = (userData: sendInvitationRequest) => {
    return client.post("accounts/invite/send/", userData)
        .then(res => res.data);
}

export const acceptInvitationApi = (invitationReseponse: invitationReseponse) => {
    return client.post("accounts/invite/accept/", invitationReseponse)
        .then(res => res.data);
}