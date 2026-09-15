import GoalDetailPage from "@/components/GoalDetailPage";

export default async function GoalPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <GoalDetailPage goalId={id} />;
}
