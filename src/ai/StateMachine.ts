export interface State<TState extends string> {
  name: TState;
  onEnter?: (prevState?: TState) => void;
  update?: (dt: number) => void;
  onExit?: (nextState: TState) => void;
}

export class StateMachine<TState extends string> {
  private states = new Map<TState, State<TState>>();
  private currentState?: State<TState>;
  private pendingInitialState?: TState;
  public stateTime = 0;

  constructor(initialState?: TState) {
    if (initialState) {
      this.pendingInitialState = initialState;
    }
  }

  public registerState(state: State<TState>): this {
    this.states.set(state.name, state);
    if (this.pendingInitialState === state.name && !this.currentState) {
      this.transitionTo(state.name);
      this.pendingInitialState = undefined;
    }
    return this;
  }

  public transitionTo(nextStateName: TState): boolean {
    if (this.currentState?.name === nextStateName) return false;

    const nextState = this.states.get(nextStateName);
    if (!nextState) {
      throw new Error(`State '${nextStateName}' is not registered in StateMachine`);
    }

    const prevState = this.currentState?.name;
    if (this.currentState?.onExit) {
      this.currentState.onExit(nextStateName);
    }

    this.currentState = nextState;
    this.stateTime = 0;

    if (this.currentState.onEnter) {
      this.currentState.onEnter(prevState);
    }
    return true;
  }

  public update(dt: number): void {
    if (this.currentState) {
      this.stateTime += dt;
      if (this.currentState.update) {
        this.currentState.update(dt);
      }
    }
  }

  public getCurrentState(): TState | undefined {
    return this.currentState?.name;
  }
}
