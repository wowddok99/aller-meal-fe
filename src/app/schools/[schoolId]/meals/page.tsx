import { PublicSchoolMealsPage } from "@/components/public/school-meals/public-school-meals-page";

type SchoolMealsPageProps = {
  params: Promise<{
    schoolId: string;
  }>;
};

export default async function SchoolMealsPage({ params }: SchoolMealsPageProps) {
  const { schoolId } = await params;

  return <PublicSchoolMealsPage schoolId={schoolId} />;
}
