// api/shgonboard.api.ts

import { CCMFormData } from '../ccm/pages/detailspage/types'
import { client } from './client'

// ── Application CRUD ──────────────────────────────────────────────────────────

const createApplicationApi = (data: Omit<CCMFormData, 'members' | 'id'>) =>
  // POST without members — members posted separately after SHG pk is known
  client.post('shg/create/', data).then(res => res.data)

const updateApplicationApi = (pk: number, data: Omit<CCMFormData, 'members' | 'id'>) =>
  // PATCH — members excluded, never sent in main form update
  client.patch(`shg/${pk}/update/`, data).then(res => res.data)

const submitApplicationApi = (pk: number) =>
  client.post(`shg/${pk}/submit/`).then(res => res.data)

const getApplicationApi = (pk: number) =>
  client.get(`shg/${pk}/`).then(res => res.data)

const getApplicationsApi = () =>
  client.get('admin/applications/').then(res => res.data)

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