import { PlanRow } from '../../types/planApp/planRow';

export interface PlanGatewayResponse {
  planId?: string;
  name?: string;
  root: { children: PlanRow[] };
}

export interface PlanGatewayPostResponse {
  result: number;
}

export type PlanUpdateCallback = (response: PlanGatewayResponse) => void;
export type Unsubscribe = () => void;

export interface PlanSummary {
  id: string;
  name: string;
}

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
  updatePlan?(plan: PlanGatewayResponse, planId?: string, ownerId?: string): void | Promise<void>;
  createPlan?(ownerId: string, name?: string): Promise<string>;
  listPlans?(ownerId: string): Promise<PlanSummary[]>;
  renamePlan?(ownerId: string, planId: string, name: string): Promise<void>;
}
