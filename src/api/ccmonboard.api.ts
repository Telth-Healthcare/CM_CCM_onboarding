// api/shgonboard.api.ts
import { ccmClient as client} from './client'

// ── Application CRUD ──────────────────────────────────────────────────────────
const createApplicationApi = (data: Record<string, any>) =>
  // POST without members — members posted separately after CM/CCM pk is known
  client.post('partners/app/cm-ccm/', data).then(res => res.data)

const updateApplicationApi = (pk: number, data: Record<string, any>) =>
  // PATCH — members excluded, never sent in main form update
  client.patch(`partners/app/cm-ccm/${pk}/`, data).then(res => res.data)

const submitApplicationApi = (userId: number) =>
  client.post(`applications/app/`, { user: userId }).then(res => res.data)

const getApplicationStatusApi=(appid:number,)=>client.get(`applications/app/${appid}/`).then(res=>res.data)

const getApplicationApi = (pk: number) =>
  client.get(`partners/app/cm-ccm/${pk}/`).then(res => res.data)

// ccmonboard.api.ts — replace your postDocumentsApi with this:
export const uploadDocumentApi = (file: File, docType: string, appId: number) => {
  const form = new FormData()
  form.append('file', file)
  form.append('document_type', docType)
  form.append('shg', String(appId))
  return client.post('partners/app/documents/', form).then(res => res.data)
}

const productInterestApi = () =>
  client.get('partners/product-category/all/').then(res => res.data)

const getshgsIdApi = (shgId: number) =>
  client.get(`partners/${shgId}/`).then(res => res.data)


export {
  createApplicationApi,
  updateApplicationApi,
  submitApplicationApi,
  productInterestApi,
  getshgsIdApi,
  getApplicationApi,
  getApplicationStatusApi
}