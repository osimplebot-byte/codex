import { initializeAnalytics } from './analytics';
import { OnboardingFlow } from './onboarding';

const SEGMENT_WRITE_KEY = process.env.REACT_APP_SEGMENT_WRITE_KEY;
const APP_ENVIRONMENT = process.env.REACT_APP_ENVIRONMENT;

autoInitializeAnalytics();

function autoInitializeAnalytics() {
  initializeAnalytics(SEGMENT_WRITE_KEY, {
    environment: APP_ENVIRONMENT,
  });
}

export function App() {
  return (
    <main>
      <h1>Configuração do atendente virtual</h1>
      <OnboardingFlow />
    </main>
  );
}

export default App;
