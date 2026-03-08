import { PlanRow } from '../../types/planApp/planRow';

export interface PlanGatewayResponse {
  name?: string;
  root: { children: PlanRow[] };
}

export interface PlanGatewayPostResponse {
  result: number;
}

export type PlanUpdateCallback = (response: PlanGatewayResponse) => void;
export type Unsubscribe = () => void;

export interface PlanGateway {
  fetch(
    action: string,
    params: Record<string, unknown>
  ): Promise<PlanGatewayResponse>;
  post(
    action: string,
    payload: Record<string, unknown>
  ): Promise<PlanGatewayPostResponse>;
  subscribe(
    action: string,
    params: Record<string, unknown>,
    callback: PlanUpdateCallback
  ): Unsubscribe;
}
