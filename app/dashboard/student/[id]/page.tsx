import StudentDetailClient from "@/components/StudentDetailClient";

export default async function StudentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <StudentDetailClient studentId={id} />;
}
