import { Component, type ReactNode } from 'react';
import { Button } from './ui';

interface Props { children: ReactNode }
interface State { hasError: boolean }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) return <div className="error-page"><div><span>🦊</span><h1>Faris braucht eine kurze Pause</h1><p>Etwas hat nicht geklappt. Dein gespeicherter Fortschritt bleibt erhalten.</p><Button onClick={() => window.location.reload()}>Spiel neu laden</Button></div></div>;
    return this.props.children;
  }
}
