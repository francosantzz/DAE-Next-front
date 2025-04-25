import ButtonAuth from "@/components/ButtonAuth";
import { HomePage } from "@/components/component/HomePage";
import { Layout } from "@/components/Layout";
import ErrorBoundary from "@/components/ErrorBoundary";


export default function Home() {
  return (
    <ErrorBoundary>
      <HomePage />
      <div>
        <ButtonAuth/>
      </div>
    </ErrorBoundary>
  );
}
