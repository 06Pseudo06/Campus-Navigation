import { CampusRoute } from "@/types/campus";
import { generateDemonstrationRoute } from "@/data/campusData";

/**
 * Route Service Client
 * 
 * In this Phase 3 prototype, this service generates structured demonstration route paths.
 * When the FastAPI Graph Route Planning Service is completed in subsequent phases,
 * this client module will seamlessly switch to calling `GET /api/v1/routes/plan` without
 * altering the Dashboard UI components.
 */
export const routeService = {
  /**
   * Get walking route between two campus locations.
   */
  async calculateRoute(fromId: string = "loc-main-gate", toId: string): Promise<CampusRoute> {
    // Simulated short async delay to mirror future network behavior cleanly
    await new Promise((resolve) => setTimeout(resolve, 150));
    return generateDemonstrationRoute(fromId, toId);
  },
};
