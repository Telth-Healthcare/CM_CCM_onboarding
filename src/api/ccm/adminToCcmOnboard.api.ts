// api/shgonboard.api.ts
import { client} from '../client'

// ── Application CRUD ──────────────────────────────────────────────────────────
export const createOnboardApi = (data: Record<string, any>) =>
  client.post('partners/app/cm-ccm/', data).then(res => res.data)

export const updateOnboardApi = (pk: number, data: Record<string, any>) =>
  client.patch(`partners/app/cm-ccm/${pk}/`, data).then(res => res.data)

export const submitOnboardApi = (userId: number) =>
  client.post(`applications/app/`, { user: userId }).then(res => res.data)

export const getOnboardStatusApi=(appid:number,)=>client.get(`applications/app/${appid}/`).then(res=>res.data)

export const getOnboardApi = (pk: number) =>
  client.get(`partners/app/cm-ccm/${pk}/`).then(res => res.data)

export const uploadOnboardDocumentApi = (
  file: File,
  docType: string,
  appId: number,
  status?: string       
) => {
  const form = new FormData()
  form.append('file', file)
  form.append('document_type', docType)
  form.append('shg', String(appId))
  
  if (status) form.append('status', status)   // only appended when reupload

  return client.post('partners/app/documents/', form).then(res => res.data)
}
 