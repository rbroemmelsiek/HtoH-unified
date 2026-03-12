import React from 'react';
import App from './App';

export interface EmbeddedPlanAppProps {
  planId?: string;
  ownerId?: string | number;
  showNav?: boolean;
  mode?: string;
  sessionType?: string;
  keyId?: string;
}

export default function EmbeddedPlanApp(props: EmbeddedPlanAppProps) {
  return <App planId={props.planId} ownerId={props.ownerId?.toString()} />;
}
