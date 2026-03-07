// api/shgonboard.api.ts
import { client } from './client'

// ── Application CRUD ──────────────────────────────────────────────────────────
const createApplicationApi = (data: Record<string, any>) =>
  // POST without members — members posted separately after SHG pk is known
  client.post('shg/app/', data).then(res => res.data)

const updateApplicationApi = (pk: number, data: Record<string, any>) =>
  // PATCH — members excluded, never sent in main form update
  client.patch(`shg/app/${pk}/`, data).then(res => res.data)

const submitApplicationApi = (userId: number) =>
  client.post(`applications/app/`, { user: userId }).then(res => res.data)

const getApplicationApi = (pk: number) =>
  client.get(`shg/app/${pk}/`).then(res => res.data)

const getApplicationsApi = () =>
  client.get('admin/applications/').then(res => res.data)

// ccmonboard.api.ts — replace your postDocumentsApi with this:
export const uploadDocumentApi = (file: File, docType: string, appId: number) => {
  const form = new FormData()
  form.append('file', file)
  form.append('document_type', docType)
  form.append('shg', String(appId))
  return client.post('shg/documents/', form).then(res => res.data)
}

const productInterestApi = () =>
  client.get('shg/product-category/all/').then(res => res.data)

const getshgsIdApi = (shgId: number) =>
  client.get(`shg/${shgId}/`).then(res => res.data)


export {
  createApplicationApi,
  updateApplicationApi,
  submitApplicationApi,
  getApplicationsApi,
  productInterestApi,
  getshgsIdApi,
  getApplicationApi,
}