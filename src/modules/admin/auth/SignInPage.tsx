
import PageMeta from "../../../shared/components/common/PageMeta";
import SignInForm from "../auth/SignInForm";
import { useSearchParams } from "react-router";
import AuthLayout from "./AuthLayout";

export default function SignIn() {
    const search = useSearchParams()[1];
  console.log(search);
  return (
    <>
      <PageMeta
        title="React.js SignIn Dashboard | T-store - Next.js Admin Dashboard Template"
        description="This is React.js SignIn Tables Dashboard page for T-store - React.js Tailwind CSS Admin Dashboard Template"
      />
      <AuthLayout>
        <SignInForm />
      </AuthLayout>
    </>
  );
}
