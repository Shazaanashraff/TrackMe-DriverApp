import React from 'react';

interface CustomRouteRecorderProps {
  vehicle: unknown;
  routeId?: string;
  mode?: 'initial' | 'update';
  onSubmitted: () => void;
}

declare const CustomRouteRecorder: React.FC<CustomRouteRecorderProps>;
export default CustomRouteRecorder;
