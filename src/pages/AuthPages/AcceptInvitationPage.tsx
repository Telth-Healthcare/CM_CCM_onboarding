import { lazy } from "react";
import AuthLayout from "./AuthPageLayout";

const AcceptInvitationForm = lazy(() => import("./AcceptInvitationForm"));

export default function AcceptInvitationPage() {
  return (
    <AuthLayout>
      <AcceptInvitationForm />
    </AuthLayout>
  );
}
