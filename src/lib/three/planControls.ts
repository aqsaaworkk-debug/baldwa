export type PlanView = 'iso' | 'top' | 'front';
export type PlanLight = 'evening' | 'day';

// Mutable camera targets shared by the lightweight HTML controls and the deferred 3D scene.
export type PlanControls = {
  az: number;
  azT: number;
  el: number;
  elT: number;
  zoom: number;
  zoomT: number;
  spin: boolean;
  dragged: boolean;
  intro: boolean;
};

const D2R = Math.PI / 180;
export const PLAN_VIEWS: Record<PlanView, { az: number; el: number }> = {
  iso: { az: -.7, el: 32 * D2R },
  top: { az: 0, el: 89.5 * D2R },
  front: { az: 0, el: 46 * D2R },
};
