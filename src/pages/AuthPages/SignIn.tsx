import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import SignInForm from "../../components/auth/SignInForm";

export default function SignIn() {
  return (
    <>
      <PageMeta
        title=" Telth Partner Console"
        description="This is SignIn Telth Partner Console page"
      />
      <AuthLayout>
        <SignInForm />
      </AuthLayout>
    </>
  );
}
