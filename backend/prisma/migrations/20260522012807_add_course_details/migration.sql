-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "careerPaths" TEXT[],
ADD COLUMN     "category" TEXT,
ADD COLUMN     "duration" TEXT,
ADD COLUMN     "featured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "logoUrl" TEXT,
ADD COLUMN     "skills" TEXT[];
