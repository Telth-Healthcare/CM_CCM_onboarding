import { client } from "./client"

export const createGroupApi = (payload: any) => {
  return client.post("trainer/app/groups/", payload)
  .then(res => res.data)
}

export const updateGroupApi = (groupId: number, payload: any) => {
  return client.patch(`trainer/app/groups/${groupId}/`, payload)
  .then(res => res.data)
}


export const getGroupApi = () => {
    return client.get("trainer/app/groups/")
    .then(res => res.data)
}
export const deleteGroupApi = (groupid:number) => {
    return client.delete(`trainer/app/groups/${groupid}/`)
    .then(res => res.data)
}

