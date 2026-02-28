import { lazy } from "react";
import AuthLayout from "./AuthPageLayout";
import AcceptInvitationForm from "./AcceptInvitationForm";

// const AcceptInvitationForm = lazy(() => import("./AcceptInvitationForm"));

export default function AcceptInvitationPage() {
  return (
    <AuthLayout>
      <AcceptInvitationForm />
    </AuthLayout>
  );
}
