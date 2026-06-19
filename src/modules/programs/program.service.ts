// program.service.ts
import Program from "./program.model.js";
import { CreateProgramInput, UpdateProgramInput } from "./program.validation.js";

const createProgram = async (
  payload: CreateProgramInput
) => {
  // Check for existing slug
  const existingProgram = await Program.findOne({
    slug: payload.slug,
  });

  if (existingProgram) {
    throw new Error("Program slug already exists");
  }

  // Ensure thumbnail is provided (if required)
  if (!payload.thumbnail) {
    throw new Error("Thumbnail is required");
  }

  // Create the program
  return await Program.create(payload);
};

const getAllPrograms = async () => {
  const result = await Program.find().sort({
    createdAt: -1,
  });

  return result;
};

const getProgramById = async (id: string) => {
  return await Program.findById(id);
};

const getProgramBySlug = async (slug: string) => {
  return await Program.findOne({ slug });
};

const deleteProgram = async (id: string) => {
  const result = await Program.findByIdAndDelete(id);
  return result;
};

const updateProgram = async (
  id: string,
  payload: UpdateProgramInput
) => {
  if (payload.slug) {
    const existingProgram = await Program.findOne({
      slug: payload.slug,
      _id: { $ne: id },
    });

    if (existingProgram) {
      throw new Error("Program slug already exists");
    }
  }

  return await Program.findByIdAndUpdate(
    id,
    payload,
    {
      new: true,
      runValidators: true,
    }
  );
};

export const ProgramService = {
  createProgram,
  getAllPrograms,
  getProgramById,
  getProgramBySlug,
  deleteProgram,
  updateProgram,
};