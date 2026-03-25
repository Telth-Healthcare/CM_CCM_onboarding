// api/shgonboard.api.ts
import {  client} from './client'

// ── Application CRUD ──────────────────────────────────────────────────────────
const createApplicationApi = (data: Record<string, any>) =>
  // POST without members — members posted separately after CM/CCM pk is known
  client.post('partners/app/', data).then(res => res.data)

const updateApplicationApi = (pk: number, data: Record<string, any>) =>
  // PATCH — members excluded, never sent in main form update
  client.patch(`partners/app/${pk}/`, data).then(res => res.data)

const submitApplicationApi = (userId: number) =>
  client.post(`applications/app/`, { user: userId }).then(res => res.data)

const getApplicationStatusApi=(appid:number,)=>client.get(`applications/app/${appid}/`).then(res=>res.data)

const getApplicationApi = (pk: number) =>
  client.get(`partners/app/${pk}/`).then(res => res.data)

// ccmonboard.api.ts — replace your postDocumentsApi with this:
export const uploadDocumentApi = (file: File, docType: string, appId: number) => {
  const form = new FormData()
  form.append('file', file)
  form.append('document_type', docType)
  form.append('partners', String(appId))
  return client.post('partners/documents/', form).then(res => res.data)
}

const productInterestApi = () =>
  client.get('partners/product-category/all/').then(res => res.data)

const getpartnersIdApi = (shgId: number) =>
  client.get(`partners/${shgId}/`).then(res => res.data)

 export const documentVerifyApi = (id: number, payload: { is_approved: boolean }) => {
   return client
    .patch(`partners/app/documents/${id}/`, payload, {
           headers: {
        "Content-Type": "multipart/form-data",
      },
    })
    .then((res) => res.data);
};

export {
  createApplicationApi,
  updateApplicationApi,
  submitApplicationApi,
  productInterestApi,
  getpartnersIdApi,
  getApplicationApi,
  getApplicationStatusApi,
}