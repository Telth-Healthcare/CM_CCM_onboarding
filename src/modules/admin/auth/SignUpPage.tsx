
import PageMeta from "../../../shared/components/common/PageMeta";
import SignUpForm from "../auth/SignUpForm";
import AuthLayout from "./AuthLayout";

export default function SignUp() {
  return (
    <>
      <PageMeta
        title="React.js SignUp Dashboard | T-store - Next.js Admin Dashboard Template"
        description="This is React.js SignUp Tables Dashboard page for T-store - React.js Tailwind CSS Admin Dashboard Template"
      />
      <AuthLayout>
        <SignUpForm />
      </AuthLayout>
    </>
  );
}
