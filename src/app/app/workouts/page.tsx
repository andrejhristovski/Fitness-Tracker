import { requireUser } from "@/lib/session";
import { loadWorkouts } from "@/lib/workouts-data";
import { WorkoutsTab } from "@/components/workouts/workouts-tab";

export default async function WorkoutsPage() {
  const user = await requireUser();
  return <WorkoutsTab {...await loadWorkouts(user.id)} />;
}
