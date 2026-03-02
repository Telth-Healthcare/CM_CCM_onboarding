import PageMeta from "../../shared/components/common/PageMeta";
import AuthLayout from "../../modules/admin/auth/AuthLayout";
import CCMSignUpForm from "./SignUpForm";


export default function CCMSignUpPage() {
  return (
    <>
      <PageMeta
        title="React.js SignUp Dashboard | T-store - Next.js Admin Dashboard Template"
        description="This is React.js SignUp Tables Dashboard page for T-store - React.js Tailwind CSS Admin Dashboard Template"
      />
      <AuthLayout>
        <CCMSignUpForm/>
      </AuthLayout>
    </>
  );
}
