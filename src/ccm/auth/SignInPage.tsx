import PageMeta from "../../shared/components/common/PageMeta";
import AuthLayout from "../../modules/admin/auth/AuthLayout";
import CCMSignInForm from "./SignInForm";


export default function CCMSignInPage() {
  return (
    <>
      <PageMeta
        title="React.js SignIn Dashboard | T-store - Next.js Admin Dashboard Template"
        description="This is React.js SignIn Tables Dashboard page for T-store - React.js Tailwind CSS Admin Dashboard Template"
      />
      <AuthLayout>
        <CCMSignInForm />
      </AuthLayout>
    </>
  );
}
