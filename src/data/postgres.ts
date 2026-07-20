import { PrismaPg } from "@prisma/adapter-pg";
import { envs } from "../config/plugins/envs.plugin";
import { PrismaClient } from "../generated/prisma/client";

const adapter = new PrismaPg(envs.POSTGRES_URL);

export const prismaClient = new PrismaClient({ adapter });
