import { ccmClient as client } from "../client";


export const Coursefetchapi=()=>client.get("/trainer/app/course-enrollments/")