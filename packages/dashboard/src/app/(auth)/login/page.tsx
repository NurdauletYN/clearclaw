import { LoginForm } from "../../../components/LoginForm";

type LoginPageProps = {
  searchParams: { error?: string };
};

export default function LoginPage({ searchParams }: LoginPageProps): JSX.Element {
  return <LoginForm initialError={searchParams.error} />;
}
