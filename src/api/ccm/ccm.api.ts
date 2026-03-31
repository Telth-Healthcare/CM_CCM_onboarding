import { ccmClient as client } from "../client";


export const Coursefetchapi=()=>client.get("/trainer/app/course-enrollments/")

export const moduleCompleteApi=(
    data:{
       material?: number
  is_completed?: boolean
    }
)=>client.post("/trainer/app/material-completions/",data)   