import PageMeta from "../../shared/components/common/PageMeta";
import AuthLayout from "../../modules/admin/auth/AuthLayout";
import CCMSignInForm from "./SignInForm";


export default function CCMSignInPage() {
  return (
    <>
      <PageMeta
        title="CCM Dashboard Modal"
        description="This is CCM Onboarding Layout Modal"
      />
      <AuthLayout>
        <CCMSignInForm />
      </AuthLayout>
    </>
  );
}
