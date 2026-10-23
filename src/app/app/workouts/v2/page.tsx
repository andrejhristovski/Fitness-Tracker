import { requireUser } from "@/lib/session";
import { loadWorkouts } from "@/lib/workouts-data";
import { WorkoutsV2 } from "@/components/workouts/workouts-v2";

/** Preview of the redesigned Workouts page. */
export default async function WorkoutsV2Page() {
  const user = await requireUser();
  return <WorkoutsV2 {...await loadWorkouts(user.id)} />;
}
