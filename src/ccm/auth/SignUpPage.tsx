import PageMeta from "../../shared/components/common/PageMeta";
import AuthLayout from "../../modules/admin/auth/AuthLayout";
import CCMSignUpForm from "./SignUpForm";


export default function CCMSignUpPage() {
  return (
    <>
      <PageMeta
        title="Telth CM CCM Console"
        description="Telth CC CCM Signin Console"
      />
      <AuthLayout>
        <CCMSignUpForm/>
      </AuthLayout>
    </>
  );
}
